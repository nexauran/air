import { client } from "@/sanity/lib/client";

export default async function OrdersPage() {
  const orders = await client.fetch(`
    *[_type == "order"] | order(orderDate desc){
      _id,
      orderNumber,
      customerName,
      totalPrice,
      total,
      status
    }
  `);

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#16a34a]">
          Orders
        </h1>
        <p className="text-gray-500 text-sm">
          Manage all customer orders
        </p>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <p className="text-gray-400">No orders found</p>
      ) : (
        <div className="space-y-4">

          {orders.map((order: any) => (
            <div
              key={order._id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition"
            >

              {/* Top Row */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">

                {/* Left */}
                <div>
                  <p className="text-sm text-gray-500">
                    Order ID
                  </p>
                  <p className="font-semibold text-black">
                    #{order.orderNumber}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <span className="px-3 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                    {order.status || "pending"}
                  </span>
                </div>

              </div>

              {/* Divider */}
              <div className="my-4 border-t" />

              {/* Bottom Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">

                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="font-medium text-black">
                    {order.customerName}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500">Total</p>
                  <p className="font-semibold text-[#16a34a]">
                    ₹{order.totalPrice || order.total || 0}
                  </p>
                </div>

                <div className="hidden md:block">
                  <p className="text-gray-500">Payment</p>
                  <p className="text-black">WhatsApp</p>
                </div>

              </div>

            </div>
          ))}

        </div>
      )}
    </div>
  );
}