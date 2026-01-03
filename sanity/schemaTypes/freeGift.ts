// /sanity/schemas/freeGift.ts
import { defineType, defineField } from "sanity";

export default defineType({
  name: "freeGift",
  title: "Free Gift (coupon-only product)",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (Rule) => Rule.required().error("Title is required"),
    }),
    defineField({
      name: "slug",
      title: "Slug (optional)",
      type: "slug",
      options: { source: "title", maxLength: 96 },
    }),
    defineField({
      name: "images",
      title: "Images",
      type: "array",
      of: [{ type: "image", options: { hotspot: true } }],
    }),
    defineField({
      name: "price",
      title: "Reference Price (optional)",
      type: "number",
      description: "Shown as 'originalPrice' in cart when given as a free item (not charged).",
    }),
    defineField({
      name: "sku",
      title: "SKU (optional)",
      type: "string",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
    }),
    defineField({
      name: "hideFromCatalog",
      title: "Hide from product catalog",
      type: "boolean",
      initialValue: true,
      description: "When true this doc won't show up in normal product listings.",
    }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      initialValue: true,
      description: "If false, coupons referencing this gift will ignore it.",
    }),
  ],
});
