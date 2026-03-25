/** @format */

"use client";

import { useState } from "react";
import PosterSelector from "./PosterSelector";
import AddToCartButton from "./AddToCartButton";
import FavoriteButton from "./FavouriteButton";

/* ✅ FINAL Poster Type (TypeScript Safe) */
interface Poster {
  _id: string;
  title?: string;
  name?: string;
  posterName?: string;
  image: {
    asset?: {
      _ref?: string;
    };
  };
}

const ProductPosterWrapper = ({ product }: any) => {
  const [selectedPosters, setSelectedPosters] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full space-y-4">
      {/* 🔘 Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="w-full px-4 py-3 rounded-xl border bg-white/70 backdrop-blur flex items-center justify-between hover:shadow-md transition"
      >
        <span className="font-medium tracking-tight">
          {selectedPosters.length > 0
            ? `${selectedPosters.length} Posters Selected`
            : "Select Posters"}
        </span>

        <span className="text-sm text-gray-500">
          {selectedPosters.length}/{product?.posterLimit || 3}
        </span>
      </button>

      {/* Buttons Row */}
      <div className="w-full flex items-center gap-3">
        <div className="w-12.5 flex justify-center">
          <FavoriteButton showProduct={true} product={product} />
        </div>

        <div className="flex-1">
          <AddToCartButton
            product={product}
            selectedPosters={selectedPosters}
          />
        </div>
      </div>

      {/* 💎 Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-lg flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white w-[95%] max-w-xl h-[90vh] rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.25)] border border-white/20 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <h2 className="text-lg font-semibold">
                Select Posters
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              <PosterSelector
                enabled={product?.enablePosterSelection}
                limit={product?.posterLimit || 3}
                allowedCategories={
                  product?.allowedCategories?.map((c: any) => c._id) || []
                }

                onChange={(posters: Poster[]) => {
                  const cleaned = posters.map((p, index) => {
                    const name =
                      p.title ||
                      p.name ||
                      p.posterName ||
                      `Poster ${index + 1}`;

                    return {
                      _type: "object",
                      id: p._id,
                      name: name, // ✅ always valid
                      image: {
                        _type: "image",
                        asset: {
                          _type: "reference",
                          _ref: p.image?.asset?._ref,
                        },
                      },
                    };
                  });

                  setSelectedPosters(cleaned);
                }}
              />
            </div>

            {/* Footer */}
            <div className="p-5 border-t bg-white">
              <button
                onClick={() => {
                  if (
                    selectedPosters.length <
                    (product?.posterLimit || 3)
                  ) {
                    alert("Please select all posters");
                    return;
                  }

                  setOpen(false);
                }}
                className="w-full py-3 rounded-xl font-semibold text-white bg-black hover:opacity-90"
              >
                Done ({selectedPosters.length}/{product?.posterLimit || 3})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPosterWrapper;