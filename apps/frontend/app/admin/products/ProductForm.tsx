"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ImageUploader, type UploadedImage } from "@/app/admin/components/ImageUploader";
import { MATERIAL_OPTIONS, OCCASION_OPTIONS, SIZE_OPTIONS } from "@/lib/catalog-options";

export interface ProductFormValues {
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAtPrice: string;
  categoryId: string;
  images: UploadedImage[];
  sizes: string[];
  colors: { name: string; hex: string }[];
  material: string;
  occasion: string[];
  stock: string;
  sku: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;
  tags: string;
}

export const EMPTY_PRODUCT: ProductFormValues = {
  name: "",
  slug: "",
  description: "",
  price: "",
  compareAtPrice: "",
  categoryId: "",
  images: [],
  sizes: [],
  colors: [],
  material: "",
  occasion: [],
  stock: "50",
  sku: "",
  isFeatured: false,
  isNewArrival: true,
  isBestseller: false,
  tags: "",
};

interface Category {
  _id: string;
  name: string;
  parentId?: string;
}

const INPUT = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-300";
const LABEL = "block text-xs font-medium text-gray-500 mb-1.5";

export function ProductForm({ productId, initial }: { productId?: string; initial: ProductFormValues }) {
  const router = useRouter();
  const [v, setV] = useState<ProductFormValues>(initial);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => setCategories([]));
  }, []);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setV((prev) => ({ ...prev, [key]: value }));
  const toggle = (key: "sizes" | "occasion", value: string) =>
    set(key, v[key].includes(value) ? v[key].filter((x) => x !== value) : [...v[key], value]);

  const nameById = new Map(categories.map((c) => [c._id, c.name]));
  const discount =
    Number(v.compareAtPrice) > Number(v.price) && Number(v.price) > 0
      ? Math.round(((Number(v.compareAtPrice) - Number(v.price)) / Number(v.compareAtPrice)) * 100)
      : 0;

  const save = async () => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch(productId ? `/api/admin/products/${productId}` : "/api/admin/products", {
        method: productId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...v,
          images: v.images.map((i) => i.assetId),
          tags: v.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save product");
      router.push("/admin/products?saved=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save product");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-24">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/admin/products" className="text-xs text-gray-400 hover:text-gray-600">
            ← All products
          </Link>
          <h2 className="text-2xl font-display mt-1">{productId ? "Edit product" : "Add new product"}</h2>
        </div>
        {productId && v.slug && (
          <a href={`/products/${v.slug}`} target="_blank" className="text-sm text-gold-600 hover:underline">
            View on website ↗
          </a>
        )}
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}

      <Card title="Photos" hint="The first photo is the main one shown in the shop. Large photos are resized automatically.">
        <ImageUploader images={v.images} onChange={(images) => set("images", images)} />
      </Card>

      <Card title="Basic details">
        <div>
          <label className={LABEL}>Product name *</label>
          <input className={INPUT} value={v.name} maxLength={150} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Crinkle Chiffon Hijab — Dusty Rose" />
        </div>
        <div>
          <label className={LABEL}>Description</label>
          <textarea className={`${INPUT} resize-y`} rows={5} value={v.description} maxLength={3000} onChange={(e) => set("description", e.target.value)} placeholder="Fabric, fit, care instructions…" />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Category *</label>
            <select className={INPUT} value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">Choose a category…</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.parentId ? `${nameById.get(c.parentId) || "…"} › ${c.name}` : c.name}
                </option>
              ))}
            </select>
            <Link href="/admin/categories" className="text-[11px] text-gold-600 hover:underline">
              Manage categories
            </Link>
          </div>
          <div>
            <label className={LABEL}>Material</label>
            <select className={INPUT} value={v.material} onChange={(e) => set("material", e.target.value)}>
              <option value="">—</option>
              {MATERIAL_OPTIONS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card title="Price & stock">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className={LABEL}>Selling price (PKR) *</label>
            <input className={INPUT} type="number" min={0} value={v.price} onChange={(e) => set("price", e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>Original price (optional)</label>
            <input className={INPUT} type="number" min={0} value={v.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} placeholder="Shows as crossed out" />
            {discount > 0 && <p className="text-[11px] text-green-600 mt-1">Shows {discount}% OFF</p>}
          </div>
          <div>
            <label className={LABEL}>Stock quantity *</label>
            <input className={INPUT} type="number" min={0} step={1} value={v.stock} onChange={(e) => set("stock", e.target.value)} />
          </div>
          <div>
            <label className={LABEL}>SKU (optional)</label>
            <input className={INPUT} value={v.sku} maxLength={60} onChange={(e) => set("sku", e.target.value)} />
          </div>
        </div>
      </Card>

      <Card title="Sizes, colours & occasion">
        <div>
          <label className={LABEL}>Available sizes</label>
          <div className="flex flex-wrap gap-2">
            {SIZE_OPTIONS.map((s) => (
              <Chip key={s.value} active={v.sizes.includes(s.value)} onClick={() => toggle("sizes", s.value)}>
                {s.label}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <label className={LABEL}>Colours</label>
          <div className="space-y-2">
            {v.colors.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : "#cccccc"}
                  onChange={(e) => set("colors", v.colors.map((x, idx) => (idx === i ? { ...x, hex: e.target.value } : x)))}
                  className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                />
                <input
                  className={INPUT}
                  value={c.name}
                  placeholder="Colour name, e.g. Dusty Rose"
                  onChange={(e) => set("colors", v.colors.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))}
                />
                <button type="button" onClick={() => set("colors", v.colors.filter((_, idx) => idx !== i))} className="text-xs text-red-500 px-2">
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={() => set("colors", [...v.colors, { name: "", hex: "#c6a45c" }])} className="text-sm text-gold-600 hover:underline">
              + Add colour
            </button>
          </div>
        </div>
        <div>
          <label className={LABEL}>Occasion</label>
          <div className="flex flex-wrap gap-2">
            {OCCASION_OPTIONS.map((o) => (
              <Chip key={o.value} active={v.occasion.includes(o.value)} onClick={() => toggle("occasion", o.value)}>
                {o.label}
              </Chip>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Shop badges & search">
        <div className="flex flex-wrap gap-6 text-sm">
          {(
            [
              ["isNewArrival", "New Arrival"],
              ["isBestseller", "Bestseller"],
              ["isFeatured", "Featured on homepage"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input type="checkbox" checked={v[key]} onChange={(e) => set(key, e.target.checked)} className="accent-gold-500" />
              {label}
            </label>
          ))}
        </div>
        <div>
          <label className={LABEL}>Tags (comma separated, help customers find it in search)</label>
          <input className={INPUT} value={v.tags} onChange={(e) => set("tags", e.target.value)} placeholder="eid, summer, lightweight" />
        </div>
      </Card>

      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 px-6 py-3 flex items-center gap-3 z-10">
        <button
          onClick={save}
          disabled={saving}
          className="bg-secondary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/90 transition disabled:opacity-50"
        >
          {saving ? "Saving…" : productId ? "Save changes" : "Publish product"}
        </button>
        <Link href="/admin/products" className="text-sm text-gray-500 hover:text-gray-700">
          Cancel
        </Link>
      </div>
    </div>
  );
}

function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
      <div>
        <h3 className="font-medium">{title}</h3>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs border transition ${
        active ? "bg-secondary text-white border-secondary" : "border-gray-200 text-gray-600 hover:border-gray-400"
      }`}
    >
      {children}
    </button>
  );
}
