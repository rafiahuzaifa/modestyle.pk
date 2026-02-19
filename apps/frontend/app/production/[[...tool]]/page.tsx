"use client";

/**
 * Sanity Studio — mounted at /production
 * Provides CMS interface for managing products, categories, banners, etc.
 */
import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

export const dynamic = "force-static";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
