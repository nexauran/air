import { NextRequest } from "next/server";
import { sanityClient } from "@/lib/sanityClient";

export async function GET(req: NextRequest) {

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  console.log("Fetching orders for:", email);

  const query = `
  *[_type == "order" && email == $email]{
    _id,
    "orderId": orderNumber,
    products[product->warrantyAvailable == true]{
      _key,
      quantity,
      "name": product->name,
      "productId": product->_id,
      "image": product->images[0].asset->url
    }
  }
  `;

  const orders = await sanityClient.fetch(query, { email });

  console.log("Orders returned:", orders);

  return Response.json(orders);
}