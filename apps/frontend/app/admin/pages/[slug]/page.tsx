"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  BLOCK_SPECS,
  PAGE_LABELS,
  emptyBlock,
  isPageSlug,
  type Block,
  type FieldSpec,
  type PageContent,
  type TableValue,
} from "@/lib/content-pages";

const INPUT = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-300";
const LABEL = "block text-xs font-medium text-gray-500 mb-1";
const TOKENS = "{whatsapp} {email} {freeShipping} {standardShipping} {expressShipping} {codFee}";

export default function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [page, setPage] = useState<PageContent | null>(null);
  const [customised, setCustomised] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [addType, setAddType] = useState("text");

  useEffect(() => {
    fetch(`/api/admin/pages/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setPage(d.page);
        setCustomised(d.customised);
      })
      .catch((err) => setMessage({ ok: false, text: err.message || "Could not load page" }));
  }, [slug]);

  if (!isPageSlug(slug)) return <p className="text-sm text-red-600">Unknown page.</p>;
  if (!page) return message ? <p className="text-sm text-red-600">{message.text}</p> : <div className="text-center py-20 text-gray-400">Loading…</div>;

  const setBlock = (i: number, b: Block) => setPage({ ...page, blocks: page.blocks.map((x, idx) => (idx === i ? b : x)) });
  const moveBlock = (i: number, to: number) => {
    if (to < 0 || to >= page.blocks.length) return;
    const blocks = [...page.blocks];
    const [b] = blocks.splice(i, 1);
    blocks.splice(to, 0, b);
    setPage({ ...page, blocks });
  };

  const request = async (method: "PUT" | "DELETE") => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/pages/${slug}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "PUT" ? JSON.stringify(page) : undefined,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not save");
      setPage(d.page);
      setCustomised(d.customised);
      setMessage({ ok: true, text: method === "PUT" ? "Saved! The page is updated on the website." : "Page reset to the original text." });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Could not save" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-24">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/pages" className="text-xs text-gray-400 hover:text-gray-600">← All pages</Link>
          <h2 className="text-2xl font-display mt-1">{PAGE_LABELS[slug]}</h2>
          <p className="text-xs text-gray-400 mt-1">
            {customised ? "Edited version is live." : "Showing the original text."} You can use {TOKENS} — they fill in from Settings.
          </p>
        </div>
        <a href={`/${slug}`} target="_blank" className="text-sm text-gold-600 hover:underline">View page ↗</a>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
        <h3 className="font-medium">Top banner</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>Title</label>
            <input className={INPUT} value={page.title} onChange={(e) => setPage({ ...page, title: e.target.value })} />
          </div>
          <div>
            <label className={LABEL}>Small label above title (optional)</label>
            <input className={INPUT} value={page.eyebrow} onChange={(e) => setPage({ ...page, eyebrow: e.target.value })} />
          </div>
        </div>
        <div>
          <label className={LABEL}>Subtitle</label>
          <input className={INPUT} value={page.subtitle} onChange={(e) => setPage({ ...page, subtitle: e.target.value })} />
        </div>
      </div>

      {page.blocks.map((b, i) => {
        const spec = BLOCK_SPECS[b.type];
        if (!spec) return null;
        return (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-gold-600">{spec.label}</p>
                <p className="text-[11px] text-gray-400">{spec.hint}</p>
              </div>
              <div className="flex gap-1 text-xs">
                <button onClick={() => moveBlock(i, i - 1)} className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50" aria-label="Move up">↑</button>
                <button onClick={() => moveBlock(i, i + 1)} className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50" aria-label="Move down">↓</button>
                <button
                  onClick={() => confirm("Remove this section?") && setPage({ ...page, blocks: page.blocks.filter((_, idx) => idx !== i) })}
                  className="px-2 py-1 border border-red-100 text-red-500 rounded hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
            {spec.fields.map((f) => (
              <Field key={f.key} spec={f} value={b[f.key]} onChange={(v) => setBlock(i, { ...b, [f.key]: v })} />
            ))}
          </div>
        );
      })}

      <div className="flex flex-wrap items-center gap-2 bg-gray-50 rounded-xl p-4">
        <span className="text-sm text-gray-500">Add a section:</span>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={addType} onChange={(e) => setAddType(e.target.value)}>
          {Object.entries(BLOCK_SPECS).map(([type, s]) => (
            <option key={type} value={type}>{s.label}</option>
          ))}
        </select>
        <button onClick={() => setPage({ ...page, blocks: [...page.blocks, emptyBlock(addType)] })} className="bg-secondary text-white px-4 py-2 rounded-lg text-sm">
          + Add
        </button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 px-6 py-3 flex flex-wrap items-center gap-3 z-10">
        <button onClick={() => request("PUT")} disabled={saving} className="bg-secondary text-white px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50">
          {saving ? "Saving…" : "Save page"}
        </button>
        {customised && (
          <button
            onClick={() => confirm("Discard your edits and go back to the original text?") && request("DELETE")}
            disabled={saving}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            Reset to original
          </button>
        )}
        {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}
      </div>
    </div>
  );
}

function Field({ spec, value, onChange }: { spec: FieldSpec; value: unknown; onChange: (v: unknown) => void }) {
  switch (spec.kind) {
    case "text":
      return (
        <div>
          <label className={LABEL}>{spec.label}</label>
          <input className={INPUT} value={String(value ?? "")} maxLength={spec.max} placeholder={spec.placeholder} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "textarea":
      return (
        <div>
          <label className={LABEL}>{spec.label}</label>
          <textarea className={`${INPUT} resize-y`} rows={5} value={String(value ?? "")} maxLength={spec.max} onChange={(e) => onChange(e.target.value)} />
        </div>
      );
    case "select":
      return (
        <div>
          <label className={LABEL}>{spec.label}</label>
          <select className={INPUT} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
            {spec.options?.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      );
    case "lines":
      return (
        <div>
          <label className={LABEL}>{spec.label}</label>
          <textarea
            className={`${INPUT} resize-y`}
            rows={Math.max(3, (Array.isArray(value) ? value.length : 0) + 1)}
            value={Array.isArray(value) ? value.join("\n") : String(value ?? "")}
            onChange={(e) => onChange(e.target.value.split("\n"))}
          />
        </div>
      );
    case "rows": {
      const rows = Array.isArray(value) ? (value as Record<string, string>[]) : [];
      const update = (i: number, patch: Record<string, string>) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
      return (
        <div>
          <label className={LABEL}>{spec.label}</label>
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="flex gap-2 items-start bg-gray-50 rounded-lg p-2">
                <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: spec.rowFields?.map((f) => (f.max && f.max <= 20 ? "90px" : "1fr")).join(" ") }}>
                  {spec.rowFields?.map((f) =>
                    f.kind === "textarea" ? (
                      <textarea key={f.key} className={`${INPUT} resize-y`} rows={2} placeholder={f.label} value={row[f.key] || ""} onChange={(e) => update(i, { [f.key]: e.target.value })} />
                    ) : (
                      <input key={f.key} className={INPUT} placeholder={f.placeholder || f.label} value={row[f.key] || ""} onChange={(e) => update(i, { [f.key]: e.target.value })} />
                    )
                  )}
                </div>
                <button onClick={() => onChange(rows.filter((_, idx) => idx !== i))} className="text-xs text-red-500 px-1 py-2" aria-label="Remove row">✕</button>
              </div>
            ))}
            <button onClick={() => onChange([...rows, {}])} className="text-sm text-gold-600 hover:underline">+ Add row</button>
          </div>
        </div>
      );
    }
    case "table": {
      const t = (value || { columns: [], rows: [] }) as TableValue;
      const setCols = (columns: string[]) => onChange({ columns, rows: t.rows.map((r) => columns.map((_, k) => r[k] || "")) });
      return (
        <div>
          <label className={LABEL}>{spec.label}</label>
          <div className="overflow-x-auto">
            <table className="text-sm">
              <thead>
                <tr>
                  {t.columns.map((c, k) => (
                    <th key={k} className="p-1">
                      <input className={`${INPUT} font-medium min-w-[110px]`} value={c} onChange={(e) => setCols(t.columns.map((x, idx) => (idx === k ? e.target.value : x)))} />
                    </th>
                  ))}
                  <th className="p-1 whitespace-nowrap">
                    <button onClick={() => setCols([...t.columns, `Column ${t.columns.length + 1}`])} className="text-xs text-gold-600">+ col</button>
                    {t.columns.length > 1 && (
                      <button onClick={() => setCols(t.columns.slice(0, -1))} className="text-xs text-red-500 ml-2">− col</button>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {t.rows.map((r, j) => (
                  <tr key={j}>
                    {t.columns.map((_, k) => (
                      <td key={k} className="p-1">
                        <input
                          className={`${INPUT} min-w-[110px]`}
                          value={r[k] || ""}
                          onChange={(e) => onChange({ ...t, rows: t.rows.map((row, idx) => (idx === j ? t.columns.map((__, kk) => (kk === k ? e.target.value : row[kk] || "")) : row)) })}
                        />
                      </td>
                    ))}
                    <td className="p-1">
                      <button onClick={() => onChange({ ...t, rows: t.rows.filter((_, idx) => idx !== j) })} className="text-xs text-red-500 px-1" aria-label="Remove row">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => onChange({ ...t, rows: [...t.rows, t.columns.map(() => "")] })} className="text-sm text-gold-600 hover:underline mt-1">+ Add row</button>
        </div>
      );
    }
  }
}
