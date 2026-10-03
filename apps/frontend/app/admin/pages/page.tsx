import Link from "next/link";
import { PAGE_LABELS, PAGE_SLUGS } from "@/lib/content-pages";

const OTHER = [
  { label: "Homepage slides & banners", href: "/admin/content", note: "Admin → Content" },
  { label: "Products & categories", href: "/admin/products", note: "Admin → Products" },
  { label: "Announcement bar, contact details, shipping & promo codes", href: "/admin/settings", note: "Admin → Settings" },
];

export default function AdminPagesIndex() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-display">Pages</h2>
        <p className="text-sm text-gray-500 mt-1">Edit the text on every information page of the website.</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
        {PAGE_SLUGS.map((slug) => (
          <div key={slug} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-medium text-sm">{PAGE_LABELS[slug]}</p>
              <p className="text-xs text-gray-400">/{slug}</p>
            </div>
            <div className="flex gap-4 text-sm">
              <a href={`/${slug}`} target="_blank" className="text-gray-400 hover:underline">View</a>
              <Link href={`/admin/pages/${slug}`} className="text-gold-600 hover:underline">Edit</Link>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-gray-50 rounded-xl p-5 text-sm space-y-2">
        <p className="font-medium">Managed elsewhere</p>
        {OTHER.map((o) => (
          <p key={o.href} className="text-gray-500">
            {o.label} → <Link href={o.href} className="text-gold-600 hover:underline">{o.note}</Link>
          </p>
        ))}
      </div>
    </div>
  );
}
