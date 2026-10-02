import "server-only";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { writeClient } from "@/sanity/lib/write-client";
import { MATERIAL_OPTIONS, OCCASION_OPTIONS, SIZE_OPTIONS } from "@/lib/catalog-options";

/** Server-side catalog management for the admin panel (products, categories, images).
 * Callers must check admin access first. Every write refreshes the whole storefront. */

const SIZES = SIZE_OPTIONS.map((o) => o.value);
const OCCASIONS = OCCASION_OPTIONS.map((o) => o.value);

export class CatalogError extends Error {}

/** Purges cached pages so admin edits show on the website immediately. */
export function refreshStorefront() {
  revalidatePath("/", "layout");
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

async function uniqueSlug(type: "product" | "category", base: string, excludeId?: string) {
  const root = slugify(base) || type;
  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const taken = await writeClient.fetch<number>(
      `count(*[_type == $type && slug.current == $slug && !(_id in [$id, "drafts." + $id])])`,
      { type, slug: candidate, id: excludeId || "" }
    );
    if (!taken) return candidate;
  }
  return `${root}-${randomUUID().slice(0, 6)}`;
}

// ─── Images ──────────────────────────────────────────────────────────

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // Vercel request bodies cap at 4.5 MB; the admin UI resizes before upload

export async function uploadImage(file: File) {
  if (!IMAGE_TYPES.includes(file.type)) throw new CatalogError("Please upload a JPG, PNG, WebP or AVIF image.");
  if (file.size > MAX_IMAGE_BYTES) throw new CatalogError("Image is too large (max 4 MB).");
  const asset = await writeClient.assets.upload("image", Buffer.from(await file.arrayBuffer()), {
    filename: file.name,
    contentType: file.type,
  });
  return { assetId: asset._id, url: asset.url };
}

const imageRef = (assetId: string) => ({
  _type: "image",
  _key: randomUUID().slice(0, 12),
  asset: { _type: "reference", _ref: assetId },
});

// ─── Products ────────────────────────────────────────────────────────

export interface ProductInput {
  name: string;
  slug?: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  categoryId: string;
  images: string[]; // Sanity image asset ids, first = main image
  sizes: string[];
  colors: { name: string; hex: string }[];
  material: string | null;
  occasion: string[];
  stock: number;
  sku: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestseller: boolean;
  tags: string[];
}

const ASSET_ID_RE = /^image-[a-zA-Z0-9]+-\d+x\d+-[a-z0-9]+$/;
const DOC_ID_RE = /^[a-zA-Z0-9._-]{1,128}$/;

export function parseProductInput(body: Record<string, unknown>): ProductInput {
  const name = String(body.name ?? "").trim().slice(0, 150);
  if (!name) throw new CatalogError("Product name is required.");

  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) throw new CatalogError("Please enter a valid price.");
  const compare = body.compareAtPrice === "" || body.compareAtPrice == null ? null : Number(body.compareAtPrice);
  if (compare !== null && (!Number.isFinite(compare) || compare < 0)) {
    throw new CatalogError("Please enter a valid 'compare at' price, or leave it empty.");
  }
  if (compare !== null && compare > 0 && compare <= price) {
    throw new CatalogError("'Compare at' price must be higher than the selling price (it shows the discount).");
  }

  const categoryId = String(body.categoryId ?? "");
  if (!DOC_ID_RE.test(categoryId)) throw new CatalogError("Please choose a category.");

  const images = (Array.isArray(body.images) ? body.images : []).map(String).filter((id) => ASSET_ID_RE.test(id));
  if (!images.length) throw new CatalogError("Please add at least one product image.");

  const stock = Number(body.stock);
  if (!Number.isInteger(stock) || stock < 0) throw new CatalogError("Stock must be a whole number (0 or more).");

  const list = (v: unknown) => (Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : []);
  const colors = (Array.isArray(body.colors) ? body.colors : [])
    .map((c: { name?: unknown; hex?: unknown }) => ({
      name: String(c?.name ?? "").trim().slice(0, 40),
      hex: String(c?.hex ?? "").trim(),
    }))
    .filter((c) => c.name)
    .map((c) => ({ ...c, hex: /^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : "#cccccc" }));
  const material = String(body.material ?? "");

  return {
    name,
    slug: typeof body.slug === "string" && body.slug.trim() ? body.slug : undefined,
    description: String(body.description ?? "").trim().slice(0, 3000),
    price: Math.round(price),
    compareAtPrice: compare ? Math.round(compare) : null,
    categoryId,
    images: images.slice(0, 12),
    sizes: list(body.sizes).filter((s) => SIZES.includes(s)),
    colors: colors.slice(0, 20),
    material: MATERIAL_OPTIONS.includes(material) ? material : null,
    occasion: list(body.occasion).filter((o) => OCCASIONS.includes(o)),
    stock,
    sku: String(body.sku ?? "").trim().slice(0, 60),
    isFeatured: body.isFeatured === true,
    isNewArrival: body.isNewArrival === true,
    isBestseller: body.isBestseller === true,
    tags: list(body.tags).map((t) => t.slice(0, 40)).slice(0, 30),
  };
}

async function productFields(p: ProductInput, id?: string) {
  const exists = await writeClient.fetch<number>(`count(*[_type == "category" && _id == $id])`, { id: p.categoryId });
  if (!exists) throw new CatalogError("The selected category no longer exists.");
  return {
    name: p.name,
    slug: { _type: "slug", current: await uniqueSlug("product", p.slug || p.name, id) },
    description: p.description,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    category: { _type: "reference", _ref: p.categoryId },
    images: p.images.map(imageRef),
    sizes: p.sizes,
    colors: p.colors.map((c) => ({ _key: randomUUID().slice(0, 12), ...c })),
    material: p.material,
    occasion: p.occasion,
    stock: p.stock,
    sku: p.sku,
    isFeatured: p.isFeatured,
    isNewArrival: p.isNewArrival,
    isBestseller: p.isBestseller,
    tags: p.tags,
  };
}

export async function createProduct(p: ProductInput) {
  const doc = await writeClient.create({
    _type: "product",
    rating: 0,
    reviewCount: 0,
    ...(await productFields(p)),
  });
  refreshStorefront();
  return doc._id;
}

export async function updateProduct(id: string, p: ProductInput) {
  if (!DOC_ID_RE.test(id)) throw new CatalogError("Invalid product.");
  await writeClient.patch(id).set(await productFields(p, id)).commit();
  refreshStorefront();
}

/** Quick edits from the product list (price / stock / badges). */
export async function quickUpdateProduct(id: string, body: Record<string, unknown>) {
  if (!DOC_ID_RE.test(id)) throw new CatalogError("Invalid product.");
  const set: Record<string, unknown> = {};
  if (body.price !== undefined) {
    const v = Number(body.price);
    if (!Number.isFinite(v) || v < 0) throw new CatalogError("Invalid price.");
    set.price = Math.round(v);
  }
  if (body.stock !== undefined) {
    const v = Number(body.stock);
    if (!Number.isInteger(v) || v < 0) throw new CatalogError("Stock must be a whole number.");
    set.stock = v;
  }
  for (const flag of ["isFeatured", "isNewArrival", "isBestseller"]) {
    if (typeof body[flag] === "boolean") set[flag] = body[flag];
  }
  if (!Object.keys(set).length) throw new CatalogError("Nothing to update.");
  await writeClient.patch(id).set(set).commit();
  refreshStorefront();
}

export async function deleteProduct(id: string) {
  if (!DOC_ID_RE.test(id)) throw new CatalogError("Invalid product.");
  // Reviews reference the product, so remove them in the same transaction.
  const reviewIds = await writeClient.fetch<string[]>(`*[_type == "review" && references($id)]._id`, { id });
  const tx = writeClient.transaction();
  reviewIds.forEach((rid) => tx.delete(rid));
  tx.delete(id);
  tx.delete(`drafts.${id}`);
  await tx.commit();
  refreshStorefront();
}

export async function getProductForEdit(id: string) {
  if (!DOC_ID_RE.test(id)) return null;
  return writeClient.fetch(
    `*[_type == "product" && _id == $id][0]{
      _id, name, "slug": slug.current, description, price, compareAtPrice,
      "categoryId": category._ref,
      "images": images[]{ "assetId": asset._ref, "url": asset->url },
      sizes, colors[]{ name, hex }, material, occasion, stock, sku,
      isFeatured, isNewArrival, isBestseller, tags
    }`,
    { id }
  );
}

export async function listProducts() {
  return writeClient.fetch(
    `*[_type == "product" && !(_id in path("drafts.**"))] | order(_createdAt desc){
      _id, name, "slug": slug.current, price, compareAtPrice, stock,
      "image": images[0].asset->url, "category": category->name, "categoryId": category._ref,
      isFeatured, isNewArrival, isBestseller
    }`
  );
}

// ─── Categories ──────────────────────────────────────────────────────

export interface CategoryInput {
  name: string;
  description: string;
  imageAssetId: string | null;
  parentId: string | null;
  order: number;
}

export function parseCategoryInput(body: Record<string, unknown>): CategoryInput {
  const name = String(body.name ?? "").trim().slice(0, 80);
  if (!name) throw new CatalogError("Category name is required.");
  const image = String(body.imageAssetId ?? "");
  const parent = String(body.parentId ?? "");
  const order = Number(body.order);
  return {
    name,
    description: String(body.description ?? "").trim().slice(0, 1000),
    imageAssetId: ASSET_ID_RE.test(image) ? image : null,
    parentId: DOC_ID_RE.test(parent) ? parent : null,
    order: Number.isFinite(order) ? Math.round(order) : 0,
  };
}

function categoryFields(c: CategoryInput) {
  return {
    name: c.name,
    description: c.description,
    order: c.order,
    image: c.imageAssetId ? { _type: "image", asset: { _type: "reference", _ref: c.imageAssetId } } : null,
    parent: c.parentId ? { _type: "reference", _ref: c.parentId } : null,
  };
}

export async function listCategories() {
  return writeClient.fetch(
    `*[_type == "category" && !(_id in path("drafts.**"))] | order(order asc, name asc){
      _id, name, "slug": slug.current, description, order,
      "image": image.asset->url, "imageAssetId": image.asset._ref,
      "parentId": parent._ref,
      "productCount": count(*[_type == "product" && references(^._id)])
    }`
  );
}

export async function createCategory(c: CategoryInput) {
  const doc = await writeClient.create({
    _type: "category",
    slug: { _type: "slug", current: await uniqueSlug("category", c.name) },
    ...categoryFields(c),
  });
  refreshStorefront();
  return doc._id;
}

export async function updateCategory(id: string, c: CategoryInput) {
  if (!DOC_ID_RE.test(id)) throw new CatalogError("Invalid category.");
  if (c.parentId === id) throw new CatalogError("A category can't be its own parent.");
  // Keep the slug stable so existing links (/products?category=...) keep working.
  await writeClient.patch(id).set(categoryFields(c)).commit();
  refreshStorefront();
}

export async function deleteCategory(id: string) {
  if (!DOC_ID_RE.test(id)) throw new CatalogError("Invalid category.");
  const used = await writeClient.fetch<number>(`count(*[references($id)])`, { id });
  if (used) {
    throw new CatalogError(
      `This category is used by ${used} product(s) or sub-categories. Move them to another category first.`
    );
  }
  await writeClient.delete(id);
  refreshStorefront();
}
