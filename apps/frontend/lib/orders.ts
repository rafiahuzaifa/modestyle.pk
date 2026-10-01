import { client } from "@/sanity/lib/client";
import { getDb } from "@/lib/neon";
import { randomUUID } from "crypto";

export const FREE_SHIPPING_THRESHOLD = 5000;
export const STANDARD_SHIPPING = 250;
export const EXPRESS_SHIPPING = 500;
const VALID_PROMO_CODES = new Set(["MODEST10", "WELCOME10"]);
const PROMO_DISCOUNT_RATE = 0.1;

export interface OrderItemInput {
  product_id: string;
  name: string;
  quantity: number;
  size?: string;
  color?: string;
}

export class OrderValidationError extends Error {}

/** Recomputes subtotal/discount/total/shipping from trusted server-side data.
 * Never trust client-submitted prices or totals. */
export async function recomputeOrderTotals(
  items: OrderItemInput[],
  shipping: number,
  promoCode?: string
) {
  if (!items?.length) throw new OrderValidationError("No items in order");

  const productIds = [...new Set(items.map((i) => i.product_id))] as string[];
  const products = await client.fetch<{ _id: string; price: number }[]>(
    `*[_type == "product" && _id in $ids]{ _id, price }`,
    { ids: productIds }
  );
  const priceById = new Map(products.map((p) => [p._id, p.price]));

  for (const item of items) {
    if (!priceById.has(item.product_id)) {
      throw new OrderValidationError("One or more items are no longer available");
    }
  }

  const subtotal = items.reduce(
    (sum, item) => sum + (priceById.get(item.product_id) || 0) * item.quantity,
    0
  );

  const promoApplied = typeof promoCode === "string" && VALID_PROMO_CODES.has(promoCode.toUpperCase());
  const discount = promoApplied ? Math.round(subtotal * PROMO_DISCOUNT_RATE) : 0;

  const allowedShipping = subtotal >= FREE_SHIPPING_THRESHOLD
    ? [0, EXPRESS_SHIPPING]
    : [STANDARD_SHIPPING, EXPRESS_SHIPPING];
  const shippingCost = allowedShipping.includes(shipping) ? shipping : allowedShipping[0];

  const total = subtotal + shippingCost - discount;

  return { subtotal, discount, total, shippingCost, priceById, promoApplied };
}

export interface CreateOrderParams {
  items: OrderItemInput[];
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress?: Record<string, unknown>;
  shipping: number;
  promoCode?: string;
  paymentMethod: "cod" | "safepay" | "jazzcash" | "easypaisa";
  paymentStatus: "unpaid" | "pending" | "paid" | "failed";
  status?: string;
}

/** Validates pricing, then creates the order + order_items rows in Neon.
 * Returns the created order's id and computed totals. */
export async function createOrder(params: CreateOrderParams) {
  const { subtotal, discount, total, shippingCost, priceById, promoApplied } =
    await recomputeOrderTotals(params.items, params.shipping, params.promoCode);

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
      ${orderId}, ${params.customerName}, ${params.customerEmail}, ${params.customerPhone || ""},
      ${params.status || "processing"}, ${subtotal}, ${shippingCost}, ${discount}, ${total},
      ${promoApplied ? params.promoCode!.toUpperCase() : null}, ${params.paymentMethod}, ${params.paymentStatus},
      ${JSON.stringify(params.shippingAddress || {})}, ${now}, ${now}
    )
  `;

  for (const item of params.items) {
    await sql`
      INSERT INTO order_items (id, order_id, product_id, name, price, quantity, size, color)
      VALUES (
        ${randomUUID()}, ${orderId}, ${item.product_id},
        ${item.name}, ${priceById.get(item.product_id)}, ${item.quantity},
        ${item.size || null}, ${item.color || null}
      )
    `;
  }

  return { orderId, subtotal, discount, total, shippingCost };
}

export async function setOrderGatewaySession(orderId: string, gatewaySessionId: string, paymentStatus: string) {
  const sql = getDb();
  await sql`
    UPDATE orders SET gateway_session_id = ${gatewaySessionId}, payment_status = ${paymentStatus}, updated_at = NOW()
    WHERE id = ${orderId}
  `;
}

export async function markOrderPaymentFailed(orderId: string) {
  const sql = getDb();
  await sql`UPDATE orders SET payment_status = 'failed', updated_at = NOW() WHERE id = ${orderId}`;
}

export async function findOrderByGatewaySessionId(gatewaySessionId: string) {
  const sql = getDb();
  const [order] = await sql`SELECT id FROM orders WHERE gateway_session_id = ${gatewaySessionId}`;
  return order as { id: string } | undefined;
}

export async function findOrderByIdPrefix(idPrefix: string) {
  const sql = getDb();
  const [order] = await sql`SELECT id FROM orders WHERE id LIKE ${idPrefix + "%"}`;
  return order as { id: string } | undefined;
}

export async function markOrderPaid(orderId: string, transactionId: string) {
  const sql = getDb();
  await sql`
    UPDATE orders SET payment_status = 'paid', status = 'processing', transaction_id = ${transactionId}, updated_at = NOW()
    WHERE id = ${orderId}
  `;
}
