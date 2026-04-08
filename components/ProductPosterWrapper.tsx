/** @format */

"use client";

import { useState } from "react";
import PosterSelector from "./PosterSelector";

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
  const [selectedPosters, setSelectedPosters] = useState<Poster[]>([]);
  const [open, setOpen] = useState(false);

  const limit = product?.posterLimit || 3;

  return (
    <div className="w-full space-y-4">
      {/* 🔘 Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="w-full px-4 py-3 rounded-xl border bg-white hover:shadow-md flex items-center justify-between transition"
      >
        <span className="font-medium">
          {selectedPosters.length > 0
            ? `${selectedPosters.length} Posters Selected`
            : "Select Posters"}
        </span>

        <span className="text-sm text-gray-500">
          {selectedPosters.length}/{limit}
        </span>
      </button>

      {/* 💎 MODAL (FIXED VERSION) */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          {/* Modal Box */}
          <div
            className="relative w-[95%] max-w-2xl h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">
                Select Posters ({selectedPosters.length}/{limit})
              </h2>

              <button
                onClick={() => setOpen(false)}
                className="text-xl hover:opacity-70"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <PosterSelector
                enabled={product?.enablePosterSelection}
                limit={limit}
                allowedCategories={
                  product?.allowedCategories?.map((c: any) => c._id) || []
                }
                onChange={(posters: Poster[]) => {
                  const cleaned = posters.map((p, index) => ({
                    _type: "object",
                    id: p._id,
                    name:
                      p.title ||
                      p.name ||
                      p.posterName ||
                      `Poster ${index + 1}`,
                    image: {
                      _type: "image",
                      asset: {
                        _type: "reference",
                        _ref: p.image?.asset?._ref,
                      },
                    },
                  }));

                  setSelectedPosters(cleaned as any);
                }}
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-white">
              <button
                onClick={() => {
                  if (selectedPosters.length < limit) {
                    alert("Please select all posters");
                    return;
                  }
                  setOpen(false);
                }}
                className="w-full py-3 bg-black text-white rounded-xl font-semibold hover:opacity-90"
              >
                Done ({selectedPosters.length}/{limit})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPosterWrapper;