"use client";

import { useEffect, useState } from "react";

interface Stats {
  email: number;
  whatsapp: number;
  emailReady: boolean;
  whatsappReady: boolean;
}

interface Result {
  email: number;
  whatsapp: number;
  failed: number;
}

const INPUT_CLASS =
  "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-300";

export default function AdminMarketingPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [code, setCode] = useState("");
  const [useEmail, setUseEmail] = useState(true);
  const [useWhatsApp, setUseWhatsApp] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/broadcast")
      .then((res) => res.json())
      .then((data) => setStats(data.error ? null : data))
      .catch(() => setStats(null));
  }, []);

  const emailOn = useEmail && !!stats?.emailReady;
  const whatsappOn = useWhatsApp && !!stats?.whatsappReady;
  const recipients = (emailOn ? stats?.email || 0 : 0) + (whatsappOn ? stats?.whatsapp || 0 : 0);

  const send = async () => {
    setError("");
    setResult(null);
    if (!subject.trim() || !message.trim()) {
      setError("Please write a subject and a message.");
      return;
    }
    if (!emailOn && !whatsappOn) {
      setError("Choose at least one channel that is set up.");
      return;
    }
    if (!confirm(`Send this offer to ${recipients} recipients now? This cannot be undone.`)) return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, code, email: emailOn, whatsapp: whatsappOn }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-display">Marketing</h2>
        <p className="text-sm text-gray-500 mt-1">
          Send sale offers to customers who opted in. Shoppers who leave checkout without ordering
          automatically get one reminder with the abandoned-cart code chosen in Settings.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <ChannelCard
          title="Email subscribers"
          count={stats?.email}
          ready={stats?.emailReady}
          setupHint="Add RESEND_API_KEY and ORDER_EMAIL_FROM on Vercel to enable."
        />
        <ChannelCard
          title="WhatsApp subscribers"
          count={stats?.whatsapp}
          ready={stats?.whatsappReady}
          setupHint="Add the WhatsApp Cloud API keys on Vercel to enable."
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <h3 className="font-medium">New offer</h3>
        <input
          className={INPUT_CLASS}
          placeholder="Subject / headline — e.g. Eid Sale: 20% off all abayas"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={150}
        />
        <textarea
          className={`${INPUT_CLASS} resize-none`}
          rows={5}
          placeholder="Message — e.g. Our Eid collection is here! Enjoy 20% off every abaya until Sunday."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={900}
        />
        <input
          className={`${INPUT_CLASS} uppercase`}
          placeholder="Promo code (optional) — must already work at checkout"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={30}
        />
        <div className="flex flex-wrap gap-6 text-sm">
          <label className={`flex items-center gap-2 ${stats?.emailReady ? "" : "opacity-40"}`}>
            <input
              type="checkbox"
              checked={emailOn}
              disabled={!stats?.emailReady}
              onChange={(e) => setUseEmail(e.target.checked)}
              className="accent-gold-500"
            />
            Email
          </label>
          <label className={`flex items-center gap-2 ${stats?.whatsappReady ? "" : "opacity-40"}`}>
            <input
              type="checkbox"
              checked={whatsappOn}
              disabled={!stats?.whatsappReady}
              onChange={(e) => setUseWhatsApp(e.target.checked)}
              className="accent-gold-500"
            />
            WhatsApp
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {result && (
          <p className="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3">
            Sent: {result.email} emails, {result.whatsapp} WhatsApp messages
            {result.failed > 0 && ` · ${result.failed} failed`}
          </p>
        )}

        <button
          onClick={send}
          disabled={sending || recipients === 0}
          className="bg-secondary text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-secondary/90 transition disabled:opacity-40"
        >
          {sending ? "Sending…" : `Send to ${recipients} recipients`}
        </button>
      </div>
    </div>
  );
}

function ChannelCard({
  title,
  count,
  ready,
  setupHint,
}: {
  title: string;
  count?: number;
  ready?: boolean;
  setupHint: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wider">{title}</p>
      <p className="text-3xl font-display mt-1">{count ?? "—"}</p>
      <p className={`text-xs mt-2 ${ready ? "text-green-600" : "text-amber-600"}`}>
        {ready ? "● Connected" : setupHint}
      </p>
    </div>
  );
}
