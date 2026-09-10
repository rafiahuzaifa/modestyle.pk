import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/neon";
import { client } from "@/sanity/lib/client";
import { randomUUID } from "crypto";

const FREE_SHIPPING_THRESHOLD = 5000;
const STANDARD_SHIPPING = 250;
const EXPRESS_SHIPPING = 500;
const COD_FEE = 200;
const VALID_PROMO_CODES = new Set(["MODEST10", "WELCOME10"]);
const PROMO_DISCOUNT_RATE = 0.1;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customer_name, customer_email, customer_phone,
      shipping_address, shipping, promo_code } = body;

    if (!items?.length || !customer_email || !customer_name) {
      return NextResponse.json({ error: "Missing required order fields" }, { status: 400 });
    }

    // Never trust client-supplied prices/totals — recompute from Sanity.
    const productIds = [...new Set(items.map((i: { product_id: string }) => i.product_id))] as string[];
    const products = await client.fetch<{ _id: string; price: number }[]>(
      `*[_type == "product" && _id in $ids]{ _id, price }`,
      { ids: productIds }
    );
    const priceById = new Map(products.map((p) => [p._id, p.price]));

    for (const item of items) {
      if (!priceById.has(item.product_id)) {
        return NextResponse.json({ error: "One or more items are no longer available" }, { status: 400 });
      }
    }

    const subtotal = items.reduce(
      (sum: number, item: { product_id: string; quantity: number }) =>
        sum + (priceById.get(item.product_id) || 0) * item.quantity,
      0
    );

    const promoApplied = typeof promo_code === "string" && VALID_PROMO_CODES.has(promo_code.toUpperCase());
    const discount = promoApplied ? Math.round(subtotal * PROMO_DISCOUNT_RATE) : 0;

    const allowedShipping = subtotal >= FREE_SHIPPING_THRESHOLD
      ? [0, EXPRESS_SHIPPING]
      : [STANDARD_SHIPPING, EXPRESS_SHIPPING];
    const shippingCost = allowedShipping.includes(shipping) ? shipping : allowedShipping[0];

    const total = subtotal + shippingCost - discount + COD_FEE;

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
        'processing', ${subtotal}, ${shippingCost}, ${discount}, ${total},
        ${promoApplied ? promo_code.toUpperCase() : null}, 'cod', 'unpaid',
        ${JSON.stringify(shipping_address || {})}, ${now}, ${now}
      )
    `;

    for (const item of items) {
      await sql`
        INSERT INTO order_items (id, order_id, product_id, name, price, quantity, size, color)
        VALUES (
          ${randomUUID()}, ${orderId}, ${item.product_id},
          ${item.name}, ${priceById.get(item.product_id)}, ${item.quantity},
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
