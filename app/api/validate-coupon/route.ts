/** @format */

import { NextResponse } from "next/server";
import sanityClient from "@sanity/client";

type ReqBody = { code: string; cartTotal: number };

const client = sanityClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET ?? "production",
  useCdn: false,
});

async function findCouponByCode(code: string) {
  return client.fetch(
    `*[_type in ["coupon","freeItemCoupon"] && lower(code) == $c][0]{
      _id,
      _type,
      code,
      discountType,
      amount,
      minimumCartValue,
      expiresAt,
      maxUses,
      uses,
      singleUse,
      usedBy[],
      active,
      freeProducts[]->{
        _id,
        _type,
        title,
        name,
        slug,
        price,
        images,
        "imageUrl": images[0].asset->url,
        active
      }
    }`,
    { c: code.toLowerCase() }
  );
}

export async function POST(req: Request) {
  try {
    const raw = await req.text().catch(() => null);
    if (!raw)
      return NextResponse.json({ error: "Missing body" }, { status: 400 });

    const body = JSON.parse(raw) as ReqBody;
    if (!body?.code || typeof body.cartTotal !== "number") {
      return NextResponse.json(
        { error: "code and cartTotal required" },
        { status: 400 }
      );
    }

    const { code, cartTotal } = body;

    const coupon: any = await findCouponByCode(code);
    if (!coupon)
      return NextResponse.json(
        { error: "Invalid coupon code" },
        { status: 404 }
      );

    if (!coupon.active)
      return NextResponse.json(
        { error: "Coupon is inactive" },
        { status: 400 }
      );

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
      return NextResponse.json({ error: "Coupon expired" }, { status: 400 });

    const minCartValue =
      typeof coupon.minimumCartValue === "number" ?
        coupon.minimumCartValue
      : null;

    const isFreeItems =
      String(coupon.discountType ?? "").toLowerCase() === "free_items" ||
      (Array.isArray(coupon.freeProducts) && coupon.freeProducts.length > 0);

    if (isFreeItems) {
      const freeProductsPreview = (coupon.freeProducts ?? []).map(
        (fp: any) => ({
          quantity: fp.quantity ?? 1,
          _id: fp.productRef?._id,
          title: fp.productRef?.title ?? fp.productRef?.name,
          type: fp.productRef?._type,
          price: fp.productRef?.price ?? 0,
          imageUrl: fp.productRef?.imageUrl ?? null,
        })
      );

      return NextResponse.json(
        { ok: true, isFreeItems: true, minCartValue, freeProductsPreview },
        { status: 200 }
      );
    }

    let discount = 0;
    if (String(coupon.discountType ?? "").toLowerCase() === "percent") {
      discount = (Number(coupon.amount) / 100) * Number(cartTotal);
    } else {
      discount = Number(coupon.amount ?? 0);
    }
    if (discount > cartTotal) discount = cartTotal;

    return NextResponse.json(
      { ok: true, isFreeItems: false, minCartValue, discount },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[validate-coupon] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
