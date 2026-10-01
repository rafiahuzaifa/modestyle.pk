import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { findOrderByGatewaySessionId, findOrderByIdPrefix, markOrderPaid, markOrderPaymentFailed } from "@/lib/orders";

const SAFEPAY_WEBHOOK_SECRET = process.env.SAFEPAY_WEBHOOK_SECRET || "";
const JAZZCASH_SALT = process.env.JAZZCASH_INTEGRITY_SALT || "";
const EASYPAISA_HASH_KEY = process.env.EASYPAISA_HASH_KEY || "";
const EASYPAISA_STORE_ID = process.env.EASYPAISA_STORE_ID || "";

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

async function handleSafepay(request: NextRequest) {
  const rawBody = await request.text();

  if (SAFEPAY_WEBHOOK_SECRET) {
    const signature = request.headers.get("x-sfpy-signature") || "";
    const expected = createHmac("sha256", SAFEPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
    if (!signature || !safeEqual(signature, expected)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }
  }

  const data = JSON.parse(rawBody);
  const eventType = data?.type || "";
  const tracker = data?.data?.token || "";
  if (!tracker) return NextResponse.json({ received: true });

  const order = await findOrderByGatewaySessionId(tracker);
  if (!order) return NextResponse.json({ received: true });

  if (eventType === "payment:created" || eventType === "payment:completed") {
    await markOrderPaid(order.id, data?.data?.tracker?.id || "");
  } else if (eventType === "payment:failed") {
    await markOrderPaymentFailed(order.id);
  }

  return NextResponse.json({ received: true });
}

/** JazzCash's documented hash scheme: HMAC-SHA256 (key = Integrity Salt) over the
 * salt followed by the values of every non-empty pp_* field (excluding
 * pp_SecureHash), sorted alphabetically by key and joined with "&" — the same
 * scheme used to sign outgoing requests. */
function verifyJazzCashHash(data: Record<string, string>): boolean {
  if (!JAZZCASH_SALT) return false;
  const receivedHash = data["pp_SecureHash"] || "";
  if (!receivedHash) return false;
  const fields = Object.keys(data)
    .filter((k) => k.startsWith("pp_") && k !== "pp_SecureHash" && data[k])
    .sort();
  const hashString = JAZZCASH_SALT + fields.map((k) => `&${data[k]}`).join("");
  const computed = createHmac("sha256", JAZZCASH_SALT).update(hashString).digest("hex");
  return safeEqual(computed.toLowerCase(), receivedHash.toLowerCase());
}

async function handleJazzCash(request: NextRequest) {
  const form = await request.formData();
  const data: Record<string, string> = {};
  form.forEach((value, key) => (data[key] = String(value)));

  if (!verifyJazzCashHash(data)) {
    return NextResponse.json({ error: "Invalid JazzCash callback signature" }, { status: 401 });
  }

  const txnRef = data["pp_TxnRefNo"] || "";
  const responseCode = data["pp_ResponseCode"] || "";
  if (!txnRef) return NextResponse.json({ received: true });

  const order = await findOrderByGatewaySessionId(txnRef);
  if (!order) return NextResponse.json({ received: true });

  if (responseCode === "000") {
    await markOrderPaid(order.id, data["pp_RetreivalReferenceNo"] || txnRef);
  } else {
    await markOrderPaymentFailed(order.id);
  }

  return NextResponse.json({ received: true });
}

/** Mirrors the HMAC-SHA256 scheme used to sign outgoing requests
 * (amount + orderId + storeId). EasyPaisa is expected to echo the same hash
 * back under `merchantHashedReq` — confirm the exact field name against your
 * EasyPaisa merchant docs if this stops matching in production. */
function verifyEasyPaisaHash(data: Record<string, string>): boolean {
  if (!EASYPAISA_HASH_KEY) return false;
  const receivedHash = data["merchantHashedReq"] || "";
  if (!receivedHash) return false;
  const hashData = `${data["amount"] || ""}${data["orderId"] || ""}${EASYPAISA_STORE_ID}`;
  const computed = createHmac("sha256", EASYPAISA_HASH_KEY).update(hashData).digest("hex");
  return safeEqual(computed.toLowerCase(), receivedHash.toLowerCase());
}

async function handleEasyPaisa(request: NextRequest) {
  const form = await request.formData();
  const data: Record<string, string> = {};
  form.forEach((value, key) => (data[key] = String(value)));

  if (!verifyEasyPaisaHash(data)) {
    return NextResponse.json({ error: "Invalid EasyPaisa callback signature" }, { status: 401 });
  }

  const orderId = data["orderId"] || "";
  const status = data["status"] || "";
  if (!orderId) return NextResponse.json({ received: true });

  const order = await findOrderByIdPrefix(orderId.replace("MS-", ""));
  if (!order) return NextResponse.json({ received: true });

  if (status === "0000" || status === "0001") {
    await markOrderPaid(order.id, data["transactionId"] || "");
  } else {
    await markOrderPaymentFailed(order.id);
  }

  return NextResponse.json({ received: true });
}

export async function POST(request: NextRequest) {
  const gateway = request.nextUrl.searchParams.get("gateway") || "";
  try {
    if (gateway === "safepay") return await handleSafepay(request);
    if (gateway === "jazzcash") return await handleJazzCash(request);
    if (gateway === "easypaisa") return await handleEasyPaisa(request);
    return NextResponse.json({ error: "Unknown gateway" }, { status: 400 });
  } catch (err) {
    console.error(`Webhook error (${gateway}):`, err);
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
