import { NextRequest } from "next/server";
import { adminHandler } from "@/lib/admin-route";
import { latestReport } from "@/lib/agent/advisor";
import { CatalogError } from "@/lib/catalog-admin";
import { callGemini } from "@/lib/gemini";

export const maxDuration = 60;

const INSTRUCTIONS = `You are the AI Advisor for ModestStyle PK, a Pakistani online store for hijabs, abayas and modest wear.
You talk to the store owner. Base every answer on the store report provided (sales, orders, stock, competitor prices from KEF, Hijabeaze, The Women Zone and Scarfs.pk, website health, marketing).
- Reply in the same language and script the owner uses (Roman Urdu if they write Roman Urdu).
- Be concrete: name products, prices and numbers from the report. Keep answers short (under 150 words) unless asked for detail.
- Give advice as suggestions; explain what to change and where in the admin panel (Products, Settings, Pages, Marketing, Orders).
- You cannot change the website yourself — the owner applies changes in the admin panel.
- If the report doesn't contain the answer, say so instead of guessing.`;

interface Turn {
  role: "user" | "advisor";
  text: string;
}

export async function POST(request: NextRequest) {
  return adminHandler(async () => {
    const { question, history } = (await request.json()) as { question?: string; history?: Turn[] };
    const q = String(question || "").trim().slice(0, 1000);
    if (!q) throw new CatalogError("Please ask a question.");

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return {
        answer:
          "Main abhi sawalon ke jawab nahi de sakta kyun ke GEMINI_API_KEY set nahi hai. Vercel mein key add karein. Tab tak upar wali tajweezon ki list dekhein.",
      };
    }

    const report = await latestReport();
    const context = report
      ? JSON.stringify({ ...report, slow: { ...report.slow, products: report.slow.products.slice(0, 15) } }).slice(0, 60000)
      : "No report yet — tell the owner to press 'Run review'.";

    const turns = (Array.isArray(history) ? history : []).slice(-8);
    const res = await callGemini(
      key,
      {
        system_instruction: { parts: [{ text: `${INSTRUCTIONS}\n\nSTORE REPORT (JSON):\n${context}` }] },
        contents: [
          ...turns.map((t) => ({ role: t.role === "user" ? "user" : "model", parts: [{ text: String(t.text).slice(0, 2000) }] })),
          { role: "user", parts: [{ text: q }] },
        ],
        generationConfig: { maxOutputTokens: 3000, temperature: 0.4 },
      },
      50000
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Advisor Gemini error:", res.status, JSON.stringify(data).slice(0, 300));
      return { answer: "Maazrat, AI se jawab nahi mil saka. Thori der baad dobara koshish karein." };
    }
    const answer = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("").trim();
    return { answer: answer || "Maazrat, is ka jawab nahi mil saka." };
  });
}
