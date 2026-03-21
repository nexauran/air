/** @format */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { client } from "@/sanity/lib/client";

import imageUrlBuilder from "@sanity/image-url";

const builder = imageUrlBuilder(client);
const urlFor = (src: any) => builder.image(src);

interface Poster {
  _id: string;
  title: string;
  image: any;
  category?: { _ref: string };
}

interface Category {
  _id: string;
  title: string;
}

export default function PostersPage() {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [editingPoster, setEditingPoster] = useState<Poster | null>(null);

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);

  // FETCH
  const fetchPosters = async () => {
    const data = await client.fetch(
      `*[_type=="poster"] | order(_createdAt desc)`,
    );
    setPosters(data);
  };

  const fetchCategories = async () => {
    const data = await client.fetch(`*[_type=="posterCategory"]{_id,title}`);
    setCategories(data);
  };

  useEffect(() => {
    fetchPosters();
    fetchCategories();
  }, []);

  // DROPZONE
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  // UPLOAD (safe version)
  const uploadImage = async () => {
    if (!file) return null;

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return data;
  };

  // CREATE
  const handleCreate = async () => {
    const image = await uploadImage();

    await fetch("/api/posters", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        image,
        category,
      }),
    });

    reset();
    fetchPosters();
  };

  const handleUpdate = async () => {
    let image = editingPoster?.image;

    if (file) image = await uploadImage();

    await fetch("/api/posters", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        _id: editingPoster!._id,
        title,
        image,
        category,
      }),
    });

    reset();
    fetchPosters();
  };

  const handleDelete = async (id: string) => {
  await fetch("/api/posters", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id }),
  });

  fetchPosters();
};

  const reset = () => {
    setEditingPoster(null);
    setTitle("");
    setFile(null);
    setCategory("");
    setUploadProgress(0);
  };

  return (
    <div className="bg-[#f6f7f8] min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-semibold">Posters</h1>

          <button
            onClick={() => setEditingPoster({} as Poster)}
            className="bg-green-500 text-white px-5 py-2 rounded-lg"
          >
            + New Poster
          </button>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {posters.map((poster) => (
            <div key={poster._id} className="bg-white p-3 rounded-xl shadow">
              <div className="aspect-6/4 bg-gray-100 rounded flex items-center justify-center">
                <img
                  src={urlFor(poster.image).width(600).url()}
                  className="max-h-full object-contain"
                />
              </div>

              <p className="mt-2 text-sm font-medium">{poster.title}</p>

              <div className="flex gap-3 mt-2 text-sm">
                <button
                  onClick={() => {
                    setEditingPoster(poster);
                    setTitle(poster.title);
                    setCategory(poster.category?._ref || "");
                  }}
                  className="text-blue-600"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(poster._id)}
                  className="text-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL */}
        {editingPoster && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white w-full max-w-lg p-6 rounded-xl">
              <h2 className="text-lg font-semibold mb-4">
                {editingPoster._id ? "Edit Poster" : "New Poster"}
              </h2>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Poster Name"
                className="w-full p-2 border rounded mb-3"
              />

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border rounded mb-3"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>

              {/* IMAGE PREVIEW */}
              {editingPoster.image && (
                <img
                  src={urlFor(editingPoster.image).url()}
                  className="max-h-[50vh] object-contain mb-3"
                />
              )}

              {/* DROPZONE */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed p-6 text-center rounded ${
                  isDragActive ? "border-green-500" : "border-gray-300"
                }`}
              >
                <input {...getInputProps()} />
                Drag & drop or click to upload
              </div>

              {file && (
                <img
                  src={URL.createObjectURL(file)}
                  className="max-h-40 mt-3 mx-auto"
                />
              )}

              {/* PROGRESS */}
              {uploadProgress > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 h-2 rounded">
                    <div
                      className="bg-green-500 h-2 rounded"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-5">
                <button
                  onClick={reset}
                  className="px-4 py-2 bg-gray-100 rounded"
                >
                  Cancel
                </button>

                <button
                  onClick={editingPoster._id ? handleUpdate : handleCreate}
                  className="px-5 py-2 bg-green-500 text-white rounded"
                >
                  {editingPoster._id ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
