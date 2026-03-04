import { defineField, defineType } from "sanity";

export const guaranteeType = defineType({
  name: "guarantee",
  title: "Guarantee",
  type: "document",
  fields: [
    defineField({
      name: "orderId",
      title: "Order ID",
      type: "string",
    }),
    defineField({
      name: "productId",
      title: "Product ID",
      type: "string",
    }),
    defineField({
      name: "productName",
      title: "Product Name",
      type: "string",
    }),
    defineField({
      name: "productImage",
      title: "Product Image",
      type: "image",
    }),
    defineField({
      name: "userEmail",
      title: "User Email",
      type: "string",
    }),
    defineField({
      name: "durationMonths",
      title: "Warranty Duration (Months)",
      type: "number",
    }),
    defineField({
      name: "activatedAt",
      title: "Activated At",
      type: "datetime",
    }),
    defineField({
      name: "expiresAt",
      title: "Expires At",
      type: "datetime",
    }),
  ],
});