import { client } from "@/sanity/lib/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  const orders = await client.fetch(
    `*[_type == "order" && customerEmail == $email]{
      orderNumber,
      productName,
      trackingNumber
    }`,
    { email }
  );

  return NextResponse.json(orders);
}