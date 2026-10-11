import "server-only";

/** Primary model, and a lighter one used when the primary is overloaded. */
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash-lite";

/**
 * POSTs to Gemini generateContent. If the primary model is busy or failing
 * (429/5xx), the same request is sent to the fallback model.
 * Note: newer Gemini models spend output tokens on internal "thinking", so callers
 * should leave generous maxOutputTokens or replies get cut off.
 */
export async function callGemini(apiKey: string, body: unknown, timeoutMs = 45000) {
  const send = (model: string) =>
    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  const first = await send(GEMINI_MODEL).catch(() => null);
  if (first && first.status !== 429 && first.status < 500) return first;
  return send(FALLBACK_MODEL);
}
