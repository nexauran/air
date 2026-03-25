"use client";

import { useEffect, useState } from "react";
import { client } from "@/lib/sanity";

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  totalPrice: number;
  status: string;
}

export default function OrderStatusPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 📦 Fetch Orders
  useEffect(() => {
    const fetchOrders = async () => {
      const data = await client.fetch(`
        *[_type == "order"] | order(orderDate desc){
          _id,
          orderNumber,
          customerName,
          totalPrice,
          status
        }
      `);

      setOrders(data);
      setLoading(false);
    };

    fetchOrders();
  }, []);

  // 🔥 Update Status (API)
  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);

    await fetch("/api/update-order-status", {
      method: "POST",
      body: JSON.stringify({ id, status }),
    });

    setOrders((prev) =>
      prev.map((o) => (o._id === id ? { ...o, status } : o))
    );

    setUpdatingId(null);
  };

  const statuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((o) => o.status === filter);

  const getCount = (status: string) =>
    orders.filter((o) => o.status === status).length;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200";
      case "confirmed":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "processing":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";
      case "shipped":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "delivered":
        return "bg-green-50 text-green-700 border border-green-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border border-red-200";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <h1 className="text-xl md:text-2xl font-semibold">
        Order Status Management
      </h1>

      {/* 🔥 STATUS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
        
        <div
          onClick={() => setFilter("all")}
          className={`p-4 rounded-2xl cursor-pointer transition border ${
            filter === "all"
              ? "bg-green-600 text-white shadow-md"
              : "bg-white hover:shadow"
          }`}
        >
          <p className="text-xs opacity-80">All</p>
          <h2 className="text-xl md:text-2xl font-bold mt-1">
            {orders.length}
          </h2>
        </div>

        {statuses.map((status) => (
          <div
            key={status}
            onClick={() => setFilter(status)}
            className={`p-4 rounded-2xl cursor-pointer transition border ${
              filter === status
                ? "bg-green-600 text-white shadow-md"
                : "bg-white hover:shadow"
            }`}
          >
            <p className="text-xs capitalize opacity-80">
              {status}
            </p>
            <h2 className="text-xl md:text-2xl font-bold mt-1">
              {getCount(status)}
            </h2>
          </div>
        ))}
      </div>

      {/* 📦 TABLE (DESKTOP) */}
      <div className="hidden md:block bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="p-4 text-left">Order</th>
              <th className="p-4 text-left">Customer</th>
              <th className="p-4 text-left">Amount</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Update</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center">
                  Loading...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center">
                  No orders found
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order._id} className="border-t hover:bg-gray-50">
                  
                  <td className="p-4 font-semibold">
                    {order.orderNumber}
                  </td>

                  <td className="p-4 text-gray-600">
                    {order.customerName}
                  </td>

                  <td className="p-4 font-medium">
                    ₹{order.totalPrice}
                  </td>

                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${getStatusStyle(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td className="p-4">
                    <select
                      value={order.status}
                      disabled={updatingId === order._id}
                      onChange={(e) =>
                        updateStatus(order._id, e.target.value)
                      }
                      className="border px-3 py-1 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 📱 MOBILE VIEW (CARD DESIGN) */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : filteredOrders.length === 0 ? (
          <p className="text-center">No orders</p>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white p-4 rounded-2xl shadow-sm border space-y-3"
            >
              <div className="flex justify-between">
                <p className="font-semibold">
                  {order.orderNumber}
                </p>
                <span
                  className={`px-2 py-1 text-xs rounded ${getStatusStyle(
                    order.status
                  )}`}
                >
                  {order.status}
                </span>
              </div>

              <p className="text-sm text-gray-600">
                {order.customerName}
              </p>

              <div className="flex justify-between items-center">
                <p className="font-medium">
                  ₹{order.totalPrice}
                </p>

                <select
                  value={order.status}
                  onChange={(e) =>
                    updateStatus(order._id, e.target.value)
                  }
                  className="border px-2 py-1 rounded text-sm"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}