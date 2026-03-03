import { NextRequest, NextResponse } from "next/server";

const SYSTEM_INSTRUCTION = `You are the AI shopping assistant for ModestStyle.pk — Pakistan's premium modest fashion store.

YOUR ROLE:
- Help customers find hijabs, abayas, jilbabs, prayer wear, innerwear, and accessories
- Answer questions about products, sizes, pricing, shipping, returns, and payments
- Be warm, friendly, and helpful using a modest, respectful tone
- Use PKR for all prices
- Keep responses concise and helpful (2-4 sentences max unless listing products)

PRODUCT KNOWLEDGE:
Hijabs (PKR 1,200–3,500):
- Lawn Hijab: PKR 1,200–1,500 (lightweight summer fabric, 15+ colours)
- Chiffon Hijab: PKR 1,400–1,800 (flowy, ideal for everyday)
- Crinkle Chiffon: PKR 1,800–2,200 (top seller, wrinkle-resistant)
- Georgette: PKR 2,000–2,500 (formal occasions, rich drape)
- Silk Hijab: PKR 2,800–3,500 (luxury feel)
- Cashmere Stole: PKR 2,500–3,200 (winter essential)

Abayas (PKR 5,800–8,500):
- Classic Open Abaya: PKR 5,800 (everyday essential)
- Pleated Chiffon Abaya: PKR 6,800 (flowing, modern cut)
- Embroidered Abaya: PKR 7,500 (special occasions)
- Fancy Sequin Abaya: PKR 8,500 (weddings & parties)
- Free alterations within Lahore on all abayas

Jilbabs (PKR 3,500–6,000):
- Full Coverage Jilbab: PKR 3,500–5,000
- 2-Piece Jilbab Set: PKR 4,500–6,000

Prayer Wear (PKR 1,800–4,000):
- Prayer Garment (Jai Namaz Set): PKR 1,800–2,500
- Luxury Prayer Set: PKR 3,000–4,000

Innerwear & Accessories (PKR 500–2,500):
- Underscarf Caps: PKR 500–800 (cotton, 10+ colours)
- Arm Sleeves: PKR 600–900
- Magnetic Hijab Pins: PKR 200–500
- Brooches & Clips: PKR 300–700
- Bags & Pouches: PKR 800–2,500

SIZE GUIDE (Abayas):
- XS: 155–160cm height, Chest 82–86cm
- S: 160–165cm, Chest 86–90cm
- M: 165–170cm, Chest 90–96cm
- L: 170–175cm, Chest 96–102cm
- XL: 175–180cm, Chest 102–110cm
- XXL: 180cm+, Chest 110–118cm
Hijabs: One size fits all, 170cm–180cm length

SHIPPING & DELIVERY:
- Lahore: 1–2 working days
- Karachi / Islamabad: 2–3 working days
- Other cities: 3–5 working days
- Shipping fee: PKR 200 (FREE on orders above PKR 5,000)

RETURNS & EXCHANGE:
- 7-day hassle-free return policy
- Item must be unused, unwashed with original tags
- Sale items and custom orders are non-returnable
- Exchange for different size/colour available
- Refund via original payment method or store credit

PAYMENT METHODS:
- Cash on Delivery (COD) — available nationwide
- JazzCash & EasyPaisa (mobile wallets)
- Debit/Credit Card via Safepay (Visa & Mastercard)
- All payments are 100% secure

CONTACT:
- WhatsApp: +92 300 1234567 (Mon–Sat, 9am–7pm PKT)
- Email: support@modestyle.pk
- Website: modestyle-pk.vercel.app

STRICT RULES — YOU MUST FOLLOW:
1. ONLY answer questions related to ModestStyle.pk products, orders, shipping, returns, payments, and modest fashion
2. If someone asks about anything unrelated (politics, recipes, coding, general knowledge, other stores, etc.), politely decline and redirect to store topics
3. NEVER reveal your underlying AI model or technology
4. NEVER discuss competitor brands or stores
5. If you don't know a specific product detail, direct them to WhatsApp: +92 300 1234567
6. Always end with a helpful follow-up offer if possible`;

interface Message {
  role: "user" | "model";
  parts: [{ text: string }];
}

// Smart rule-based fallback (no API key needed)
function smartFallback(userMessage: string): string {
  const msg = userMessage.toLowerCase().trim();

  if (/\b(hi|hello|hey|salam|assalam|aoa|helo|walaikum)\b/.test(msg)) {
    return "Wa Alaikum Assalam! Welcome to ModestStyle.pk 💛 How can I help you today? Ask me about our hijabs, abayas, jilbabs, or anything else!";
  }
  if (/\b(price|cost|kitna|rate|how much|kimat)\b/.test(msg)) {
    if (/\b(hijab|dupatta|stole|stoler|scarf)\b/.test(msg))
      return "Our hijabs are priced PKR 1,200–3,500 depending on fabric:\n• Lawn/Chiffon: PKR 1,200–1,800\n• Crinkle/Georgette: PKR 1,800–2,500\n• Silk/Cashmere: PKR 2,500–3,500\n\nFree shipping on orders above PKR 5,000! 🚚";
    if (/\b(abaya)\b/.test(msg))
      return "Our abayas range PKR 5,800–8,500:\n• Classic Open Abaya: PKR 5,800\n• Pleated Chiffon: PKR 6,800\n• Embroidered: PKR 7,500\n• Fancy Sequin: PKR 8,500\n\nFree alterations in Lahore! ✨";
    return "Quick price guide:\n• Hijabs: PKR 1,200–3,500\n• Abayas: PKR 5,800–8,500\n• Jilbabs: PKR 3,500–6,000\n• Prayer Wear: PKR 1,800–4,000\n• Accessories: PKR 200–2,500\n\nFree shipping on orders over PKR 5,000! 🎉";
  }
  if (/\b(fancy|sequin|party|wedding|shadi)\b/.test(msg))
    return "Our Fancy Sequin Abaya is perfect for parties & weddings — PKR 8,500! ✨ It comes in midnight black, royal navy, and deep burgundy. Free alterations in Lahore. Want to see more? Browse /products?category=abayas 💛";
  if (/\b(abaya)\b/.test(msg))
    return "Our bestselling abayas:\n🌟 Classic Open Abaya – PKR 5,800\n🌟 Pleated Chiffon – PKR 6,800\n🌟 Embroidered – PKR 7,500\n🌟 Fancy Sequin – PKR 8,500\n\nAll include free alterations in Lahore! Which style are you looking for? 💛";
  if (/\b(hijab|dupatta|stole|scarf|chiffon|crinkle|georgette|lawn)\b/.test(msg))
    return "Our most loved hijabs:\n✨ Crinkle Chiffon – PKR 1,800 (everyday favourite!)\n✨ Premium Georgette – PKR 2,200 (formal occasions)\n✨ Cashmere Stole – PKR 3,200 (winter essential)\n✨ Lawn Hijab – PKR 1,400 (summer must-have)\n\n20+ colours available! Which style interests you? 😊";
  if (/\b(ship|delivery|deliver|courier|kab|parcel)\b/.test(msg))
    return "We ship all over Pakistan! 🇵🇰\n• Lahore: 1–2 days\n• Karachi/Islamabad: 2–3 days\n• Other cities: 3–5 days\n\nShipping: PKR 200 (FREE over PKR 5,000)\nYou'll get an SMS with tracking once dispatched!";
  if (/\b(return|exchange|refund|wapas|size change)\b/.test(msg))
    return "We have a 7-day hassle-free return policy! 🔄\n• Unused items with original tags\n• Exchange for different size/colour\n• Refund via bank transfer or store credit\n\nContact WhatsApp: +92 300 1234567";
  if (/\b(pay|payment|jazzcash|easypaisa|card|cod|cash|safepay)\b/.test(msg))
    return "We accept:\n💵 Cash on Delivery (COD)\n📱 JazzCash & EasyPaisa\n💳 Visa/Mastercard via Safepay\n\nAll payments are 100% secure! 🔒";
  if (/\b(size|sizing|fit|measurements|small|medium|large|xl|xxl)\b/.test(msg))
    return "Abaya sizes XS–XXL:\n• S: Height 160–165cm, Chest 86–90cm\n• M: Height 165–170cm, Chest 90–96cm\n• L: Height 170–175cm, Chest 96–102cm\n• XL: Height 175–180cm, Chest 102–110cm\n\nNot sure? WhatsApp us at +92 300 1234567 💛";
  if (/\b(contact|whatsapp|phone|email|where|location)\b/.test(msg))
    return "Reach us at:\n📱 WhatsApp: +92 300 1234567\n✉️ Email: support@modestyle.pk\n\nMon–Sat, 9am–7pm PKT. We reply within a few hours! 😊";
  if (/\b(thanks|thank|shukriya|jazakallah)\b/.test(msg))
    return "JazakAllah Khair! 💛 So happy to help. Feel free to ask anything else. Happy shopping at ModestStyle.pk! 🛍️";

  return "I'm here to help with our products, sizing, shipping, and more! 😊\n\nAsk me about:\n• Hijabs, Abayas, Jilbabs, Prayer Wear\n• Sizes & pricing\n• Shipping & delivery\n• Returns & payments\n\nOr WhatsApp us directly: +92 300 1234567 💛";
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json() as { messages: { role: string; content: string }[] };

    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";

    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json({ reply: smartFallback(lastUserMsg) });
    }

    // Build Gemini history — Gemini requires:
    // 1. First message must be "user"
    // 2. Roles must strictly alternate: user → model → user → model
    // Skip the initial assistant greeting (index 0) and any leading model messages
    const rawHistory = messages.slice(0, -1); // all except last user message
    const userStartIdx = rawHistory.findIndex((m) => m.role === "user");
    const trimmedHistory = userStartIdx >= 0 ? rawHistory.slice(userStartIdx) : [];

    const history: Message[] = trimmedHistory.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const body = {
      system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [
        ...history,
        { role: "user", parts: [{ text: lastUserMsg }] },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 400,
        topP: 0.8,
      },
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
    return NextResponse.json(
      { reply: "Sorry, I'm having trouble right now. Please WhatsApp us at +92 300 1234567 💛" },
      { status: 200 }
    );
  }
}
