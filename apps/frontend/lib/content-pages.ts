/**
 * Admin-editable content pages (About, FAQs, policies, size guide…).
 * Shared by the storefront renderer, the admin editor (client) and server-side validation.
 *
 * Text may contain tokens that are filled from Admin → Settings at render time:
 *   {whatsapp} {email} {freeShipping} {standardShipping} {expressShipping} {codFee}
 */

export const PAGE_SLUGS = ["about", "faqs", "shipping", "returns", "size-guide", "privacy", "terms"] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

export const PAGE_LABELS: Record<PageSlug, string> = {
  about: "About Us",
  faqs: "FAQs",
  shipping: "Shipping Policy",
  returns: "Returns & Exchange",
  "size-guide": "Size Guide",
  privacy: "Privacy Policy",
  terms: "Terms of Service",
};

export function isPageSlug(s: string): s is PageSlug {
  return (PAGE_SLUGS as readonly string[]).includes(s);
}

// ─── Block specs (drive both the admin form and sanitising) ──────────

type FieldKind = "text" | "textarea" | "lines" | "select" | "rows" | "table";

export interface FieldSpec {
  key: string;
  label: string;
  kind: FieldKind;
  max?: number;
  options?: { value: string; label: string }[];
  /** For kind "rows": the fields of each row. */
  rowFields?: FieldSpec[];
  placeholder?: string;
}

export interface BlockSpec {
  label: string;
  hint: string;
  fields: FieldSpec[];
}

const TONES = [
  { value: "default", label: "Plain" },
  { value: "gold", label: "Gold highlight" },
  { value: "good", label: "Green (yes / allowed)" },
  { value: "bad", label: "Red (no / not allowed)" },
  { value: "amber", label: "Amber (important note)" },
];

export const BLOCK_SPECS: Record<string, BlockSpec> = {
  text: {
    label: "Text",
    hint: "Heading with paragraphs. Leave an empty line between paragraphs.",
    fields: [
      { key: "eyebrow", label: "Small label above heading (optional)", kind: "text", max: 60 },
      { key: "heading", label: "Heading", kind: "text", max: 150 },
      { key: "body", label: "Text", kind: "textarea", max: 5000 },
    ],
  },
  list: {
    label: "Bullet list",
    hint: "One point per line.",
    fields: [
      { key: "heading", label: "Heading", kind: "text", max: 150 },
      { key: "tone", label: "Style", kind: "select", options: TONES },
      { key: "items", label: "Points (one per line)", kind: "lines", max: 600 },
    ],
  },
  cards: {
    label: "Cards",
    hint: "Small boxes with an emoji, title and short text — e.g. delivery times or values.",
    fields: [
      { key: "eyebrow", label: "Small label above heading (optional)", kind: "text", max: 60 },
      { key: "heading", label: "Heading", kind: "text", max: 150 },
      {
        key: "items",
        label: "Cards",
        kind: "rows",
        rowFields: [
          { key: "icon", label: "Emoji", kind: "text", max: 8, placeholder: "🚚" },
          { key: "title", label: "Title", kind: "text", max: 80 },
          { key: "text", label: "Text", kind: "text", max: 300 },
        ],
      },
    ],
  },
  steps: {
    label: "Numbered steps",
    hint: "A how-it-works sequence. Numbers are added automatically.",
    fields: [
      { key: "heading", label: "Heading", kind: "text", max: 150 },
      {
        key: "items",
        label: "Steps",
        kind: "rows",
        rowFields: [
          { key: "title", label: "Step title", kind: "text", max: 80 },
          { key: "text", label: "Description", kind: "text", max: 400 },
        ],
      },
    ],
  },
  table: {
    label: "Table",
    hint: "e.g. size charts or refund timelines.",
    fields: [
      { key: "heading", label: "Heading", kind: "text", max: 150 },
      { key: "table", label: "Table", kind: "table" },
      { key: "note", label: "Small note under the table (optional)", kind: "text", max: 300 },
    ],
  },
  stats: {
    label: "Numbers band",
    hint: "Big numbers on a dark strip, e.g. 5,000+ Happy Customers.",
    fields: [
      {
        key: "items",
        label: "Numbers",
        kind: "rows",
        rowFields: [
          { key: "value", label: "Number", kind: "text", max: 20, placeholder: "5,000+" },
          { key: "label", label: "Label", kind: "text", max: 60, placeholder: "Happy Customers" },
        ],
      },
    ],
  },
  callout: {
    label: "Highlighted note",
    hint: "A coloured box for an important message.",
    fields: [
      { key: "tone", label: "Style", kind: "select", options: TONES },
      { key: "heading", label: "Heading (optional)", kind: "text", max: 150 },
      { key: "body", label: "Text", kind: "textarea", max: 2000 },
    ],
  },
  faq: {
    label: "FAQ group",
    hint: "Questions customers can tap to open.",
    fields: [
      { key: "heading", label: "Group name", kind: "text", max: 100 },
      {
        key: "items",
        label: "Questions",
        kind: "rows",
        rowFields: [
          { key: "q", label: "Question", kind: "text", max: 200 },
          { key: "a", label: "Answer", kind: "textarea", max: 1500 },
        ],
      },
    ],
  },
  shippingFees: {
    label: "Shipping charges table",
    hint: "Shows your current shipping charges from Settings automatically.",
    fields: [{ key: "heading", label: "Heading", kind: "text", max: 150 }],
  },
  cta: {
    label: "Button",
    hint: "A call-to-action with a button.",
    fields: [
      { key: "heading", label: "Heading", kind: "text", max: 150 },
      { key: "body", label: "Text (optional)", kind: "text", max: 300 },
      { key: "buttonLabel", label: "Button text", kind: "text", max: 40 },
      { key: "href", label: "Button link (e.g. /products or /contact)", kind: "text", max: 200 },
    ],
  },
};

// ─── Types ───────────────────────────────────────────────────────────

/** A block is a loose record: `type` plus the fields its spec defines. */
export type Block = { type: string; [key: string]: unknown };

export interface PageContent {
  title: string;
  eyebrow: string;
  subtitle: string;
  blocks: Block[];
}

export interface TableValue {
  columns: string[];
  rows: string[][];
}

// ─── Sanitising (server uses this on save; renderer on read) ─────────

const clip = (v: unknown, max = 500) => String(v ?? "").trim().slice(0, max);

function cleanField(spec: FieldSpec, value: unknown): unknown {
  switch (spec.kind) {
    case "text":
    case "textarea":
      return clip(value, spec.max ?? (spec.kind === "text" ? 300 : 5000));
    case "select":
      return spec.options?.some((o) => o.value === value) ? value : spec.options?.[0]?.value;
    case "lines": {
      const lines = Array.isArray(value) ? value : String(value ?? "").split("\n");
      return lines.map((l) => clip(l, spec.max ?? 600)).filter(Boolean).slice(0, 60);
    }
    case "rows":
      return (Array.isArray(value) ? value : [])
        .slice(0, 60)
        .map((row) => Object.fromEntries((spec.rowFields || []).map((f) => [f.key, cleanField(f, (row as Record<string, unknown>)?.[f.key])])))
        .filter((row) => Object.values(row).some((v) => v));
    case "table": {
      const t = (value || {}) as Partial<TableValue>;
      const columns = (Array.isArray(t.columns) ? t.columns : []).map((c) => clip(c, 60)).filter(Boolean).slice(0, 8);
      const rows = (Array.isArray(t.rows) ? t.rows : [])
        .slice(0, 50)
        .map((r) => (Array.isArray(r) ? r : []).slice(0, columns.length).map((c) => clip(c, 120)))
        .filter((r) => r.some(Boolean));
      return { columns, rows };
    }
  }
}

export function sanitizePage(input: unknown): PageContent {
  const p = (input || {}) as Partial<PageContent>;
  const blocks = (Array.isArray(p.blocks) ? p.blocks : [])
    .filter((b): b is Block => !!b && typeof b === "object" && typeof (b as Block).type === "string" && !!BLOCK_SPECS[(b as Block).type])
    .slice(0, 40)
    .map((b) => {
      const spec = BLOCK_SPECS[b.type];
      return { type: b.type, ...Object.fromEntries(spec.fields.map((f) => [f.key, cleanField(f, b[f.key])])) } as Block;
    });
  return {
    title: clip(p.title, 120),
    eyebrow: clip(p.eyebrow, 60),
    subtitle: clip(p.subtitle, 300),
    blocks,
  };
}

export function emptyBlock(type: string): Block {
  const spec = BLOCK_SPECS[type];
  return sanitizePage({ blocks: [{ type, ...Object.fromEntries(spec.fields.map((f) => [f.key, f.kind === "table" ? { columns: ["Column 1", "Column 2"], rows: [["", ""]] } : undefined])) }] }).blocks[0];
}

// ─── Tokens ──────────────────────────────────────────────────────────

export interface TokenValues {
  whatsapp: string;
  email: string;
  freeShipping: string;
  standardShipping: string;
  expressShipping: string;
  codFee: string;
}

export function fillTokens(text: string, t: TokenValues) {
  return text.replace(/\{(whatsapp|email|freeShipping|standardShipping|expressShipping|codFee)\}/g, (_, k: keyof TokenValues) => t[k]);
}

// ─── Defaults (the original site copy) ───────────────────────────────

export const DEFAULT_PAGES: Record<PageSlug, PageContent> = {
  about: {
    eyebrow: "Our Story",
    title: "About ModestStyle.pk",
    subtitle: "Pakistan's finest destination for elegant modest fashion — where faith meets style.",
    blocks: [
      {
        type: "text",
        eyebrow: "Our Mission",
        heading: "Elegance in Every Drape",
        body: "At ModestStyle.pk, we believe that modest fashion is not a limitation — it is an expression of grace, identity, and confidence. Founded in Lahore, we curate premium hijabs, abayas, and modest wear that blend timeless elegance with everyday comfort. Every piece in our collection is thoughtfully selected to celebrate the modern Pakistani woman.",
      },
      {
        type: "cards",
        eyebrow: "What We Stand For",
        heading: "Our Values",
        items: [
          { icon: "✦", title: "Quality First", text: "Every fabric is tested for durability, softness, and colour-fastness before it reaches you." },
          { icon: "🤍", title: "Modest & Stylish", text: "We prove that modesty and style are not opposites — they are the perfect pair." },
          { icon: "🇵🇰", title: "Made in Pakistan", text: "We proudly work with local artisans and manufacturers to support Pakistani craftsmanship." },
          { icon: "💛", title: "Customer Obsessed", text: "From packaging to after-sales support, we go the extra mile for every customer." },
        ],
      },
      {
        type: "text",
        eyebrow: "How It Started",
        heading: "Born from a Passion for Modest Fashion",
        body: "ModestStyle.pk was founded by a group of passionate women who were frustrated by the lack of high-quality modest fashion options in Pakistan. Shopping for elegant hijabs and abayas meant either settling for poor quality or paying exorbitant prices for imported pieces.\n\nWe decided to change that. Starting from a small studio in Lahore, we began sourcing the finest fabrics — georgette, chiffon, crepe, and luxury cashmere — and working with skilled local tailors to create modest wear that Pakistani women truly deserve.\n\nToday, we ship across Pakistan, serving thousands of happy customers who trust us for their everyday modest wear, special occasions, and everything in between.",
      },
      {
        type: "stats",
        items: [
          { value: "5,000+", label: "Happy Customers" },
          { value: "200+", label: "Products" },
          { value: "50+", label: "Cities Served" },
          { value: "4.8★", label: "Average Rating" },
        ],
      },
      {
        type: "cta",
        heading: "Explore Our Collection",
        body: "Discover hijabs, abayas & accessories curated just for you",
        buttonLabel: "Shop Now",
        href: "/products",
      },
    ],
  },

  faqs: {
    eyebrow: "",
    title: "Frequently Asked Questions",
    subtitle: "Everything you need to know about shopping with us",
    blocks: [
      {
        type: "faq",
        heading: "Orders & Shopping",
        items: [
          { q: "How do I place an order?", a: "Browse our collection, add items to your cart, then proceed to checkout. You can pay with Cash on Delivery." },
          { q: "Can I modify or cancel my order?", a: "You can cancel or modify your order within 2 hours of placing it. Contact us immediately on WhatsApp at {whatsapp}." },
          { q: "Do I need an account to order?", a: "No, you can checkout as a guest. However, creating an account lets you track orders and save your address for faster checkout." },
          { q: "How do I confirm my order?", a: "After you order, our team confirms it with you on WhatsApp or by phone before dispatch." },
        ],
      },
      {
        type: "faq",
        heading: "Shipping & Delivery",
        items: [
          { q: "How long does delivery take?", a: "Lahore: 1–2 days. Karachi/Islamabad: 2–3 days. Other cities: 3–5 days. Orders placed before 2 PM are dispatched the same day (Mon–Sat)." },
          { q: "How much does shipping cost?", a: "Standard shipping is {standardShipping} for orders under {freeShipping}. Orders of {freeShipping} or more get FREE standard shipping nationwide. Cash on Delivery has a {codFee} fee." },
          { q: "Do you deliver on Sundays?", a: "Our courier partners (TCS, Leopards) deliver Mon–Sat. Sunday deliveries are not available." },
          { q: "Can I track my order?", a: "Yes! Once your order is dispatched, you'll receive an SMS with a tracking number from our courier partner." },
        ],
      },
      {
        type: "faq",
        heading: "Returns & Exchanges",
        items: [
          { q: "What is your return policy?", a: "We accept returns within 7 days of delivery for unused items with original tags and packaging intact." },
          { q: "How do I return an item?", a: "Contact us on WhatsApp at {whatsapp} or email {email} with your order number. We'll guide you through the return process." },
          { q: "Can I exchange for a different size?", a: "Yes! Exchanges for a different size or color are available within 7 days. The exchanged item is dispatched once we receive your return." },
          { q: "Are sale items returnable?", a: "No, all sale and discounted items are final sale and cannot be returned or exchanged." },
        ],
      },
      {
        type: "faq",
        heading: "Products",
        items: [
          { q: "Are your fabrics true to the photos?", a: "We strive to represent colors accurately. Slight variations may occur due to screen settings. Contact us if you'd like fabric samples for large orders." },
          { q: "How should I wash my hijab/abaya?", a: "We recommend hand washing in cold water with mild detergent, or gentle machine wash. Avoid tumble drying. Iron on low heat with a cloth barrier." },
          { q: "Do you restock sold-out items?", a: "Yes! Message us on WhatsApp or subscribe to our newsletter to be notified when items are restocked." },
          { q: "Do you offer wholesale or bulk orders?", a: "Yes, we offer wholesale pricing for retailers and bulk buyers. Contact us at {email} for pricing." },
        ],
      },
      {
        type: "cta",
        heading: "Still have questions?",
        body: "Our team is happy to help you",
        buttonLabel: "Contact Us",
        href: "/contact",
      },
    ],
  },

  shipping: {
    eyebrow: "",
    title: "Shipping Policy",
    subtitle: "Fast, reliable delivery across Pakistan",
    blocks: [
      {
        type: "cards",
        heading: "Delivery Timeframes",
        items: [
          { icon: "🚀", title: "Lahore", text: "1–2 Days" },
          { icon: "📦", title: "Karachi / Islamabad", text: "2–3 Days" },
          { icon: "🚚", title: "Other Cities", text: "3–5 Days" },
        ],
      },
      { type: "shippingFees", heading: "Shipping Charges" },
      {
        type: "steps",
        heading: "How It Works",
        items: [
          { title: "Place Your Order", text: "Order before 2 PM for same-day dispatch (Mon–Sat)." },
          { title: "We Pack With Care", text: "Each item is carefully packaged in our signature ModestStyle wrapping." },
          { title: "Courier Pickup", text: "Our trusted courier partners (TCS, Leopards) collect and scan your parcel." },
          { title: "Delivered to You", text: "You receive an SMS with tracking info once your parcel is on its way." },
        ],
      },
      {
        type: "list",
        heading: "Important Notes",
        tone: "amber",
        items: [
          "Orders are processed Mon–Sat, excluding public holidays.",
          "Delivery times may vary during Eid, sale seasons & extreme weather.",
          "We currently ship within Pakistan only.",
          "Contact us within 24 hours if your order hasn't arrived on time.",
        ],
      },
    ],
  },

  returns: {
    eyebrow: "",
    title: "Returns & Exchange",
    subtitle: "Hassle-free returns within 7 days",
    blocks: [
      {
        type: "cards",
        heading: "",
        items: [
          { icon: "📅", title: "7-Day Returns", text: "Return any item within 7 days of delivery" },
          { icon: "🔄", title: "Easy Exchange", text: "Swap for a different size or color" },
          { icon: "💳", title: "Full Refund", text: "Store credit or original payment method" },
        ],
      },
      {
        type: "list",
        heading: "✅ Eligible for Return",
        tone: "good",
        items: ["Unused, unworn items", "Original tags attached", "Original packaging intact", "Returned within 7 days", "Defective or damaged items", "Wrong item received"],
      },
      {
        type: "list",
        heading: "❌ Not Eligible for Return",
        tone: "bad",
        items: ["Worn or washed items", "Tags removed", "After 7 days of delivery", "Sale / discounted items", "Accessories (pins, jewelry)", "Custom/personalized orders"],
      },
      {
        type: "steps",
        heading: "How to Return",
        items: [
          { title: "Contact Us", text: "WhatsApp us at {whatsapp} or email {email} with your order number and reason for return." },
          { title: "Get Approval", text: "We'll review and send you a return approval within 24 hours." },
          { title: "Ship It Back", text: "Pack the item securely and send it via your preferred courier to our Lahore address. Return shipping cost is your responsibility unless the item is defective." },
          { title: "Get Refunded", text: "Once we receive and inspect the item, your refund or exchange is processed within 3–5 business days." },
        ],
      },
      {
        type: "table",
        heading: "Refund Methods",
        table: {
          columns: ["Method", "Timeline"],
          rows: [
            ["Store Credit", "Instant"],
            ["JazzCash / EasyPaisa", "1–2 business days"],
            ["Bank Transfer", "3–5 business days"],
          ],
        },
        note: "",
      },
      { type: "cta", heading: "Still have questions?", body: "", buttonLabel: "Contact Support", href: "/contact" },
    ],
  },

  "size-guide": {
    eyebrow: "",
    title: "Size Guide",
    subtitle: "Find your perfect fit",
    blocks: [
      {
        type: "cards",
        heading: "How to Measure",
        items: [
          { icon: "📏", title: "Chest", text: "Measure around the fullest part of your chest, keeping the tape parallel to the floor." },
          { icon: "📐", title: "Waist", text: "Measure around your natural waistline, at the narrowest part of your torso." },
          { icon: "📌", title: "Length", text: "Measure from the back of your neck to the desired garment length." },
        ],
      },
      {
        type: "table",
        heading: "Hijab Sizes",
        table: {
          columns: ["Style", "Dimensions", "Best For"],
          rows: [
            ["Square Hijab", "110 × 110 cm", "Classic styles, turban looks"],
            ["Rectangular Shawl", "70 × 180 cm", "Draping, layered styles"],
            ["Chiffon Dupatta", "100 × 200 cm", "Modest draping, formal events"],
            ["Georgette Panel", "60 × 175 cm", "Everyday wear, easy styling"],
          ],
        },
        note: "",
      },
      {
        type: "table",
        heading: "Abaya Sizes",
        table: {
          columns: ["Size", "Chest (cm)", "Waist (cm)", "Length (cm)", "Height"],
          rows: [
            ["XS", "82–86", "68–72", "140", "5'0\"–5'2\""],
            ["S", "86–90", "72–76", "144", "5'2\"–5'4\""],
            ["M", "90–96", "76–82", "148", "5'4\"–5'6\""],
            ["L", "96–102", "82–88", "150", "5'5\"–5'7\""],
            ["XL", "102–110", "88–96", "152", "5'6\"–5'8\""],
            ["XXL", "110–118", "96–104", "154", "5'7\"–5'9\""],
          ],
        },
        note: "* All measurements are in centimetres. For the best fit, go up one size if you're between sizes.",
      },
      {
        type: "list",
        heading: "Fit Tips from Our Stylists",
        tone: "gold",
        items: [
          "If you're between sizes, choose the larger size for a more comfortable, modest fit.",
          "Chiffon and georgette hijabs drape beautifully when 10–15 cm longer than your usual preference.",
          "For abayas, measure your height while standing straight without shoes.",
          "Not sure? Contact our styling team on WhatsApp at {whatsapp} — we're happy to help!",
        ],
      },
    ],
  },

  privacy: {
    eyebrow: "",
    title: "Privacy Policy",
    subtitle: "Last updated: February 2026",
    blocks: [
      {
        type: "callout",
        tone: "gold",
        heading: "",
        body: "Your privacy matters to us. This policy explains what data we collect, how we use it, and how we protect it. By using ModestStyle.pk, you agree to this policy.",
      },
      {
        type: "list",
        heading: "1. Information We Collect",
        tone: "default",
        items: [
          "Personal Information: Name, email address, phone number, and shipping address when you place an order or create an account.",
          "Payment Information: We do not store card or wallet details. Online payments, when offered, are processed securely by our payment partners.",
          "Usage Data: Pages visited, products viewed, time spent on site, and browser/device information via analytics tools.",
          "Communications: Messages you send us via contact forms, WhatsApp, or email.",
        ],
      },
      {
        type: "list",
        heading: "2. How We Use Your Information",
        tone: "default",
        items: [
          "To process and fulfil your orders.",
          "To send order confirmations, shipping updates, and delivery notifications.",
          "To respond to your inquiries and provide customer support.",
          "To send promotional emails and WhatsApp offers if you opted in (you can opt out anytime).",
          "To improve our website, products, and services.",
          "To prevent fraud and ensure platform security.",
        ],
      },
      {
        type: "list",
        heading: "3. Information Sharing",
        tone: "default",
        items: [
          "Courier Partners (TCS, Leopards, etc.): We share your name, address, and phone number to deliver your orders.",
          "Payment Partners: Transaction data is shared with payment providers only to process payments.",
          "Analytics: We use anonymised data for Google Analytics.",
          "We never sell your personal data to third parties.",
        ],
      },
      {
        type: "list",
        heading: "4. Data Security",
        tone: "default",
        items: [
          "We use SSL/TLS encryption for all data transmitted between your browser and our servers.",
          "Access to your personal data is restricted to authorised team members only.",
          "We retain your data only as long as necessary to fulfil orders and comply with legal obligations.",
        ],
      },
      {
        type: "list",
        heading: "5. Your Rights",
        tone: "default",
        items: [
          "Access: You can request a copy of the personal data we hold about you.",
          "Correction: You can update your account information at any time.",
          "Deletion: You can request deletion of your account and associated data.",
          "Opt-Out: Unsubscribe from marketing emails via the unsubscribe link, or reply STOP on WhatsApp.",
          "To exercise any of these rights, contact us at {email}.",
        ],
      },
      {
        type: "list",
        heading: "6. Cookies",
        tone: "default",
        items: [
          "We use cookies to maintain your session, remember your cart, and analyse site traffic.",
          "You can disable cookies in your browser settings, but some site features may not work correctly.",
        ],
      },
      {
        type: "list",
        heading: "7. Children's Privacy",
        tone: "default",
        items: ["ModestStyle.pk is not intended for children under 13. We do not knowingly collect data from children."],
      },
      {
        type: "list",
        heading: "8. Changes to This Policy",
        tone: "default",
        items: ["We may update this policy from time to time. We will notify you of significant changes via email or a notice on our website."],
      },
      {
        type: "list",
        heading: "9. Contact Us",
        tone: "default",
        items: ["For any privacy-related questions, contact us at {email} or WhatsApp {whatsapp}."],
      },
    ],
  },

  terms: {
    eyebrow: "",
    title: "Terms of Service",
    subtitle: "Last updated: February 2026",
    blocks: [
      {
        type: "callout",
        tone: "gold",
        heading: "",
        body: "By accessing or using ModestStyle.pk, you agree to be bound by these Terms of Service. Please read them carefully before placing an order or using our services.",
      },
      { type: "text", eyebrow: "", heading: "1. Acceptance of Terms", body: "By browsing our website, creating an account, or placing an order, you confirm that you have read, understood, and agree to these Terms of Service and our Privacy Policy." },
      { type: "text", eyebrow: "", heading: "2. Products & Pricing", body: "All prices are listed in Pakistani Rupees (PKR) and are inclusive of applicable taxes. We reserve the right to change prices at any time. In the event of a pricing error, we will notify you and give you the option to confirm or cancel your order. Product images are for illustrative purposes — slight colour variations may occur due to screen settings." },
      { type: "text", eyebrow: "", heading: "3. Orders & Payment", body: "Orders are confirmed once our team verifies them with you (for Cash on Delivery) or once payment is received. We reserve the right to refuse or cancel any order at our discretion. For COD orders, a non-refundable advance may be required for high-value orders. Cash on Delivery carries a {codFee} fee." },
      { type: "text", eyebrow: "", heading: "4. Shipping & Delivery", body: "We ship within Pakistan only. Delivery timelines are estimates and may vary due to courier delays, public holidays, or unforeseen circumstances. ModestStyle.pk is not liable for delays caused by courier partners. Risk of loss passes to you upon delivery to the courier." },
      { type: "text", eyebrow: "", heading: "5. Returns & Exchanges", body: "Returns are accepted within 7 days of delivery for unused items in original condition. Sale items, accessories, and custom orders are non-returnable. Refer to our Returns & Exchange Policy for full details. Refunds are processed via the original payment method or as store credit." },
      { type: "text", eyebrow: "", heading: "6. User Accounts", body: "You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorised use of your account. We reserve the right to suspend or terminate accounts that violate these terms." },
      { type: "text", eyebrow: "", heading: "7. Intellectual Property", body: "All content on ModestStyle.pk — including images, text, logos, and design — is the property of ModestStyle.pk and is protected by Pakistani and international copyright laws. You may not reproduce, distribute, or use our content without express written permission." },
      { type: "text", eyebrow: "", heading: "8. Prohibited Activities", body: "You agree not to: use our site for any unlawful purpose, attempt to gain unauthorised access to our systems, submit false or misleading information, or interfere with the proper operation of our platform." },
      { type: "text", eyebrow: "", heading: "9. Limitation of Liability", body: "ModestStyle.pk is not liable for indirect, incidental, or consequential damages arising from the use of our products or services. Our maximum liability to you will not exceed the amount paid for the specific order in question." },
      { type: "text", eyebrow: "", heading: "10. Governing Law", body: "These Terms are governed by the laws of the Islamic Republic of Pakistan. Any disputes shall be subject to the exclusive jurisdiction of the courts of Lahore, Punjab." },
      { type: "text", eyebrow: "", heading: "11. Changes to Terms", body: "We reserve the right to update these Terms at any time. Continued use of our site after changes constitutes acceptance of the new Terms. We will notify you of material changes via email." },
      { type: "text", eyebrow: "", heading: "12. Contact", body: "For questions about these Terms, contact us at {email} or WhatsApp {whatsapp}." },
    ],
  },
};
