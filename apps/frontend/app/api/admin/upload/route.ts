import { NextRequest } from "next/server";
import { adminHandler } from "@/lib/admin-route";
import { CatalogError, uploadImage } from "@/lib/catalog-admin";

export const maxDuration = 60;

/** Uploads one image to Sanity and returns its asset id + CDN url. */
export async function POST(request: NextRequest) {
  return adminHandler(async () => {
    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) throw new CatalogError("No image received.");
    return uploadImage(file);
  });
}
