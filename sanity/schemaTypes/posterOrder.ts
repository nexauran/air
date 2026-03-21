export default {
  name: "posterOrder",
  type: "document",
  title: "Poster Orders",
  fields: [
    // ✅ Order Info
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

    // ✅ Customer Info
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

    // ✅ Products (Scalable for future)
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

            // ✅ Selected Posters
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
                      type: "url",
                      title: "Image URL",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};