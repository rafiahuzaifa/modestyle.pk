import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | ModestStyle.pk",
};

const SIDEBAR_LINKS = [
  { name: "Dashboard", href: "/admin", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { name: "Products", href: "/admin/products", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { name: "Orders", href: "/admin/orders", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { name: "Users", href: "/admin/users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { name: "Content", href: "/admin/content", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary text-white flex-shrink-0 hidden lg:flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/admin">
            <h2 className="font-display text-lg">
              <span className="text-gold-400">Modest</span>Style
              <span className="text-gold-400 text-xs">.pk</span>
            </h2>
            <p className="text-[11px] text-white/40 mt-1">Admin Panel</p>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {SIDEBAR_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={link.icon} />
              </svg>
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <a
            href="/production"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gold-500/20 text-gold-400 text-sm hover:bg-gold-500/30 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Sanity Studio
          </a>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 mt-2 rounded-lg text-white/40 text-sm hover:text-white/70 transition"
          >
            &larr; Back to Store
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-x-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-medium">Admin</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Logged in as Admin</span>
            <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-600 text-xs font-bold">
              A
            </div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
