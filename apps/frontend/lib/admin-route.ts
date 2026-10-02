import "server-only";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { CatalogError } from "@/lib/catalog-admin";

/** Wraps an admin API handler: rejects non-admins and turns errors into JSON responses. */
export async function adminHandler(fn: () => Promise<unknown>) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await fn();
    return result instanceof NextResponse ? result : NextResponse.json(result ?? { ok: true });
  } catch (err) {
    if (err instanceof CatalogError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Admin API error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
