import { NextRequest } from "next/server";
import { adminHandler } from "@/lib/admin-route";
import { createProduct, listProducts, parseProductInput } from "@/lib/catalog-admin";

export async function GET() {
  return adminHandler(async () => ({ products: await listProducts() }));
}

export async function POST(request: NextRequest) {
  return adminHandler(async () => {
    const id = await createProduct(parseProductInput(await request.json()));
    return { id };
  });
}
