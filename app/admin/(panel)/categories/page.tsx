"use client";

import { useEffect, useState } from "react";

interface Category {
  _id: string;
  title: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // 🔄 Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ➕ Add category
  const addCategory = async () => {
    if (!newCategory.trim()) return;

    await fetch("/api/categories", {
      method: "POST",
      body: JSON.stringify({ title: newCategory }),
    });

    setNewCategory(""); // ✅ always string
    fetchCategories();
  };

  // ✏️ Start editing
  const startEdit = (cat: Category) => {
    setEditingId(cat._id);
    setEditingValue(cat.title || ""); // ✅ prevent undefined
  };

  // ✏️ Update category
  const updateCategory = async (id: string) => {
    if (!editingValue.trim()) return;

    await fetch("/api/categories", {
      method: "PUT",
      body: JSON.stringify({ id, title: editingValue }),
    });

    setEditingId(null);
    setEditingValue("");
    fetchCategories();
  };

  // ❌ Delete category
  const deleteCategory = async (id: string) => {
    await fetch(`/api/categories?id=${id}`, {
      method: "DELETE",
    });

    fetchCategories();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#16a34a]">
          Poster Categories
        </h1>
        <p className="text-gray-500 text-sm">
          Manage your poster categories
        </p>
      </div>

      {/* Add Category */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex gap-3">
        <input
          type="text"
          placeholder="New category name"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
        />

        <button
          onClick={addCategory}
          className="bg-[#16a34a] text-white px-5 py-2 rounded-lg hover:opacity-90"
        >
          Add
        </button>
      </div>

      {/* Categories List */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {categories.length === 0 ? (
          <p className="text-gray-400 p-6">No categories yet</p>
        ) : (
          <div>
            {/* Header */}
            <div className="grid grid-cols-2 px-6 py-3 text-sm text-gray-500 border-b bg-gray-50">
              <span>Name</span>
              <span className="text-right">Actions</span>
            </div>

            {/* Rows */}
            {categories.map((cat, i) => (
              <div
                key={cat._id}
                className={`grid grid-cols-2 px-6 py-4 items-center text-sm ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-[#ecfdf5]`}
              >
                {/* Name / Edit Input */}
                <div>
                  {editingId === cat._id ? (
                    <input
                      value={editingValue || ""}
                      onChange={(e) => setEditingValue(e.target.value)}
                      className="px-3 py-1 border rounded-lg w-full"
                    />
                  ) : (
                    <span className="font-medium text-black">
                      {cat.title}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  {editingId === cat._id ? (
                    <>
                      <button
                        onClick={() => updateCategory(cat._id)}
                        className="text-green-600 hover:underline"
                      >
                        Save
                      </button>

                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditingValue("");
                        }}
                        className="text-gray-500 hover:underline"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(cat)}
                        className="text-blue-600 hover:underline"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteCategory(cat._id)}
                        className="text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}