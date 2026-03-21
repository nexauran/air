import { NextRequest, NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { createClient } from "@sanity/client";

// 🔒 ADMIN CLIENT (server only)
const adminClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_ADMIN_TOKEN,
});


// ✅ GET (with optional category filter)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const query = category
    ? `*[_type=="poster" && category._ref==$cat]{
        _id,
        title,
        image,
        category
      } | order(_createdAt desc)`
    : `*[_type=="poster"]{
        _id,
        title,
        image,
        category
      } | order(_createdAt desc)`;

  const data = await client.fetch(query, { cat: category });

  return NextResponse.json(data);
}


// ✅ CREATE
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const doc = await adminClient.create({
      _type: "poster",
      title: body.title,
      image: body.image,
      category: body.category
        ? { _type: "reference", _ref: body.category }
        : undefined,
    });

    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}


// ✅ UPDATE
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const doc = await adminClient
      .patch(body._id)
      .set({
        title: body.title,
        image: body.image,
        category: body.category
          ? { _type: "reference", _ref: body.category }
          : undefined,
      })
      .commit();

    return NextResponse.json(doc);
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}


// ✅ DELETE
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    await adminClient.delete(id);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}