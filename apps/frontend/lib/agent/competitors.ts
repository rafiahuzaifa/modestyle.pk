import "server-only";
import { writeClient } from "@/sanity/lib/write-client";

/**
 * Price comparison against leading Pakistani hijab brands, using the public
 * Shopify catalogue each store publishes at /products.json.
 */

export const COMPETITORS = [
  { name: "KEF", url: "https://kefpk.com" },
  { name: "Hijabeaze", url: "https://hijabeaze.com" },
  { name: "The Women Zone", url: "https://thewomenzone.pk" },
  { name: "Scarfs.pk", url: "https://scarfs.pk" },
];

type Kind = "abaya" | "prayer" | "jilbab" | "underscarf" | "pins" | "instant" | "niqab" | "khimar" | "kids" | "hijab";
const KIND_RE: [Kind, RegExp][] = [
  ["kids", /\bkids?\b|\bgirls?\b|baby/],
  ["abaya", /abaya/],
  ["prayer", /prayer|namaz|isdal|salah/],
  ["jilbab", /jilbab/],
  ["khimar", /khimar/],
  ["niqab", /niqab|naqab/],
  ["instant", /instant|ready.?to.?wear|pre.?(sewn|stitched|pinned)/],
  ["underscarf", /under.?scarf|inner cap|tube cap|bonnet|\bcap\b/],
  ["pins", /\bpins?\b|magnet/],
  ["hijab", /hijab|scarf|stole|wrap|dupatta/],
];
const FABRIC_RE: [string, RegExp][] = [
  ["silk", /silk|satin/],
  ["cashmere", /cashmere|pashmina|wool/],
  ["modal", /modal|viscose/],
  ["jersey", /jersey/],
  ["chiffon", /chiffon|georgette|crinkle|crimp/],
  ["lawn", /lawn|cotton|voile/],
];

const kindOf = (text: string): Kind | null => KIND_RE.find(([, re]) => re.test(text))?.[0] ?? null;
const fabricOf = (text: string) => FABRIC_RE.find(([, re]) => re.test(text))?.[0] ?? null;
/** For kids items: which garment it is, so a kids abaya isn't compared with kids hijabs. */
const garmentOf = (text: string) =>
  /abaya|jilbab/.test(text) ? "abaya" : /prayer|namaz|isdal/.test(text) ? "prayer" : /hijab|scarf/.test(text) ? "hijab" : null;

function median(values: number[]) {
  const s = [...values].sort((a, b) => a - b);
  if (!s.length) return null;
  const m = s.length / 2;
  return Math.round(s.length % 2 ? s[Math.floor(m)] : (s[m - 1] + s[m]) / 2);
}

interface Item {
  kind: Kind;
  fabric: string | null;
  garment: string | null;
  price: number;
}

async function loadBrand(url: string): Promise<Item[]> {
  const items: Item[] = [];
  for (let page = 1; page <= 4; page++) {
    const res = await fetch(`${url}/products.json?limit=250&page=${page}`, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ModestStyleAdvisor/1.0)" },
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) break;
    const data = (await res.json()) as { products?: { title: string; product_type?: string; variants?: { price: string }[] }[] };
    const products = data.products || [];
    for (const p of products) {
      const text = `${p.title} ${p.product_type || ""}`.toLowerCase();
      const kind = kindOf(text);
      const price = Math.min(...(p.variants || []).map((v) => Number(v.price)).filter((n) => n > 0));
      if (kind && Number.isFinite(price)) items.push({ kind, fabric: fabricOf(text), garment: garmentOf(text), price });
    }
    if (products.length < 250) break;
  }
  return items;
}

export interface ProductComparison {
  name: string;
  price: number;
  market: number | null;
  diffPercent: number | null;
  brands: Record<string, number | null>;
}

export interface CompetitorReport {
  checkedAt: string;
  brands: { name: string; url: string; products: number; ok: boolean }[];
  products: ProductComparison[];
  /** Product types every competitor sells that this store doesn't. */
  missingKinds: { kind: string; brandsSelling: number; medianPrice: number | null }[];
}

export async function compareWithCompetitors(): Promise<CompetitorReport> {
  const loaded = await Promise.all(
    COMPETITORS.map(async (b) => {
      try {
        return { ...b, items: await loadBrand(b.url), ok: true };
      } catch {
        return { ...b, items: [] as Item[], ok: false };
      }
    })
  );

  const ours = await writeClient.fetch<{ name: string; price: number; material?: string }[]>(
    `*[_type == "product" && !(_id in path("drafts.**"))]{ name, price, material }`
  );

  const products: ProductComparison[] = ours.map((p) => {
    const text = `${p.name} ${p.material || ""}`.toLowerCase();
    const kind = kindOf(text) ?? "hijab";
    const fabric = fabricOf(text);
    const brands: Record<string, number | null> = {};
    for (const b of loaded) {
      const garment = garmentOf(text);
      let matches = b.items.filter((i) => i.kind === kind && (kind !== "kids" || i.garment === garment));
      if (fabric && (kind === "hijab" || kind === "abaya")) {
        const sameFabric = matches.filter((i) => i.fabric === fabric);
        if (sameFabric.length) matches = sameFabric;
      }
      brands[b.name] = median(matches.map((i) => i.price));
    }
    const market = median(Object.values(brands).filter((v): v is number => v !== null));
    return {
      name: p.name,
      price: p.price,
      market,
      diffPercent: market ? Math.round((100 * (p.price - market)) / market) : null,
      brands,
    };
  });

  const ourKinds = new Set(ours.map((p) => kindOf(`${p.name} ${p.material || ""}`.toLowerCase()) ?? "hijab"));
  const missingKinds = (["instant", "underscarf", "niqab", "khimar", "pins"] as Kind[])
    .filter((k) => !ourKinds.has(k))
    .map((k) => {
      const selling = loaded.filter((b) => b.items.some((i) => i.kind === k));
      return {
        kind: k,
        brandsSelling: selling.length,
        medianPrice: median(selling.flatMap((b) => b.items.filter((i) => i.kind === k).map((i) => i.price))),
      };
    })
    .filter((m) => m.brandsSelling >= 2);

  return {
    checkedAt: new Date().toISOString(),
    brands: loaded.map((b) => ({ name: b.name, url: b.url, products: b.items.length, ok: b.ok })),
    products,
    missingKinds,
  };
}
