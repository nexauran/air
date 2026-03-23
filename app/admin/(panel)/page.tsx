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

  // 🔥 Fetch data (no cache)
  const [products, ordersCount, orders, recentOrders, todayOrders] =
    await Promise.all([
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
    ]);

  // 💰 Revenue
  const revenue = orders?.reduce(
    (sum: number, order: any) =>
      sum + (order.totalPrice || order.total || 0),
    0
  );

  return (
    <div className="p-8 min-h-screen bg-[#f6fef9] space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-[#16a34a]">
          Welcome Admin 🌿
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your store efficiently
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <p className="text-gray-500 text-sm">Products</p>
          <h2 className="text-3xl font-semibold">{products}</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <p className="text-gray-500 text-sm">Orders</p>
          <h2 className="text-3xl font-semibold">{ordersCount}</h2>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <p className="text-gray-500 text-sm">Today Orders</p>
          <h2 className="text-3xl font-semibold text-[#16a34a]">
            {todayOrders}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <p className="text-gray-500 text-sm">Revenue</p>
          <h2 className="text-3xl font-semibold text-[#16a34a]">
            ₹{revenue || 0}
          </h2>
        </div>

      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">

        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[#16a34a]">
            Recent Orders
          </h2>

          <a href="/admin/orders" className="text-sm text-[#16a34a]">
            View All →
          </a>
        </div>

        {recentOrders.length === 0 ? (
          <p className="p-6 text-gray-400">No orders yet</p>
        ) : (
          <div>

            <div className="grid grid-cols-3 px-6 py-3 text-sm text-gray-500 border-b bg-gray-50">
              <span>Order ID</span>
              <span>Customer</span>
              <span className="text-right">Amount</span>
            </div>

            {recentOrders.map((order: any, i: number) => (
              <div
                key={order._id}
                className={`grid grid-cols-3 px-6 py-4 ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-[#ecfdf5]`}
              >
                <span className="font-medium">
                  #{order.orderNumber}
                </span>

                <span>{order.customerName}</span>

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