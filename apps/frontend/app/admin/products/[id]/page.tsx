import { notFound } from "next/navigation";
import { getProductForEdit } from "@/lib/catalog-admin";
import { ProductForm, type ProductFormValues } from "../ProductForm";

export const dynamic = "force-dynamic";

interface ProductDoc {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number | null;
  categoryId?: string;
  images?: { assetId: string; url: string }[] | null;
  sizes?: string[] | null;
  colors?: { name?: string; hex?: string }[] | null;
  material?: string | null;
  occasion?: string[] | null;
  stock?: number;
  sku?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestseller?: boolean;
  tags?: string[] | null;
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = (await getProductForEdit(id)) as ProductDoc | null;
  if (!p) notFound();

  const initial: ProductFormValues = {
    name: p.name || "",
    slug: p.slug || "",
    description: p.description || "",
    price: p.price != null ? String(p.price) : "",
    compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
    categoryId: p.categoryId || "",
    images: (p.images || []).filter((i) => i?.assetId && i?.url),
    sizes: p.sizes || [],
    colors: (p.colors || []).map((c) => ({ name: c.name || "", hex: c.hex || "#cccccc" })),
    material: p.material || "",
    occasion: p.occasion || [],
    stock: String(p.stock ?? 0),
    sku: p.sku || "",
    isFeatured: !!p.isFeatured,
    isNewArrival: !!p.isNewArrival,
    isBestseller: !!p.isBestseller,
    tags: (p.tags || []).join(", "),
  };

  return <ProductForm productId={id} initial={initial} />;
}
