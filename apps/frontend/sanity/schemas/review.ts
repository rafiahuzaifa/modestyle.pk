import { defineField, defineType } from "sanity";

export const review = defineType({
  name: "review",
  title: "Review",
  type: "document",
  fields: [
    defineField({
      name: "product",
      title: "Product",
      type: "reference",
      to: [{ type: "product" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "author",
      title: "Author Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "rating",
      title: "Rating",
      type: "number",
      validation: (Rule) => Rule.required().min(1).max(5),
    }),
    defineField({
      name: "comment",
      title: "Comment",
      type: "text",
    }),
    defineField({
      name: "clerkUserId",
      title: "Clerk User ID",
      type: "string",
    }),
    defineField({
      name: "isApproved",
      title: "Approved",
      type: "boolean",
      initialValue: false,
    }),
  ],
  preview: {
    select: { title: "author", product: "product.name", rating: "rating" },
    prepare({ title, product, rating }) {
      return { title, subtitle: `${product} — ${"★".repeat(rating)}` };
    },
  },
});
