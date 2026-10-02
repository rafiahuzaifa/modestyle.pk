import { createHmac, timingSafeEqual } from "crypto";

/**
 * WhatsApp Business Cloud API (Meta) client.
 *
 * Required env (Meta → WhatsApp → API Setup):
 *   WHATSAPP_TOKEN            permanent System User access token
 *   WHATSAPP_PHONE_NUMBER_ID  the sending number's Phone Number ID
 *   WHATSAPP_APP_SECRET       Meta app secret (verifies webhook signatures)
 *   WHATSAPP_VERIFY_TOKEN     any random string, also entered in the Meta webhook settings
 *
 * Business-initiated messages must use templates approved in WhatsApp Manager.
 * Template names can be overridden by env; defaults are listed in TEMPLATES.
 */
const TOKEN = process.env.WHATSAPP_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || "";
const API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0";
const TEMPLATE_LANG = process.env.WHATSAPP_TEMPLATE_LANG || "en";

export const TEMPLATES = {
  /** Utility. Body: {{1}} name, {{2}} order no, {{3}} total. Quick-reply buttons: "Confirm Order", "Cancel Order". */
  orderConfirmation: process.env.WHATSAPP_TPL_ORDER || "order_confirmation",
  /** Marketing. Body: {{1}} name, {{2}} promo code. URL button: checkout link. */
  cartReminder: process.env.WHATSAPP_TPL_CART || "cart_reminder",
  /** Marketing. Body: {{1}} name, {{2}} offer text. */
  saleOffer: process.env.WHATSAPP_TPL_OFFER || "sale_offer",
};

export function isWhatsAppConfigured() {
  return !!TOKEN && !!PHONE_NUMBER_ID;
}

/** Converts 03xxxxxxxxx / +92 3xx... into Cloud API format 923xxxxxxxxx. */
export function toWaId(phone: string) {
  const digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("0")) return "92" + digits.slice(1);
  return digits;
}

async function post(payload: Record<string, unknown>) {
  if (!isWhatsAppConfigured()) return { ok: false, skipped: true as const };
  const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", ...payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("WhatsApp API error:", res.status, JSON.stringify(data));
    return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
  }
  return { ok: true, id: data?.messages?.[0]?.id as string | undefined };
}

type Button =
  | { type: "quick_reply"; index: number; payload: string }
  | { type: "url"; index: number; text: string };

/** Sends an approved template. Body params fill {{1}}, {{2}}, ... in order. */
export async function sendTemplate(to: string, name: string, bodyParams: string[], buttons: Button[] = []) {
  const components: Record<string, unknown>[] = [];
  if (bodyParams.length) {
    components.push({
      type: "body",
      parameters: bodyParams.map((text) => ({ type: "text", text: String(text).slice(0, 1000) })),
    });
  }
  for (const b of buttons) {
    components.push({
      type: "button",
      sub_type: b.type,
      index: String(b.index),
      parameters: [b.type === "quick_reply" ? { type: "payload", payload: b.payload } : { type: "text", text: b.text }],
    });
  }
  return post({
    to: toWaId(to),
    type: "template",
    template: { name, language: { code: TEMPLATE_LANG }, components },
  });
}

/** Free-form text — only delivered within 24h of the customer's last message to us. */
export async function sendText(to: string, body: string) {
  return post({ to: toWaId(to), type: "text", text: { body, preview_url: true } });
}

/** Verifies Meta's X-Hub-Signature-256 header against the raw request body. */
export function verifyWebhookSignature(rawBody: string, header: string | null) {
  if (!APP_SECRET) return false;
  const expected = "sha256=" + createHmac("sha256", APP_SECRET).update(rawBody).digest("hex");
  const a = Buffer.from(header || "");
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
