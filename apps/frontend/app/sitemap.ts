import type { MetadataRoute } from "next";
import { client } from "@/sanity/lib/client";
import { SITE_URL } from "@/lib/site";

const STATIC_ROUTES = [
  "",
  "/products",
  "/about",
  "/contact",
  "/faqs",
  "/shipping",
  "/returns",
  "/size-guide",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([
    client
      .fetch<{ slug: string; _updatedAt?: string }[]>(
        `*[_type == "product"]{ "slug": slug.current, _updatedAt }`
      )
      .catch(() => []),
    client
      .fetch<{ slug: string }[]>(
        `*[_type == "category" && !defined(parent)]{ "slug": slug.current }`
      )
      .catch(() => []),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = (categories ?? []).map((c) => ({
    url: `${SITE_URL}/products?category=${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const productEntries: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
    url: `${SITE_URL}/products/${p.slug}`,
    lastModified: p._updatedAt ? new Date(p._updatedAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
