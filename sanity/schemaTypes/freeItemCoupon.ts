import { defineType, defineField } from "sanity";

export default defineType({
  name: "freeItemCoupon",
  title: "Free Item Coupons",
  type: "document",
  fields: [
    defineField({
      name: "code",
      title: "Coupon Code",
      type: "string",
      validation: (Rule) => Rule.required().error("Coupon code is required"),
      description: "Enter the coupon code users will type (case-insensitive).",
    }),

    defineField({
      name: "minimumCartValue",
      title: "Minimum Cart Value (₹)",
      type: "number",
      description: "Coupon works only if products subtotal is at or above this amount. Leave empty for no minimum.",
    }),

    // *** Updated: freeProducts is now an array of objects { product, quantity } ***
    defineField({
      name: "freeProducts",
      title: "Free Products to Add",
      type: "array",
      of: [
        {
          type: "object",
          title: "Free Product",
          fields: [
            defineField({
              name: "product",
              title: "Product or Gift",
              type: "reference",
              to: [{ type: "product" }, { type: "freeGift" }],
              validation: (Rule) => Rule.required().error("Select a product or freeGift"),
            }),
            defineField({
              name: "quantity",
              title: "Quantity",
              type: "number",
              initialValue: 1,
              validation: (Rule) =>
                Rule.required()
                  .min(1)
                  .integer()
                  .error("Quantity must be an integer >= 1"),
              description: "How many of this product to add when the coupon is applied.",
            }),
          ],
          preview: {
            select: {
              title: "product.title",
              subtitle: "quantity",
              media: "product.images[0]",
            },
            prepare(selection) {
              return {
                title: selection.title || "Untitled product",
                subtitle: `Quantity: ${selection.subtitle ?? 1}`,
                media: selection.media,
              };
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1).error("Add at least one free product or gift"),
      description: "Select one or more products (or Free Gift documents) and set quantity for each.",
    }),

    defineField({
      name: "maxUsage",
      title: "Max Usage (global)",
      type: "number",
      initialValue: 0,
      description: "Maximum times this coupon can be used across all users. 0 = unlimited.",
    }),

    defineField({
      name: "maxUsagePerUser",
      title: "Max Usage Per User",
      type: "number",
      initialValue: 1,
      description: "How many times a single user can use this coupon. 0 = unlimited per user.",
    }),

    defineField({
      name: "expiresAt",
      title: "Expiry Date",
      type: "datetime",
      description: "Optional — coupon will be invalid after this date/time.",
    }),

    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      initialValue: true,
      description: "Toggle to enable/disable the coupon without deleting it.",
    }),
  ],
});
