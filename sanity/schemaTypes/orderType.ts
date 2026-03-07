/** @format */

import { BasketIcon } from "@sanity/icons";
import { defineArrayMember, defineField, defineType } from "sanity";

export const orderType = defineType({
  name: "order",
  title: "Order",
  type: "document",
  icon: BasketIcon,

  fields: [
    // ✅ Order ID
    defineField({
      name: "orderNumber",
      title: "Order ID",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    // ✅ Order Date
    defineField({
      name: "orderDate",
      title: "Order Date",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),

    // ✅ Customer Info
    defineField({
      name: "customerName",
      title: "Customer Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: "email",
      title: "Customer Email",
      type: "string",
      validation: (Rule) => Rule.required().email(),
    }),

    defineField({
      name: "phone",
      title: "Customer Phone",
      type: "string",
    }),

    // ✅ Products
    defineField({
      name: "products",
      title: "Products",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "product",
              title: "Product",
              type: "reference",
              to: [{ type: "product" }],
            }),
            defineField({
              name: "quantity",
              title: "Quantity",
              type: "number",
            }),
          ],
          preview: {
            select: {
              name: "product.name",
              quantity: "quantity",
              price: "product.price",
              image: "product.images.0",
            },
            prepare(selection) {
              const { name, quantity, price, image } = selection;
              return {
                title: `${name} x ${quantity}`,
                subtitle: `₹${price * quantity}`,
                media: image,
              };
            },
          },
        }),
      ],
    }),

    // ✅ Pricing
    defineField({
      name: "subtotal",
      title: "Subtotal",
      type: "number",
    }),

    defineField({
      name: "shipping",
      title: "Shipping",
      type: "number",
    }),

    defineField({
      name: "couponDiscount",
      title: "Coupon Discount",
      type: "number",
    }),

    defineField({
      name: "totalPrice",
      title: "Total Price",
      type: "number",
      validation: (Rule) => Rule.required().min(0),
    }),

    defineField({
      name: "currency",
      title: "Currency",
      type: "string",
      initialValue: "INR",
    }),

    // ✅ Address
    defineField({
      name: "address",
      title: "Shipping Address",
      type: "object",
      fields: [
        defineField({ name: "name", title: "Name", type: "string" }),
        defineField({ name: "address", title: "Address", type: "string" }),
        defineField({ name: "city", title: "City", type: "string" }),
        defineField({ name: "state", title: "State", type: "string" }),
        defineField({ name: "zip", title: "Zip Code", type: "string" }),
      ],
    }),

    // ✅ Order Status (for admin management)
    defineField({
      name: "status",
      title: "Order Status",
      type: "string",
      initialValue: "pending",
      options: {
        list: [
          { title: "Pending Confirmation", value: "pending" },
          { title: "Confirmed", value: "confirmed" },
          { title: "Processing", value: "processing" },
          { title: "Shipped", value: "shipped" },
          { title: "Delivered", value: "delivered" },
          { title: "Cancelled", value: "cancelled" },
        ],
      },
    }),

    

    // ✅ Payment Method (now always WhatsApp)
    defineField({
      name: "paymentMethod",
      title: "Payment Method",
      type: "string",
      initialValue: "WhatsApp",
    }),

    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
  ],

  preview: {
    select: {
      name: "customerName",
      amount: "totalPrice",
      orderId: "orderNumber",
      status: "status",
    },
    prepare(select) {
      return {
        title: `${select.name} (${select.orderId})`,
        subtitle: `₹${select.amount} • ${select.status}`,
        media: BasketIcon,
      };
    },
  },
});
