import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createOrder, markOrderPaid, normalizePkPhone, OrderValidationError } from "@/lib/orders";
import { getDb } from "@/lib/neon";

const JAZZCASH_MERCHANT_ID = process.env.JAZZCASH_MERCHANT_ID || "";
const JAZZCASH_PASSWORD = process.env.JAZZCASH_PASSWORD || "";
const JAZZCASH_SALT = process.env.JAZZCASH_INTEGRITY_SALT || "";
const JAZZCASH_BASE =
  process.env.JAZZCASH_BASE_URL ||
  "https://sandbox.jazzcash.com.pk/ApplicationAPI/API/2.0/Purchase/DoMWalletTransaction";

function isConfigured(key: string) {
  return !!key && !key.startsWith("your_");
}

/** JazzCash timestamps are yyyyMMddHHmmss in Pakistan time (UTC+5). */
function pktTimestamp(date: Date) {
  return new Date(date.getTime() + 5 * 60 * 60 * 1000).toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
}

/** JazzCash secure hash: HMAC-SHA256 (key = integrity salt) over the salt followed by
 * the values of every non-empty pp_* field, sorted alphabetically by key, joined with "&".
 * Same scheme the webhook uses to verify callbacks. */
function jazzCashHash(fields: Record<string, string>) {
  const values = Object.keys(fields)
    .filter((k) => k.startsWith("pp_") && k !== "pp_SecureHash" && fields[k] !== "")
    .sort()
    .map((k) => fields[k]);
  return createHmac("sha256", JAZZCASH_SALT).update([JAZZCASH_SALT, ...values].join("&")).digest("hex").toUpperCase();
}

export async function POST(request: NextRequest) {
  if (!isConfigured(JAZZCASH_MERCHANT_ID) || !isConfigured(JAZZCASH_PASSWORD) || !isConfigured(JAZZCASH_SALT)) {
    return NextResponse.json(
      { error: "JazzCash payment is being set up. Please use Cash on Delivery for now." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { items, customer_name, customer_email, customer_phone, shipping_address, shipping, promo_code, checkout_id, marketing_opt_in, mobile_number } = body;

    if (!items?.length || !customer_email || !customer_name) {
      return NextResponse.json({ error: "Missing required order fields" }, { status: 400 });
    }
    const walletNumber = normalizePkPhone(mobile_number);
    if (!walletNumber) {
      return NextResponse.json({ error: "Valid JazzCash mobile number required (e.g. 03001234567)" }, { status: 400 });
    }

    const { orderId, total } = await createOrder({
      items,
      customerName: customer_name,
      customerEmail: customer_email,
      customerPhone: customer_phone,
      shippingAddress: shipping_address,
      shipping,
      promoCode: promo_code,
      checkoutId: typeof checkout_id === "string" ? checkout_id : undefined,
      marketingOptIn: marketing_opt_in === true,
      paymentMethod: "jazzcash",
      paymentStatus: "unpaid",
    });

    const txnRef = `MS-${orderId.slice(0, 8)}-${Date.now()}`;
    const now = new Date();
    const txnDateTime = pktTimestamp(now);
    const txnExpiry = pktTimestamp(new Date(now.getTime() + 60 * 60 * 1000));

    const fields: Record<string, string> = {
      pp_Language: "EN",
      pp_MerchantID: JAZZCASH_MERCHANT_ID,
      pp_Password: JAZZCASH_PASSWORD,
      pp_TxnRefNo: txnRef,
      // JazzCash amounts are in paisa (PKR × 100)
      pp_Amount: String(Math.round(total) * 100),
      pp_TxnCurrency: "PKR",
      pp_TxnDateTime: txnDateTime,
      pp_TxnExpiryDateTime: txnExpiry,
      pp_BillReference: `order-${orderId.slice(0, 8)}`,
      pp_Description: `ModestStyle.pk Order #${orderId.slice(0, 8)}`,
      pp_MobileNumber: walletNumber,
      pp_CNIC: "",
    };
    const payload = { ...fields, pp_SecureHash: jazzCashHash(fields) };

    const gatewayRes = await fetch(JAZZCASH_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = gatewayRes.ok ? await gatewayRes.json() : {};

    const sql = getDb();

    await sql`UPDATE orders SET gateway_session_id = ${txnRef}, updated_at = NOW() WHERE id = ${orderId}`;

    // "000" = approved in-app during the call; "124"/"157" = awaiting customer approval.
    if (data.pp_ResponseCode === "000") {
      await markOrderPaid(orderId, data.pp_RetreivalReferenceNo || txnRef);
      return NextResponse.json({ order_id: orderId, status: "paid", message: "Payment received." });
    }
    if (data.pp_ResponseCode === "124" || data.pp_ResponseCode === "157") {
      await sql`UPDATE orders SET payment_status = 'pending', updated_at = NOW() WHERE id = ${orderId}`;
      return NextResponse.json({
        order_id: orderId,
        status: "pending",
        message: "Payment request sent to your JazzCash app. Please approve.",
      });
    }

    await sql`UPDATE orders SET payment_status = 'failed', updated_at = NOW() WHERE id = ${orderId}`;
    return NextResponse.json(
      { error: data.pp_ResponseMessage || "JazzCash payment failed" },
      { status: 400 }
    );
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("JazzCash payment error:", err);
    return NextResponse.json(
      { error: "JazzCash unavailable. Please use Cash on Delivery or WhatsApp us." },
      { status: 500 }
    );
  }
}
