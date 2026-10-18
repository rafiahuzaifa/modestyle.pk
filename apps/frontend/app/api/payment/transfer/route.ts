import { NextRequest, NextResponse, after } from "next/server";
import { createOrder, OrderValidationError } from "@/lib/orders";
import { notifyNewOrder } from "@/lib/notify";
import { getSettings } from "@/lib/settings";
import { transferAvailable } from "@/lib/settings-shared";
import { getDb } from "@/lib/neon";

/** Advance payment by bank / Raast / wallet transfer. The order waits until the admin
 * confirms the money arrived (Admin → Orders → Mark payment received). */
export async function POST(request: NextRequest) {
  try {
    if (!transferAvailable(await getSettings())) {
      return NextResponse.json({ error: "Bank transfer isn't available right now. Please use Cash on Delivery." }, { status: 400 });
    }
    const body = await request.json();
    const { items, customer_name, customer_email, customer_phone, shipping_address, shipping, promo_code, checkout_id, marketing_opt_in } = body;
    if (!items?.length || !customer_email || !customer_name) {
      return NextResponse.json({ error: "Missing required order fields" }, { status: 400 });
    }

    const { orderId } = await createOrder({
      items,
      customerName: customer_name,
      customerEmail: customer_email,
      customerPhone: customer_phone,
      shippingAddress: shipping_address,
      shipping,
      promoCode: promo_code,
      checkoutId: typeof checkout_id === "string" ? checkout_id : undefined,
      marketingOptIn: marketing_opt_in === true,
      paymentMethod: "transfer",
      paymentStatus: "pending",
      status: "pending",
    });

    // Optional transaction ID / reference the customer typed in.
    const reference = String(body.transfer_reference || "").trim().slice(0, 80);
    if (reference) {
      await getDb()`UPDATE orders SET transaction_id = ${reference}, updated_at = NOW() WHERE id = ${orderId}`;
    }

    after(() => notifyNewOrder(orderId));
    return NextResponse.json({ order_id: orderId, status: "awaiting_payment" });
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Transfer order error:", err);
    return NextResponse.json({ error: "Failed to place order. Please try again or contact us on WhatsApp." }, { status: 500 });
  }
}
