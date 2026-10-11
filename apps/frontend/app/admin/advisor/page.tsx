"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { AdvisorReport, Suggestion } from "@/lib/agent/advisor";

const PRIORITY: Record<Suggestion["priority"], { label: string; cls: string }> = {
  urgent: { label: "Urgent", cls: "bg-red-50 text-red-700 border-red-200" },
  important: { label: "Important", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  idea: { label: "Idea", cls: "bg-blue-50 text-blue-700 border-blue-200" },
};

const pkr = (n: number | null | undefined) => (n == null ? "—" : `PKR ${Math.round(n).toLocaleString("en-PK")}`);

interface Turn {
  role: "user" | "advisor";
  text: string;
}

// Minimal typing for the browser Speech Recognition API (Chrome/Edge).
type Recognition = {
  lang: string;
  interimResults: boolean;
  onresult: (e: { results: { 0: { transcript: string } }[] }) => void;
  onend: () => void;
  onerror: () => void;
  start: () => void;
  stop: () => void;
};

export default function AdvisorPage() {
  const [report, setReport] = useState<AdvisorReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/advisor")
      .then((r) => r.json())
      .then((d) => setReport(d.report || null))
      .catch(() => setError("Could not load the report."))
      .finally(() => setLoading(false));
  }, []);

  const run = async () => {
    setRunning(true);
    setError("");
    try {
      const res = await fetch("/api/admin/advisor", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Review failed");
      setReport(d.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display">AI Advisor</h2>
          <p className="text-sm text-gray-500 mt-1">
            Reviews your store and competitors every morning and suggests what to improve. You decide what to change.
          </p>
          {report && (
            <p className="text-xs text-gray-400 mt-1">
              Last review: {new Date(report.createdAt).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          )}
        </div>
        <button
          onClick={run}
          disabled={running}
          className="bg-secondary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/90 transition disabled:opacity-50"
        >
          {running ? "Reviewing store & competitors… (up to a minute)" : "Run review now"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-center py-16 text-gray-400">Loading…</p>
      ) : !report ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-sm text-gray-500">
          No review yet. Press <b>Run review now</b> to create the first one.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="Orders (30 days)" value={String(report.sales.orders)} />
            <Stat label="Revenue (30 days)" value={pkr(report.sales.revenue)} />
            <Stat label="Orders needing attention" value={String(report.attention.count)} warn={report.attention.count > 0} />
            <Stat label="Out of / low stock" value={`${report.stock.out_of_stock.length} / ${report.stock.low_stock.length}`} />
          </div>

          <div className="space-y-3">
            <h3 className="font-medium">Suggestions ({report.suggestions.length})</h3>
            {report.suggestions.length === 0 && <p className="text-sm text-gray-500">Everything looks good right now. 🎉</p>}
            {report.suggestions.map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-3">
                <span className={`h-fit text-[10px] uppercase tracking-wider px-2 py-1 rounded border ${PRIORITY[s.priority].cls}`}>
                  {PRIORITY[s.priority].label}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{s.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{s.detail}</p>
                </div>
                {s.link && (
                  <Link href={s.link} className="text-xs text-gold-600 hover:underline whitespace-nowrap self-center">
                    Open →
                  </Link>
                )}
              </div>
            ))}
          </div>

          {report.competitors && <CompetitorTable report={report} />}
        </>
      )}

      <AdvisorChat />
    </div>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4">
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-display mt-1 ${warn ? "text-red-600" : ""}`}>{value}</p>
    </div>
  );
}

function CompetitorTable({ report }: { report: AdvisorReport }) {
  const c = report.competitors!;
  const rows = [...c.products].filter((p) => p.market).sort((a, b) => (b.diffPercent ?? 0) - (a.diffPercent ?? 0));
  const brandNames = c.brands.map((b) => b.name);
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-medium">Price vs top brands</h3>
        <p className="text-xs text-gray-400 mt-0.5">
          Typical price of similar items at {brandNames.join(", ")}. Red = you&apos;re much more expensive, green = cheaper.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-400">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Your product</th>
              <th className="text-right px-4 py-2 font-medium">You</th>
              {brandNames.map((b) => (
                <th key={b} className="text-right px-4 py-2 font-medium">{b}</th>
              ))}
              <th className="text-right px-4 py-2 font-medium">Difference</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.name} className="border-t border-gray-50">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2 text-right">{p.price.toLocaleString("en-PK")}</td>
                {brandNames.map((b) => (
                  <td key={b} className="px-4 py-2 text-right text-gray-500">{p.brands[b]?.toLocaleString("en-PK") ?? "—"}</td>
                ))}
                <td
                  className={`px-4 py-2 text-right font-medium ${
                    (p.diffPercent ?? 0) >= 40 ? "text-red-600" : (p.diffPercent ?? 0) <= -15 ? "text-green-600" : "text-gray-600"
                  }`}
                >
                  {(p.diffPercent ?? 0) > 0 ? "+" : ""}
                  {p.diffPercent}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdvisorChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [speak, setSpeak] = useState(true);
  const [lang, setLang] = useState<"ur-PK" | "en-US">("ur-PK");
  const recRef = useRef<Recognition | null>(null);

  const say = (text: string) => {
    if (!speak || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(lang.slice(0, 2)));
    if (voice) u.voice = voice;
    u.lang = voice?.lang || lang;
    window.speechSynthesis.speak(u);
  };

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    const history = turns;
    setTurns([...history, { role: "user", text: q }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/advisor/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history }),
      });
      const d = await res.json();
      const answer = res.ok ? d.answer : d.error || "Something went wrong.";
      setTurns((t) => [...t, { role: "advisor", text: answer }]);
      say(answer);
    } catch {
      setTurns((t) => [...t, { role: "advisor", text: "Connection problem — please try again." }]);
    } finally {
      setBusy(false);
    }
  };

  const toggleMic = () => {
    const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return alert("Voice input works in Chrome or Edge. Please type your question instead.");
    if (listening) return recRef.current?.stop();
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = false;
    rec.onresult = (e) => ask(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-medium">Ask the advisor</h3>
          <p className="text-xs text-gray-400">e.g. &quot;Konse products mehngay hain?&quot; · &quot;Is hafte sales kaisi rahi?&quot; · &quot;Kya naya add karoon?&quot;</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <select value={lang} onChange={(e) => setLang(e.target.value as typeof lang)} className="border border-gray-200 rounded px-2 py-1">
            <option value="ur-PK">Urdu voice</option>
            <option value="en-US">English voice</option>
          </select>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={speak} onChange={(e) => setSpeak(e.target.checked)} className="accent-gold-500" />
            Speak answers
          </label>
        </div>
      </div>

      {turns.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {turns.map((t, i) => (
            <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-line ${
                  t.role === "user" ? "bg-secondary text-white" : "bg-gray-50 text-gray-700"
                }`}
              >
                {t.text}
              </div>
            </div>
          ))}
          {busy && <p className="text-xs text-gray-400">Advisor is thinking…</p>}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex gap-2"
      >
        <button
          type="button"
          onClick={toggleMic}
          className={`px-3 rounded-lg border text-lg ${listening ? "bg-red-500 text-white border-red-500 animate-pulse" : "border-gray-200 hover:bg-gray-50"}`}
          aria-label={listening ? "Stop listening" : "Speak your question"}
          title="Speak your question"
        >
          🎤
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? "Listening…" : "Type or tap the mic and speak…"}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-300"
        />
        <button type="submit" disabled={busy || !input.trim()} className="bg-secondary text-white px-5 rounded-lg text-sm disabled:opacity-40">
          Ask
        </button>
      </form>
    </div>
  );
}
