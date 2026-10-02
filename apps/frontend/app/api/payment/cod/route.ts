import { NextRequest, NextResponse, after } from "next/server";
import { createOrder, OrderValidationError } from "@/lib/orders";
import { notifyNewOrder } from "@/lib/notify";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customer_name, customer_email, customer_phone,
      shipping_address, shipping, promo_code, checkout_id, marketing_opt_in } = body;

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
      paymentMethod: "cod",
      paymentStatus: "unpaid",
      status: "pending",
    });

    after(() => notifyNewOrder(orderId));

    return NextResponse.json({
      order_id: orderId,
      status: "pending_confirmation",
      message: "Order placed! Pay on delivery.",
    });
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("COD order error:", err);
    return NextResponse.json(
      { error: "Failed to place order. Please try again or contact us on WhatsApp." },
      { status: 500 }
    );
  }
}
