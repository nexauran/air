import { client } from "@/sanity/lib/client";

export async function POST(req: Request) {
  const body = await req.json();

  const doc = {
    _type: "posterOrder",
    customerName: body.name,
    phone: body.phone,
    createdAt: new Date().toISOString(),

    products: body.products.map((item: any) => ({
      productName: item.name,
      selectedPosters: item._posterData || []
    }))
  };

  const res = await client.create(doc);
  

  return Response.json(res);
  
}