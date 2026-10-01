import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { writeClient } from "@/sanity/lib/write-client";
import { ADMIN_BANNERS } from "@/sanity/lib/queries";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const banners = await client.fetch(ADMIN_BANNERS);
    return NextResponse.json({ banners: banners ?? [] });
  } catch (err) {
    console.error("Admin banners error:", err);
    return NextResponse.json({ banners: [] }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id, ...fields } = await request.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const allowed = ["isActive", "order"] as const;
    const patch: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in fields) patch[key] = fields[key];
    }

    await writeClient.patch(id).set(patch).commit();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Patch banner error:", err);
    return NextResponse.json({ error: "Failed to update banner" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await writeClient.delete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete banner error:", err);
    return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
  }
}
