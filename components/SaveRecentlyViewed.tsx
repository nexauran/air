"use client";

import { useEffect } from "react";

export default function SaveRecentlyViewed({ product }: any) {

  useEffect(() => {

    const viewed = JSON.parse(
      localStorage.getItem("recentProducts") || "[]"
    );

    const updated = [
      product,
      ...viewed.filter((p: any) => p._id !== product._id),
    ].slice(0, 6);

    localStorage.setItem(
      "recentProducts",
      JSON.stringify(updated)
    );

  }, [product]);

  return null;
}