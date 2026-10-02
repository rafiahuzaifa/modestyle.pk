"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  stock: number;
  image?: string;
  category?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
}

type Flag = "isNewArrival" | "isBestseller" | "isFeatured";
const FLAGS: { key: Flag; label: string }[] = [
  { key: "isNewArrival", label: "New" },
  { key: "isBestseller", label: "Best" },
  { key: "isFeatured", label: "Featured" },
];

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading products…</div>}>
      <ProductsTable />
    </Suspense>
  );
}

function ProductsTable() {
  const saved = useSearchParams().get("saved");
  const [products, setProducts] = useState<Product[] | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [stockFilter, setStockFilter] = useState<"" | "low" | "out">("");
  const [notice, setNotice] = useState(saved ? "Product saved — it's live on the website." : "");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => setProducts([]));
  }, []);

  const categories = useMemo(
    () => [...new Set((products || []).map((p) => p.category).filter(Boolean))].sort() as string[],
    [products]
  );

  const visible = (products || []).filter((p) => {
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    if (category && p.category !== category) return false;
    if (stockFilter === "out" && p.stock > 0) return false;
    if (stockFilter === "low" && (p.stock === 0 || p.stock >= 10)) return false;
    return true;
  });

  const patch = async (id: string, fields: Partial<Product>) => {
    const before = products;
    setProducts((prev) => prev && prev.map((p) => (p._id === id ? { ...p, ...fields } : p)));
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setNotice("Saved.");
    } catch (err) {
      setProducts(before);
      setNotice(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(null);
    }
  };

  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This also removes its reviews and cannot be undone.\n\nTip: set stock to 0 to hide it from sale instead.`)) return;
    setBusy(p._id);
    try {
      const res = await fetch(`/api/admin/products/${p._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setProducts((prev) => prev && prev.filter((x) => x._id !== p._id));
      setNotice(`Deleted "${p.name}".`);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-display">Products</h2>
          <p className="text-sm text-gray-500 mt-1">
            {products ? `${products.length} products` : "Loading…"} · edit price and stock right in the table
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/categories" className="border border-gray-200 px-4 py-2.5 rounded-lg text-sm hover:border-gray-400 transition">
            Categories
          </Link>
          <Link href="/admin/products/new" className="bg-gold-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gold-600 transition">
            + Add product
          </Link>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between text-sm bg-gold-50 border border-gold-100 text-gold-800 rounded-lg px-4 py-2.5">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="text-gold-600 px-2" aria-label="Dismiss">✕</button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-300"
          placeholder="Search products…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm" value={stockFilter} onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}>
          <option value="">All stock</option>
          <option value="low">Low stock (&lt; 10)</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400">
                <th className="text-left px-4 py-3 font-medium">Product</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Price (PKR)</th>
                <th className="text-left px-4 py-3 font-medium">Stock</th>
                <th className="text-left px-4 py-3 font-medium">Badges</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products === null ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading products…</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">No products match.</td></tr>
              ) : (
                visible.map((p) => (
                  <tr key={p._id} className={`border-b border-gray-50 ${busy === p._id ? "opacity-60" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {p.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={`${p.image}?w=88&h=96&fit=crop`} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <Link href={`/admin/products/${p._id}`} className="font-medium hover:text-gold-600 max-w-[220px] truncate">
                          {p.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.category || "—"}</td>
                    <td className="px-4 py-3">
                      <InlineNumber key={`price-${p.price}`} value={p.price} onSave={(price) => patch(p._id, { price })} />
                    </td>
                    <td className="px-4 py-3">
                      <InlineNumber
                        key={`stock-${p.stock}`}
                        value={p.stock ?? 0}
                        onSave={(stock) => patch(p._id, { stock })}
                        className={(p.stock ?? 0) === 0 ? "text-red-600" : (p.stock ?? 0) < 10 ? "text-amber-600" : ""}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {FLAGS.map((f) => (
                          <button
                            key={f.key}
                            onClick={() => patch(p._id, { [f.key]: !p[f.key] })}
                            className={`text-[10px] px-2 py-1 rounded-full border transition ${
                              p[f.key] ? "bg-secondary text-white border-secondary" : "text-gray-400 border-gray-200 hover:border-gray-400"
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link href={`/admin/products/${p._id}`} className="text-xs text-gold-600 hover:underline mr-3">Edit</Link>
                      <a href={`/products/${p.slug}`} target="_blank" className="text-xs text-gray-400 hover:underline mr-3">View</a>
                      <button onClick={() => remove(p)} className="text-xs text-red-500 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/** Number cell that saves on Enter or when focus leaves, only if the value changed.
 * Callers pass key={value} so it resets when the saved value changes. */
function InlineNumber({ value, onSave, className = "" }: { value: number; onSave: (v: number) => void; className?: string }) {
  const [draft, setDraft] = useState(String(value));
  const commit = () => {
    const n = Number(draft);
    if (draft === "" || !Number.isFinite(n) || n < 0) return setDraft(String(value));
    if (Math.round(n) !== value) onSave(Math.round(n));
  };
  return (
    <input
      type="number"
      min={0}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      className={`w-24 border border-transparent hover:border-gray-200 focus:border-gold-300 rounded px-2 py-1 focus:outline-none ${className}`}
    />
  );
}
