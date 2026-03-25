/** @format */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function AdminLayout({ children }: any) {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [adminName, setAdminName] = useState("Admin");

  const menu = [
    { name: "Dashboard", path: "/admin" },
    { name: "Orders", path: "/admin/orders" },
    { name: "Messages", path: "/admin/messages" },
    { name: "Posters", path: "/admin/posters" },
    { name: "Categories", path: "/admin/categories" },
    { name: "Order Status", path: "/admin/order-status" },
  ];

  // 🔥 Get admin name from token
  useEffect(() => {
    const getAdmin = async () => {
      try {
        const res = await fetch("/api/admin-me");
        const data = await res.json();

        if (data?.username) {
          setAdminName(data.username);
        }
      } catch (err) {
        console.log("No admin");
      }
    };

    getAdmin();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/admin-logout");

    setShowLogoutModal(false);
    setShowToast(true);

    setTimeout(() => {
      window.location.href = "/admin/login";
    }, 1200);
  };

  return (
    <div className="h-screen overflow-hidden flex">
      {/* 📱 Mobile Top */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b px-4 flex items-center justify-between z-50 md:hidden">
        <h2 className="font-semibold text-[#16a34a]">Admin</h2>
        <button onClick={() => setOpen(true)}>☰</button>
      </div>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 🧱 Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white border-r p-5 z-50 transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <h2 className="text-xl font-semibold text-[#16a34a] mb-6">
          Admin Panel
        </h2>

        {/* Menu */}
        <div className="space-y-2">
          {menu.map((item) => {
            const isActive = pathname === item.path;

            return (
              <Link key={item.name} href={item.path}>
                <div
                  onClick={() => setOpen(false)}
                  className={`p-3 rounded-xl text-sm font-medium transition cursor-pointer
                  ${
                    isActive ?
                      "bg-[#16a34a] text-white shadow"
                    : "text-gray-700 hover:bg-[#ecfdf5]"
                  }`}
                >
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>

        {/* 👤 Bottom User */}
        <div className="absolute bottom-6 left-5 right-5 border-t pt-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#16a34a] text-white flex items-center justify-center text-sm font-semibold">
              {adminName?.charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="text-sm font-medium text-gray-800">{adminName}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* 📦 Content */}
      <main className="flex-1 h-screen overflow-y-auto bg-[#f6fef9] p-6 mt-16 md:mt-0 md:ml-64">
        {children}
      </main>

      {/* 🔥 Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowLogoutModal(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-sm animate-fadeIn">
            <h2 className="text-lg font-semibold mb-2">Logout</h2>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to logout?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg animate-slideIn">
          Logged out successfully
        </div>
      )}
    </div>
  );
}
