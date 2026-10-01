import { NextRequest, NextResponse } from "next/server";
import { createOrder, OrderValidationError } from "@/lib/orders";
import { getDb } from "@/lib/neon";
import { SITE_URL } from "@/lib/site";

const SAFEPAY_API_KEY = process.env.SAFEPAY_API_KEY || "";
const SAFEPAY_SECRET = process.env.SAFEPAY_SECRET_KEY || "";
const SAFEPAY_BASE = process.env.SAFEPAY_BASE_URL || "https://sandbox.api.getsafepay.com";
const SAFEPAY_ENV = process.env.SAFEPAY_ENV || "sandbox";

function isConfigured(key: string) {
  return !!key && !key.startsWith("your_");
}

export async function POST(request: NextRequest) {
  if (!isConfigured(SAFEPAY_API_KEY) || !isConfigured(SAFEPAY_SECRET)) {
    return NextResponse.json(
      { error: "Card payment is being set up. Please use Cash on Delivery for now." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { items, customer_name, customer_email, customer_phone, shipping_address, shipping, promo_code } = body;

    if (!items?.length || !customer_email || !customer_name) {
      return NextResponse.json({ error: "Missing required order fields" }, { status: 400 });
    }

    const { orderId, total } = await createOrder({
      items,
      customerName: customer_name,
      customerEmail: customer_email,
      customerPhone: customer_phone,
      shippingAddress: shipping_address,
      shipping,
      promoCode: promo_code,
      paymentMethod: "safepay",
      paymentStatus: "unpaid",
    });

    const trackerRes = await fetch(`${SAFEPAY_BASE}/order/payments/v3/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: SAFEPAY_API_KEY,
        amount: Math.round(total),
        currency: "PKR",
        environment: SAFEPAY_ENV,
      }),
    });
    const trackerData = await trackerRes.json();

    if (!trackerRes.ok) {
      return NextResponse.json(
        { error: `Safepay error: ${trackerData?.message || "Unknown error"}` },
        { status: 502 }
      );
    }

    const trackerToken = trackerData?.data?.token;
    if (!trackerToken) {
      return NextResponse.json({ error: "Safepay did not return a tracker token" }, { status: 502 });
    }

    const sql = getDb();
    await sql`
      UPDATE orders SET gateway_session_id = ${trackerToken}, payment_status = 'pending', updated_at = NOW()
      WHERE id = ${orderId}
    `;

    const redirectUrl = `${SITE_URL}/checkout/success?order_id=${orderId}`;
    const cancelUrl = `${SITE_URL}/checkout`;
    const checkoutUrl =
      `https://${SAFEPAY_ENV === "sandbox" ? "sandbox" : "www"}.getsafepay.com` +
      `/components?beacon=${trackerToken}` +
      `&entry_mode=hosted&env=${SAFEPAY_ENV === "sandbox" ? "sandbox" : "production"}&source=custom` +
      `&redirect_url=${encodeURIComponent(redirectUrl)}` +
      `&cancel_url=${encodeURIComponent(cancelUrl)}`;

    return NextResponse.json({ checkout_url: checkoutUrl, order_id: orderId, tracker_token: trackerToken });
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Safepay payment error:", err);
    return NextResponse.json(
      { error: "Card payment unavailable. Please use Cash on Delivery or WhatsApp us." },
      { status: 500 }
    );
  }
}
