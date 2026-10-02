"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useCartStore } from "@/sanity/lib/cart-store";
import { useWishlistStore } from "@/sanity/lib/wishlist-store";
import { useSettings } from "@/app/components/SettingsProvider";

const NAV_CATEGORIES = [
  { name: "Hijabs", href: "/products?category=hijabs" },
  { name: "Abayas", href: "/products?category=abayas" },
  { name: "Accessories", href: "/products?category=accessories" },
  { name: "Jilbabs", href: "/products?category=jilbabs" },
  { name: "Prayer Wear", href: "/products?category=prayer-wear" },
  { name: "Innerwear", href: "/products?category=innerwear" },
  { name: "Kids Modest", href: "/products?category=kids-modest" },
];

const Navbar = () => {
  const { announcement } = useSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const totalItems = useCartStore((s) => s.totalItems);
  const toggleCart = useCartStore((s) => s.toggleCart);
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/products?q=${encodeURIComponent(query.trim())}`);
    setSearchOpen(false);
    setQuery("");
  };

  return (
    <>
      {/* Announcement Bar (edited in Admin → Settings; hidden when empty) */}
      {announcement && (
        <div className="bg-secondary text-white text-center text-xs py-2 px-4 tracking-wider whitespace-pre-wrap">
          {announcement}
        </div>
      )}

      <nav className="bg-white border-b border-gold-100 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between py-4 px-4 lg:px-8">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <h1 className="font-display text-2xl lg:text-3xl tracking-wide">
              <span className="text-gold-500">Modest</span>
              <span className="text-secondary">Style</span>
              <span className="text-gold-400 text-sm">.pk</span>
            </h1>
          </Link>

          {/* Desktop Nav */}
          <ul className="hidden lg:flex items-center gap-8 text-sm tracking-wide uppercase">
            {NAV_CATEGORIES.map((cat) => (
              <li key={cat.name}>
                <Link
                  href={cat.href}
                  className="text-secondary/80 hover:text-gold-500 transition-colors"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right icons */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <button
                onClick={() => setSearchOpen((v) => !v)}
                className="p-2 hover:text-gold-500 transition"
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <AnimatePresence>
                {searchOpen && (
                  <motion.form
                    onSubmit={submitSearch}
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex items-center gap-2 w-72 z-50"
                  >
                    <input
                      autoFocus
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search hijabs, abayas..."
                      className="flex-1 text-sm px-3 py-2 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="bg-gold-500 hover:bg-gold-600 text-white text-xs px-3 py-2 rounded-lg transition"
                    >
                      Go
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Account */}
            <SignedIn>
              <Link href="/account" className="p-2 hover:text-gold-500 transition" aria-label="Account">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
            </SignedIn>
            <SignedOut>
              <Link
                href="/sign-in"
                className="text-sm font-medium hover:text-gold-500 transition"
              >
                Sign In
              </Link>
            </SignedOut>

            {/* Wishlist */}
            <Link href="/account?tab=wishlist" className="p-2 hover:text-gold-500 transition relative" aria-label="Wishlist">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <button
              onClick={toggleCart}
              className="p-2 hover:text-gold-500 transition relative"
              aria-label="Cart"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-gold-100 animate-slide-down">
            <ul className="flex flex-col py-4">
              {NAV_CATEGORIES.map((cat) => (
                <li key={cat.name}>
                  <Link
                    href={cat.href}
                    className="block px-6 py-3 text-sm tracking-wide uppercase text-secondary/80 hover:bg-gold-50 hover:text-gold-600 transition"
                    onClick={() => setMobileOpen(false)}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
