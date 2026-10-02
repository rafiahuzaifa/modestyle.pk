import { NextRequest } from "next/server";
import { adminHandler } from "@/lib/admin-route";
import { createCategory, listCategories, parseCategoryInput } from "@/lib/catalog-admin";

export async function GET() {
  return adminHandler(async () => ({ categories: await listCategories() }));
}

export async function POST(request: NextRequest) {
  return adminHandler(async () => ({ id: await createCategory(parseCategoryInput(await request.json())) }));
}
