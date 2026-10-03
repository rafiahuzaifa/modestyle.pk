import { defineField, defineType } from "sanity";

/** Storefront content page (About, FAQs, policies…). Edited from /admin/pages;
 * `data` holds the page's blocks as JSON (see lib/content-pages.ts). */
export const contentPage = defineType({
  name: "contentPage",
  title: "Content Page",
  type: "document",
  fields: [
    defineField({ name: "slug", title: "Page", type: "string", readOnly: true }),
    defineField({
      name: "data",
      title: "Content (JSON — edit in the admin panel)",
      type: "text",
      readOnly: true,
    }),
  ],
  preview: { select: { title: "slug" } },
});
