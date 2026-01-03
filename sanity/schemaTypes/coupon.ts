// schemas/coupon.ts
import { defineType, defineField } from "sanity";

export default defineType({
  name: "coupon",
  title: "Coupon",
  type: "document",
  fields: [
    defineField({
      name: "code",
      title: "Code",
      type: "string",
      description: "Unique coupon code (case-insensitive).",
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "title",
      title: "Title",
      type: "string",
    }),
    defineField({
      name: "discountType",
      title: "Type",
      type: "string",
      options: { list: ["fixed", "percent"] },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "amount",
      title: "Amount",
      type: "number",
      description: "Fixed amount (e.g. 100) or percent (e.g. 10 for 10%).",
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "minCartValue",
      title: "Minimum products amount (₹)",
      type: "number",
      description:
        "Minimum products subtotal required for this coupon to be applicable. Leave empty to use default server-side minimum.",
      initialValue: 799, // default visible in studio
      validation: (Rule) =>
        Rule.min(0)
          .error("Minimum cart value must be a non-negative number")
          .precision(0),
    }),
    defineField({
      name: "expiresAt",
      title: "Expires At",
      type: "datetime",
    }),
    defineField({
      name: "maxUses",
      title: "Max Uses (global)",
      type: "number",
    }),
    defineField({
      name: "uses",
      title: "Uses (counter)",
      type: "number",
      initialValue: 0,
    }),
    defineField({
      name: "singleUse",
      title: "Single Use (true = 1 use total)",
      type: "boolean",
    }),
    defineField({
      name: "usedBy",
      title: "Used By",
      type: "array",
      of: [{ type: "string" }], // store userId or email strings
      description: "Store userId or email to prevent re-use per user.",
    }),
    defineField({
      name: "active",
      title: "Active",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: "code",
      subtitle: "title",
      amount: "amount",
      minCartValue: "minCartValue",
    },
    prepare(selection) {
      const { title, subtitle, amount, minCartValue } = selection;
      return {
        title: title,
        subtitle: `${subtitle ?? ""} · ${amount ?? ""} · min ₹${minCartValue ?? "—"}`,
      };
    },
  },
});
