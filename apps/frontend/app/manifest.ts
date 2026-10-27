import type { MetadataRoute } from "next";

/** Web App Manifest, served at /manifest.webmanifest and linked automatically by Next.js. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "ModestStyle PK — Hijabs & Modest Fashion",
    short_name: "ModestStyle",
    description: "Shop premium hijabs, abayas, jilbabs and prayer wear with nationwide delivery across Pakistan.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#1A1A1A",
    lang: "en-PK",
    dir: "ltr",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Hijabs", url: "/products?category=hijabs", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Abayas", url: "/products?category=abayas", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My bag", url: "/checkout", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
