"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ImageUploader, type UploadedImage } from "@/app/admin/components/ImageUploader";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  order?: number;
  image?: string;
  imageAssetId?: string;
  parentId?: string;
  productCount: number;
}

interface Draft {
  name: string;
  description: string;
  order: string;
  parentId: string;
  image: UploadedImage[];
}

const EMPTY: Draft = { name: "", description: "", order: "0", parentId: "", image: [] };
const INPUT = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-300";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () =>
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => setCategories([]));

  useEffect(() => {
    load();
  }, []);

  const startEdit = (c?: Category) => {
    setError("");
    setEditing(c ? c._id : "new");
    setDraft(
      c
        ? {
            name: c.name,
            description: c.description || "",
            order: String(c.order ?? 0),
            parentId: c.parentId || "",
            image: c.imageAssetId && c.image ? [{ assetId: c.imageAssetId, url: c.image }] : [],
          }
        : EMPTY
    );
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(editing === "new" ? "/api/admin/categories" : `/api/admin/categories/${editing}`, {
        method: editing === "new" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          description: draft.description,
          order: draft.order,
          parentId: draft.parentId,
          imageAssetId: draft.image[0]?.assetId || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Category) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    const res = await fetch(`/api/admin/categories/${c._id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Could not delete");
    load();
  };

  const topLevel = (categories || []).filter((c) => !c.parentId);
  const childrenOf = (id: string) => (categories || []).filter((c) => c.parentId === id);

  const row = (c: Category, depth = 0) => (
    <div key={c._id}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50" style={{ paddingLeft: 16 + depth * 28 }}>
        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {c.image && <img src={`${c.image}?w=80&h=80&fit=crop`} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{c.name}</p>
          <p className="text-xs text-gray-400">
            {c.productCount} product{c.productCount === 1 ? "" : "s"} · /products?category={c.slug}
          </p>
        </div>
        <span className="text-xs text-gray-400 hidden sm:block">Order {c.order ?? 0}</span>
        <button onClick={() => startEdit(c)} className="text-xs text-gold-600 hover:underline">Edit</button>
        <button onClick={() => remove(c)} className="text-xs text-red-500 hover:underline">Delete</button>
      </div>
      {childrenOf(c._id).map((child) => row(child, depth + 1))}
    </div>
  );

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/products" className="text-xs text-gray-400 hover:text-gray-600">← Products</Link>
          <h2 className="text-2xl font-display mt-1">Categories</h2>
          <p className="text-sm text-gray-500 mt-1">Shown in the shop menu and filters. Lower order numbers appear first.</p>
        </div>
        <button onClick={() => startEdit()} className="bg-gold-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gold-600 transition">
          + Add category
        </button>
      </div>

      {editing && (
        <div className="bg-white rounded-xl border border-gold-200 p-6 space-y-4">
          <h3 className="font-medium">{editing === "new" ? "New category" : "Edit category"}</h3>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid sm:grid-cols-2 gap-4">
            <input className={INPUT} placeholder="Name *" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <select className={INPUT} value={draft.parentId} onChange={(e) => setDraft({ ...draft, parentId: e.target.value })}>
              <option value="">Top-level category</option>
              {topLevel
                .filter((c) => c._id !== editing)
                .map((c) => (
                  <option key={c._id} value={c._id}>Inside: {c.name}</option>
                ))}
            </select>
            <input className={INPUT} type="number" placeholder="Display order" value={draft.order} onChange={(e) => setDraft({ ...draft, order: e.target.value })} />
          </div>
          <textarea className={`${INPUT} resize-y`} rows={2} placeholder="Description (optional)" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
          <div className="max-w-xs">
            <ImageUploader images={draft.image} multiple={false} onChange={(image) => setDraft({ ...draft, image })} />
          </div>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="bg-secondary text-white px-5 py-2.5 rounded-lg text-sm disabled:opacity-50">
              {saving ? "Saving…" : "Save category"}
            </button>
            <button onClick={() => setEditing(null)} className="text-sm text-gray-500">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {categories === null ? (
          <p className="text-center py-12 text-gray-400 text-sm">Loading…</p>
        ) : categories.length === 0 ? (
          <p className="text-center py-12 text-gray-400 text-sm">No categories yet.</p>
        ) : (
          topLevel.map((c) => row(c))
        )}
      </div>
    </div>
  );
}
