import { NextRequest, NextResponse } from "next/server";
import { adminHandler } from "@/lib/admin-route";
import {
  deleteProduct,
  getProductForEdit,
  parseProductInput,
  quickUpdateProduct,
  updateProduct,
} from "@/lib/catalog-admin";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  return adminHandler(async () => {
    const product = await getProductForEdit((await params).id);
    return product ?? NextResponse.json({ error: "Product not found" }, { status: 404 });
  });
}

/** Full edit from the product form. */
export async function PUT(request: NextRequest, { params }: Ctx) {
  return adminHandler(async () => {
    await updateProduct((await params).id, parseProductInput(await request.json()));
  });
}

/** Quick edit (price, stock, badges) from the product list. */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  return adminHandler(async () => {
    await quickUpdateProduct((await params).id, await request.json());
  });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  return adminHandler(async () => {
    await deleteProduct((await params).id);
  });
}
