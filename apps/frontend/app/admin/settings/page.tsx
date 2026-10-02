"use client";

import { useEffect, useState } from "react";
import type { PromoCode, StoreSettings } from "@/lib/settings-shared";

const INPUT_CLASS =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-300";
const LABEL_CLASS = "block text-xs font-medium text-gray-500 mb-1.5";

type NumberKey = "freeShippingThreshold" | "standardShipping" | "expressShipping" | "codFee";
type TextKey = "announcement" | "whatsappNumber" | "supportEmail" | "instagram" | "facebook" | "tiktok" | "popupPromoCode" | "cartRecoveryCode";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load settings");
        setSettings(data);
      })
      .catch((err) => setLoadError(err.message));
  }, []);

  if (loadError) return <p className="text-sm text-red-600">{loadError}</p>;
  if (!settings) return <div className="text-center py-20 text-gray-400">Loading settings…</div>;

  const setText = (key: TextKey, value: string) => setSettings({ ...settings, [key]: value });
  const setNumber = (key: NumberKey, value: string) =>
    setSettings({ ...settings, [key]: value === "" ? ("" as unknown as number) : Number(value) });
  const setPromo = (i: number, patch: Partial<PromoCode>) =>
    setSettings({
      ...settings,
      promoCodes: settings.promoCodes.map((p, idx) => (idx === i ? { ...p, ...patch } : p)),
    });

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setSettings(data);
      setMessage({ type: "ok", text: "Saved! Changes are live on the website now." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Could not save" });
    } finally {
      setSaving(false);
    }
  };

  const activeCodes = settings.promoCodes.filter((p) => p.active && p.code).map((p) => p.code);

  return (
    <div className="space-y-6 max-w-3xl pb-24">
      <div>
        <h2 className="text-2xl font-display">Store Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Changes apply to the whole website, including checkout prices, as soon as you save.
        </p>
      </div>

      <Section title="Announcement bar" hint="The strip at the very top of every page. Leave empty to hide it.">
        <input
          className={INPUT_CLASS}
          value={settings.announcement}
          maxLength={200}
          placeholder="e.g. EID SALE — 20% OFF ALL ABAYAS"
          onChange={(e) => setText("announcement", e.target.value)}
        />
      </Section>

      <Section title="Contact details" hint="Used in the footer, contact page, order pages and the chat assistant.">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="WhatsApp number">
            <input
              className={INPUT_CLASS}
              value={settings.whatsappNumber}
              placeholder="03323025239"
              onChange={(e) => setText("whatsappNumber", e.target.value)}
            />
          </Field>
          <Field label="Support email">
            <input
              className={INPUT_CLASS}
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setText("supportEmail", e.target.value)}
            />
          </Field>
          <Field label="Instagram link">
            <input className={INPUT_CLASS} value={settings.instagram} onChange={(e) => setText("instagram", e.target.value)} />
          </Field>
          <Field label="Facebook link">
            <input className={INPUT_CLASS} value={settings.facebook} onChange={(e) => setText("facebook", e.target.value)} />
          </Field>
          <Field label="TikTok link">
            <input className={INPUT_CLASS} value={settings.tiktok} onChange={(e) => setText("tiktok", e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="Shipping & fees (PKR)">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Free shipping on orders over">
            <NumberInput value={settings.freeShippingThreshold} onChange={(v) => setNumber("freeShippingThreshold", v)} />
          </Field>
          <Field label="Standard delivery charge">
            <NumberInput value={settings.standardShipping} onChange={(v) => setNumber("standardShipping", v)} />
          </Field>
          <Field label="Express delivery charge">
            <NumberInput value={settings.expressShipping} onChange={(v) => setNumber("expressShipping", v)} />
          </Field>
          <Field label="Cash on Delivery fee (0 = no fee)">
            <NumberInput value={settings.codFee} onChange={(v) => setNumber("codFee", v)} />
          </Field>
        </div>
      </Section>

      <Section title="Promo codes" hint="Customers type these at checkout. Turn a code off instead of deleting it to pause it.">
        <div className="space-y-2">
          {settings.promoCodes.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className={`${INPUT_CLASS} uppercase font-mono`}
                value={p.code}
                placeholder="CODE"
                maxLength={30}
                onChange={(e) => setPromo(i, { code: e.target.value.toUpperCase() })}
              />
              <div className="relative w-28 flex-shrink-0">
                <input
                  className={`${INPUT_CLASS} pr-7`}
                  type="number"
                  min={1}
                  max={90}
                  value={p.percent}
                  onChange={(e) => setPromo(i, { percent: Number(e.target.value) })}
                />
                <span className="absolute right-3 top-2.5 text-sm text-gray-400">%</span>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-gray-600 flex-shrink-0">
                <input
                  type="checkbox"
                  checked={p.active}
                  onChange={(e) => setPromo(i, { active: e.target.checked })}
                  className="accent-gold-500"
                />
                Active
              </label>
              <button
                onClick={() =>
                  setSettings({ ...settings, promoCodes: settings.promoCodes.filter((_, idx) => idx !== i) })
                }
                className="text-xs text-red-500 hover:underline flex-shrink-0 px-1"
              >
                Delete
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              setSettings({ ...settings, promoCodes: [...settings.promoCodes, { code: "", percent: 10, active: true }] })
            }
            className="text-sm text-gold-600 hover:underline"
          >
            + Add promo code
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-4">
          <Field label="Code shown in the discount popup">
            <CodeSelect value={settings.popupPromoCode} codes={activeCodes} onChange={(v) => setText("popupPromoCode", v)} />
          </Field>
          <Field label="Code sent to shoppers who leave checkout">
            <CodeSelect value={settings.cartRecoveryCode} codes={activeCodes} onChange={(v) => setText("cartRecoveryCode", v)} />
          </Field>
        </div>
      </Section>

      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 px-6 py-3 flex items-center gap-4 z-10">
        <button
          onClick={save}
          disabled={saving}
          className="bg-secondary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/90 transition disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {message && (
          <p className={`text-sm ${message.type === "ok" ? "text-green-700" : "text-red-600"}`}>{message.text}</p>
        )}
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
      <div>
        <h3 className="font-medium">{title}</h3>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      {children}
    </div>
  );
}

function NumberInput({ value, onChange }: { value: number; onChange: (v: string) => void }) {
  return (
    <input
      className={INPUT_CLASS}
      type="number"
      min={0}
      value={Number.isFinite(value) ? value : ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function CodeSelect({ value, codes, onChange }: { value: string; codes: string[]; onChange: (v: string) => void }) {
  const options = value && !codes.includes(value) ? [...codes, value] : codes;
  return (
    <select className={INPUT_CLASS} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">— None (turn off) —</option>
      {options.map((c) => (
        <option key={c} value={c}>
          {c}
          {!codes.includes(c) ? " (inactive)" : ""}
        </option>
      ))}
    </select>
  );
}
