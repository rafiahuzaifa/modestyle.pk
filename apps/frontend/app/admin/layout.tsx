import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { isAdminEmail } from "@/lib/admin";
import { SignOutButton } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Admin Dashboard | ModestStyle.pk",
};

const SIDEBAR_LINKS = [
  { name: "Dashboard", href: "/admin", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { name: "Products", href: "/admin/products", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  { name: "Orders", href: "/admin/orders", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
  { name: "Users", href: "/admin/users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { name: "Content", href: "/admin/content", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
  { name: "Marketing", href: "/admin/marketing", icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
  { name: "Leads", href: "/admin/leads", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in?redirect_url=/admin");

  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;
  if (!isAdminEmail(email)) return <AccessDenied email={email} />;

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
          <h1 className="text-lg font-medium">
            <Link href="/admin">Admin</Link>
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">
              Logged in as {user.firstName || email}
            </span>
            <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-600 text-xs font-bold">
              {(user.firstName || email || "A")[0].toUpperCase()}
            </div>
          </div>
        </header>
        {/* Mobile navigation (the sidebar is desktop-only) */}
        <nav className="lg:hidden bg-white border-b border-gray-200 px-4 py-2 flex gap-2 overflow-x-auto">
          {SIDEBAR_LINKS.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs bg-gray-100 text-gray-700 hover:bg-gold-50 hover:text-gold-700"
            >
              {link.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

/** Shown instead of a silent redirect so it's clear why the panel won't open. */
function AccessDenied({ email }: { email?: string }) {
  const configured = (process.env.ADMIN_EMAILS || "").split(",").some((e) => e.trim());
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl border border-gray-100 p-8 max-w-md text-center space-y-4">
        <h1 className="font-display text-2xl">Admin access required</h1>
        <p className="text-sm text-gray-500">
          You&apos;re signed in as <span className="font-medium text-gray-800">{email || "an account without an email"}</span>,
          which isn&apos;t on the admin list.
        </p>
        {!configured && (
          <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-4 py-3 text-left">
            No admin emails are configured on this deployment. Add <code>ADMIN_EMAILS</code> in
            Vercel → Settings → Environment Variables (e.g. <code>you@example.com</code>) and redeploy.
          </p>
        )}
        <div className="flex gap-3 justify-center pt-2">
          <SignOutButton redirectUrl="/sign-in?redirect_url=/admin">
            <button className="bg-secondary text-white px-5 py-2.5 rounded-lg text-sm">
              Sign in with another account
            </button>
          </SignOutButton>
          <Link href="/" className="border border-gray-200 px-5 py-2.5 rounded-lg text-sm">
            Back to store
          </Link>
        </div>
      </div>
    </div>
  );
}
