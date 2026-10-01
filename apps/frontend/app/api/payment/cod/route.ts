import { NextRequest, NextResponse } from "next/server";
import { createOrder, OrderValidationError } from "@/lib/orders";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customer_name, customer_email, customer_phone,
      shipping_address, shipping, promo_code } = body;

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
      paymentMethod: "cod",
      paymentStatus: "unpaid",
      status: "processing",
    });

    return NextResponse.json({
      order_id: orderId,
      status: "confirmed",
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
