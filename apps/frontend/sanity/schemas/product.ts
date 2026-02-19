import { defineField, defineType } from "sanity";

export const product = defineType({
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "body",
      title: "Product Story",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "price",
      title: "Price (PKR)",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "compareAtPrice",
      title: "Compare At Price (PKR)",
      type: "number",
      description: "Original price for showing discount",
    }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "category" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "subcategory",
      title: "Subcategory",
      type: "reference",
      to: [{ type: "category" }],
    }),
    defineField({
      name: "sizes",
      title: "Available Sizes",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Free Size", value: "free" },
          { title: "XS", value: "xs" },
          { title: "S", value: "s" },
          { title: "M", value: "m" },
          { title: "L", value: "l" },
          { title: "XL", value: "xl" },
          { title: "XXL", value: "xxl" },
          { title: "52", value: "52" },
          { title: "54", value: "54" },
          { title: "56", value: "56" },
          { title: "58", value: "58" },
        ],
      },
    }),
    defineField({
      name: "colors",
      title: "Available Colors",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "name", type: "string", title: "Color Name" },
            { name: "hex", type: "string", title: "Hex Code" },
          ],
        },
      ],
    }),
    defineField({
      name: "material",
      title: "Material",
      type: "string",
      options: {
        list: [
          "Georgette",
          "Chiffon",
          "Crinkle",
          "Silk",
          "Lawn",
          "Cotton",
          "Polyester",
          "Cashmere",
          "Nida",
          "Jersey",
          "Linen",
        ],
      },
    }),
    defineField({
      name: "occasion",
      title: "Occasion",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Casual", value: "casual" },
          { title: "Office", value: "office" },
          { title: "Formal", value: "formal" },
          { title: "Party", value: "party" },
          { title: "Bridal", value: "bridal" },
          { title: "Everyday", value: "everyday" },
        ],
      },
    }),
    defineField({
      name: "stock",
      title: "Stock Quantity",
      type: "number",
      initialValue: 50,
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: "sku",
      title: "SKU",
      type: "string",
    }),
    defineField({
      name: "isFeatured",
      title: "Featured Product",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "isNewArrival",
      title: "New Arrival",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "isBestseller",
      title: "Bestseller",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "rating",
      title: "Average Rating",
      type: "number",
      initialValue: 0,
      validation: (Rule) => Rule.min(0).max(5),
    }),
    defineField({
      name: "reviewCount",
      title: "Review Count",
      type: "number",
      initialValue: 0,
    }),
    defineField({
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
    }),
  ],
  preview: {
    select: {
      title: "name",
      media: "images.0",
      price: "price",
      category: "category.name",
    },
    prepare({ title, media, price, category }) {
      return {
        title,
        subtitle: `PKR ${price} — ${category || "Uncategorized"}`,
        media,
      };
    },
  },
});
