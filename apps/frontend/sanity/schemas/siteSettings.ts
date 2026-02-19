import { defineField, defineType } from "sanity";

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
      name: "freeShippingThreshold",
      title: "Free Shipping Threshold (PKR)",
      type: "number",
      initialValue: 5000,
    }),
    defineField({
      name: "announcement",
      title: "Announcement Bar Text",
      type: "string",
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
