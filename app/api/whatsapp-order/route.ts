/** @format */

import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ 1. MAIN ORDER (no change)
    const orderDoc = await client.create({
      _type: "order",

      orderNumber: body.orderId,
      orderDate: body.orderDate,

      clerkUserId: body.clerkUserId,

      customerName: body.customerName,
      email: body.email,
      phone: body.phone,

      products: body.products,

      subtotal: body.subtotal,
      shipping: body.shipping,
      couponDiscount: body.couponDiscount,
      totalPrice: body.total,

      currency: "INR",
      address: body.address,

      status: "pending",
      paymentMethod: "WhatsApp",

      createdAt: new Date().toISOString(),
    });

    // ✅ 2. POSTER ORDER (FIXED FOR YOUR NEW SCHEMA)
    const posterDocs = [];

    for (const item of body.products) {
      if (item.selectedPosters && item.selectedPosters.length > 0) {
        const posterDoc = await client.create({
          _type: "posterOrder",

          orderId: body.orderId,
          createdAt: new Date().toISOString(),

          customerName: body.customerName,
          phone: body.phone,

          products: [
            {
              _key: crypto.randomUUID(), // ✅ FIX 1

              productName: item.productName || "24 Posters Combo",
              quantity: item.quantity || 1,

              selectedPosters: item.selectedPosters.map((poster: any) => ({
                _key: crypto.randomUUID(), // ✅ FIX 2
                id: poster.id,
                name: poster.name,
                image: poster.image,
              })),
            },
          ],
        });

        posterDocs.push(posterDoc);
      }
    }
    return NextResponse.json({
      success: true,
      orderId: orderDoc._id,
      posterDocs,
    });
  } catch (error: any) {
    console.error("Sanity save error:", error);

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
