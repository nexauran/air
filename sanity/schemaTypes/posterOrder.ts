export default {
  name: "posterOrder",
  type: "document",
  title: "Poster Orders",

  fields: [
    {
      name: "orderId",
      type: "string",
      title: "Order ID",
    },
    {
      name: "createdAt",
      type: "datetime",
      title: "Created At",
    },

    // Customer
    {
      name: "customerName",
      type: "string",
      title: "Customer Name",
    },
    {
      name: "phone",
      type: "string",
      title: "Phone",
    },

    // Products
    {
      name: "products",
      type: "array",
      title: "Products",
      of: [
        {
          type: "object",

          fields: [
            {
              name: "productName",
              type: "string",
              title: "Product Name",
              initialValue: "24 Posters Combo",
            },
            {
              name: "quantity",
              type: "number",
              title: "Quantity",
              initialValue: 1,
            },

            {
              name: "selectedPosters",
              type: "array",
              title: "Selected Posters",
              of: [
                {
                  type: "object",

                  fields: [
                    {
                      name: "id",
                      type: "string",
                      title: "Poster ID",
                    },
                    {
                      name: "name",
                      type: "string",
                      title: "Poster Name",
                    },
                    {
                      name: "image",
                      type: "image",
                      title: "Poster Image",
                    },
                  ],

                  // 🔥 Poster preview (fixes "Untitled")
                  preview: {
                    select: {
                      title: "name",
                      subtitle: "id",
                      media: "image",
                    },
                  },
                },
              ],
            },
          ],

          // 🔥 Product preview
          preview: {
            select: {
              title: "productName",
              subtitle: "quantity",
            },
            prepare({
              title,
              subtitle,
            }: {
              title?: string;
              subtitle?: number;
            }) {
              return {
                title: title || "Product",
                subtitle: `Qty: ${subtitle ?? 0}`,
              };
            },
          },
        },
      ],
    },
  ],

  // 🔥 Order preview in list
  preview: {
    select: {
      title: "orderId",
      subtitle: "customerName",
    },
    prepare({
      title,
      subtitle,
    }: {
      title?: string;
      subtitle?: string;
    }) {
      return {
        title: title || "Order",
        subtitle: subtitle ? `Customer: ${subtitle}` : "",
      };
    },
  },
};