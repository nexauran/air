/** @format */

// app/(path-to)/CartPage.tsx
"use client";
import { ChevronUp, ChevronDown } from "lucide-react";
import { MessageCircle } from "lucide-react";
import Container from "@/components/Container";
import EmptyCart from "@/components/EmptyCart";
import NoAccessToCart from "@/components/NoAccessToCart";
import PriceFormater from "@/components/PriceFormater";
import AddToWishlistButton from "@/components/AddToWishlistButton";
import QuantityButton from "@/components/QuantityButton";
import Title from "@/components/Title";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import useStore from "@/store";
import { useAuth, useUser } from "@clerk/nextjs";
import { ShoppingBag, Trash } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AddAddressModal from "@/components/AddAddressModal";

/** Minimal types — extend as needed */
type AddressDoc = {
  _id?: string;
  name?: string;
   phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  default?: boolean;
  publishedAt?: string;
  createdAt?: string;
};

/** Coupon response shape from /api/apply-coupon */
type AppliedCoupon = {
  success: true;
  code: string;
  discount: number;
  newTotal: number;
};

/**
 * Helper: normalize server free-item into a Product-like object that matches your Product type.
 * Returns a minimal product-shaped object the UI/store expects.
 *
 * Note: we intentionally type many fields as `any` to be resilient to server shapes.
 */
function normalizeFreeItemToProduct(fi: any, idx: number) {
  const id =
    fi._id ?? fi.id ?? `free-${Math.random().toString(36).slice(2, 9)}-${idx}`;

  const images =
    Array.isArray(fi.images) && fi.images.length ?
      fi.images.map((im: any) => {
        // if already in Sanity-like shape (has asset)
        if (im?.asset) {
          // keep as-is; render logic will check for asset.url or asset._ref
          return im;
        }
        // plain URL string
        if (typeof im === "string") return { asset: { url: im } };
        // object with url
        if (im?.url) return { asset: { url: im.url } };
        // fallback
        return im;
      })
    : fi.imageUrl ? [{ asset: { url: fi.imageUrl } }]
    : [];

  const product: any = {
    _id: id,
    _type: "product",
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    _rev: Math.random().toString(36).slice(2, 9),
    name: fi.title ?? fi.name ?? "Free item",
    slug: fi.slug ?? { current: `free-${id}` },
    images,
    description: fi.description ?? "",
    price: 0,
    discount: fi.discount ?? 0,
    categories: undefined,
    stock: fi.stock ?? 0,
    brand: undefined,
    status: fi.status,
    variant: fi.variant,
    isFeatured: fi.isFeatured ?? false,
  };

  // client-only helpers so UI/store logic can detect free gifts
  product.isFree = true;
  product.originalPrice = fi.originalPrice ?? fi.price ?? 0;
  product.meta = {
    fromCoupon: fi.couponCode ?? undefined,
    sourceType: fi.type ?? "freeGift",
  };

  return product;
}

/**
 * Upsert normalizedForStore (array of Product-shaped objects with .quantity) into zustand store.
 * Preserves server quantity: inserts with that quantity or increments existing quantity by that amount.
 */
function upsertNormalizedFreeItemsFactory(
  useStoreHook: any,
  toastFn: (msg: string) => void,
) {
  return function upsertNormalizedFreeItems(normalizedForStore: any[]) {
    const storeAny: any = useStoreHook as any;

    type ItemShape = { product: any; quantity: number };

    // Prefer reading/writing the store directly via getState/setState (works with your current store)
    if (
      typeof storeAny?.getState === "function" &&
      typeof storeAny?.setState === "function"
    ) {
      const prev = (storeAny.getState().items ?? []) as ItemShape[];

      const map = new Map<string, ItemShape>(
        (prev as ItemShape[]).map((it) => [
          it.product._id ?? (it.product as any).id,
          it,
        ]),
      );

      for (const p of normalizedForStore) {
        const key = p._id ?? p.id;
        const qty = Number(p.quantity ?? 1);
        if (!map.has(key)) {
          map.set(key, { product: p, quantity: qty });
        } else {
          const existing = map.get(key)!;
          existing.quantity = (existing.quantity ?? 0) + qty;
          map.set(key, existing);
        }
      }

      storeAny.setState({ items: Array.from(map.values()) });
      toastFn(`Added ${normalizedForStore.length} free item(s) to cart`);
      return;
    }

    // If that isn't available, fall back to calling addItem if it exists (try to pass qty)
    const addItemFn = storeAny?.getState?.().addItem ?? undefined;
    if (typeof addItemFn === "function") {
      for (const p of normalizedForStore) {
        const qty = Number(p.quantity ?? 1);
        try {
          if (addItemFn.length === 2) {
            addItemFn(p, qty);
          } else {
            // call addItem multiple times if it only accepts single increment
            for (let i = 0; i < qty; i++) addItemFn(p);
          }
        } catch (e) {
          console.warn("addItem fallback failed for", p, e);
        }
      }
      toastFn(`Added ${normalizedForStore.length} free item(s) to cart`);
      return;
    }

    // Last-resort: try setCartItems if exposed (functional form)
    const setCartItemsFn = storeAny?.getState?.().setCartItems ?? undefined;
    if (typeof setCartItemsFn === "function") {
      setCartItemsFn((prev: ItemShape[] = []) => {
        const m = new Map<string, ItemShape>(
          (prev as ItemShape[]).map((it) => [
            it.product._id ?? (it.product as any).id,
            it,
          ]),
        );
        for (const p of normalizedForStore) {
          const key = p._id ?? p.id;
          const qty = Number(p.quantity ?? 1);
          if (!m.has(key)) m.set(key, { product: p, quantity: qty });
          else {
            const existing = m.get(key)!;
            existing.quantity = (existing.quantity ?? 0) + qty;
            m.set(key, existing);
          }
        }
        return Array.from(m.values());
      });
      toastFn(`Added ${normalizedForStore.length} free item(s) to cart`);
      return;
    }

    // Otherwise, nothing worked — show a message
    toastFn(
      `Coupon applied — server provided ${normalizedForStore.length} free item(s). Please refresh if they're not visible.`,
    );
    console.warn(
      "Could not programmatically add normalized free items:",
      normalizedForStore,
    );
  };
}

function getUserEmail(user: unknown): string | undefined {
  try {
    const u = user as any;
    if (!u) return undefined;
    if (u.primaryEmailAddress?.emailAddress)
      return String(u.primaryEmailAddress.emailAddress);
    if (Array.isArray(u.emailAddresses) && u.emailAddresses[0]?.emailAddress) {
      return String(u.emailAddresses[0].emailAddress);
    }
    if (typeof u.email === "string") return u.email;
  } catch {
    // ignore
  }
  return undefined;
}

function getUserPhone(user: unknown): string | undefined {
  try {
    const u = user as any;
    if (!u) return undefined;
    if (
      Array.isArray(u.phoneNumbers) &&
      (u.phoneNumbers[0]?.phoneNumber || u.phoneNumbers[0]?.phone)
    ) {
      return String(u.phoneNumbers[0]?.phoneNumber ?? u.phoneNumbers[0]?.phone);
    }
    if (typeof u.phoneNumber === "string") return u.phoneNumber;
  } catch {
    // ignore
  }
  return undefined;
}

function makeClientUUID(): string {
  try {
    // @ts-ignore - available in modern browsers
    if (
      typeof crypto !== "undefined" &&
      typeof (crypto as any).randomUUID === "function"
    ) {
      // @ts-ignore
      return (crypto as any).randomUUID();
    }
  } catch {
    // ignore
  }
  return "id-" + Math.random().toString(36).slice(2, 11);
}

const CartPage: React.FC = () => {
  const router = useRouter();

  // attempt to extract common store helpers — some may be undefined depending on your store.
  const {
    deleteCartProduct,
    getTotalPrice,
    getItemCount,
    getSubTotalPrice,
    resetCart,
    getGroupedItems,
    // prefer the store's addItem (your store implements addItem)
    // note: if your store doesn't expose addItem via hook, upsertNormalizedFreeItems will fall back to direct setState
    addItem,
    // optional legacy helpers for adding items — may or may not exist in your store
    addToCart,
    addProduct,
    setCartItems,
  } = useStore() as any;

  const groupedItems = useStore((state) => state.getGroupedItems());
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [addresses, setAddresses] = useState<AddressDoc[] | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<AddressDoc | null>(
    null,
  );

  // controlled radio value
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  // --- Shipping configuration ---
  const SHIPPING_FEE = 59;
  const FREE_SHIPPING_THRESHOLD = 699;

  const computeShipping = (productsTotal: number) => {
    if (!productsTotal || productsTotal <= 0) return 0;
    return productsTotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  };

  // --- UPDATED: fetch only addresses for current logged-in user's email ---
  const fetchAddresses = async () => {
    try {
      const email = getUserEmail(user);

      if (!email) {
        setAddresses([]);
        setSelectedAddress(null);
        setSelectedAddressId("");
        return;
      }

      const query = `*[_type == "address" && email == $email] 
                     | order(default desc, createdAt desc)`;
      const params = { email };

      const data = (await client.fetch(query, params)) as
        | AddressDoc[]
        | undefined;

      setAddresses(data ?? []);

      const defaultAddress = (data ?? []).find((addr) => addr?.default);

      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
        setSelectedAddressId(defaultAddress._id ?? "");
      } else if ((data ?? []).length > 0) {
        setSelectedAddress(data![0]);
        setSelectedAddressId(data![0]._id ?? "");
      } else {
        setSelectedAddress(null);
        setSelectedAddressId("");
      }
    } catch (error: unknown) {
      console.log("Addresses fetching error:", error);
    }
  };

  useEffect(() => {
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleResetCart = () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset your cart?",
    );
    if (confirmed) {
      resetCart();
      toast.success("Cart reset successfully!");
    }
  };

  // --------- Coupon state & helpers ----------
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponApplying, setCouponApplying] = useState<boolean>(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null,
  );
  const [couponError, setCouponError] = useState<string | null>(null);

  const displaySubTotal = getSubTotalPrice();
  const displayProductsTotal = getTotalPrice(); // assume product-level discounts (not coupon) are already applied here

  const displayShipping = computeShipping(displayProductsTotal);
  // couponDiscountTotal is the amount returned by the coupon endpoint (applies to the cart total)
  const couponDiscountTotal =
    appliedCoupon ? Number(appliedCoupon.discount ?? 0) : 0;

  // Final total used for checkout (products + shipping - coupon)
  const displayFinalTotal = Math.round(
    (displayProductsTotal ?? 0) + displayShipping - couponDiscountTotal,
  );

  // factory for upsert helper bound to our store and toast
  const upsertNormalizedFreeItems = upsertNormalizedFreeItemsFactory(
    useStore,
    (m: string) => toast.success(m),
  );
  // NEW: Available Coupons state
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);

  // Fetch available coupons automatically
  useEffect(() => {
    async function load() {
      setLoadingCoupons(true);
      try {
        const res = await fetch(
          `/api/available-coupons?cartTotal=${displayProductsTotal}`,
        );
        const data = await res.json();
        setAvailableCoupons(data.coupons || []);
      } catch (err) {
        console.log("coupon list error:", err);
      }
      setLoadingCoupons(false);
    }

    if (displayProductsTotal > 0) load();
  }, [displayProductsTotal]);

  // Apply coupon using App Router route /api/apply-coupon (this route should return {discount, newTotal, code, freeItems?})
  const handleApplyCoupon = async () => {
    setCouponError(null);

    const code = couponCode.trim();
    if (!code) {
      setCouponError("Enter a coupon code");
      return;
    }

    setCouponApplying(true);

    type ServerFreeItem = {
      _id?: string;
      id?: string;
      title?: string;
      name?: string;
      type?: string; // "product" | "freeGift"
      slug?: any;
      price?: number;
      originalPrice?: number;
      imageUrl?: string | null;
      images?: any[];
      quantity?: number;
    };

    try {
      const productsTotal = Number(displayProductsTotal ?? 0);

      const vRes = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, cartTotal: productsTotal }),
      });

      const vJson = await vRes.json();

      if (!vRes.ok) {
        setCouponError(vJson?.error || "Invalid coupon");
        setAppliedCoupon(null);
        setCouponApplying(false);
        return;
      }

      const minCartValue: number | null = vJson.minCartValue ?? null;
      if (minCartValue !== null && productsTotal < Number(minCartValue)) {
        setCouponError(
          `This coupon requires products amount of at least ₹${minCartValue}. Your current products amount is ₹${productsTotal}.`,
        );
        setAppliedCoupon(null);
        setCouponApplying(false);
        return;
      }

      const clerkUserId =
        (user as any)?.id ?? (user as any)?.userId ?? undefined;
      const payload = { code, userId: clerkUserId, cartTotal: productsTotal };

      const res = await fetch("/api/apply-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setCouponError(json?.error || "Failed to apply coupon");
        setAppliedCoupon(null);
        setCouponApplying(false);
        return;
      }

      // --- Free items handling (normalize + upsert with server quantity) ---
      if (Array.isArray(json.freeItems) && json.freeItems.length > 0) {
        const serverFree = json.freeItems as ServerFreeItem[];

        // normalize into Product-shaped objects and carry server quantity
        const normalizedForStore = serverFree.map((fi, idx) => {
          const prod = normalizeFreeItemToProduct(fi, idx);
          (prod as any).quantity = fi.quantity ?? 1;
          return prod;
        });

        try {
          // use reliable upsert helper that respects quantity
          upsertNormalizedFreeItems(normalizedForStore);
        } catch (errAdd: any) {
          console.error("Error adding free items to store:", errAdd);
          toast.success(
            `Coupon applied — free items returned by server. Please refresh to see them.`,
          );
        }

        // Debug logs
        try {
          console.log("server freeItems raw:", json.freeItems);
          const storeAny: any = useStore as any;
          if (typeof storeAny.getState === "function") {
            console.log(
              "store.getState().items (after add):",
              storeAny.getState().items,
            );
          }
          console.log("local groupedItems selector (current):", groupedItems);
        } catch (e) {
          console.warn("store debug failed", e);
        }

        // set coupon state
        const applied: AppliedCoupon = {
          success: true,
          code: json.code,
          discount: Number(json.discount ?? 0),
          newTotal: Number(json.newTotal ?? productsTotal),
        };

        setAppliedCoupon(applied);
        setCouponError(null);
        setCouponApplying(false);
        return;
      }

      // no free items — regular coupon
      const applied: AppliedCoupon = {
        success: true,
        code: json.code,
        discount: Number(json.discount ?? 0),
        newTotal: Number(json.newTotal ?? productsTotal - (json.discount ?? 0)),
      };

      setAppliedCoupon(applied);
      setCouponError(null);
      toast.success(
        `Coupon ${applied.code} applied — saved ${applied.discount}`,
      );
    } catch (err: any) {
      console.error("apply coupon error:", err);
      setCouponError(err?.message ?? "Error applying coupon");
      setAppliedCoupon(null);
    } finally {
      setCouponApplying(false);
    }
  };

  // put this inside your CartPage component (near other helpers)

  function isFreeProductShape(p: any, couponCodeToMatch?: string) {
    if (!p) return false;
    try {
      if (p.isFree) return true;
      const id = String(p._id ?? p.id ?? "");
      if (id.startsWith("free-")) return true;
      if (p.meta && (p.meta.sourceType === "freeGift" || p.meta.isFree))
        return true;
      if (
        couponCodeToMatch &&
        p.meta &&
        p.meta.fromCoupon &&
        String(p.meta.fromCoupon) === couponCodeToMatch
      )
        return true;
    } catch {
      /* ignore */
    }
    return false;
  }

  async function removeFreeItemsFromCart(couponCodeToMatch?: string) {
    const storeAny: any = useStore as any;

    // 1) Prefer setCartItems functional update if available (safe & atomic)
    if (typeof setCartItems === "function") {
      setCartItems((prev: any[] = []) => {
        // prev shape in your store sometimes is Array<{ product, quantity }> or array of products — handle both
        return prev.filter((it: any) => {
          const product = it?.product ?? it;
          return !isFreeProductShape(product, couponCodeToMatch);
        });
      });
      return true;
    }

    // 2) If direct getState/setState available (zustand)
    if (
      typeof storeAny?.getState === "function" &&
      typeof storeAny?.setState === "function"
    ) {
      const prev =
        storeAny.getState().items ?? storeAny.getState().cartItems ?? [];
      const filtered = (prev as any[]).filter((it: any) => {
        const product = it?.product ?? it;
        return !isFreeProductShape(product, couponCodeToMatch);
      });
      // try both possible keys 'items' and 'cartItems' depending on your store shape
      if (Array.isArray(storeAny.getState().items)) {
        storeAny.setState({ items: filtered });
      } else if (Array.isArray(storeAny.getState().cartItems)) {
        storeAny.setState({ cartItems: filtered });
      } else {
        // generic fallback: set both
        storeAny.setState({ items: filtered, cartItems: filtered });
      }
      return true;
    }

    // 3) Fallback: if deleteCartProduct exists (will remove by id)
    if (typeof deleteCartProduct === "function") {
      // get grouping to find free items
      const current = (groupedItems ?? []) as any[];
      current.forEach(({ product }: any) => {
        try {
          if (isFreeProductShape(product, couponCodeToMatch)) {
            // delete by product._id if available, else try product.id
            const pid = product?._id ?? product?.id;
            if (pid) deleteCartProduct(pid);
          }
        } catch (e) {
          console.warn("deleteCartProduct failed for", product, e);
        }
      });
      return true;
    }

    // 4) Last resort: notify user to refresh (should rarely happen)
    return false;
  }

  const handleRemoveCoupon = async () => {
    const couponCodeToMatch = appliedCoupon?.code ?? couponCode ?? undefined;

    // remove free items first
    try {
      const removed = await removeFreeItemsFromCart(couponCodeToMatch);

      // Clear coupon UI state
      setAppliedCoupon(null);
      setCouponCode("");
      setCouponError(null);

      if (removed) {
        toast.success("Coupon removed from cart");
      } else {
        toast(
          "Coupon removed. Free items may still be present — refresh to update cart.",
        );
      }
    } catch (err) {
      console.error("remove coupon/free items error:", err);

      setAppliedCoupon(null);
      setCouponCode("");
      setCouponError(null);
      toast.error(
        "Coupon removed, but removing free items failed. Check console.",
      );
    }
  };

  function productCouponDiscount(productPrice: number) {
    const productsTotal = Number(displayProductsTotal ?? 0);
    if (!productsTotal || productPrice <= 0 || couponDiscountTotal <= 0)
      return 0;

    const proportional = (productPrice / productsTotal) * couponDiscountTotal;
    return Math.round(proportional * 100) / 100;
  }

  const [loading, setLoading] = useState(false);

  const handleProceedToCheckout = async () => {
  try {
    if (loading) return;

    if (!selectedAddressId || !selectedAddress) {
      toast.error("Please add or select a delivery address before checkout.");
      return;
    }

    if (!groupedItems || groupedItems.length === 0) {
      toast.error("Cart is empty.");
      return;
    }

    setLoading(true);

    // 🔥 Generate Order ID
    const randomCode = Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();
    const orderId = `ORD-${randomCode}`;
    const orderDate = new Date().toISOString();

    const clerkUserId = user?.id;

    const customerName =
      (user &&
        (user.fullName ??
          `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim())) ||
      selectedAddress?.name ||
      "";

    const customerEmail = getUserEmail(user) ?? "";

    // ✅ FIXED PHONE SOURCE
    const customerPhone =
      selectedAddress?.phone ||
      getUserPhone(user) ||
      "";

    if (!customerPhone) {
      toast.error("Phone number is required before checkout.");
      setLoading(false);
      return;
    }

    const subtotal = getSubTotalPrice();
    const shippingCharge = computeShipping(subtotal);
    const productsTotal = getTotalPrice();

    const finalTotal = Math.round(
      (productsTotal ?? 0) + shippingCharge - couponDiscountTotal
    );

    if (!finalTotal || finalTotal <= 0) {
      toast.error("Invalid total amount.");
      setLoading(false);
      return;
    }

    // ✅ Prepare Products for Sanity
    const productsForSanity = groupedItems.map(({ product }) => ({
      _key: product?._id,
      product: {
        _type: "reference",
        _ref: product?._id,
      },
      quantity: getItemCount(product?._id ?? "") || 1,
    }));

    // ✅ Save Order
    const saveRes = await fetch("/api/whatsapp-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        orderDate,
        clerkUserId,
        customerName,
        email: customerEmail,
        phone: customerPhone,
        address: selectedAddress,
        products: productsForSanity,
        subtotal,
        shipping: shippingCharge,
        couponDiscount: couponDiscountTotal,
        total: finalTotal,
        status: "pending",
        paymentMethod: "WhatsApp",
      }),
    });

    if (!saveRes.ok) {
      const errorText = await saveRes.text();
      console.error("Order save failed:", errorText);
      toast.error("Failed to save order.");
      setLoading(false);
      return;
    }

    const saveJson = await saveRes.json();

    if (!saveJson.success) {
      toast.error("Failed to save order.");
      setLoading(false);
      return;
    }

    // ✅ PROFESSIONAL WHATSAPP MESSAGE (CLEAN FORMAT)
    let message = `
🧾 NEW ORDER RECEIVED
━━━━━━━━━━━━━━━━━━

Order Details
Order ID: ${orderId}
Order Date: ${new Date(orderDate).toLocaleString("en-IN")}

Customer Information
Name: ${customerName}
Phone: ${customerPhone}
Email: ${customerEmail}

Delivery Address
${selectedAddress?.name || ""}
${selectedAddress?.address}
${selectedAddress?.city}, ${selectedAddress?.state} - ${selectedAddress?.zip}

Order Summary
━━━━━━━━━━━━━━━━━━
`;

    groupedItems.forEach(({ product }) => {
      const qty = getItemCount(product?._id ?? "") || 1;
      const price = product?.price ?? 0;
      const itemTotal = price * qty;

      message += `
${product?.name}
Qty: ${qty} × ₹${price}
Line Total: ₹${itemTotal}
`;
    });

    message += `
━━━━━━━━━━━━━━━━━━
Subtotal: ₹${subtotal}
Discount: -₹${couponDiscountTotal}
Shipping: ₹${shippingCharge}
━━━━━━━━━━━━━━━━━━
Grand Total: ₹${finalTotal}

Kindly confirm this order and proceed with processing.
Thank you.
`;

    const phoneNumber = "919495217987"; // your business WhatsApp number
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    // ✅ Open WhatsApp
    window.open(whatsappURL, "_blank");

    // ✅ Clear Cart
    resetCart();

    // ✅ Redirect
    router.push(`/order/confirm?orderNumber=${orderId}`);

    setLoading(false);
  } catch (err: any) {
    console.error("Checkout error:", err);
    toast.error("Checkout failed.");
    setLoading(false);
  }
};

  return (
    <div className="bg-gray-50 pb-52 md:pb-10">
      {isSignedIn ?
        <Container>
          {groupedItems && groupedItems.length ?
            <>
              <div className="flex items-center gap-2 py-5">
                <ShoppingBag className="text-darkColor" />
                <Title>Shopping Cart</Title>
              </div>
              <div className="grid lg:grid-cols-3 md:gap-8">
                <div className="lg:col-span-2 rounded-lg">
                  <div className="border bg-white rounded-md">
                    {groupedItems.map(({ product }, idx) => {
                      const itemCount = getItemCount(product?._id ?? "") || 1;
                      const key =
                        product?._id ??
                        product?.slug?.current ??
                        `product-${idx}`;

                      // safer image resolution: prefer asset.url if present, otherwise try urlFor when asset._ref exists
                      let imageSrc = "/placeholder.png";
                      const firstImg =
                        product?.images && product.images.length ?
                          product.images[0]
                        : undefined;

                      if (firstImg) {
                        const asset = (firstImg as any).asset;
                        if (
                          asset &&
                          typeof asset === "object" &&
                          typeof (asset as any).url === "string" &&
                          (asset as any).url
                        ) {
                          imageSrc = (asset as any).url;
                        } else if (
                          asset &&
                          typeof asset === "object" &&
                          typeof (asset as any)._ref === "string" &&
                          (asset as any)._ref
                        ) {
                          try {
                            imageSrc = urlFor(firstImg).url();
                          } catch {
                            imageSrc = "/placeholder.png";
                          }
                        } else if (typeof firstImg === "string") {
                          imageSrc = firstImg;
                        } else if (
                          (firstImg as any).url &&
                          typeof (firstImg as any).url === "string"
                        ) {
                          imageSrc = (firstImg as any).url;
                        } else {
                          try {
                            imageSrc = urlFor(firstImg).url();
                          } catch {
                            imageSrc = "/placeholder.png";
                          }
                        }
                      }

                      const productPrice =
                        (product?.price as number) * itemCount;
                      const prodCouponDiscount =
                        productCouponDiscount(productPrice);

                      return (
                        <div
                          key={key}
                          className="border-b p-2.5 last:border-b-0 flex items-center justify-between gap-5"
                        >
                          <div className="flex flex-1 items-start gap-2 h-36 md:h-44">
                            {product && product.images && (
                              <Link
                                href={`/product/${product?.slug?.current ?? ""}`}
                                className="border p-0.5 md:p-1 mr-2 rounded-md overflow-hidden group"
                              >
                                <img
                                  src={imageSrc ?? "/placeholder.png"}
                                  alt="productImage"
                                  width={500}
                                  height={500}
                                  loading="lazy"
                                  className="w-32 md:w-40 h-32 md:h-40 object-cover group-hover:scale-105 hoverEffect"
                                />
                              </Link>
                            )}
                            <div className="h-full flex flex-1 flex-col justify-between py-1">
                              <div className="flex flex-col gap-0.5 md:gap-1.5">
                                <h2 className="text-base font-semibold line-clamp-1">
                                  {product?.name ?? ""}
                                </h2>
                                <p className="text-sm capitalize">
                                  Variant:{" "}
                                  <span className="font-semibold">
                                    {product?.variant ?? ""}
                                  </span>
                                </p>
                                <p className="text-sm capitalize">
                                  Status:{" "}
                                  <span className="font-semibold">
                                    {product?.status ?? ""}
                                  </span>
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <AddToWishlistButton
                                        product={product!}
                                        className="relative top-0 right-0"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent className="font-bold">
                                      Add to Favorite
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Trash
                                        onClick={() => {
                                          deleteCartProduct(product?._id ?? "");
                                          toast.success(
                                            "Product deleted successfully!",
                                          );
                                        }}
                                        className="w-4 h-4 md:w-5 md:h-5 mr-1 text-gray-500 hover:text-red-600 hoverEffect"
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent className="font-bold bg-red-600">
                                      Delete product
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-start justify-between h-36 md:h-44 p-0.5 md:p-1">
                            <div className="text-right">
                              <PriceFormater
                                amount={productPrice}
                                className="font-bold text-lg"
                              />
                              {prodCouponDiscount > 0 && (
                                <div className="text-sm text-green-600">
                                  -{" "}
                                  <PriceFormater amount={prodCouponDiscount} />
                                  <span className="ml-2 text-xs text-gray-500">
                                    coupon
                                  </span>
                                </div>
                              )}
                            </div>
                            <QuantityButton product={product} />
                          </div>
                        </div>
                      );
                    })}
                    {/* NEW: AVAILABLE COUPONS SECTION (C1 placement) */}
                    <div className="border-t p-4">
                      <button
                        onClick={() => setShowCoupons((prev) => !prev)}
                        className="w-full flex items-center justify-between font-semibold text-left"
                      >
                        <span>Available Coupons</span>
                        {showCoupons ?
                          <ChevronUp className="w-5 h-5" />
                        : <ChevronDown className="w-5 h-5" />}
                      </button>

                      {showCoupons && (
                        <div className="mt-3 bg-gray-50 rounded-md p-3 border">
                          {loadingCoupons ?
                            <p className="text-sm text-gray-500">
                              Loading offers…
                            </p>
                          : availableCoupons.length === 0 ?
                            <p className="text-sm text-gray-500">
                              No available coupons right now
                            </p>
                          : <div className="space-y-2">
                              {availableCoupons.map((c: any, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between bg-white p-2 border rounded-md"
                                >
                                  <div>
                                    <p className="font-semibold text-sm">
                                      {c.code}
                                    </p>
                                    {c.description && (
                                      <p className="text-xs text-gray-600">
                                        {c.description}
                                      </p>
                                    )}
                                    {c.minimumCartValue && (
                                      <p className="text-[11px] text-gray-500">
                                        Min cart: ₹{c.minimumCartValue}
                                      </p>
                                    )}
                                  </div>

                                  <Button
                                    size="sm"
                                    className="text-xs"
                                    onClick={() => {
                                      setCouponCode(c.code);
                                      setShowCoupons(false);
                                      handleApplyCoupon();
                                    }}
                                  >
                                    Apply
                                  </Button>
                                </div>
                              ))}
                            </div>
                          }
                        </div>
                      )}
                    </div>

                    <div className="p-4 border-t">
                      <div className="flex gap-2 items-center">
                        <input
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Coupon code"
                          className="flex-1 border rounded p-2"
                        />
                        {!appliedCoupon ?
                          <Button
                            onClick={handleApplyCoupon}
                            disabled={couponApplying || !couponCode.trim()}
                            className="font-semibold"
                          >
                            {couponApplying ? "Applying..." : "Apply"}
                          </Button>
                        : <Button
                            onClick={handleRemoveCoupon}
                            variant="outline"
                            className="font-semibold"
                          >
                            Remove
                          </Button>
                        }
                      </div>
                      {couponError && (
                        <div className="text-red-600 mt-2">{couponError}</div>
                      )}
                      {appliedCoupon && (
                        <div className="mt-2 text-green-700 font-semibold">
                          Applied {appliedCoupon.code} — saved{" "}
                          <PriceFormater amount={appliedCoupon.discount} />
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleResetCart}
                      className="m-5 font-semibold"
                      variant="destructive"
                    >
                      Reset Cart
                    </Button>
                  </div>
                </div>

                <div>
                  <div className="lg:col-span-1">
                    <div className="hidden md:inline-block w-full bg-white p-6 rounded-lg border">
                      <h2 className="text-xl font-semibold mb-4">
                        Order Summary
                      </h2>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span>SubTotal</span>
                          <PriceFormater amount={displaySubTotal} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Discount</span>
                          <PriceFormater
                            amount={displaySubTotal - displayProductsTotal}
                          />
                        </div>

                        {/* new coupon discount row */}
                        <div className="flex items-center justify-between">
                          <span>Coupon discount</span>
                          <div className="text-right">
                            {couponDiscountTotal > 0 ?
                              <PriceFormater
                                amount={-Math.abs(couponDiscountTotal)}
                              />
                            : <span className="text-gray-500">—</span>}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span>Shipping</span>
                          <PriceFormater amount={displayShipping} />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between font-semibold text-lg">
                          <span>Total</span>
                          <PriceFormater
                            amount={displayFinalTotal}
                            className="text-lg font-bold text-black"
                          />
                        </div>
                        <Button
                          className="w-full rounded-full font-semibold tracking-wide hoverEffect bg-green-600 hover:bg-green-700 text-white"
                          size="lg"
                          disabled={loading || !selectedAddressId}
                          onClick={handleProceedToCheckout}
                        >
                          {loading ?
                            "Opening WhatsApp..."
                          : <span className="flex items-center justify-center gap-2">
                              <MessageCircle size={18} />
                              Checkout on WhatsApp
                            </span>
                          }
                        </Button>
                      </div>
                    </div>

                    {addresses && (
                      <div className="bg-white rounded-md mt-5">
                        <Card>
                          <CardHeader>
                            <CardTitle>Delivery Address</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <RadioGroup
                              value={selectedAddressId}
                              onValueChange={(val) => {
                                setSelectedAddressId(val);
                                const found = (addresses ?? []).find(
                                  (a) => a._id === val,
                                );
                                setSelectedAddress(found ?? null);
                              }}
                            >
                              {addresses.map((address) => (
                                <div
                                  key={address?._id ?? ""}
                                  className={`flex items-center space-x-2 mb-4 cursor-pointer ${selectedAddress && selectedAddress._id === address?._id ? "text-shop_dark_green" : ""}`}
                                >
                                  <RadioGroupItem value={address?._id ?? ""} />
                                  <Label
                                    htmlFor={`address-${address?._id ?? ""}`}
                                    className="grid gap-1.5 flex-1"
                                  >
                                    <span className="font-semibold">
                                      {address?.name ?? ""}
                                    </span>

                                    {/* ✅ Show Phone Number */}
                                    {address?.phone && (
                                      <span className="text-sm text-black/60">
                                        📞 {address.phone}
                                      </span>
                                    )}

                                    <span className="text-sm text-black/60">
                                      {`${address?.address ?? ""}, ${address?.city ?? ""} ${address?.state ?? ""} ${address?.zip ?? ""}`}
                                    </span>
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>

                            <AddAddressModal
                              email={getUserEmail(user) ?? ""}
                              onSaved={() => {
                                // refresh address list after saving
                                fetchAddresses();
                                toast.success("Address saved");
                              }}
                            >
                              <Button variant="outline" className="w-full mt-4">
                                Add New Address
                              </Button>
                            </AddAddressModal>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:hidden fixed bottom-0 left-0 w-full bg-white pt-2">
                  <div className="bg-white p-4 rounded-lg border mx-4">
                    <h2>Order Summary</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span>SubTotal</span>
                        <PriceFormater amount={displaySubTotal} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Discount</span>
                        <PriceFormater
                          amount={displaySubTotal - displayProductsTotal}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Coupon discount</span>
                        {couponDiscountTotal > 0 ?
                          <PriceFormater
                            amount={-Math.abs(couponDiscountTotal)}
                          />
                        : <span className="text-gray-500">—</span>}
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Shipping</span>
                        <PriceFormater amount={displayShipping} />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between font-semibold text-lg">
                        <span>Total</span>
                        <PriceFormater
                          amount={displayFinalTotal}
                          className="text-lg font-bold text-black"
                        />
                      </div>
                      <Button
                        className="w-full rounded-full font-semibold tracking-wide hoverEffect bg-green-600 hover:bg-green-700"
                        size="lg"
                        disabled={loading || !selectedAddressId}
                        onClick={handleProceedToCheckout}
                      >
                        {loading ?
                          "Opening WhatsApp..."
                        : <span className="flex items-center justify-center gap-2">
                            <MessageCircle size={18} />
                            Checkout on WhatsApp
                          </span>
                        }
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          : <EmptyCart />}
        </Container>
      : <NoAccessToCart />}
    </div>
  );
};

export default CartPage;
