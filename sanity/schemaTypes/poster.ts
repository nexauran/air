import { defineType, defineField } from "sanity";

export default defineType({
  name: "poster",
  title: "Posters",
  type: "document",

  fields: [
    defineField({
      name: "title",
      title: "Poster Name",
      type: "string",
    }),

    defineField({
      name: "image",
      title: "Poster Image",
      type: "image",
      options: { hotspot: true },
    }),

    defineField({
      name: "category",
      title: "Category",
      type: "reference",
      to: [{ type: "posterCategory" }],
    }),
  ],
});