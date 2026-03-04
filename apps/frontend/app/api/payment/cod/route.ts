import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/neon";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customer_name, customer_email, customer_phone,
      shipping_address, subtotal, shipping, discount, total, promo_code } = body;

    if (!items?.length || !customer_email || !customer_name) {
      return NextResponse.json({ error: "Missing required order fields" }, { status: 400 });
    }

    const sql = getDb();
    const orderId = randomUUID();
    const now = new Date().toISOString();

    await sql`
      INSERT INTO orders (
        id, customer_name, customer_email, customer_phone,
        status, subtotal, shipping, discount, total,
        promo_code, payment_method, payment_status,
        shipping_address, created_at, updated_at
      ) VALUES (
        ${orderId}, ${customer_name}, ${customer_email}, ${customer_phone || ""},
        'processing', ${subtotal}, ${shipping}, ${discount}, ${total},
        ${promo_code || null}, 'cod', 'unpaid',
        ${JSON.stringify(shipping_address || {})}, ${now}, ${now}
      )
    `;

    for (const item of items) {
      await sql`
        INSERT INTO order_items (id, order_id, product_id, name, price, quantity, size, color)
        VALUES (
          ${randomUUID()}, ${orderId}, ${item.product_id},
          ${item.name}, ${item.price}, ${item.quantity},
          ${item.size || null}, ${item.color || null}
        )
      `;
    }

    return NextResponse.json({
      order_id: orderId,
      status: "confirmed",
      message: "Order placed! Pay on delivery.",
    });
  } catch (err) {
    console.error("COD order error:", err);
    return NextResponse.json(
      { error: "Failed to place order. Please try again or contact us on WhatsApp." },
      { status: 500 }
    );
  }
}
