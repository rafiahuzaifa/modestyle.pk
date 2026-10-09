import { getDb } from "@/lib/neon";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { adminEmails } from "@/lib/admin";
import { getSettings } from "@/lib/settings";
import { isWhatsAppConfigured, sendTemplate, TEMPLATES } from "@/lib/whatsapp";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
// Must be an address on a domain verified in Resend. "onboarding@resend.dev" only
// delivers to the Resend account owner's own email — fine for admin alerts while testing.
const FROM = process.env.ORDER_EMAIL_FROM || `${SITE_NAME} <onboarding@resend.dev>`;

export function isEmailConfigured() {
  return !!RESEND_API_KEY && !RESEND_API_KEY.startsWith("your_");
}

function adminRecipients(): string[] {
  if (!process.env.ORDER_NOTIFY_EMAILS) return adminEmails();
  return process.env.ORDER_NOTIFY_EMAILS
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on Delivery",
  safepay: "Card (Safepay)",
  jazzcash: "JazzCash",
  easypaisa: "EasyPaisa",
};

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const pkr = (n: number) => `PKR ${Math.round(Number(n)).toLocaleString("en-PK")}`;

export async function sendEmail(to: string[], subject: string, html: string, headers?: Record<string, string>) {
  if (!to.length || !isEmailConfigured()) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html, headers }),
  });
  if (!res.ok) console.error("Resend error:", res.status, await res.text());
  return res.ok;
}

interface OrderRow {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  shipping_address: { address?: string; city?: string; province?: string; postal_code?: string } | null;
  items: { name: string; price: number; quantity: number; size: string | null; color: string | null }[];
}

/** Sends the new-order email (owner + customer) and the WhatsApp confirmation
 * request with Confirm/Cancel buttons. Each channel runs only if configured.
 * Never throws — a notification failure must not fail the order. */
export async function notifyNewOrder(orderId: string) {
  if (!isEmailConfigured() && !isWhatsAppConfigured()) return;
  try {
    const sql = getDb();
    const [order] = (await sql`
      SELECT o.*, COALESCE(json_agg(json_build_object(
        'name', oi.name, 'price', oi.price, 'quantity', oi.quantity,
        'size', oi.size, 'color', oi.color
      )) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
      FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
      WHERE o.id = ${orderId}
      GROUP BY o.id
    `) as OrderRow[];
    if (!order) return;

    const ref = order.id.slice(0, 8).toUpperCase();

    if (isWhatsAppConfigured() && order.customer_phone) {
      await sendTemplate(
        order.customer_phone,
        TEMPLATES.orderConfirmation,
        [order.customer_name.split(" ")[0] || order.customer_name, `#${ref}`, pkr(order.total)],
        [
          { type: "quick_reply", index: 0, payload: `CONFIRM:${order.id}` },
          { type: "quick_reply", index: 1, payload: `CANCEL:${order.id}` },
        ]
      );
    }
    if (!isEmailConfigured()) return;

    const addr = order.shipping_address || {};
    const addressLine = [addr.address, addr.city, addr.province, addr.postal_code].filter(Boolean).join(", ");
    const itemsHtml = order.items
      .map(
        (i) =>
          `<tr><td style="padding:6px 0">${esc(i.name)}${i.size ? ` · ${esc(i.size)}` : ""}${i.color ? ` · ${esc(i.color)}` : ""} × ${i.quantity}</td>` +
          `<td style="padding:6px 0;text-align:right">${pkr(i.price * i.quantity)}</td></tr>`
      )
      .join("");
    const extra = Number(order.total) - Number(order.subtotal) - Number(order.shipping) + Number(order.discount);
    const totalsHtml =
      `<tr><td>Subtotal</td><td style="text-align:right">${pkr(order.subtotal)}</td></tr>` +
      `<tr><td>Shipping</td><td style="text-align:right">${Number(order.shipping) ? pkr(order.shipping) : "FREE"}</td></tr>` +
      (Number(order.discount) ? `<tr><td>Discount</td><td style="text-align:right">-${pkr(order.discount)}</td></tr>` : "") +
      (extra > 0 ? `<tr><td>COD fee</td><td style="text-align:right">${pkr(extra)}</td></tr>` : "") +
      `<tr><td style="font-weight:bold;padding-top:8px">Total</td><td style="text-align:right;font-weight:bold;padding-top:8px">${pkr(order.total)}</td></tr>`;
    const table = `<table style="width:100%;border-collapse:collapse;font-size:14px">${itemsHtml}<tr><td colspan="2"><hr></td></tr>${totalsHtml}</table>`;
    const payment = PAYMENT_LABELS[order.payment_method] || order.payment_method;

    const adminHtml = `
      <h2>New order #${ref}</h2>
      <p><b>${esc(order.customer_name)}</b><br>
      Phone: ${esc(order.customer_phone)}<br>
      Email: ${esc(order.customer_email)}<br>
      Address: ${esc(addressLine)}<br>
      Payment: ${esc(payment)} (${esc(order.payment_status)})</p>
      ${table}
      <p><a href="${SITE_URL}/admin/orders">Open in admin panel</a></p>`;

    const settings = await getSettings();
    const socials = (
      [
        ["Instagram", settings.instagram],
        ["Facebook", settings.facebook],
        ["TikTok", settings.tiktok],
      ] as const
    )
      .filter(([, url]) => url)
      .map(([name, url]) => `<a href="${esc(url)}" style="color:#b8964e">${name}</a>`)
      .join(" · ");

    const customerHtml = `
      <h2>Thank you for your order, ${esc(order.customer_name.split(" ")[0])}!</h2>
      <p>We've received your order <b>#${ref}</b>. ${
        isWhatsAppConfigured()
          ? `We've sent a WhatsApp message to ${esc(order.customer_phone)} — please tap <b>Confirm Order</b> so we can dispatch it.`
          : `Our team will call you on ${esc(order.customer_phone)} to confirm it before dispatch.`
      }</p>
      ${table}
      <p><b>Delivering to:</b> ${esc(addressLine)}<br><b>Payment:</b> ${esc(payment)}</p>
      ${socials ? `<p>Follow us for new arrivals & exclusive offers: ${socials}</p>` : ""}
      <p>Questions? Just reply to this email.<br>— ${esc(SITE_NAME)}</p>`;

    await Promise.allSettled([
      sendEmail(adminRecipients(), `🛍️ New order #${ref} — ${pkr(order.total)} (${payment})`, adminHtml),
      sendEmail([order.customer_email], `Order confirmed #${ref} — ${SITE_NAME}`, customerHtml),
    ]);
  } catch (err) {
    console.error("Order notification failed:", err);
  }
}
