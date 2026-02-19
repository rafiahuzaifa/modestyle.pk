"use client";

import React from "react";
import Link from "next/link";

const FOOTER_LINKS = {
  Shop: [
    { name: "Hijabs", href: "/products?category=hijabs" },
    { name: "Abayas", href: "/products?category=abayas" },
    { name: "Accessories", href: "/products?category=accessories" },
    { name: "Jilbabs", href: "/products?category=jilbabs" },
    { name: "Prayer Wear", href: "/products?category=prayer-wear" },
    { name: "New Arrivals", href: "/products?filter=new" },
  ],
  "Customer Care": [
    { name: "Contact Us", href: "/contact" },
    { name: "Shipping Policy", href: "/shipping" },
    { name: "Returns & Exchange", href: "/returns" },
    { name: "Size Guide", href: "/size-guide" },
    { name: "FAQs", href: "/faqs" },
  ],
  Company: [
    { name: "About Us", href: "/about" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

const Footer = () => {
  return (
    <footer className="bg-secondary text-white">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-12 text-center">
          <h3 className="font-display text-2xl mb-2">Join the ModestStyle Family</h3>
          <p className="text-white/60 text-sm mb-6">
            Subscribe for exclusive offers, new arrivals & styling tips
          </p>
          <form className="flex max-w-md mx-auto gap-2">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-gold-500"
            />
            <button
              type="submit"
              className="bg-gold-500 hover:bg-gold-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Links */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h2 className="font-display text-xl mb-4">
              <span className="text-gold-400">Modest</span>Style
              <span className="text-gold-400 text-xs">.pk</span>
            </h2>
            <p className="text-white/50 text-sm leading-relaxed mb-4">
              Pakistan&apos;s finest modest fashion destination. Elegance in every drape.
            </p>
            <div className="flex gap-4">
              {["Instagram", "Facebook", "TikTok"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-gold-500 hover:text-gold-400 transition text-xs"
                >
                  {social[0]}
                </a>
              ))}
            </div>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-medium tracking-wider uppercase text-gold-400 mb-4">
                {title}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-white/50 hover:text-white text-sm transition"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center text-xs text-white/40">
          <p>&copy; 2026 ModestStyle.pk. All rights reserved.</p>
          <p className="mt-2 md:mt-0">
            Free shipping on orders over PKR 5,000 &bull; Made with love in Pakistan
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
