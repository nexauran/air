"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function RecentlyViewed() {

  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const items = JSON.parse(
      localStorage.getItem("recentProducts") || "[]"
    );
    setProducts(items);
  }, []);

  if (!products.length) return null;

  return (
    <div className="py-10">

      <h2 className="text-2xl font-bold mb-6">
        Recently Viewed
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

        {products.map((item) => (

          <Link
            key={item._id}
            href={`/product/${item.slug.current}`}
          >

            <div className="border rounded-lg p-3 hover:shadow">

              <img
                src={item.images?.[0]?.asset?.url}
                className="w-full h-40 object-cover rounded"
              />

              <p className="mt-2 font-semibold">
                {item.name}
              </p>

            </div>

          </Link>

        ))}

      </div>

    </div>
  );
}