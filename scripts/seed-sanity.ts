/**
 * Sanity Seed Script — ModestStyle.pk
 * Seeds categories + ~45 products with realistic PKR prices
 *
 * Usage: npx tsx scripts/seed-sanity.ts
 * Requires: NEXT_PUBLIC_SANITY_PROJECT_ID, SANITY_TOKEN in .env
 */

import { createClient } from "@sanity/client";
import * as dotenv from "dotenv";

dotenv.config({ path: "apps/frontend/.env.local" });

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  token: process.env.SANITY_TOKEN!,
  apiVersion: "2026-02-16",
  useCdn: false,
});

// ─── Categories ──────────────────────────────────────────────────────
const categories = [
  { name: "Hijabs", slug: "hijabs", order: 1 },
  { name: "Abayas", slug: "abayas", order: 2 },
  { name: "Accessories", slug: "accessories", order: 3 },
  { name: "Jilbabs", slug: "jilbabs", order: 4 },
  { name: "Prayer Wear", slug: "prayer-wear", order: 5 },
  { name: "Innerwear", slug: "innerwear", order: 6 },
  { name: "Kids Modest", slug: "kids-modest", order: 7 },
];

const subcategories: Record<string, string[]> = {
  hijabs: ["Georgette", "Chiffon", "Crinkle", "Silk", "Lawn", "Printed", "Solid", "Cashmere"],
  abayas: ["Textured", "Pleated", "Chiffon", "Open", "Embroidered", "Linear", "Rose"],
  accessories: ["Pins", "Brooches", "Bags", "Jewelry", "Scarf Rings"],
  innerwear: ["Underscarves", "Sleeves"],
};

// ─── Products ────────────────────────────────────────────────────────
interface ProductSeed {
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  compareAtPrice?: number;
  material?: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  stock: number;
  description: string;
  occasion: string[];
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
  tags: string[];
}

const products: ProductSeed[] = [
  // ── Hijabs (15 products) ──
  { name: "Premium Georgette Hijab — Dusty Rose", category: "hijabs", subcategory: "Georgette", price: 1800, compareAtPrice: 2200, material: "Georgette", sizes: ["free"], colors: [{ name: "Dusty Rose", hex: "#DCAE96" }], stock: 45, description: "Ultra-soft premium georgette with a luxurious drape. Perfect for everyday elegance.", occasion: ["casual", "office"], isBestseller: true, tags: ["premium", "soft", "everyday"] },
  { name: "Pure Silk Hijab — Midnight Black", category: "hijabs", subcategory: "Silk", price: 3500, compareAtPrice: 4200, material: "Silk", sizes: ["free"], colors: [{ name: "Midnight Black", hex: "#1A1A1A" }], stock: 30, description: "100% pure silk with a natural sheen. Elegant and timeless.", occasion: ["formal", "party"], isFeatured: true, tags: ["silk", "luxury", "formal"] },
  { name: "Crinkle Cotton Hijab — Off White", category: "hijabs", subcategory: "Crinkle", price: 1200, material: "Cotton", sizes: ["free"], colors: [{ name: "Off White", hex: "#F5F5F0" }, { name: "Cream", hex: "#FFFDD0" }], stock: 80, description: "Lightweight crinkle cotton that stays in place all day.", occasion: ["casual", "everyday"], isBestseller: true, tags: ["cotton", "crinkle", "breathable"] },
  { name: "Chiffon Wrap Hijab — Sage Green", category: "hijabs", subcategory: "Chiffon", price: 1500, material: "Chiffon", sizes: ["free"], colors: [{ name: "Sage Green", hex: "#9CAF88" }, { name: "Olive", hex: "#808000" }], stock: 55, description: "Elegant chiffon with a beautiful drape. Sheer enough for layering.", occasion: ["office", "casual"], isNewArrival: true, tags: ["chiffon", "trending"] },
  { name: "Cashmere Blend Hijab — Camel", category: "hijabs", subcategory: "Cashmere", price: 3200, material: "Cashmere", sizes: ["free"], colors: [{ name: "Camel", hex: "#C19A6B" }], stock: 20, description: "Luxuriously warm cashmere blend for winter elegance.", occasion: ["formal", "office"], isFeatured: true, tags: ["winter", "luxury", "warm"] },
  { name: "Lawn Print Hijab — Floral Paradise", category: "hijabs", subcategory: "Printed", price: 1400, material: "Lawn", sizes: ["free"], colors: [{ name: "Floral Multi", hex: "#E8B4B8" }], stock: 60, description: "Vibrant floral print on premium lawn fabric. Summer essential.", occasion: ["casual", "everyday"], isNewArrival: true, tags: ["printed", "summer", "floral"] },
  { name: "Solid Jersey Hijab — Navy", category: "hijabs", subcategory: "Solid", price: 1300, material: "Jersey", sizes: ["free"], colors: [{ name: "Navy", hex: "#000080" }, { name: "Charcoal", hex: "#36454F" }, { name: "Burgundy", hex: "#800020" }], stock: 70, description: "Stretchy jersey that never slips. The ultimate everyday hijab.", occasion: ["casual", "office", "everyday"], isBestseller: true, tags: ["jersey", "no-slip", "everyday"] },
  { name: "Luxury Silk Satin Hijab — Champagne", category: "hijabs", subcategory: "Silk", price: 2800, material: "Silk", sizes: ["free"], colors: [{ name: "Champagne", hex: "#F7E7CE" }], stock: 35, description: "Silk satin with a glossy finish. Perfect for special occasions.", occasion: ["formal", "bridal", "party"], isFeatured: true, tags: ["satin", "luxury", "bridal"] },
  { name: "Georgette Hijab — Mauve", category: "hijabs", subcategory: "Georgette", price: 1600, material: "Georgette", sizes: ["free"], colors: [{ name: "Mauve", hex: "#E0B0FF" }, { name: "Lilac", hex: "#C8A2C8" }], stock: 50, description: "Soft georgette in trending mauve shade.", occasion: ["casual", "office"], tags: ["trending", "soft"] },
  { name: "Cotton Voile Hijab — Terracotta", category: "hijabs", subcategory: "Solid", price: 1100, material: "Cotton", sizes: ["free"], colors: [{ name: "Terracotta", hex: "#E2725B" }], stock: 65, description: "Breathable cotton voile in a warm terracotta tone.", occasion: ["casual", "everyday"], tags: ["cotton", "breathable"] },
  { name: "Crinkle Chiffon Hijab — Blush", category: "hijabs", subcategory: "Crinkle", price: 1700, material: "Chiffon", sizes: ["free"], colors: [{ name: "Blush", hex: "#DE5D83" }], stock: 40, description: "Textured crinkle chiffon with beautiful movement.", occasion: ["casual", "party"], isNewArrival: true, tags: ["crinkle", "textured"] },
  { name: "Modal Hijab — Stone", category: "hijabs", subcategory: "Solid", price: 1900, material: "Cotton", sizes: ["free"], colors: [{ name: "Stone", hex: "#928E85" }, { name: "Taupe", hex: "#483C32" }], stock: 45, description: "Buttery soft modal fabric with excellent drape.", occasion: ["office", "casual"], tags: ["modal", "soft"] },
  { name: "Printed Chiffon Hijab — Abstract Art", category: "hijabs", subcategory: "Printed", price: 1600, material: "Chiffon", sizes: ["free"], colors: [{ name: "Multi", hex: "#D4A574" }], stock: 35, description: "Artistic abstract print on premium chiffon.", occasion: ["casual", "party"], tags: ["printed", "artistic"] },
  { name: "Lawn Hijab — Pastel Mint", category: "hijabs", subcategory: "Lawn", price: 1200, material: "Lawn", sizes: ["free"], colors: [{ name: "Mint", hex: "#98FF98" }], stock: 55, description: "Cool pastel mint lawn hijab. Perfect for summer.", occasion: ["casual", "everyday"], tags: ["summer", "pastel"] },
  { name: "Silk Hijab — Ruby Red", category: "hijabs", subcategory: "Silk", price: 3400, material: "Silk", sizes: ["free"], colors: [{ name: "Ruby Red", hex: "#9B111E" }], stock: 25, description: "Rich ruby red pure silk. A statement piece.", occasion: ["formal", "party"], isFeatured: true, tags: ["silk", "statement", "red"] },

  // ── Abayas (10 products) ──
  { name: "Classic Black Textured Abaya", category: "abayas", subcategory: "Textured", price: 6500, compareAtPrice: 7500, material: "Nida", sizes: ["52", "54", "56", "58"], colors: [{ name: "Black", hex: "#000000" }], stock: 30, description: "Timeless black abaya with subtle texture. A wardrobe essential.", occasion: ["everyday", "office"], isBestseller: true, tags: ["classic", "textured", "essential"] },
  { name: "Pleated Abaya — Charcoal", category: "abayas", subcategory: "Pleated", price: 7200, material: "Polyester", sizes: ["52", "54", "56"], colors: [{ name: "Charcoal", hex: "#36454F" }], stock: 25, description: "Elegant pleated design with a modern silhouette.", occasion: ["office", "formal"], isNewArrival: true, tags: ["pleated", "modern"] },
  { name: "Chiffon Layered Abaya — Dusty Pink", category: "abayas", subcategory: "Chiffon", price: 8200, material: "Chiffon", sizes: ["54", "56", "58"], colors: [{ name: "Dusty Pink", hex: "#D4A5A5" }], stock: 15, description: "Flowing chiffon layers over a solid inner. Perfect for events.", occasion: ["party", "formal"], isFeatured: true, tags: ["layered", "event", "elegant"] },
  { name: "Open Front Abaya — Olive", category: "abayas", subcategory: "Open", price: 5800, material: "Nida", sizes: ["52", "54", "56"], colors: [{ name: "Olive", hex: "#556B2F" }], stock: 40, description: "Versatile open-front design. Layer over any outfit.", occasion: ["casual", "office"], tags: ["open-front", "versatile"] },
  { name: "Gold Embroidered Abaya — Black", category: "abayas", subcategory: "Embroidered", price: 8500, compareAtPrice: 9500, material: "Nida", sizes: ["52", "54", "56", "58"], colors: [{ name: "Black/Gold", hex: "#000000" }], stock: 20, description: "Stunning gold thread embroidery on premium nida. Luxury redefined.", occasion: ["formal", "bridal", "party"], isFeatured: true, isBestseller: true, tags: ["embroidered", "luxury", "gold"] },
  { name: "Linear Design Abaya — Navy", category: "abayas", subcategory: "Linear", price: 6800, material: "Polyester", sizes: ["54", "56"], colors: [{ name: "Navy", hex: "#000080" }], stock: 30, description: "Clean linear panels for a contemporary look.", occasion: ["office", "everyday"], isNewArrival: true, tags: ["linear", "contemporary"] },
  { name: "Rose Embellished Abaya — Burgundy", category: "abayas", subcategory: "Rose", price: 7800, material: "Nida", sizes: ["52", "54", "56"], colors: [{ name: "Burgundy", hex: "#800020" }], stock: 18, description: "3D rose embellishments on a rich burgundy base.", occasion: ["formal", "party"], tags: ["rose", "embellished"] },
  { name: "Everyday Comfort Abaya — Black", category: "abayas", subcategory: "Textured", price: 5900, material: "Nida", sizes: ["52", "54", "56", "58"], colors: [{ name: "Black", hex: "#000000" }], stock: 50, description: "Simple, comfortable, and elegant. Your daily go-to.", occasion: ["everyday", "casual"], isBestseller: true, tags: ["comfort", "daily"] },
  { name: "Butterfly Sleeve Abaya — Taupe", category: "abayas", subcategory: "Open", price: 7500, material: "Chiffon", sizes: ["54", "56"], colors: [{ name: "Taupe", hex: "#483C32" }], stock: 22, description: "Dramatic butterfly sleeves in flowing chiffon.", occasion: ["party", "formal"], tags: ["butterfly", "statement"] },
  { name: "Minimalist Abaya — Stone Grey", category: "abayas", subcategory: "Linear", price: 6200, material: "Polyester", sizes: ["52", "54", "56"], colors: [{ name: "Stone Grey", hex: "#928E85" }], stock: 35, description: "Clean minimalist lines for the modern woman.", occasion: ["office", "casual"], isNewArrival: true, tags: ["minimalist", "modern"] },

  // ── Accessories (8 products) ──
  { name: "Gold Crystal Hijab Pin Set (6 pcs)", category: "accessories", subcategory: "Pins", price: 750, material: "Polyester", sizes: [], colors: [{ name: "Gold", hex: "#FFD700" }], stock: 100, description: "Set of 6 gold crystal pins. Essential for every hijabi.", occasion: ["everyday"], isBestseller: true, tags: ["pins", "essential", "gold"] },
  { name: "Pearl Brooch — Elegant Circle", category: "accessories", subcategory: "Brooches", price: 1200, material: "Polyester", sizes: [], colors: [{ name: "Gold/Pearl", hex: "#F5F5DC" }], stock: 60, description: "Elegant circular pearl brooch. Elevate any hijab look.", occasion: ["formal", "office"], tags: ["brooch", "pearl"] },
  { name: "Modest Crossbody Bag — Beige", category: "accessories", subcategory: "Bags", price: 2500, material: "Polyester", sizes: [], colors: [{ name: "Beige", hex: "#F5F5DC" }, { name: "Black", hex: "#000000" }], stock: 35, description: "Compact crossbody with enough room for essentials.", occasion: ["casual", "everyday"], isNewArrival: true, tags: ["bag", "crossbody"] },
  { name: "Minimalist Gold Scarf Ring", category: "accessories", subcategory: "Scarf Rings", price: 900, material: "Polyester", sizes: [], colors: [{ name: "Gold", hex: "#FFD700" }], stock: 80, description: "Sleek gold scarf ring. Simple and sophisticated.", occasion: ["everyday", "office"], tags: ["scarf-ring", "gold"] },
  { name: "Tassel Earrings — Rose Gold", category: "accessories", subcategory: "Jewelry", price: 1500, material: "Polyester", sizes: [], colors: [{ name: "Rose Gold", hex: "#B76E79" }], stock: 45, description: "Delicate rose gold tassel earrings.", occasion: ["party", "formal"], tags: ["earrings", "rose-gold"] },
  { name: "Magnetic Hijab Pin — Silver (4 pcs)", category: "accessories", subcategory: "Pins", price: 600, material: "Polyester", sizes: [], colors: [{ name: "Silver", hex: "#C0C0C0" }], stock: 120, description: "No-snag magnetic pins. Safe for delicate fabrics.", occasion: ["everyday"], tags: ["magnetic", "no-snag"] },
  { name: "Chain Brooch — Vintage Gold", category: "accessories", subcategory: "Brooches", price: 1800, material: "Polyester", sizes: [], colors: [{ name: "Antique Gold", hex: "#CFB53B" }], stock: 30, description: "Statement chain brooch with vintage appeal.", occasion: ["formal", "party"], isFeatured: true, tags: ["chain", "vintage"] },
  { name: "Elegant Clutch — Black Velvet", category: "accessories", subcategory: "Bags", price: 2200, material: "Polyester", sizes: [], colors: [{ name: "Black", hex: "#000000" }], stock: 25, description: "Luxe velvet clutch for formal occasions.", occasion: ["formal", "party"], tags: ["clutch", "velvet"] },

  // ── Jilbabs (4 products) ──
  { name: "Two-Piece Jilbab Set — Black", category: "jilbabs", price: 4500, material: "Nida", sizes: ["s", "m", "l", "xl"], colors: [{ name: "Black", hex: "#000000" }], stock: 40, description: "Classic two-piece jilbab with overhead khimar and skirt.", occasion: ["everyday", "formal"], isBestseller: true, tags: ["two-piece", "classic"] },
  { name: "French Jilbab — Dark Grey", category: "jilbabs", price: 5200, material: "Nida", sizes: ["s", "m", "l"], colors: [{ name: "Dark Grey", hex: "#4A4A4A" }], stock: 30, description: "Sleek French-cut jilbab with a modern fit.", occasion: ["office", "everyday"], isNewArrival: true, tags: ["french-cut", "modern"] },
  { name: "Lightweight Jilbab — Beige", category: "jilbabs", price: 4800, material: "Cotton", sizes: ["m", "l", "xl"], colors: [{ name: "Beige", hex: "#F5F5DC" }], stock: 25, description: "Breathable cotton jilbab for warm weather.", occasion: ["casual", "everyday"], tags: ["lightweight", "summer"] },
  { name: "Full Coverage Jilbab — Navy", category: "jilbabs", price: 5500, material: "Polyester", sizes: ["s", "m", "l", "xl"], colors: [{ name: "Navy", hex: "#000080" }], stock: 20, description: "Maximum coverage with an elegant drape.", occasion: ["formal", "everyday"], tags: ["full-coverage"] },

  // ── Prayer Wear (3 products) ──
  { name: "One-Piece Prayer Dress — White", category: "prayer-wear", price: 3200, material: "Cotton", sizes: ["free"], colors: [{ name: "White", hex: "#FFFFFF" }, { name: "Black", hex: "#000000" }], stock: 55, description: "Easy slip-on prayer dress. Full coverage, lightweight.", occasion: ["everyday"], isBestseller: true, tags: ["prayer", "easy", "slip-on"] },
  { name: "Prayer Set with Bag — Travel", category: "prayer-wear", price: 3800, material: "Polyester", sizes: ["free"], colors: [{ name: "Navy", hex: "#000080" }], stock: 35, description: "Complete prayer set with mat and carry bag. Perfect for travel.", occasion: ["everyday"], isNewArrival: true, tags: ["travel", "set", "portable"] },
  { name: "Luxury Prayer Garment — Sage", category: "prayer-wear", price: 4200, material: "Cotton", sizes: ["free"], colors: [{ name: "Sage", hex: "#9CAF88" }], stock: 30, description: "Premium cotton prayer garment in calming sage.", occasion: ["everyday"], tags: ["luxury", "cotton", "calming"] },

  // ── Innerwear (3 products) ──
  { name: "Cotton Underscarf Cap — Pack of 3", category: "innerwear", subcategory: "Underscarves", price: 900, material: "Cotton", sizes: ["free"], colors: [{ name: "Black/White/Nude", hex: "#000000" }], stock: 100, description: "Essential cotton undercaps. Keeps hijab in place all day.", occasion: ["everyday"], isBestseller: true, tags: ["underscarf", "essential", "pack"] },
  { name: "Full Neck Coverage Underscarf — Black", category: "innerwear", subcategory: "Underscarves", price: 700, material: "Cotton", sizes: ["free"], colors: [{ name: "Black", hex: "#000000" }, { name: "Nude", hex: "#E3BC9A" }], stock: 80, description: "Extended coverage underscarf for full neck coverage.", occasion: ["everyday"], tags: ["full-coverage", "neck"] },
  { name: "Arm Sleeves — Pack of 2", category: "innerwear", subcategory: "Sleeves", price: 800, material: "Cotton", sizes: ["free"], colors: [{ name: "Black", hex: "#000000" }, { name: "White", hex: "#FFFFFF" }], stock: 70, description: "Stretchy arm sleeves for modest coverage under short sleeves.", occasion: ["everyday", "casual"], tags: ["sleeves", "coverage"] },

  // ── Kids Modest (3 products) ──
  { name: "Kids Hijab — Cotton Pink", category: "kids-modest", price: 800, material: "Cotton", sizes: ["xs", "s", "m"], colors: [{ name: "Pink", hex: "#FFB6C1" }, { name: "Lilac", hex: "#C8A2C8" }], stock: 50, description: "Soft cotton hijab sized for children. Ages 4-12.", occasion: ["everyday"], isNewArrival: true, tags: ["kids", "cotton", "soft"] },
  { name: "Kids Prayer Set — White", category: "kids-modest", price: 2200, material: "Cotton", sizes: ["xs", "s"], colors: [{ name: "White", hex: "#FFFFFF" }], stock: 35, description: "Complete prayer set for little ones. Includes dress and cap.", occasion: ["everyday"], tags: ["kids", "prayer", "set"] },
  { name: "Girls Abaya — Navy Blue", category: "kids-modest", price: 3500, material: "Polyester", sizes: ["xs", "s", "m"], colors: [{ name: "Navy", hex: "#000080" }], stock: 25, description: "Stylish navy abaya for girls. Ages 6-14.", occasion: ["formal", "everyday"], tags: ["kids", "abaya", "girls"] },
];


// ─── Seed Logic ──────────────────────────────────────────────────────
async function seed() {
  console.log("🌱 Starting seed...\n");

  // 1. Create top-level categories
  console.log("📁 Creating categories...");
  const categoryMap: Record<string, string> = {};

  for (const cat of categories) {
    const doc = await client.createOrReplace({
      _id: `category-${cat.slug}`,
      _type: "category",
      name: cat.name,
      slug: { _type: "slug", current: cat.slug },
      description: `Shop our ${cat.name.toLowerCase()} collection`,
      order: cat.order,
    });
    categoryMap[cat.slug] = doc._id;
    console.log(`  ✓ ${cat.name}`);
  }

  // 2. Create subcategories
  console.log("\n📁 Creating subcategories...");
  const subMap: Record<string, string> = {};

  for (const [parent, subs] of Object.entries(subcategories)) {
    for (const sub of subs) {
      const slug = sub.toLowerCase().replace(/\s+/g, "-");
      const doc = await client.createOrReplace({
        _id: `subcategory-${slug}`,
        _type: "category",
        name: sub,
        slug: { _type: "slug", current: slug },
        parent: { _type: "reference", _ref: categoryMap[parent] },
        order: 0,
      });
      subMap[slug] = doc._id;
      console.log(`  ✓ ${sub} (sub of ${parent})`);
    }
  }

  // 3. Create products
  console.log(`\n📦 Creating ${products.length} products...`);
  let count = 0;

  for (const p of products) {
    const slug = p.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80);

    const sku = `MS-${p.category.slice(0, 3).toUpperCase()}-${String(count + 1).padStart(3, "0")}`;

    const subSlug = p.subcategory?.toLowerCase().replace(/\s+/g, "-");

    await client.create({
      _type: "product",
      name: p.name,
      slug: { _type: "slug", current: slug },
      description: p.description,
      price: p.price,
      compareAtPrice: p.compareAtPrice || undefined,
      category: { _type: "reference", _ref: categoryMap[p.category] },
      subcategory: subSlug && subMap[subSlug]
        ? { _type: "reference", _ref: subMap[subSlug] }
        : undefined,
      sizes: p.sizes,
      colors: p.colors,
      material: p.material,
      occasion: p.occasion,
      stock: p.stock,
      sku,
      isFeatured: p.isFeatured || false,
      isBestseller: p.isBestseller || false,
      isNewArrival: p.isNewArrival || false,
      rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
      reviewCount: Math.floor(Math.random() * 50) + 5,
      tags: p.tags,
      // Note: images need to be uploaded via Sanity Studio or API
      // This seed creates products without images — upload via Studio
    });
    count++;
    console.log(`  ✓ [${count}/${products.length}] ${p.name} — PKR ${p.price}`);
  }

  // 4. Create hero banner
  console.log("\n🖼️  Creating hero banner...");
  await client.createOrReplace({
    _id: "banner-hero-1",
    _type: "banner",
    title: "Modest Fashion, Elevated",
    subtitle: "Discover our curated collection of premium hijabs, abayas & modest wear crafted for the modern woman.",
    buttonText: "Shop Now",
    link: "/products",
    isActive: true,
    placement: "hero",
    order: 1,
  });
  console.log("  ✓ Hero banner created");

  // 5. Create site settings
  console.log("\n⚙️  Creating site settings...");
  await client.createOrReplace({
    _id: "siteSettings",
    _type: "siteSettings",
    siteName: "ModestStyle.pk",
    tagline: "Elegance in Every Drape",
    freeShippingThreshold: 5000,
    announcement: "FREE SHIPPING on orders over PKR 5,000 | New Arrivals Weekly",
    socialLinks: {
      instagram: "https://instagram.com/modeststyle.pk",
      facebook: "https://facebook.com/modeststyle.pk",
      whatsapp: "+923001234567",
    },
  });
  console.log("  ✓ Site settings created");

  console.log(`\n✅ Seed complete! Created:`);
  console.log(`   ${categories.length} categories`);
  console.log(`   ${Object.values(subcategories).flat().length} subcategories`);
  console.log(`   ${products.length} products`);
  console.log(`   1 hero banner`);
  console.log(`   1 site settings document`);
  console.log(`\n💡 Upload product images via Sanity Studio at /production`);
}

seed().catch(console.error);
