import { NextRequest, NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanityClient";

export async function GET(req: NextRequest) {

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json([]);
  }

  const query = `
  *[_type == "guarantee" && userEmail == $email]{
    _id,
    orderId,
    productName,
    "productImage": productImage.asset->url,
    activatedAt,
    expiresAt
  }
  `;

  const data = await sanityClient.fetch(query, { email });

  return NextResponse.json(data);
}