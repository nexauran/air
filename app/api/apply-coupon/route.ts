// /app/api/apply-coupon/route.ts
import { NextResponse } from "next/server";
import sanityClient from "@sanity/client";

type ReqBody = { code: string; userId?: string; cartTotal: number };

const client = sanityClient({
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET ?? "production",
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN, // must be server-only and write-enabled
  ignoreBrowserTokenWarning: true,
});

function serverError(msg: string, err?: unknown) {
  console.error("[apply-coupon] ERROR:", msg, err);
  return NextResponse.json({ error: msg, detail: err ? (err as any)?.message ?? String(err) : undefined }, { status: 500 });
}

async function findCouponByCode(code: string) {
  const groq = `*[_type in ["coupon","freeItemCoupon"] && lower(code) == $c][0]{
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
    // quick env check
    if (!process.env.SANITY_API_WRITE_TOKEN) {
      console.error("[apply-coupon] missing SANITY_API_WRITE_TOKEN");
      return NextResponse.json({ error: "Server misconfiguration: missing SANITY_API_WRITE_TOKEN" }, { status: 500 });
    }

    const raw = await req.text().catch(() => null);
    if (!raw) return NextResponse.json({ error: "Missing request body" }, { status: 400 });

    let body: ReqBody;
    try {
      body = JSON.parse(raw) as ReqBody;
    } catch (e) {
      console.warn("[apply-coupon] invalid JSON:", raw);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { code, userId, cartTotal } = body ?? ({} as ReqBody);
    if (!code || typeof cartTotal !== "number") {
      return NextResponse.json({ error: "code (string) and cartTotal (number) are required" }, { status: 400 });
    }

    let coupon: any;
    try {
      coupon = await findCouponByCode(code);
    } catch (err) {
      console.error("[apply-coupon] sanity fetch failed:", err);
      return serverError("Failed to fetch coupon from Sanity", err);
    }

    if (!coupon) return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 });

    if (!coupon.active) return NextResponse.json({ error: "Coupon is inactive" }, { status: 400 });

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return NextResponse.json({ error: "Coupon expired" }, { status: 400 });

    if (typeof coupon.maxUses === "number" && coupon.maxUses > 0 && typeof coupon.uses === "number" && coupon.uses >= coupon.maxUses)
      return NextResponse.json({ error: "Coupon usage limit reached" }, { status: 400 });

    if (coupon.singleUse && Number(coupon.uses) > 0) return NextResponse.json({ error: "Coupon already used" }, { status: 400 });

    if (userId && Array.isArray(coupon.usedBy) && coupon.usedBy.includes(userId))
      return NextResponse.json({ error: "You have already used this coupon" }, { status: 400 });

    const hasNew = Array.isArray(coupon.freeProductsNew) && coupon.freeProductsNew.length > 0;
    const hasLegacy = Array.isArray(coupon.freeProductsLegacy) && coupon.freeProductsLegacy.length > 0;
    const isFreeItems =
      String(coupon.discountType ?? "").toLowerCase() === "free_items" || hasNew || hasLegacy;

    if (isFreeItems) {
      if (typeof coupon.minimumCartValue === "number" && Number(cartTotal) < Number(coupon.minimumCartValue)) {
        return NextResponse.json({ error: `Minimum order value ₹${coupon.minimumCartValue} required` }, { status: 400 });
      }

      // Build freeItems robustly
      let freeItems: any[] = [];

      if (hasNew) {
        freeItems = (coupon.freeProductsNew as any[]).flatMap((fp: any) => {
          const qty = typeof fp?.quantity === "number" && fp.quantity > 0 ? fp.quantity : 1;
          const ref = fp?.productRef;
          if (!ref) return [];
          if (ref.active === false) return [];
          return [{
            _id: ref._id,
            id: ref._id,
            title: ref.title ?? ref.name ?? "Free item",
            name: ref.title ?? ref.name ?? "Free item",
            type: ref._type ?? null,
            slug: ref.slug ?? null,
            originalPrice: typeof ref.price === "number" ? ref.price : 0,
            price: 0,
            images: Array.isArray(ref.images) ? ref.images : [],
            imageUrl: ref.imageUrl ?? null,
            quantity: qty,
            isFree: true,
          }];
        });
      } else if (hasLegacy) {
        freeItems = (coupon.freeProductsLegacy as any[]).flatMap((ref: any) => {
          if (!ref) return [];
          if (ref.active === false) return [];
          return [{
            _id: ref._id,
            id: ref._id,
            title: ref.title ?? ref.name ?? "Free item",
            name: ref.title ?? ref.name ?? "Free item",
            type: ref._type ?? null,
            slug: ref.slug ?? null,
            originalPrice: typeof ref.price === "number" ? ref.price : 0,
            price: 0,
            images: Array.isArray(ref.images) ? ref.images : [],
            imageUrl: ref.imageUrl ?? null,
            quantity: 1,
            isFree: true,
          }];
        });
      }

      // Defensive transaction: ensure uses field exists and usedBy exists before inc/set
      try {
        const tx = client.transaction();

        // if uses doesn't exist, set it to 0 first
        tx.patch(coupon._id, { setIfMissing: { uses: 0 } });

        // increment uses
        tx.patch(coupon._id, { inc: { uses: 1 } });

        // ensure usedBy array exists
        tx.patch(coupon._id, { setIfMissing: { usedBy: [] } });

        if (userId) {
          // fetch existing usedBy (we already have coupon.usedBy but ensure dedupe)
          const existing = Array.isArray(coupon.usedBy) ? coupon.usedBy : [];
          const newUsedBy = Array.from(new Set([...existing, userId]));
          tx.patch(coupon._id, { set: { usedBy: newUsedBy } });
        }

        console.log("[apply-coupon] committing transaction for coupon:", coupon._id, "freeItemsCount:", freeItems.length);
        await tx.commit();
        console.log("[apply-coupon] transaction committed successfully for coupon:", coupon._id);
      } catch (err) {
        console.error("[apply-coupon] Failed to commit transaction (free-items path):", err);
        // give a helpful error
        return serverError("Failed to commit coupon usage to Sanity (free-items path). Confirm SANITY_API_WRITE_TOKEN has write permissions and the document is patchable.", err);
      }

      return NextResponse.json({ success: true, code: coupon.code, discount: 0, newTotal: Number(cartTotal), freeItems }, { status: 200 });
    }

    // Discount path unchanged
    let discount = 0;
    if (String(coupon.discountType ?? "").toLowerCase() === "percent") {
      discount = (Number(coupon.amount) / 100) * Number(cartTotal);
    } else {
      discount = Number(coupon.amount ?? 0);
    }
    if (discount > cartTotal) discount = cartTotal;

    try {
      const tx2 = client.transaction();
      tx2.patch(coupon._id, { setIfMissing: { uses: 0 } });
      tx2.patch(coupon._id, { inc: { uses: 1 } });
      tx2.patch(coupon._id, { setIfMissing: { usedBy: [] } });

      if (userId) {
        const existing = Array.isArray(coupon.usedBy) ? coupon.usedBy : [];
        const newUsedBy = Array.from(new Set([...existing, userId]));
        tx2.patch(coupon._id, { set: { usedBy: newUsedBy } });
      }

      console.log("[apply-coupon] committing transaction (discount path) for coupon:", coupon._id);
      await tx2.commit();
      console.log("[apply-coupon] transaction committed (discount path) for coupon:", coupon._id);
    } catch (err) {
      console.error("[apply-coupon] Failed to commit transaction (discount path):", err);
      return serverError("Failed to commit coupon usage to Sanity (discount path). Confirm SANITY_API_WRITE_TOKEN has write permissions and the document is patchable.", err);
    }

    return NextResponse.json({ success: true, code: coupon.code, discount, newTotal: Number(cartTotal) - discount }, { status: 200 });
  } catch (err: any) {
    console.error("[apply-coupon] unexpected error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
