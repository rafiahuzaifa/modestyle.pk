import { NextRequest, NextResponse } from "next/server";
import { sendText, verifyWebhookSignature } from "@/lib/whatsapp";
import { cancelOrderFromWhatsApp, confirmOrderFromWhatsApp, unsubscribeWhatsApp } from "@/lib/marketing";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "";
const STOP_WORDS = new Set(["stop", "unsubscribe", "band", "band karo"]);

/** Meta's one-time webhook verification handshake. */
export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  if (VERIFY_TOKEN && p.get("hub.mode") === "subscribe" && p.get("hub.verify_token") === VERIFY_TOKEN) {
    return new NextResponse(p.get("hub.challenge") || "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

interface WaMessage {
  from: string;
  type: string;
  text?: { body?: string };
  button?: { payload?: string; text?: string };
  interactive?: { button_reply?: { id?: string } };
}

/** wa_id (923xxxxxxxxx) → the 03xxxxxxxxx format orders are stored in. */
const toLocal = (waId: string) => (waId.startsWith("92") ? "0" + waId.slice(2) : waId);

async function handleMessage(msg: WaMessage) {
  const phone = toLocal(msg.from);
  const payload = msg.button?.payload || msg.interactive?.button_reply?.id || "";
  const [action, orderId] = payload.split(":");

  if (action === "CONFIRM" && orderId) {
    const order = await confirmOrderFromWhatsApp(orderId, phone);
    const ref = orderId.slice(0, 8).toUpperCase();
    await sendText(
      msg.from,
      order
        ? `JazakAllah Khair ${order.customer_name.split(" ")[0]}! 🤍 Your order #${ref} is confirmed and will be dispatched soon. We'll update you when it ships.\n\n— ${SITE_NAME}`
        : `Thank you! Your order #${ref} is already confirmed. 🤍`
    );
    return;
  }

  if (action === "CANCEL" && orderId) {
    const order = await cancelOrderFromWhatsApp(orderId, phone);
    const ref = orderId.slice(0, 8).toUpperCase();
    await sendText(
      msg.from,
      order
        ? `Your order #${ref} has been cancelled. If this was a mistake, just reply here and we'll help you. You can shop again anytime: ${SITE_URL}`
        : `We couldn't cancel order #${ref} automatically as it's already being processed. Please reply here and our team will help you.`
    );
    return;
  }

  const text = (msg.text?.body || msg.button?.text || "").trim().toLowerCase();
  if (STOP_WORDS.has(text)) {
    await unsubscribeWhatsApp(phone);
    await sendText(msg.from, "You've been unsubscribed from offers. You'll still receive updates about your orders.");
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifyWebhookSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);
    for (const entry of body?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        for (const msg of (change?.value?.messages ?? []) as WaMessage[]) {
          await handleMessage(msg);
        }
      }
    }
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
  }
  // Always 200 so Meta doesn't retry-storm on our own errors.
  return NextResponse.json({ received: true });
}
