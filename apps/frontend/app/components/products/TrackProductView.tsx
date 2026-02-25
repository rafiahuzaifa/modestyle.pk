"use client";

import { useEffect } from "react";
import { addToRecentlyViewed, type RecentProduct } from "./RecentlyViewed";

export function TrackProductView({ product }: { product: RecentProduct }) {
  useEffect(() => {
    addToRecentlyViewed(product);
  }, [product]);

  return null;
}
