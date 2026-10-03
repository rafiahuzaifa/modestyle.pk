import { NextRequest, NextResponse } from "next/server";
import { adminHandler } from "@/lib/admin-route";
import { getPage, resetPage, savePage } from "@/lib/pages";
import { isPageSlug } from "@/lib/content-pages";
import { CatalogError } from "@/lib/catalog-admin";

type Ctx = { params: Promise<{ slug: string }> };

async function slugOf(params: Ctx["params"]) {
  const { slug } = await params;
  if (!isPageSlug(slug)) throw new CatalogError("Unknown page.");
  return slug;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  return adminHandler(async () => getPage(await slugOf(params)));
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  return adminHandler(async () => {
    const slug = await slugOf(params);
    try {
      return { page: await savePage(slug, await request.json()), customised: true };
    } catch (err) {
      if (err instanceof Error && err.message.includes("title is required")) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }
  });
}

/** Reset to the original built-in content. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return adminHandler(async () => ({ page: await resetPage(await slugOf(params)), customised: false }));
}
