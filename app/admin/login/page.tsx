"use client";

import { useState } from "react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Enter username and password");
      return;
    }

    setError("");
    setLoading(true);

    const res = await fetch("/api/admin-login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setShowSuccess(true);

      setTimeout(() => {
        window.location.href = "/admin";
      }, 1200);
    } else {
      setError(data.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6fef9]">

      <div className="bg-white w-full max-w-sm p-8 rounded-2xl shadow-lg border border-gray-200">

        {/* Title */}
        <h1 className="text-2xl font-semibold text-center text-[#16a34a] mb-6">
          Admin Login
        </h1>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="flex flex-col gap-4"
        >

          <input
            autoFocus
            className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition"
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            className="border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#16a34a] transition"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Error Message */}
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-[#16a34a] text-white py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>

        </form>

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center mt-6">
          Nexaura Admin Access
        </p>

      </div>

      {/* ✅ SUCCESS MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">

          <div className="bg-white p-6 rounded-2xl shadow-lg text-center animate-fadeIn">

            <div className="text-green-600 text-4xl mb-2">✔</div>

            <p className="font-semibold text-lg">
              Login Successful
            </p>

          </div>

        </div>
      )}

    </div>
  );
}