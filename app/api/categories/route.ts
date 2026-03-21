import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";

// 🔍 GET
export async function GET() {
  const data = await client.fetch(`
    *[_type == "posterCategory"] | order(_createdAt desc)
  `);

  return NextResponse.json(data);
}

// ➕ POST
export async function POST(req: Request) {
  const body = await req.json();

  const doc = {
    _type: "posterCategory",
    title: body.title,
  };

  const result = await client.create(doc);

  return NextResponse.json(result);
}

// ✏️ PUT
export async function PUT(req: Request) {
  const body = await req.json();

  const result = await client
    .patch(body.id)
    .set({ title: body.title })
    .commit();

  return NextResponse.json(result);
}