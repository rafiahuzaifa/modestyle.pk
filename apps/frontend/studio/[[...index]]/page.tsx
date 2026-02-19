"use client";

/**
 * Sanity Studio — mounted at /production
 * This renders the Sanity Studio interface for content management.
 */
import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

export default function StudioPage() {
  return <NextStudio config={config} />;
}
