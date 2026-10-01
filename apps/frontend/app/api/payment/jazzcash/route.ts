import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createOrder, OrderValidationError } from "@/lib/orders";
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

export async function POST(request: NextRequest) {
  if (!isConfigured(JAZZCASH_MERCHANT_ID) || !isConfigured(JAZZCASH_PASSWORD)) {
    return NextResponse.json(
      { error: "JazzCash payment is being set up. Please use Cash on Delivery for now." },
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
      return NextResponse.json({ error: "Valid JazzCash mobile number required (11 digits)" }, { status: 400 });
    }

    const { orderId, total } = await createOrder({
      items,
      customerName: customer_name,
      customerEmail: customer_email,
      customerPhone: customer_phone,
      shippingAddress: shipping_address,
      shipping,
      promoCode: promo_code,
      paymentMethod: "jazzcash",
      paymentStatus: "unpaid",
    });

    const txnRef = `MS-${orderId.slice(0, 8)}-${Date.now()}`;
    const amount = String(Math.round(total));
    const now = new Date();
    const txnDateTime = now.toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);

    const hashString = [JAZZCASH_SALT, amount, JAZZCASH_MERCHANT_ID, mobile_number, JAZZCASH_PASSWORD, txnDateTime, txnDateTime, txnRef, "PKR"].join("&");
    const secureHash = createHmac("sha256", JAZZCASH_SALT).update(hashString).digest("hex");

    const payload = {
      pp_Language: "EN",
      pp_MerchantID: JAZZCASH_MERCHANT_ID,
      pp_Password: JAZZCASH_PASSWORD,
      pp_TxnRefNo: txnRef,
      pp_Amount: amount,
      pp_TxnCurrency: "PKR",
      pp_TxnDateTime: txnDateTime,
      pp_TxnExpiryDateTime: txnDateTime,
      pp_BillReference: `order-${orderId.slice(0, 8)}`,
      pp_Description: `ModestStyle.pk Order #${orderId.slice(0, 8)}`,
      pp_MobileNumber: mobile_number,
      pp_CNIC: "",
      pp_SecureHash: secureHash,
    };

    const gatewayRes = await fetch(JAZZCASH_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = gatewayRes.ok ? await gatewayRes.json() : {};

    const sql = getDb();

    if (data.pp_ResponseCode === "124") {
      await sql`
        UPDATE orders SET transaction_id = ${data.pp_TxnRefNo || txnRef}, gateway_session_id = ${txnRef},
          payment_status = 'pending', updated_at = NOW()
        WHERE id = ${orderId}
      `;
      return NextResponse.json({
        order_id: orderId,
        status: "otp_sent",
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
