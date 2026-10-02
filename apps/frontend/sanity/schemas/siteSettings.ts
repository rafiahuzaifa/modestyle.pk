import { defineArrayMember, defineField, defineType } from "sanity";

/** Single store-wide settings document (_id "siteSettings"), edited from /admin/settings. */
export const siteSettings = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "siteName",
      title: "Site Name",
      type: "string",
      initialValue: "ModestStyle.pk",
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
      initialValue: "Elegance in Every Drape",
    }),
    defineField({
      name: "announcement",
      title: "Announcement Bar Text",
      type: "string",
    }),
    defineField({
      name: "supportEmail",
      title: "Support Email",
      type: "string",
    }),
    defineField({
      name: "freeShippingThreshold",
      title: "Free Shipping Threshold (PKR)",
      type: "number",
      initialValue: 5000,
    }),
    defineField({
      name: "standardShipping",
      title: "Standard Shipping (PKR)",
      type: "number",
      initialValue: 250,
    }),
    defineField({
      name: "expressShipping",
      title: "Express Shipping (PKR)",
      type: "number",
      initialValue: 500,
    }),
    defineField({
      name: "codFee",
      title: "Cash on Delivery Fee (PKR)",
      type: "number",
      initialValue: 200,
    }),
    defineField({
      name: "promoCodes",
      title: "Promo Codes",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            { name: "code", type: "string", title: "Code" },
            { name: "percent", type: "number", title: "Discount %" },
            { name: "active", type: "boolean", title: "Active", initialValue: true },
          ],
          preview: { select: { title: "code", subtitle: "percent" } },
        }),
      ],
    }),
    defineField({
      name: "popupPromoCode",
      title: "Discount Popup Code",
      type: "string",
      initialValue: "WELCOME10",
    }),
    defineField({
      name: "cartRecoveryCode",
      title: "Abandoned Cart Code",
      type: "string",
      initialValue: "WELCOME10",
    }),
    defineField({
      name: "socialLinks",
      title: "Social Links",
      type: "object",
      fields: [
        { name: "instagram", type: "url", title: "Instagram" },
        { name: "facebook", type: "url", title: "Facebook" },
        { name: "tiktok", type: "url", title: "TikTok" },
        { name: "whatsapp", type: "string", title: "WhatsApp Number" },
      ],
    }),
  ],
});
