import "server-only";
import { getDb } from "@/lib/neon";
import { marketingStats, ordersNeedingAttention, salesSummary, siteHealth, slowProducts, stockIssues } from "@/lib/agent/insights";
import { compareWithCompetitors, type CompetitorReport } from "@/lib/agent/competitors";

/**
 * AI Advisor: reviews the store and produces prioritised suggestions.
 * It only reads data and recommends — changes are made by the owner in the admin panel.
 */

export interface Suggestion {
  priority: "urgent" | "important" | "idea";
  area: "orders" | "stock" | "pricing" | "products" | "marketing" | "website" | "setup";
  title: string;
  detail: string;
  /** Where in the admin panel to act on it. */
  link?: string;
}

export interface AdvisorReport {
  createdAt: string;
  sales: Awaited<ReturnType<typeof salesSummary>>;
  attention: Awaited<ReturnType<typeof ordersNeedingAttention>>;
  stock: Awaited<ReturnType<typeof stockIssues>>;
  slow: Awaited<ReturnType<typeof slowProducts>>;
  health: Awaited<ReturnType<typeof siteHealth>>;
  marketing: Awaited<ReturnType<typeof marketingStats>>;
  competitors: CompetitorReport | null;
  suggestions: Suggestion[];
}

const pkr = (n: number) => `PKR ${Math.round(n).toLocaleString("en-PK")}`;
const KIND_LABELS: Record<string, string> = {
  instant: "Instant (ready-to-wear) hijabs",
  underscarf: "Single underscarves / inner caps",
  niqab: "Niqabs",
  khimar: "Khimars",
  pins: "Magnetic hijab pins",
};

function buildSuggestions(r: Omit<AdvisorReport, "suggestions" | "createdAt">): Suggestion[] {
  const s: Suggestion[] = [];

  if (r.attention.count) {
    s.push({
      priority: "urgent",
      area: "orders",
      title: `${r.attention.count} order(s) need attention`,
      detail: r.attention.orders
        .slice(0, 5)
        .map((o) => `#${o.ref} ${o.customer_name} — ${o.status}, ${o.age_hours}h old`)
        .join("; ") + ". Confirm pending orders on WhatsApp and dispatch confirmed ones.",
      link: "/admin/orders",
    });
  }

  if (r.health.broken_pages.length) {
    s.push({
      priority: "urgent",
      area: "website",
      title: "Some website pages are not loading",
      detail: r.health.broken_pages.map((p) => `${p.path} (status ${p.status || "no response"})`).join(", "),
    });
  }

  if (r.stock.out_of_stock.length) {
    s.push({
      priority: "important",
      area: "stock",
      title: `${r.stock.out_of_stock.length} product(s) are out of stock`,
      detail: r.stock.out_of_stock.slice(0, 8).map((p) => p.name).join(", ") + ". Restock or hide them so customers don't hit dead ends.",
      link: "/admin/products",
    });
  }
  if (r.stock.low_stock.length) {
    s.push({
      priority: "important",
      area: "stock",
      title: `${r.stock.low_stock.length} product(s) are running low`,
      detail: r.stock.low_stock.slice(0, 8).map((p) => `${p.name} (${p.stock} left)`).join(", "),
      link: "/admin/products",
    });
  }

  if (r.competitors) {
    const expensive = r.competitors.products.filter((p) => (p.diffPercent ?? 0) >= 40).sort((a, b) => (b.diffPercent ?? 0) - (a.diffPercent ?? 0));
    if (expensive.length) {
      s.push({
        priority: "important",
        area: "pricing",
        title: `${expensive.length} product(s) are priced well above competitors`,
        detail:
          expensive
            .slice(0, 6)
            .map((p) => `${p.name}: ${pkr(p.price)} vs market ${pkr(p.market!)} (+${p.diffPercent}%)`)
            .join("; ") + ". Lower the price, or explain the premium (fabric, quality) clearly in the description.",
        link: "/admin/products",
      });
    }
    const cheaper = r.competitors.products.filter((p) => (p.diffPercent ?? 0) <= -15);
    if (cheaper.length) {
      s.push({
        priority: "idea",
        area: "marketing",
        title: `${cheaper.length} product(s) are cheaper than competitors — advertise it`,
        detail:
          cheaper
            .slice(0, 5)
            .map((p) => `${p.name}: ${pkr(p.price)} vs ${pkr(p.market!)} (${p.diffPercent}%)`)
            .join("; ") + ". Feature these on the homepage and in ads (\"better value than leading brands\").",
        link: "/admin/products",
      });
    }
    for (const m of r.competitors.missingKinds) {
      s.push({
        priority: "idea",
        area: "products",
        title: `Add: ${KIND_LABELS[m.kind] || m.kind}`,
        detail: `${m.brandsSelling} of ${r.competitors.brands.length} top brands sell these${m.medianPrice ? ` (typical price ${pkr(m.medianPrice)})` : ""}, and your store has none.`,
        link: "/admin/products/new",
      });
    }
  }

  if (r.slow.not_sold_count && r.slow.total_products) {
    const share = Math.round((100 * r.slow.not_sold_count) / r.slow.total_products);
    if (share >= 50) {
      s.push({
        priority: "idea",
        area: "marketing",
        title: `${r.slow.not_sold_count} of ${r.slow.total_products} products haven't sold in ${r.slow.period_days} days`,
        detail:
          "Try a limited-time offer or an Instagram/Facebook post for a few of them: " +
          r.slow.products.slice(0, 5).map((p) => p.name).join(", ") + ".",
        link: "/admin/marketing",
      });
    }
  }

  if (r.marketing.abandoned_last_7_days >= 3) {
    s.push({
      priority: "important",
      area: "marketing",
      title: `${r.marketing.abandoned_last_7_days} shoppers left checkout this week (${pkr(r.marketing.abandoned_value)})`,
      detail: "Make sure cart-reminder emails/WhatsApp are switched on, and consider lowering the COD fee or free-shipping threshold.",
      link: "/admin/settings",
    });
  }

  if (r.health.seo.products_missing_description) {
    s.push({
      priority: "idea",
      area: "website",
      title: `${r.health.seo.products_missing_description} product(s) have no proper description`,
      detail: "Write 2–3 lines (fabric, fit, occasion, care) — it helps Google ranking and customer trust.",
      link: "/admin/products",
    });
  }

  const i = r.health.integrations;
  const setup: string[] = [];
  if (!i.order_emails) setup.push("order emails (RESEND_API_KEY on Vercel)");
  if (!i.whatsapp_automation) setup.push("WhatsApp order confirmations (Meta WhatsApp API keys)");
  if (!i.custom_domain) setup.push("your own domain (currently a .vercel.app address)");
  if (setup.length) {
    s.push({ priority: "important", area: "setup", title: "Finish setup to unlock more sales", detail: "Not connected yet: " + setup.join("; ") + "." });
  }

  const order = { urgent: 0, important: 1, idea: 2 };
  return s.sort((a, b) => order[a.priority] - order[b.priority]);
}

let tableReady: Promise<unknown> | null = null;
function ensureTable() {
  tableReady ??= getDb()`
    CREATE TABLE IF NOT EXISTS advisor_reports (
      id SERIAL PRIMARY KEY,
      data JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `.catch((err) => {
    tableReady = null;
    throw err;
  });
  return tableReady;
}

/** Runs a full review (≈10–30s, includes competitor sites) and stores it. */
export async function runAdvisor(): Promise<AdvisorReport> {
  const [sales, attention, stock, slow, health, marketing, competitors] = await Promise.all([
    salesSummary({ days: 30 }),
    ordersNeedingAttention(),
    stockIssues(),
    slowProducts({ days: 30 }),
    siteHealth(),
    marketingStats(),
    compareWithCompetitors().catch(() => null),
  ]);
  const base = { sales, attention, stock, slow, health, marketing, competitors };
  const report: AdvisorReport = { createdAt: new Date().toISOString(), ...base, suggestions: buildSuggestions(base) };

  await ensureTable();
  const sql = getDb();
  await sql`INSERT INTO advisor_reports (data) VALUES (${JSON.stringify(report)})`;
  await sql`DELETE FROM advisor_reports WHERE id NOT IN (SELECT id FROM advisor_reports ORDER BY id DESC LIMIT 30)`;
  return report;
}

export async function latestReport(): Promise<AdvisorReport | null> {
  await ensureTable();
  const [row] = await getDb()`SELECT data FROM advisor_reports ORDER BY id DESC LIMIT 1`;
  return (row?.data as AdvisorReport) || null;
}
