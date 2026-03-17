import { NextRequest, NextResponse } from "next/server";

const SYSTEM_INSTRUCTION = `You are the AI shopping assistant for ModestStyle.pk — Pakistan's premium modest fashion store.

YOUR ROLE:
- Help customers find hijabs, abayas, jilbabs, prayer wear, innerwear, and accessories
- Answer questions about products, sizes, pricing, shipping, returns, and payments
- Be warm, friendly, and helpful using a modest, respectful tone
- Use PKR for all prices
- Keep responses concise and helpful (2-4 sentences max unless listing products)

PRODUCTS:
Hijabs PKR 1,200-3,500: Lawn 1200-1500, Chiffon 1400-1800, Crinkle Chiffon 1800-2200 (top seller), Georgette 2000-2500, Silk 2800-3500, Cashmere Stole 2500-3200
Abayas PKR 5,800-8,500: Classic Open 5800, Pleated Chiffon 6800, Embroidered 7500, Fancy Sequin 8500. Free alterations in Lahore.
Jilbabs PKR 3,500-6,000. Prayer Wear PKR 1,800-4,000. Accessories PKR 200-2,500.
SIZING (Abayas): S=160-165cm/86-90cm, M=165-170cm/90-96cm, L=170-175cm/96-102cm, XL=175-180cm/102-110cm
SHIPPING: Lahore 1-2 days, Karachi/ISB 2-3 days, others 3-5 days. PKR 200 fee (FREE over PKR 5,000)
RETURNS: 7-day policy on unused items with tags. Exchange available.
PAYMENT: COD nationwide, JazzCash, EasyPaisa, Visa/Mastercard via Safepay
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

function smartFallback(msg: string): string {
  const m = msg.toLowerCase();
  if (/hi|hello|hey|salam|assalam|aoa|walaikum/.test(m))
    return "Wa Alaikum Assalam! Welcome to ModestStyle.pk! How can I help? Ask about hijabs, abayas, shipping, or sizes.";
  if (/abaya/.test(m))
    return "Our abayas: Classic Open PKR 5,800 | Pleated Chiffon PKR 6,800 | Embroidered PKR 7,500 | Fancy Sequin PKR 8,500. Free alterations in Lahore!";
  if (/hijab|chiffon|georgette|lawn|stole|scarf/.test(m))
    return "Popular hijabs: Crinkle Chiffon PKR 1,800 | Georgette PKR 2,200 | Cashmere PKR 3,200 | Lawn PKR 1,400. 20+ colours!";
  if (/ship|deliver|courier|parcel/.test(m))
    return "Lahore: 1-2 days, Karachi/ISB: 2-3 days, others: 3-5 days. PKR 200 fee FREE on orders over PKR 5,000!";
  if (/return|refund|exchange/.test(m))
    return "7-day return policy on unused items. Exchange for size/colour available. WhatsApp: +92 300 1234567";
  if (/pay|cod|jazz|easypaisa|card|cash/.test(m))
    return "We accept COD, JazzCash, EasyPaisa, Visa/Mastercard via Safepay. 100% secure!";
  if (/size|sizing|fit|measure|xl|xxl/.test(m))
    return "Abaya M=165-170cm/90-96cm, L=170-175cm/96-102cm. Unsure? WhatsApp: +92 300 1234567";
  if (/contact|whatsapp|phone|email/.test(m))
    return "WhatsApp: +92 300 1234567 | Email: support@modestyle.pk (Mon-Sat 9am-7pm PKT)";
  if (/thanks|thank|shukriya|jazakallah/.test(m))
    return "JazakAllah Khair! Happy to help anytime. Happy shopping at ModestStyle.pk!";
  if (/price|cost|kitna|rate|how much/.test(m))
    return "Hijabs: PKR 1,200-3,500 | Abayas: PKR 5,800-8,500 | Jilbabs: PKR 3,500-6,000. Free shipping over PKR 5,000!";
  return "I can help with products, sizing, shipping and payments! Ask me anything, or WhatsApp: +92 300 1234567";
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = (await req.json()) as {
      messages: { role: string; content: string }[];
    };

    const lastUserMsg =
      [...messages].reverse().find((m) => m.role === "user")?.content || "";

    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json({ reply: smartFallback(lastUserMsg) });
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
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [
        ...history,
        { role: "user", parts: [{ text: lastUserMsg }] },
      ],
      generationConfig: { temperature: 0.4, maxOutputTokens: 400, topP: 0.8 },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ],
    };

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      return NextResponse.json({ reply: smartFallback(lastUserMsg) });
    }

    const data = await res.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      smartFallback(lastUserMsg);

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({
      reply: "Sorry, something went wrong. Please WhatsApp us at +92 300 1234567",
    });
  }
}
