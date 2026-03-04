import { NextRequest } from "next/server";
import { sanityClient } from "@/lib/sanityClient";

export async function POST(req: NextRequest) {

  const body = await req.json();

  const {
    orderId,
    productId,
    productName,
    userEmail,
    durationMonths
  } = body;

  const activatedAt = new Date();
  const expiresAt = new Date();

  expiresAt.setMonth(activatedAt.getMonth() + durationMonths);

  const doc = {
    _type: "guarantee",
    orderId,
    productId,
    productName,
    userEmail,
    durationMonths,
    activatedAt: activatedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  const result = await sanityClient.create(doc);

  return Response.json({
    success: true,
    result
  });
}