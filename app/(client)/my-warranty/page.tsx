"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { generateWarrantyCertificate } from "@/lib/generateWarrantyCertificate";

interface Warranty {
  _id: string;
  orderId: string;
  productName: string;
  productImage?: string;
  activatedAt: string;
  expiresAt: string;
}

export default function MyWarranty() {
  const { user, isLoaded, isSignedIn } = useUser();

  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const email = user.primaryEmailAddress?.emailAddress;

    fetch(`/api/warranty?email=${email}`)
      .then((res) => res.json())
      .then((data) => {
        setWarranties(data);
        setLoading(false);
      });
  }, [user]);

  /* Loading Screen */

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-r from-[#0f2a44] via-[#0b3c6f] to-[#0a4fa3]">
        <div className="flex flex-col items-center text-white">
          <div className="w-10 h-10 border-4 border-white/40 border-t-white rounded-full animate-spin mb-4" />
          <p className="text-lg">Loading your warranty...</p>
        </div>
      </div>
    );
  }

  /* Login Screen */

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-r from-[#0f2a44] via-[#0b3c6f] to-[#0a4fa3] px-6">

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-10 text-center text-white shadow-xl max-w-md w-full">

          <h2 className="text-3xl font-semibold mb-3">
            My Warranty
          </h2>

          <p className="text-gray-200 mb-6">
            Login to view your warranty details
          </p>

          <SignInButton mode="modal">
            <button className="w-full bg-white text-blue-900 font-semibold py-3 rounded-lg hover:bg-gray-200 transition">
              Sign in
            </button>
          </SignInButton>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-r from-[#0f2a44] via-[#0b3c6f] to-[#0a4fa3] py-20 px-6">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold text-white mb-10">
          My Warranty
        </h1>

        {/* Loading Cards */}

        {loading && (
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white/20 rounded-2xl h-44"
              />
            ))}
          </div>
        )}

        {/* Warranty Cards */}

        {!loading && (
          <div className="grid md:grid-cols-2 gap-6">
            {warranties.map((item) => {

              const start = new Date(item.activatedAt);
              const end = new Date(item.expiresAt);

              const startDate = start.toLocaleDateString();
              const endDate = end.toLocaleDateString();

              const total = end.getTime() - start.getTime();
              const used = Date.now() - start.getTime();

              const percent = Math.min(
                100,
                Math.max(0, (used / total) * 100)
              );

              const expired = percent >= 100;

              return (
                <div
                  key={item._id}
                  className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6 shadow-lg"
                >

                  {item.productImage && (
                    <img
                      src={item.productImage}
                      className="w-full h-44 object-cover rounded-lg mb-4"
                    />
                  )}

                  <h2 className="text-lg font-semibold text-white">
                    {item.productName}
                  </h2>

                  <p className="text-sm text-gray-200">
                    Order #{item.orderId}
                  </p>

                  <div className="flex justify-between mt-4 text-sm text-gray-200">
                    <span>{startDate}</span>
                    <span>{endDate}</span>
                  </div>

                  <div className="w-full h-3 bg-white/20 rounded-full mt-3 overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-green-400 to-blue-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <p className="text-xs mt-2 text-gray-200">
                    {expired ? "Warranty Expired" : "Warranty Active"}
                  </p>

                  <button
                    onClick={() =>
                      generateWarrantyCertificate({
                        productName: item.productName,
                        productImage: item.productImage,
                        orderId: item.orderId,
                        userEmail:
                          user?.primaryEmailAddress?.emailAddress,
                        activatedAt: item.activatedAt,
                        expiresAt: item.expiresAt,
                      })
                    }
                    className="mt-4 w-full bg-white text-blue-900 font-semibold py-2 rounded-lg hover:bg-gray-200 transition"
                  >
                    Download Warranty Certificate
                  </button>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
