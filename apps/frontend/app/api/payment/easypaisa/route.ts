import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createOrder, OrderValidationError } from "@/lib/orders";
import { getDb } from "@/lib/neon";
import { SITE_URL } from "@/lib/site";

const EASYPAISA_STORE_ID = process.env.EASYPAISA_STORE_ID || "";
const EASYPAISA_HASH_KEY = process.env.EASYPAISA_HASH_KEY || "";
const EASYPAISA_BASE =
  process.env.EASYPAISA_BASE_URL || "https://easypay.easypaisa.com.pk/easypay/Index.jsf";

function isConfigured(key: string) {
  return !!key && !key.startsWith("your_");
}

export async function POST(request: NextRequest) {
  if (!isConfigured(EASYPAISA_STORE_ID) || !isConfigured(EASYPAISA_HASH_KEY)) {
    return NextResponse.json(
      { error: "EasyPaisa payment is being set up. Please use Cash on Delivery for now." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { items, customer_name, customer_email, customer_phone, shipping_address, shipping, promo_code, mobile_number } = body;

    if (!items?.length || !customer_email || !customer_name) {
      return NextResponse.json({ error: "Missing required order fields" }, { status: 400 });
    }
    if (!mobile_number || String(mobile_number).length < 11) {
      return NextResponse.json({ error: "Valid EasyPaisa mobile number required (11 digits)" }, { status: 400 });
    }

    const { orderId, total } = await createOrder({
      items,
      customerName: customer_name,
      customerEmail: customer_email,
      customerPhone: customer_phone,
      shippingAddress: shipping_address,
      shipping,
      promoCode: promo_code,
      paymentMethod: "easypaisa",
      paymentStatus: "unpaid",
    });

    const gatewayOrderId = `MS-${orderId.slice(0, 8)}`;
    const amount = total.toFixed(2);
    const postBackUrl = `${SITE_URL}/api/payment/webhook?gateway=easypaisa`;

    const hashData = `${amount}${gatewayOrderId}${EASYPAISA_STORE_ID}`;
    const secureHash = createHmac("sha256", EASYPAISA_HASH_KEY).update(hashData).digest("hex");

    const payload = new URLSearchParams({
      storeId: EASYPAISA_STORE_ID,
      amount,
      orderId: gatewayOrderId,
      mobileAccountNo: mobile_number,
      emailAddress: customer_email || "",
      postBackURL: postBackUrl,
      merchantHashedReq: secureHash,
    });

    const gatewayRes = await fetch(EASYPAISA_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload.toString(),
    });

    const sql = getDb();
    await sql`
      UPDATE orders SET gateway_session_id = ${gatewayOrderId}, payment_status = 'pending', updated_at = NOW()
      WHERE id = ${orderId}
    `;

    if (!gatewayRes.ok) {
      return NextResponse.json({ error: "EasyPaisa payment initiation failed" }, { status: 502 });
    }

    return NextResponse.json({
      order_id: orderId,
      status: "pending",
      message: "Payment request sent to your EasyPaisa account. Please approve.",
    });
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("EasyPaisa payment error:", err);
    return NextResponse.json(
      { error: "EasyPaisa unavailable. Please use Cash on Delivery or WhatsApp us." },
      { status: 500 }
    );
  }
}
