import "server-only";
import { getDb } from "@/lib/neon";
import { writeClient } from "@/sanity/lib/write-client";
import { getSettings } from "@/lib/settings";
import { ensureMarketingSchema } from "@/lib/marketing";
import { isEmailConfigured } from "@/lib/notify";
import { isWhatsAppConfigured } from "@/lib/whatsapp";
import { availablePaymentMethods } from "@/lib/payments";
import { SITE_URL } from "@/lib/site";

/** Read-only store insights the AI Manager uses to understand the business. */

const days = (n: unknown, def: number, max = 365) => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) && v > 0 ? Math.min(v, max) : def;
};

export async function salesSummary(args: { days?: number }) {
  const d = days(args.days, 7);
  const sql = getDb();
  const [totals] = (await sql`
    SELECT COUNT(*)::int AS orders,
      COALESCE(SUM(total) FILTER (WHERE status <> 'cancelled'), 0)::float AS revenue,
      COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS awaiting_confirmation,
      COUNT(*) FILTER (WHERE status = 'delivered')::int AS delivered
    FROM orders WHERE created_at > NOW() - make_interval(days => ${d})
  `) as { orders: number; revenue: number; cancelled: number; awaiting_confirmation: number; delivered: number }[];
  const top = await sql`
    SELECT oi.name, SUM(oi.quantity)::int AS units, SUM(oi.price * oi.quantity)::float AS revenue
    FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at > NOW() - make_interval(days => ${d}) AND o.status <> 'cancelled'
    GROUP BY oi.name ORDER BY units DESC LIMIT 5
  `;
  const byCity = await sql`
    SELECT COALESCE(NULLIF(TRIM(shipping_address->>'city'), ''), 'Unknown') AS city, COUNT(*)::int AS orders
    FROM orders WHERE created_at > NOW() - make_interval(days => ${d})
    GROUP BY 1 ORDER BY 2 DESC LIMIT 5
  `;
  return { period_days: d, ...totals, top_products: top, top_cities: byCity };
}

export async function ordersNeedingAttention() {
  const sql = getDb();
  const rows = (await sql`
    SELECT id, customer_name, customer_phone, total, status, payment_method, created_at,
      ROUND(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600)::int AS age_hours
    FROM orders
    WHERE (status = 'pending' AND created_at < NOW() - INTERVAL '12 hours')
       OR (status IN ('confirmed', 'processing') AND created_at < NOW() - INTERVAL '3 days')
       OR (status = 'shipped' AND updated_at < NOW() - INTERVAL '7 days')
    ORDER BY created_at ASC LIMIT 25
  `) as {
    id: string;
    customer_name: string;
    customer_phone: string;
    total: number;
    status: string;
    payment_method: string;
    created_at: string;
    age_hours: number;
  }[];
  return {
    count: rows.length,
    orders: rows.map((r) => ({ ...r, ref: String(r.id).slice(0, 8).toUpperCase() })),
    rule: "pending >12h = not confirmed with customer; confirmed/processing >3 days = not shipped; shipped >7 days = check delivery",
  };
}

export async function stockIssues() {
  const products = await writeClient.fetch<{ _id: string; name: string; stock?: number; price: number }[]>(
    `*[_type == "product" && !(_id in path("drafts.**")) && (stock < 10 || !defined(stock))]{ _id, name, stock, price } | order(stock asc)`
  );
  return {
    out_of_stock: products.filter((p) => !p.stock),
    low_stock: products.filter((p) => (p.stock ?? 0) > 0),
  };
}

export async function slowProducts(args: { days?: number }) {
  const d = days(args.days, 30);
  const sql = getDb();
  const sold = await sql`
    SELECT DISTINCT oi.product_id FROM order_items oi JOIN orders o ON o.id = oi.order_id
    WHERE o.created_at > NOW() - make_interval(days => ${d}) AND o.status <> 'cancelled'
  `;
  const soldIds = new Set(sold.map((r) => r.product_id as string));
  const products = await writeClient.fetch<
    { _id: string; name: string; price: number; stock?: number; slug: string; category?: string; image?: string; _createdAt: string }[]
  >(
    `*[_type == "product" && !(_id in path("drafts.**"))]{ _id, name, price, stock, "slug": slug.current, "category": category->name, "image": images[0].asset->url, _createdAt }`
  );
  const slow = products.filter((p) => !soldIds.has(p._id) && (p.stock ?? 0) > 0);
  return {
    period_days: d,
    total_products: products.length,
    not_sold_count: slow.length,
    products: slow.slice(0, 30).map((p) => ({ ...p, url: `${SITE_URL}/products/${p.slug}` })),
  };
}

export async function siteHealth() {
  const paths = ["/", "/products", "/checkout", "/contact", "/faqs", "/shipping", "/sitemap.xml"];
  const sample = await writeClient.fetch<string[]>(`*[_type == "product" && !(_id in path("drafts.**"))][0...3].slug.current`);
  paths.push(...sample.map((s) => `/products/${s}`));
  const pages = await Promise.all(
    paths.map(async (p) => {
      const started = Date.now();
      try {
        const r = await fetch(SITE_URL + p, { cache: "no-store", signal: AbortSignal.timeout(10000) });
        return { path: p, status: r.status, ms: Date.now() - started };
      } catch {
        return { path: p, status: 0, ms: Date.now() - started };
      }
    })
  );
  const settings = await getSettings();
  const noDescription = await writeClient.fetch<number>(
    `count(*[_type == "product" && !(_id in path("drafts.**")) && (!defined(description) || length(description) < 40)])`
  );
  return {
    site_url: SITE_URL,
    broken_pages: pages.filter((p) => p.status !== 200),
    slow_pages: pages.filter((p) => p.status === 200 && p.ms > 4000),
    checked_pages: pages.length,
    integrations: {
      order_emails: isEmailConfigured(),
      whatsapp_automation: isWhatsAppConfigured(),
      payment_methods: availablePaymentMethods(),
      social_posting: !!process.env.META_PAGE_TOKEN,
      custom_domain: !SITE_URL.includes("vercel.app"),
    },
    seo: { products_missing_description: noDescription },
    settings_snapshot: {
      announcement: settings.announcement,
      free_shipping_over: settings.freeShippingThreshold,
      cod_fee: settings.codFee,
      active_promo_codes: settings.promoCodes.filter((p) => p.active).map((p) => `${p.code} (${p.percent}%)`),
    },
  };
}

export async function marketingStats() {
  await ensureMarketingSchema();
  const sql = getDb();
  const [subs] = await sql`
    SELECT COUNT(*) FILTER (WHERE email_opt_in AND email IS NOT NULL)::int AS email_subscribers,
           COUNT(*) FILTER (WHERE whatsapp_opt_in AND phone IS NOT NULL)::int AS whatsapp_subscribers
    FROM subscribers
  `;
  const [carts] = await sql`
    SELECT COUNT(*)::int AS abandoned_last_7_days,
           COALESCE(SUM(subtotal), 0)::float AS abandoned_value
    FROM checkouts WHERE order_id IS NULL AND created_at > NOW() - INTERVAL '7 days'
  `;
  const [recovered] = await sql`
    SELECT COUNT(*)::int AS recovered_last_7_days FROM checkouts
    WHERE order_id IS NOT NULL AND created_at > NOW() - INTERVAL '7 days'
  `;
  return { ...subs, ...carts, ...recovered };
}

export async function findProducts(args: { query?: string }) {
  const q = String(args.query || "").trim();
  return writeClient.fetch(
    `*[_type == "product" && !(_id in path("drafts.**")) && ($q == "" || name match $pattern)][0...15]{
      _id, name, price, compareAtPrice, stock, "category": category->name, isFeatured, isNewArrival, isBestseller,
      "slug": slug.current, "hasDescription": length(description) > 40
    }`,
    { q, pattern: `*${q}*` }
  );
}
