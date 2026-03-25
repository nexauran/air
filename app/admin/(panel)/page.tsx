/** @format */

export const dynamic = "force-dynamic"; // 🔥 IMPORTANT (no caching)

import { client } from "@/sanity/lib/client";

export default async function AdminHome() {
  // ✅ IST-safe today
  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  )
    .toISOString()
    .split("T")[0];

  // 🔥 Fetch data
  const [
    products,
    ordersCount,
    orders,
    recentOrders,
    todayOrders,
    todayRevenueData,
  ] = await Promise.all([
    client.fetch(`count(*[_type == "product"])`),

    client.fetch(`count(*[_type == "order"])`),

    client.fetch(`*[_type == "order"]{
      totalPrice,
      total
    }`),

    client.fetch(`
      *[_type == "order"] | order(_createdAt desc)[0...5]{
        _id,
        orderNumber,
        customerName,
        totalPrice,
        total
      }
    `),

    client.fetch(`
      count(*[
        _type == "order" &&
        _createdAt >= "${today}T00:00:00Z"
      ])
    `),

    // ✅ TODAY REVENUE DATA
    client.fetch(`
      *[
        _type == "order" &&
        _createdAt >= "${today}T00:00:00Z"
      ]{
        totalPrice,
        total
      }
    `),
  ]);

  // 💰 TOTAL REVENUE
  const revenue = orders?.reduce(
    (sum: number, order: any) =>
      sum + (order.totalPrice || order.total || 0),
    0
  );

  // 💰 TODAY REVENUE
  const todayRevenue = todayRevenueData?.reduce(
    (sum: number, order: any) =>
      sum + (order.totalPrice || order.total || 0),
    0
  );

  return (
    <div className="p-6 md:p-8 min-h-screen bg-[#f6fef9] space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-[#16a34a]">
          Welcome Admin 🌿
        </h1>
        <p className="text-gray-500 mt-1 text-sm md:text-base">
          Manage your store efficiently
        </p>
      </div>

      {/* 📊 STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">

        {/* PRODUCTS */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border shadow-sm">
          <p className="text-gray-500 text-xs md:text-sm">Products</p>
          <h2 className="text-xl md:text-3xl font-semibold">
            {products}
          </h2>
        </div>

        {/* ORDERS */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border shadow-sm">
          <p className="text-gray-500 text-xs md:text-sm">Orders</p>
          <h2 className="text-xl md:text-3xl font-semibold">
            {ordersCount}
          </h2>
        </div>

        {/* TODAY ORDERS */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border shadow-sm">
          <p className="text-gray-500 text-xs md:text-sm">Today Orders</p>
          <h2 className="text-xl md:text-3xl font-semibold text-[#16a34a]">
            {todayOrders}
          </h2>
        </div>

        {/* TOTAL REVENUE */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border shadow-sm">
          <p className="text-gray-500 text-xs md:text-sm">Revenue</p>
          <h2 className="text-xl md:text-3xl font-semibold text-[#16a34a]">
            ₹{revenue || 0}
          </h2>
        </div>

        {/* 🔥 TODAY REVENUE */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border shadow-sm">
          <p className="text-gray-500 text-xs md:text-sm">
            Today Revenue
          </p>
          <h2 className="text-xl md:text-3xl font-semibold text-green-600">
            ₹{todayRevenue || 0}
          </h2>
        </div>

      </div>

      {/* 📦 RECENT ORDERS */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">

        {/* HEADER */}
        <div className="p-4 md:p-6 border-b flex justify-between items-center">
          <h2 className="text-base md:text-lg font-semibold text-[#16a34a]">
            Recent Orders
          </h2>

          <a
            href="/admin/orders"
            className="text-xs md:text-sm text-[#16a34a]"
          >
            View All →
          </a>
        </div>

        {recentOrders.length === 0 ? (
          <p className="p-6 text-gray-400 text-sm">
            No orders yet
          </p>
        ) : (
          <div>

            {/* HEADER */}
            <div className="grid grid-cols-3 px-4 md:px-6 py-3 text-xs md:text-sm text-gray-500 border-b bg-gray-50">
              <span>Order ID</span>
              <span>Customer</span>
              <span className="text-right">Amount</span>
            </div>

            {/* LIST */}
            {recentOrders.map((order: any, i: number) => (
              <div
                key={order._id}
                className={`grid grid-cols-3 px-4 md:px-6 py-3 md:py-4 text-sm ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-[#ecfdf5] transition`}
              >
                <span className="font-medium">
                  #{order.orderNumber}
                </span>

                <span className="truncate">
                  {order.customerName}
                </span>

                <span className="text-right text-[#16a34a] font-semibold">
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