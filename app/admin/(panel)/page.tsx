/** @format */

import { client } from "@/sanity/lib/client";

export default async function AdminHome() {
  // ✅ IST-safe today date
  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  )
    .toISOString()
    .split("T")[0];

  // 🔥 Fetch all data
  const [products, ordersCount, orders, recentOrders, todayOrders] =
    await Promise.all([
      client.fetch(`count(*[_type == "product"])`),

      client.fetch(`count(*[_type == "order"])`),

      // ✅ fetch totals for revenue
      client.fetch(`*[_type == "order"]{
        totalPrice,
        total
      }`),

      // 📦 recent orders
      client.fetch(`
        *[_type == "order"] | order(_createdAt desc)[0...5]{
          _id,
          orderNumber,
          customerName,
          totalPrice,
          total
        }
      `),

      // 📅 today orders
      client.fetch(`
        count(*[
          _type == "order" &&
          _createdAt >= "${today}T00:00:00Z"
        ])
      `),
    ]);

  // 💰 Calculate revenue safely
  const revenue = orders?.reduce(
    (sum: number, order: any) =>
      sum + (order.totalPrice || order.total || 0),
    0
  );

  return (
    <div className="p-8 min-h-screen bg-[#f6fef9] space-y-8">

      {/* 👋 Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#16a34a]">
          Welcome Admin 🌿
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your store efficiently
        </p>
      </div>

      {/* 📊 Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Products */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
          <p className="text-gray-500 text-sm">Products</p>
          <h2 className="text-3xl font-semibold mt-2 text-black">
            {products}
          </h2>
        </div>

        {/* Orders */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
          <p className="text-gray-500 text-sm">Orders</p>
          <h2 className="text-3xl font-semibold mt-2 text-black">
            {ordersCount}
          </h2>
        </div>

        {/* Today Orders */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
          <p className="text-gray-500 text-sm">Today Orders</p>
          <h2 className="text-3xl font-semibold mt-2 text-[#16a34a]">
            {todayOrders}
          </h2>
        </div>

        {/* Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition">
          <p className="text-gray-500 text-sm">Revenue</p>
          <h2 className="text-3xl font-semibold mt-2 text-[#16a34a]">
            ₹{revenue || 0}
          </h2>
        </div>

      </div>

      {/* 📦 Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[#16a34a]">
            Recent Orders
          </h2>

          <a
            href="/admin/orders"
            className="text-sm text-[#16a34a] hover:underline"
          >
            View All →
          </a>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-gray-400 p-6">No orders yet</p>
        ) : (
          <div>

            {/* Header */}
            <div className="grid grid-cols-3 px-6 py-3 text-sm text-gray-500 border-b bg-gray-50">
              <span>Order ID</span>
              <span>Customer</span>
              <span className="text-right">Amount</span>
            </div>

            {/* Rows */}
            {recentOrders.map((order: any, i: number) => (
              <div
                key={order._id}
                className={`grid grid-cols-3 px-6 py-4 items-center text-sm transition ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-[#ecfdf5]`}
              >
                <span className="font-medium text-black">
                  #{order.orderNumber}
                </span>

                <span className="text-gray-700">
                  {order.customerName}
                </span>

                <span className="text-right font-semibold text-[#16a34a]">
                  ₹{order.totalPrice || order.total || 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}