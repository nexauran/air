// app/api/available-coupons/route.ts
import { NextResponse } from "next/server";
import sanityClient from "@sanity/client";

const client = sanityClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET ?? "production",
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
  ignoreBrowserTokenWarning: true,
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const cartTotalParam = searchParams.get("cartTotal");
    const userId = searchParams.get("userId") || undefined;

    const cartTotal = Number(cartTotalParam || "0");

    if (Number.isNaN(cartTotal)) {
      return NextResponse.json(
        { error: "Invalid cartTotal" },
        { status: 400 }
      );
    }

    // Basic filters:
    // - active == true
    // - not expired
    // - min cart value satisfied
    // - usage limit not exceeded
    const coupons = await client.fetch(
      `*[_type in ["coupon", "freeItemCoupon"]
        && active == true
        && (!defined(minimumCartValue) || minimumCartValue <= $cartTotal)
        && (!defined(expiresAt) || expiresAt >= now())
        && (!defined(maxUses) || uses < maxUses)
      ]{
        _id,
        _type,
        title,
        code,
        description,
        discountType,
        amount,
        minimumCartValue,
        expiresAt,
        maxUses,
        uses
      } | order(minimumCartValue asc)`,
      { cartTotal }
    );

    // If you have per-user / single-use logic stored somewhere (e.g. usedBy, allowedUsers),
    // you can additionally filter coupons in JS here using userId.

    return NextResponse.json({ coupons });
  } catch (err) {
    console.error("Error fetching available coupons:", err);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}
