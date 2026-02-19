import { groq } from "next-sanity";

// ─── Products ────────────────────────────────────────────────────────
export const PRODUCTS_QUERY = groq`
  *[_type == "product"] | order(_createdAt desc) {
    _id, name, "slug": slug.current, price, compareAtPrice,
    "image": images[0].asset->url,
    "images": images[].asset->url,
    "category": category->name,
    "categorySlug": category->slug.current,
    material, sizes, colors, stock,
    isFeatured, isNewArrival, isBestseller,
    rating, reviewCount, tags
  }
`;

export const PRODUCT_BY_SLUG = groq`
  *[_type == "product" && slug.current == $slug][0] {
    _id, name, "slug": slug.current, description, body,
    price, compareAtPrice,
    "images": images[].asset->url,
    "category": category->{ _id, name, "slug": slug.current },
    "subcategory": subcategory->{ name, "slug": slug.current },
    material, sizes, colors, stock, sku,
    isFeatured, isNewArrival, isBestseller,
    rating, reviewCount, tags, occasion
  }
`;

export const FEATURED_PRODUCTS = groq`
  *[_type == "product" && isFeatured == true][0..7] | order(_createdAt desc) {
    _id, name, "slug": slug.current, price, compareAtPrice,
    "image": images[0].asset->url,
    "category": category->name,
    rating, reviewCount, isBestseller, isNewArrival
  }
`;

export const BESTSELLERS = groq`
  *[_type == "product" && isBestseller == true][0..7] | order(rating desc) {
    _id, name, "slug": slug.current, price, compareAtPrice,
    "image": images[0].asset->url,
    "images": images[0..1][].asset->url,
    "category": category->name,
    rating, reviewCount
  }
`;

export const NEW_ARRIVALS = groq`
  *[_type == "product" && isNewArrival == true][0..7] | order(_createdAt desc) {
    _id, name, "slug": slug.current, price, compareAtPrice,
    "image": images[0].asset->url,
    "images": images[0..1][].asset->url,
    "category": category->name,
    rating, reviewCount
  }
`;

export const PRODUCTS_BY_CATEGORY = groq`
  *[_type == "product" && category->slug.current == $categorySlug] | order(_createdAt desc) {
    _id, name, "slug": slug.current, price, compareAtPrice,
    "image": images[0].asset->url,
    "images": images[0..1][].asset->url,
    "category": category->name,
    material, sizes, colors, stock,
    rating, reviewCount, tags, occasion
  }
`;

export const RELATED_PRODUCTS = groq`
  *[_type == "product" && category._ref == $categoryId && _id != $productId][0..3] {
    _id, name, "slug": slug.current, price, compareAtPrice,
    "image": images[0].asset->url,
    "category": category->name,
    rating, reviewCount
  }
`;

// ─── Categories ──────────────────────────────────────────────────────
export const CATEGORIES_QUERY = groq`
  *[_type == "category" && !defined(parent)] | order(order asc) {
    _id, name, "slug": slug.current, description,
    "image": image.asset->url,
    "subcategories": *[_type == "category" && parent._ref == ^._id] | order(order asc) {
      _id, name, "slug": slug.current
    }
  }
`;

// ─── Banners ─────────────────────────────────────────────────────────
export const HERO_BANNERS = groq`
  *[_type == "banner" && isActive == true && placement == "hero"] | order(order asc) {
    _id, title, subtitle, "image": image.asset->url,
    link, buttonText
  }
`;

// ─── Reviews ─────────────────────────────────────────────────────────
export const PRODUCT_REVIEWS = groq`
  *[_type == "review" && product._ref == $productId && isApproved == true] | order(_createdAt desc) {
    _id, author, rating, comment, _createdAt
  }
`;

// ─── Site Settings ───────────────────────────────────────────────────
export const SITE_SETTINGS = groq`
  *[_type == "siteSettings"][0] {
    siteName, tagline, freeShippingThreshold,
    announcement, socialLinks
  }
`;

// ─── Admin queries ───────────────────────────────────────────────────
export const ADMIN_PRODUCTS = groq`
  *[_type == "product"] | order(_createdAt desc) {
    _id, name, "slug": slug.current, price, stock,
    "image": images[0].asset->url,
    "category": category->name,
    isFeatured, isBestseller, isNewArrival
  }
`;

export const ADMIN_LOW_STOCK = groq`
  *[_type == "product" && stock < 10] | order(stock asc) {
    _id, name, stock, "image": images[0].asset->url
  }
`;

export const ADMIN_STATS = groq`{
  "totalProducts": count(*[_type == "product"]),
  "totalCategories": count(*[_type == "category"]),
  "lowStockCount": count(*[_type == "product" && stock < 10]),
  "featuredCount": count(*[_type == "product" && isFeatured == true])
}`;
