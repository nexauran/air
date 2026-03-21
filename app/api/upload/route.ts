import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@sanity/client";

const adminClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_ADMIN_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    const asset = await adminClient.assets.upload("image", file);

    return NextResponse.json({
      _type: "image",
      asset: {
        _type: "reference",
        _ref: asset._id,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err }, { status: 500 });
  }
}