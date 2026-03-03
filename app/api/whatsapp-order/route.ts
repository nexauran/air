import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const doc = {
      _type: "order",

      orderNumber: body.orderId,
      orderDate: body.orderDate,

      // ✅ VERY IMPORTANT (this makes orders page work)
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

      status: "pending", // must match schema options
      paymentMethod: "WhatsApp",

      createdAt: new Date().toISOString(),
    };

    const result = await client.create(doc);

    return NextResponse.json({ success: true, id: result._id });
  } catch (error: any) {
    console.error("Sanity save error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}