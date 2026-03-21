import { defineType, defineField } from "sanity";

export default defineType({
  name: "posterCategory",
  title: "Poster Categories",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Category Name",
      type: "string",
    }),
  ],
});