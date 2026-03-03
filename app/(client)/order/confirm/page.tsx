// app/(path-to)/OrderConfirmPage.tsx
import React from "react";
import Link from "next/link";
import { client } from "@/sanity/lib/client";
import PriceFormater from "@/components/PriceFormater";
import { ShoppingBag } from "lucide-react";
import { urlFor } from "@/sanity/lib/image";

export const dynamic = "force-dynamic";

type SearchParams = {
  orderNumber?: string;
};

function formatDate(iso?: string) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default async function OrderConfirmPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const orderNumber = String(params?.orderNumber || "").trim();

  if (!orderNumber) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-6 rounded shadow max-w-lg w-full">
          <h1 className="text-xl font-semibold mb-4">Order not specified</h1>
          <Link href="/" className="bg-black text-white px-4 py-2 rounded">
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  const query = `*[_type == "order" && orderNumber == $orderNumber][0]{
    orderNumber,
    orderDate,
    customerName,
    email,
    phone,
    status,
    subtotal,
    shipping,
    couponDiscount,
    totalPrice,
    currency,
    address,
    products[]{
      quantity,
      product->{
        _id,
        name,
        price,
        images,
        slug,
        isFree
      }
    }
  }`;

  const order = await client.fetch(query, { orderNumber });

  if (!order) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white p-6 rounded shadow max-w-lg w-full">
          <h1 className="text-xl font-semibold mb-4">Order not found</h1>
          <p>Order ID: {orderNumber}</p>
          <Link href="/" className="bg-black text-white px-4 py-2 rounded mt-4 inline-block">
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  const {
    customerName,
    email,
    phone,
    status,
    subtotal,
    shipping,
    couponDiscount,
    totalPrice,
    currency,
    address,
    orderDate,
    products,
  } = order;

  const items = Array.isArray(products) ? products : [];

  const displaySubtotal = subtotal ?? 0;
  const displayDiscount = couponDiscount ?? 0;
  const displayShipping = shipping ?? 0;
  const displayTotal = totalPrice ?? 0;

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
        <div className="flex items-center gap-3 mb-6">
          <ShoppingBag className="text-green-600" />
          <div>
            <h1 className="text-2xl font-semibold">
              Order {String(status || "pending").toUpperCase()}
            </h1>
            <p className="text-sm text-gray-600">
              Order ID: <strong>{orderNumber}</strong>
            </p>
          </div>
        </div>

        {/* Items */}
        <h2 className="font-semibold mb-3">Items</h2>
        <div className="space-y-3">
          {items.map((item: any, index: number) => {
            const product = item.product;
            const qty = item.quantity ?? 1;
            const price = product?.price ?? 0;
            const total = price * qty;

            const image =
              product?.images?.length ? urlFor(product.images[0]).url() : "/placeholder.png";

            return (
              <div key={index} className="flex gap-4 border p-3 rounded">
                <img
                  src={image}
                  alt={product?.name}
                  className="w-20 h-20 object-cover rounded"
                />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{product?.name}</h3>
                    <PriceFormater amount={total} />
                  </div>
                  <p className="text-sm text-gray-600">Qty: {qty}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <PriceFormater amount={displaySubtotal} />
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Discount</span>
            <PriceFormater amount={displayDiscount} />
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Shipping</span>
            {displayShipping === 0 ? (
              <span>FREE</span>
            ) : (
              <PriceFormater amount={displayShipping} />
            )}
          </div>

          <div className="flex justify-between font-semibold text-lg border-t pt-2">
            <span>Total</span>
            <PriceFormater amount={displayTotal} />
          </div>
        </div>

        {/* Address + Customer */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold mb-2">Shipping Address</h4>
            {address ? (
              <div className="text-sm text-gray-700">
                <div>{address.name}</div>
                <div>{address.address}</div>
                <div>
                  {address.city}, {address.state} {address.zip}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No address recorded.</div>
            )}
          </div>

          <div>
            <h4 className="font-semibold mb-2">Customer</h4>
            <div className="text-sm text-gray-700">
              <div>{customerName}</div>
              <div>{email}</div>
              <div>{phone}</div>
              <div className="text-xs text-gray-500 mt-2">
                Ordered at: {formatDate(orderDate)}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link href="/" className="bg-black text-white px-4 py-2 rounded">
            Continue shopping
          </Link>
        </div>
      </div>
    </main>
  );
}