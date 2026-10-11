import "server-only";

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

/**
 * POSTs to Gemini generateContent, retrying once when the model is busy (429/503).
 * Note: newer Gemini models spend output tokens on internal "thinking", so callers
 * should leave generous maxOutputTokens or replies get cut off.
 */
export async function callGemini(apiKey: string, body: unknown, timeoutMs = 45000) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const send = () =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  const first = await send();
  if (first.status !== 429 && first.status !== 503) return first;
  await new Promise((r) => setTimeout(r, 1500));
  return send();
}
