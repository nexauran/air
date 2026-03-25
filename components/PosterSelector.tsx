"use client";

import { useEffect, useState } from "react";
import { urlFor } from "@/lib/imageUrl";

interface Poster {
  _id: string;
  title: string;
  image: any; // 🔥 important (Sanity image object)
}

interface Category {
  _id: string;
  title: string;
}

interface Props {
  enabled: boolean;
  limit: number;
  allowedCategories: string[];
  onChange?: (selected: Poster[]) => void;
}

const PosterSelector = ({
  enabled,
  limit,
  allowedCategories,
  onChange,
}: Props) => {
  const [step, setStep] = useState<"category" | "posters">("category");
  const [categories, setCategories] = useState<Category[]>([]);
  const [posters, setPosters] = useState<Poster[]>([]);
  const [selected, setSelected] = useState<Poster[]>([]);
  const [visibleCount, setVisibleCount] = useState(8);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // ✅ FETCH CATEGORIES
  useEffect(() => {
    if (!enabled) return;

    const fetchCategories = async () => {
      const res = await fetch("/api/categories");
      const data = await res.json();

      if (allowedCategories?.length > 0) {
        setCategories(
          data.filter((cat: Category) =>
            allowedCategories.includes(cat._id)
          )
        );
      } else {
        setCategories(data);
      }
    };

    fetchCategories();
  }, [enabled, allowedCategories]);

  // ✅ FETCH POSTERS
  const loadPosters = async (categoryId: string) => {
    setStep("posters");
    setActiveCategory(categoryId);

    const res = await fetch(`/api/posters?category=${categoryId}`);
    const data = await res.json();

    setPosters(data);
    setVisibleCount(8);
  };

  // ✅ SELECT / DESELECT
  const toggleSelect = (poster: Poster) => {
    let updated;

    const exists = selected.find((p) => p._id === poster._id);

    if (exists) {
      updated = selected.filter((p) => p._id !== poster._id);
    } else {
      if (selected.length >= limit) return;
      updated = [...selected, poster];
    }

    setSelected(updated);
    onChange?.(updated);
  };

  if (!enabled) return null;

  return (
    <div className="mt-6 border-t pt-6 space-y-4">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          Select Posters ({selected.length}/{limit})
        </h2>

        {categories.length > 0 && (
          <button
            onClick={() => setStep("category")}
            className="px-4 py-1 text-sm border rounded-full bg-gray-100 hover:bg-black hover:text-white transition"
          >
            {step === "posters"
              ? categories.find((c) => c._id === activeCategory)?.title ||
                "Change"
              : "All"}
          </button>
        )}
      </div>

      {/* CATEGORY GRID */}
      {step === "category" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat._id}
              onClick={() => loadPosters(cat._id)}
              className="border p-4 rounded-lg cursor-pointer hover:shadow-md text-center"
            >
              {cat.title}
            </div>
          ))}
        </div>
      )}

      {/* POSTERS GRID */}
      {step === "posters" && (
        <div>

          <button
            onClick={() => setStep("category")}
            className="mb-4 text-sm underline"
          >
            ← Back to Categories
          </button>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {posters.slice(0, visibleCount).map((poster) => {
              const isSelected = selected.find((p) => p._id === poster._id);

              let imageUrl = "";

              try {
                imageUrl = poster.image
                  ? urlFor(poster.image).width(400).height(400).url()
                  : "/placeholder.png";
              } catch {
                imageUrl = "/placeholder.png";
              }

              return (
                <div
                  key={poster._id}
                  onClick={() => toggleSelect(poster)}
                  className={`border rounded-lg cursor-pointer relative overflow-hidden ${
                    isSelected ? "border-black" : ""
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={poster.title}
                    className="w-full h-40 object-cover"
                    loading="lazy"
                    onError={(e) =>
                      (e.currentTarget.src = "/placeholder.png")
                    }
                  />

                  {/* SELECT CHECK */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 rounded">
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* LOAD MORE */}
          {visibleCount < posters.length && (
            <button
              onClick={() => setVisibleCount((prev) => prev + 8)}
              className="mt-4 px-4 py-2 border rounded"
            >
              Load More
            </button>
          )}

        </div>
      )}
    </div>
  );
};

export default PosterSelector;