import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    const query = `
      *[_type == "order" ${
        phone ? `&& phone match "${phone}*"` : ""
      }] | order(_createdAt desc) {
        _id,
        orderNumber,
        customerName,
        phone,
        totalPrice,
        currency,
        status,
        orderDate,
        "products": products[]{
          quantity,
          "productName": product->name
        },
        address {
          name,
          address,
          city,
          state,
          zip
        }
      }
    `;

    const adminOrders = await client.fetch(query);

    return NextResponse.json(adminOrders);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}