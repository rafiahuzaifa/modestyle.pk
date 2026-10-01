import { defineField, defineType } from "sanity";

export const banner = defineType({
  name: "banner",
  title: "Banner",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "subtitle",
      title: "Subtitle",
      type: "string",
    }),
    defineField({
      name: "eyebrow",
      title: "Eyebrow Text",
      description: "Small label above the title, e.g. \"Elegance in Every Drape\"",
      type: "string",
    }),
    defineField({
      name: "mediaType",
      title: "Media Type",
      type: "string",
      options: {
        list: [
          { title: "Image", value: "image" },
          { title: "Video", value: "video" },
        ],
        layout: "radio",
      },
      initialValue: "image",
    }),
    defineField({
      name: "image",
      title: "Banner Image",
      type: "image",
      options: { hotspot: true },
      hidden: ({ parent }) => parent?.mediaType === "video",
    }),
    defineField({
      name: "video",
      title: "Banner Video (MP4, muted/looped)",
      type: "file",
      options: { accept: "video/mp4" },
      hidden: ({ parent }) => parent?.mediaType !== "video",
    }),
    defineField({
      name: "videoPoster",
      title: "Video Poster Image",
      description: "Shown while the video loads, and as a fallback",
      type: "image",
      options: { hotspot: true },
      hidden: ({ parent }) => parent?.mediaType !== "video",
    }),
    defineField({
      name: "link",
      title: "Link URL",
      type: "string",
    }),
    defineField({
      name: "buttonText",
      title: "Button Text",
      type: "string",
      initialValue: "Shop Now",
    }),
    defineField({
      name: "secondaryLink",
      title: "Secondary Link URL",
      type: "string",
    }),
    defineField({
      name: "secondaryButtonText",
      title: "Secondary Button Text",
      type: "string",
    }),
    defineField({
      name: "isActive",
      title: "Active",
      type: "boolean",
      initialValue: true,
    }),
    defineField({
      name: "placement",
      title: "Placement",
      type: "string",
      options: {
        list: [
          { title: "Hero", value: "hero" },
          { title: "Mid Page", value: "mid" },
          { title: "Footer", value: "footer" },
        ],
      },
      initialValue: "hero",
    }),
    defineField({
      name: "order",
      title: "Display Order",
      type: "number",
      initialValue: 0,
    }),
  ],
  preview: {
    select: { title: "title", media: "image", active: "isActive" },
    prepare({ title, media, active }) {
      return {
        title,
        subtitle: active ? "Active" : "Inactive",
        media,
      };
    },
  },
});
