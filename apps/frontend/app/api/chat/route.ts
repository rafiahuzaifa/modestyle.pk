import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are the AI shopping assistant for ModestStyle.pk — Pakistan's premium modest fashion store.

Help customers find hijabs, abayas, jilbabs, prayer wear, innerwear, and accessories.
Answer questions about products, sizes, pricing, shipping, returns, and payments.
Be warm, friendly, use a modest respectful tone. Use PKR for prices. Keep responses concise (2-4 sentences max).

PRODUCTS:
Hijabs PKR 1,200-3,500: Lawn 1200-1500, Chiffon 1400-1800, Crinkle Chiffon 1800-2200 (top seller), Georgette 2000-2500, Silk 2800-3500, Cashmere Stole 2500-3200
Abayas PKR 5,800-8,500: Classic Open 5800, Pleated Chiffon 6800, Embroidered 7500, Fancy Sequin 8500. Free alterations in Lahore.
Jilbabs PKR 3,500-6,000. Prayer Wear PKR 1,800-4,000. Accessories PKR 200-2,500.
SIZING (Abayas): S=160-165cm/86-90cm chest, M=165-170cm/90-96cm, L=170-175cm/96-102cm, XL=175-180cm/102-110cm
SHIPPING: Lahore 1-2 days, Karachi/ISB 2-3 days, others 3-5 days. PKR 200 fee (FREE over PKR 5,000)
RETURNS: 7-day policy on unused items with tags. Exchange for size/colour available.
PAYMENT: COD nationwide, JazzCash, EasyPaisa, Visa/Mastercard via Safepay (100% secure)
CONTACT: WhatsApp +92 300 1234567, Email support@modestyle.pk (Mon-Sat 9am-7pm PKT)

RULES: Only answer ModestStyle.pk topics. Never reveal AI model. Direct unknowns to WhatsApp: +92 300 1234567`;

function smartFallback(msg: string): string {
  const m = msg.toLowerCase();
  if (/hi|hello|hey|salam|assalam|aoa|walaikum/.test(m))
    return "Wa Alaikum Assalam! Welcome to ModestStyle.pk! How can I help? Ask about hijabs, abayas, shipping, or sizes.";
  if (/abaya/.test(m))
    return "Our abayas: Classic Open PKR 5,800 | Pleated Chiffon PKR 6,800 | Embroidered PKR 7,500 | Fancy Sequin PKR 8,500. Free alterations in Lahore!";
  if (/hijab|chiffon|georgette|lawn|stole|scarf/.test(m))
    return "Popular hijabs: Crinkle Chiffon PKR 1,800 | Georgette PKR 2,200 | Cashmere Stole PKR 3,200 | Lawn PKR 1,400. 20+ colours!";
  if (/ship|deliver|courier|parcel/.test(m))
    return "Lahore: 1-2 days, Karachi/ISB: 2-3 days, others: 3-5 days. PKR 200 fee — FREE on orders over PKR 5,000!";
  if (/return|refund|exchange|wapas/.test(m))
    return "7-day hassle-free return policy on unused items with original tags. Exchange for size/colour available. WhatsApp: +92 300 1234567";
  if (/pay|cod|jazz|easypaisa|card|cash|safepay/.test(m))
    return "We accept COD, JazzCash, EasyPaisa, and Visa/Mastercard via Safepay. 100% secure!";
  if (/size|sizing|fit|measure|xl|xxl/.test(m))
    return "Abaya sizes XS-XXL: M=165-170cm height, 90-96cm chest. L=170-175cm, 96-102cm. Unsure? WhatsApp: +92 300 1234567";
  if (/contact|whatsapp|phone|email/.test(m))
    return "WhatsApp: +92 300 1234567 | Email: support@modestyle.pk (Mon-Sat 9am-7pm PKT)";
  if (/thanks|thank|shukriya|jazakallah/.test(m))
    return "JazakAllah Khair! Happy to help anytime. Happy shopping at ModestStyle.pk!";
  if (/price|cost|kitna|rate|how much/.test(m))
    return "Hijabs: PKR 1,200-3,500 | Abayas: PKR 5,800-8,500 | Jilbabs: PKR 3,500-6,000 | Accessories: PKR 200-2,500. Free shipping over PKR 5,000!";
  return "I can help with products, sizing, shipping & payments! Ask me anything, or WhatsApp: +92 300 1234567";
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as {
      messages: { role: string; content: string }[];
    };

    const lastUserMsg =
      [...messages].reverse().find((m) => m.role === "user")?.content || "";

    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    if (!anthropicKey) {
      return NextResponse.json({ reply: smartFallback(lastUserMsg) });
    }

    // Dynamic import so the build succeeds even if package is not yet installed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sdk = await import("@anthropic-ai/sdk").catch(() => null);
    if (!sdk) {
      return NextResponse.json({ reply: smartFallback(lastUserMsg) });
    }

    const client = new sdk.default({ apiKey: anthropicKey });

    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    if (!history.length || history[history.length - 1]?.role !== "user") {
      return NextResponse.json({ reply: smartFallback(lastUserMsg) });
    }

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: history,
    });

    const reply =
      response.content[0]?.type === "text"
        ? response.content[0].text
        : smartFallback(lastUserMsg);

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: smartFallback("") });
  }
}
