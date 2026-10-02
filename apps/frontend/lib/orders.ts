import { client } from "@/sanity/lib/client";
import { getDb } from "@/lib/neon";
import { randomUUID } from "crypto";
import { notifyNewOrder } from "@/lib/notify";
import { markCheckoutRecovered, upsertSubscriber } from "@/lib/marketing";

export const FREE_SHIPPING_THRESHOLD = 5000;
export const STANDARD_SHIPPING = 250;
export const EXPRESS_SHIPPING = 500;
export const COD_FEE = 200;
const MAX_QTY_PER_ITEM = 20;
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Normalises Pakistani mobile numbers (03xx..., +923xx..., 923xx...) to 03xxxxxxxxx.
 * Returns null if the number isn't a valid PK mobile. */
export function normalizePkPhone(raw: unknown): string | null {
  const digits = String(raw ?? "").replace(/\D/g, "");
  const local = digits.startsWith("92") ? "0" + digits.slice(2) : digits;
  return /^03\d{9}$/.test(local) ? local : null;
}

export function isValidEmail(raw: unknown): boolean {
  return typeof raw === "string" && EMAIL_RE.test(raw.trim());
}

/** Recomputes subtotal/discount/total/shipping from trusted server-side data.
 * Never trust client-submitted prices or totals. */
export async function recomputeOrderTotals(
  items: OrderItemInput[],
  shipping: number,
  promoCode?: string,
  paymentMethod?: string
) {
  if (!Array.isArray(items) || !items.length) throw new OrderValidationError("No items in order");
  for (const item of items) {
    if (
      typeof item?.product_id !== "string" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > MAX_QTY_PER_ITEM
    ) {
      throw new OrderValidationError("Invalid item quantity in your bag. Please review your cart.");
    }
  }

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

  const codFee = paymentMethod === "cod" ? COD_FEE : 0;
  const total = subtotal + shippingCost - discount + codFee;

  return { subtotal, discount, codFee, total, shippingCost, priceById, promoApplied };
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
  /** Client-side checkout session id, used to close the abandoned-cart record. */
  checkoutId?: string;
  /** Customer ticked "send me offers on WhatsApp & email". */
  marketingOptIn?: boolean;
}

function validateCustomer(params: CreateOrderParams) {
  if (!params.customerName?.trim()) throw new OrderValidationError("Please enter your name.");
  if (!isValidEmail(params.customerEmail)) throw new OrderValidationError("Please enter a valid email address.");
  const phone = normalizePkPhone(params.customerPhone);
  if (!phone) throw new OrderValidationError("Please enter a valid mobile number (e.g. 03001234567).");
  const addr = params.shippingAddress as { address?: string; city?: string } | undefined;
  if (!addr?.address?.trim() || !addr?.city?.trim()) {
    throw new OrderValidationError("Please enter your full delivery address and city.");
  }
  return phone;
}

/** Validates customer details and pricing, then creates the order + order_items rows in Neon.
 * Returns the created order's id and computed totals. COD orders include COD_FEE in the total. */
export async function createOrder(params: CreateOrderParams) {
  const phone = validateCustomer(params);
  const { subtotal, discount, codFee, total, shippingCost, priceById, promoApplied } =
    await recomputeOrderTotals(params.items, params.shipping, params.promoCode, params.paymentMethod);

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
      ${orderId}, ${params.customerName.trim()}, ${params.customerEmail.trim().toLowerCase()}, ${phone},
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

  await recordMarketing(orderId, params, phone);

  return { orderId, subtotal, discount, codFee, total, shippingCost, phone };
}

/** Best-effort: never fails the order. */
async function recordMarketing(orderId: string, params: CreateOrderParams, phone: string) {
  const email = params.customerEmail.trim().toLowerCase();
  try {
    await markCheckoutRecovered(orderId, params.checkoutId, phone, email);
    if (params.marketingOptIn) {
      await upsertSubscriber({ name: params.customerName.trim(), email, phone, source: "order" });
    }
  } catch (err) {
    console.error("Marketing record failed:", err);
  }
}

export interface OrderSummary {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
}

/** Public-safe order summary for the success page (order ids are unguessable UUIDs). */
export async function getOrderSummary(orderId: string): Promise<OrderSummary | null> {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;
  const sql = getDb();
  const [order] = await sql`
    SELECT id, customer_name, total, status, payment_method, payment_status, created_at
    FROM orders WHERE id = ${orderId}
  `;
  return (order as OrderSummary) || null;
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

/** Marks an online-payment order as paid. Notifies the store only on the first
 * transition to paid, so gateway retries don't send duplicate emails. */
export async function markOrderPaid(orderId: string, transactionId: string) {
  const sql = getDb();
  const updated = await sql`
    UPDATE orders SET payment_status = 'paid', status = 'processing', transaction_id = ${transactionId}, updated_at = NOW()
    WHERE id = ${orderId} AND payment_status <> 'paid'
    RETURNING id
  `;
  if (updated.length) await notifyNewOrder(orderId);
}
