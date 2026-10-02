import { NextRequest } from "next/server";
import { adminHandler } from "@/lib/admin-route";
import { deleteCategory, parseCategoryInput, updateCategory } from "@/lib/catalog-admin";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Ctx) {
  return adminHandler(async () => {
    await updateCategory((await params).id, parseCategoryInput(await request.json()));
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return adminHandler(async () => {
    await deleteCategory((await params).id);
  });
}
