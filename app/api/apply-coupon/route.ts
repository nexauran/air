
import { NextResponse } from "next/server";
import sanityClient from "@sanity/client";

type ReqBody = { code: string; userId?: string; cartTotal: number };

const client = sanityClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET ?? "production",
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
  ignoreBrowserTokenWarning: true,
});

async function findCouponByCode(code: string) {
  const groq = `*[_type in ["coupon","freeItemCoupon"] && lower(code) == $c][0]{
    _id,
    _type,
    code,
    discountType,
    amount,
    minCartValue,
    minimumCartValue,
    expiresAt,
    maxUses,
    uses,
    singleUse,
    usedBy[],
    active,
    "freeProductsNew": freeProducts[]{
      quantity,
      "productRef": product->{
        _id,
        _type,
        title,
        name,
        slug,
        price,
        images,
        "imageUrl": coalesce(images[0].asset->url, null),
        active
      }
    },
    "freeProductsLegacy": freeProducts[]->{
      _id,
      _type,
      title,
      name,
      slug,
      price,
      images,
      "imageUrl": coalesce(images[0].asset->url, null),
      active
    }
  }`;
  return client.fetch(groq, { c: code.toLowerCase() });
}

export async function POST(req: Request) {
  try {
    const body: ReqBody = await req.json();
    const { code, userId, cartTotal } = body;

    if (!code || typeof cartTotal !== "number") {
      return NextResponse.json(
        { error: "code and cartTotal required" },
        { status: 400 }
      );
    }

    const coupon = await findCouponByCode(code);

    if (!coupon)
      return NextResponse.json({ error: "Invalid coupon" }, { status: 404 });

    if (!coupon.active)
      return NextResponse.json(
        { error: "Coupon inactive" },
        { status: 400 }
      );

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: "Coupon expired" },
        { status: 400 }
      );
    }

    if (
      typeof coupon.maxUses === "number" &&
      coupon.maxUses > 0 &&
      coupon.uses >= coupon.maxUses
    ) {
      return NextResponse.json(
        { error: "Coupon limit reached" },
        { status: 400 }
      );
    }

    // 🔥 PER USER CHECK
    if (userId && coupon.usedBy?.includes(userId)) {
      return NextResponse.json(
        { error: "You have already used this coupon" },
        { status: 400 }
      );
    }

    // 🔥 MIN CART VALUE FIX (supports both schemas)
    const minValue =
      coupon.minimumCartValue ?? coupon.minCartValue ?? null;

    if (
      typeof minValue === "number" &&
      Number(cartTotal) < Number(minValue)
    ) {
      return NextResponse.json(
        { error: "Minimum order value ₹" + minValue + " required" },
        { status: 400 }
      );
    }

    const hasNew =
      Array.isArray(coupon.freeProductsNew) &&
      coupon.freeProductsNew.length > 0;

    const hasLegacy =
      Array.isArray(coupon.freeProductsLegacy) &&
      coupon.freeProductsLegacy.length > 0;

    const isFreeItems =
      String(coupon.discountType ?? "").toLowerCase() === "free_items" ||
      hasNew ||
      hasLegacy;

    // =========================
    // 🎁 FREE ITEMS
    // =========================
    if (isFreeItems) {
      let freeItems: any[] = [];

      if (hasNew) {
        freeItems = coupon.freeProductsNew.flatMap((fp: any) => {
          const qty = fp.quantity || 1;
          const ref = fp.productRef;
          if (!ref || ref.active === false) return [];

          return [
            {
              _id: ref._id,
              id: ref._id,
              title: ref.title ?? ref.name ?? "Free item",
              name: ref.title ?? ref.name ?? "Free item",
              slug: ref.slug ?? null,
              originalPrice: ref.price ?? 0,
              price: 0,
              images: ref.images ?? [],
              imageUrl: ref.imageUrl ?? null,
              quantity: qty,
              isFree: true,
            },
          ];
        });
      } else if (hasLegacy) {
        freeItems = coupon.freeProductsLegacy
          .map((ref: any) => {
            if (!ref || ref.active === false) return null;
            return {
              _id: ref._id,
              id: ref._id,
              title: ref.title ?? ref.name ?? "Free item",
              name: ref.title ?? ref.name ?? "Free item",
              slug: ref.slug ?? null,
              originalPrice: ref.price ?? 0,
              price: 0,
              images: ref.images ?? [],
              imageUrl: ref.imageUrl ?? null,
              quantity: 1,
              isFree: true,
            };
          })
          .filter(Boolean);
      }

      // ✅ UPDATE usage + usedBy
      const existing = Array.isArray(coupon.usedBy) ? coupon.usedBy : [];
      const updated = userId
        ? Array.from(new Set([...existing, userId]))
        : existing;

      await client
        .patch(coupon._id)
        .setIfMissing({ uses: 0 })
        .inc({ uses: 1 })
        .set({ usedBy: updated })
        .commit();

      return NextResponse.json({
        success: true,
        code: coupon.code,
        discount: 0,
        newTotal: Number(cartTotal),
        freeItems,
      });
    }

    // =========================
    // 💸 DISCOUNT
    // =========================
    let discount = 0;

    if (String(coupon.discountType).toLowerCase() === "percent") {
      discount = (Number(coupon.amount) / 100) * Number(cartTotal);
    } else {
      discount = Number(coupon.amount ?? 0);
    }

    if (discount > cartTotal) discount = cartTotal;

    // ✅ UPDATE usage + usedBy
    const existing = Array.isArray(coupon.usedBy) ? coupon.usedBy : [];
    const updated = userId
      ? Array.from(new Set([...existing, userId]))
      : existing;

    await client
      .patch(coupon._id)
      .setIfMissing({ uses: 0 })
      .inc({ uses: 1 })
      .set({ usedBy: updated })
      .commit();

    return NextResponse.json({
      success: true,
      code: coupon.code,
      discount,
      newTotal: Number(cartTotal) - discount,
    });
  } catch (err) {
    console.error("[apply-coupon] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

