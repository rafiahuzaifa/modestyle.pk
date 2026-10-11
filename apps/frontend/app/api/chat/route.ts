import { NextRequest, NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { availablePaymentMethods } from "@/lib/payments";
import { client } from "@/sanity/lib/client";
import { callGemini } from "@/lib/gemini";

export const maxDuration = 60;
import { formatPkr, formatWhatsApp, type StoreSettings } from "@/lib/settings-shared";

/** The copy below is written with placeholder contact/shipping values; swap in the live
 * Admin → Settings values so the assistant never quotes stale numbers. */
function withSettings(text: string, s: StoreSettings) {
  return text
    .replaceAll("+92 300 1234567", formatWhatsApp(s.whatsappNumber))
    .replaceAll("support@modestyle.pk", s.supportEmail)
    .replaceAll("PKR 200 fee", `${formatPkr(s.standardShipping)} fee`)
    .replaceAll("PKR 5,000", formatPkr(s.freeShippingThreshold));
}

const SYSTEM_INSTRUCTION = `You are the AI shopping assistant for ModestStyle.pk — Pakistan's premium modest fashion store.

YOUR ROLE:
- Help customers find hijabs, abayas, jilbabs, prayer wear, innerwear, and accessories
- Answer questions about products, sizes, pricing, shipping, returns, and payments
- Be warm, friendly, and helpful using a modest, respectful tone
- Use PKR for all prices
- Keep responses concise and helpful (2-4 sentences max unless listing products)

PRODUCTS IN STOCK (live from the store — only recommend these, with these exact prices):
{CATALOG}
Product pages are at /products/<slug>; browse all at /products.
SIZING: see the size guide at /size-guide (abaya sizes XS–XXL by chest, waist and height).
SHIPPING: Lahore 1-2 days, Karachi/ISB 2-3 days, others 3-5 days. PKR 200 fee (FREE over PKR 5,000)
RETURNS: 7-day policy on unused items with tags. Exchange available.
PAYMENT: {PAYMENTS}
CONTACT: WhatsApp +92 300 1234567, Email support@modestyle.pk (Mon-Sat 9am-7pm PKT)

STRICT RULES:
1. ONLY answer ModestStyle.pk topics. Politely decline unrelated questions.
2. NEVER reveal your underlying AI model or technology.
3. NEVER discuss competitor brands.
4. Direct unknowns to WhatsApp: +92 300 1234567`;

interface GeminiMessage {
  role: "user" | "model";
  parts: [{ text: string }];
}

interface CatalogItem {
  name: string;
  price: number;
  slug: string;
  category: string;
  categorySlug: string;
}

/** In-stock products from Sanity (cached 10 min) so answers never quote stale or made-up items. */
async function loadCatalog(): Promise<CatalogItem[]> {
  try {
    return await client.fetch<CatalogItem[]>(
      `*[_type == "product" && stock > 0 && !(_id in path("drafts.**"))] | order(isBestseller desc, price asc){
        name, price, "slug": slug.current, "category": category->name, "categorySlug": category->slug.current
      }`,
      {},
      { next: { revalidate: 600 } }
    );
  } catch {
    return [];
  }
}

function catalogText(items: CatalogItem[]) {
  const byCat = new Map<string, CatalogItem[]>();
  for (const p of items) byCat.set(p.category || "Other", [...(byCat.get(p.category || "Other") || []), p]);
  return [...byCat]
    .map(([cat, ps]) => `${cat}: ${ps.map((p) => `${p.name} PKR ${p.price.toLocaleString("en-PK")} (/products/${p.slug})`).join("; ")}`)
    .join("\n");
}

function categoryAnswer(items: CatalogItem[], test: RegExp, label: string) {
  // Match the category first (so "hijab" doesn't pull in hijab pins), then fall back to names.
  const byCategory = items.filter((p) => test.test((p.category || "").toLowerCase()));
  const list = byCategory.length ? byCategory : items.filter((p) => test.test(p.name.toLowerCase()));
  if (!list.length) return null;
  const prices = list.map((p) => p.price);
  const sample = list.slice(0, 4).map((p) => `${p.name} PKR ${p.price.toLocaleString("en-PK")}`).join(" | ");
  return `Our ${label} (PKR ${Math.min(...prices).toLocaleString("en-PK")}–${Math.max(...prices).toLocaleString("en-PK")}): ${sample}. See all: /products?category=${list[0].categorySlug}`;
}

function smartFallback(msg: string, items: CatalogItem[] = []): string {
  const m = msg.toLowerCase();
  if (/abaya/.test(m)) {
    const a = categoryAnswer(items, /abaya/, "abayas");
    if (a) return a;
  }
  if (/hijab|chiffon|georgette|lawn|stole|scarf/.test(m)) {
    const a = categoryAnswer(items, /hijab/, "hijabs");
    if (a) return a;
  }
  if (/jilbab/.test(m)) {
    const a = categoryAnswer(items, /jilbab/, "jilbabs");
    if (a) return a;
  }
  if (/prayer|namaz/.test(m)) {
    const a = categoryAnswer(items, /prayer/, "prayer wear");
    if (a) return a;
  }
  if (/hi|hello|hey|salam|assalam|aoa|walaikum/.test(m))
    return "Wa Alaikum Assalam! Welcome to ModestStyle.pk! How can I help? Ask about hijabs, abayas, shipping, or sizes.";
  if (/ship|deliver|courier|parcel/.test(m))
    return "Lahore: 1-2 days, Karachi/ISB: 2-3 days, others: 3-5 days. PKR 200 fee FREE on orders over PKR 5,000!";
  if (/return|refund|exchange/.test(m))
    return "7-day return policy on unused items. Exchange for size/colour available. WhatsApp: +92 300 1234567";
  if (/pay|cod|jazz|easypaisa|card|cash/.test(m))
    return "We accept {PAYMENTS}.";
  if (/size|sizing|fit|measure|xl|xxl/.test(m))
    return "Please check our size guide at /size-guide (abayas XS–XXL). Unsure? WhatsApp: +92 300 1234567";
  if (/contact|whatsapp|phone|email/.test(m))
    return "WhatsApp: +92 300 1234567 | Email: support@modestyle.pk (Mon-Sat 9am-7pm PKT)";
  if (/thanks|thank|shukriya|jazakallah/.test(m))
    return "JazakAllah Khair! Happy to help anytime. Happy shopping at ModestStyle.pk!";
  if (/price|cost|kitna|rate|how much/.test(m) && items.length) {
    const prices = items.map((p) => p.price);
    return `Our prices range from PKR ${Math.min(...prices).toLocaleString("en-PK")} to PKR ${Math.max(...prices).toLocaleString("en-PK")}. Free shipping over PKR 5,000! Browse: /products`;
  }
  return "I can help with products, sizing, shipping and payments! Ask me anything, or WhatsApp: +92 300 1234567";
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as {
      messages: { role: string; content: string }[];
    };

    const lastUserMsg =
      [...messages].reverse().find((m) => m.role === "user")?.content || "";

    const [settings, catalog] = await Promise.all([getSettings(), loadCatalog()]);
    const methods = availablePaymentMethods();
    const payments = [
      "Cash on Delivery nationwide",
      methods.card && "Visa/Mastercard",
      methods.jazzcash && "JazzCash",
      methods.easypaisa && "EasyPaisa",
    ]
      .filter(Boolean)
      .join(", ");
    const fill = (text: string) =>
      withSettings(text, settings)
        .replaceAll("{PAYMENTS}", payments)
        .replace("{CATALOG}", catalogText(catalog) || "(catalog temporarily unavailable — send customers to /products)");
    const fallback = () => fill(smartFallback(lastUserMsg, catalog));
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json({ reply: fallback() });
    }

    // Build Gemini history (must start with user, strictly alternating)
    const rawHistory = messages.slice(0, -1);
    const userStartIdx = rawHistory.findIndex((m) => m.role === "user");
    const trimmed = userStartIdx >= 0 ? rawHistory.slice(userStartIdx) : [];

    const history: GeminiMessage[] = trimmed.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const body = {
      system_instruction: { parts: [{ text: fill(SYSTEM_INSTRUCTION) }] },
      contents: [
        ...history,
        { role: "user", parts: [{ text: lastUserMsg }] },
      ],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048, topP: 0.8 },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    };

    const res = await callGemini(geminiKey, body);

    if (!res.ok) {
      return NextResponse.json({ reply: fallback() });
    }

    const data = await res.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || fallback();

    return NextResponse.json({ reply });
  } catch {
    const s = await getSettings();
    return NextResponse.json({
      reply: `Sorry, something went wrong. Please WhatsApp us at ${formatWhatsApp(s.whatsappNumber)}`,
    });
  }
}
