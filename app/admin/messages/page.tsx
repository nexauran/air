"use client";

import { useEffect, useState } from "react";

export default function AdminMessagesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [search, setSearch] = useState("");
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");

  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [trackingData, setTrackingData] = useState({
    courier: "",
    trackingId: "",
    trackingLink: "",
    estimatedDelivery: "",
  });

  const handleLogin = () => {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASS) {
      setAuthorized(true);
    } else {
      alert("Wrong password");
    }
  };

  useEffect(() => {
    if (!authorized) return;

    const fetchOrders = async () => {
      const res = await fetch(
        search
          ? `/api/admin-orders?phone=${search}`
          : "/api/admin-orders"
      );
      const data = await res.json();
      setOrders(data);
    };

    fetchOrders();
  }, [authorized, search]);

  const generateMessage = (type: string) => {
    if (!selectedOrder) return;

    const formattedProducts =
      selectedOrder.products
        ?.map((p: any) => `- ${p.productName} x${p.quantity}`)
        .join("\n") || "Product";

    const formattedAddress = `
${selectedOrder.address?.address || ""}
${selectedOrder.address?.city || ""}
${selectedOrder.address?.state || ""} - ${selectedOrder.address?.zip || ""}
`.trim();

    let message = "";

    switch (type) {
      case "confirmation":
        message = `ORDER CONFIRMATION

Hi ${selectedOrder.customerName},
Thank you for your order! We have successfully received your order details.
Order ID: ${selectedOrder.orderNumber}
Products:
${formattedProducts}
Total Amount: ₹${selectedOrder.totalPrice}
Delivery Address:
${formattedAddress}
Thank you for choosing Nexaura.in ❤️`;
        break;

      case "payment":
        message = `PAYMENT REQUEST

Thank you for your order.
To confirm and start processing your order, please complete the payment using the QR code provided.
Amount: ₹${selectedOrder.totalPrice}
Order ID: ${selectedOrder.orderNumber}
After payment, kindly send the screenshot for verification.
Once confirmed, we will begin processing immediately.
Thank you for choosing Nexaura.in ❤️`;
        break;

      case "tracking":
        message = `ORDER DISPATCHED

Hi ${selectedOrder.customerName},
Great news! Your order has been successfully dispatched.
Order ID: ${selectedOrder.orderNumber}
Products:
${formattedProducts}
Courier Partner: ${trackingData.courier}
Tracking Number: ${trackingData.trackingId}
You can track your shipment here:
${trackingData.trackingLink}
Estimated Delivery: ${trackingData.estimatedDelivery}
If you have any questions, feel free to reply to this message.
Thank you for shopping with Nexaura.in ❤️`;

        setShowTrackingForm(false);
        break;

      case "review":
        message = `THANK YOU FOR YOUR ORDER

Hi ${selectedOrder.customerName},
We hope you loved your order.
If you are happy with your purchase, we would truly appreciate a quick review from you.
Your feedback helps our small business grow and serve you better.
Thank you for choosing Nexaura.in ❤️`;
        break;
    }

    setGeneratedMessage(message);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(generatedMessage);
    alert("Message copied!");
  };

  const openWhatsApp = () => {
    if (!selectedOrder) return;

    const cleanPhone = selectedOrder.phone.replace(/\D/g, "");
    const url = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
      generatedMessage
    )}`;

    window.open(url, "_blank");
  };

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-3xl shadow-2xl w-96 text-center">
          <h2 className="text-3xl font-bold mb-6">Nexaura Admin</h2>
          <input
            type="password"
            placeholder="Enter admin password"
            className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-gray-300 mb-4"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 transition"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-10">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-4xl font-bold mb-8">
          Nexaura – Admin Message Center
        </h1>

        <input
          type="text"
          placeholder="Search by phone number"
          className="w-full mb-4 px-4 py-3 rounded-xl bg-white/10 border border-white/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="w-full mb-6 px-4 py-3 rounded-xl bg-white/10 border border-white/20"
          onChange={(e) =>
            setSelectedOrder(
              orders.find((o) => o._id === e.target.value)
            )
          }
        >
          <option className="text-black">Select Order</option>
          {orders.map((order) => (
            <option
              key={order._id}
              value={order._id}
              className="text-black"
            >
              {order.orderNumber} – {order.customerName}
            </option>
          ))}
        </select>

        <div className="flex gap-4 mb-6 flex-wrap">
          <button
            onClick={() => generateMessage("confirmation")}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:scale-105 transition"
          >
            Confirmation
          </button>

          <button
            onClick={() => generateMessage("payment")}
            className="px-5 py-2 rounded-xl bg-yellow-600 hover:scale-105 transition"
          >
            Payment
          </button>

          <button
            onClick={() => setShowTrackingForm(true)}
            className="px-5 py-2 rounded-xl bg-green-600 hover:scale-105 transition"
          >
            Tracking
          </button>

          <button
            onClick={() => generateMessage("review")}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:scale-105 transition"
          >
            Review
          </button>
        </div>

        {showTrackingForm && (
          <div className="bg-white/10 border border-white/20 p-6 rounded-2xl mb-6">
            <h2 className="text-lg font-semibold mb-4">
              Add Tracking Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Courier Partner"
                className="px-4 py-3 rounded-xl bg-white/20"
                value={trackingData.courier}
                onChange={(e) =>
                  setTrackingData({
                    ...trackingData,
                    courier: e.target.value,
                  })
                }
              />

              <input
                type="text"
                placeholder="Tracking Number"
                className="px-4 py-3 rounded-xl bg-white/20"
                value={trackingData.trackingId}
                onChange={(e) =>
                  setTrackingData({
                    ...trackingData,
                    trackingId: e.target.value,
                  })
                }
              />

              <input
                type="text"
                placeholder="Tracking Link"
                className="px-4 py-3 rounded-xl bg-white/20"
                value={trackingData.trackingLink}
                onChange={(e) =>
                  setTrackingData({
                    ...trackingData,
                    trackingLink: e.target.value,
                  })
                }
              />

              <input
                type="text"
                placeholder="Estimated Delivery"
                className="px-4 py-3 rounded-xl bg-white/20"
                value={trackingData.estimatedDelivery}
                onChange={(e) =>
                  setTrackingData({
                    ...trackingData,
                    estimatedDelivery: e.target.value,
                  })
                }
              />
            </div>

            <button
              onClick={() => generateMessage("tracking")}
              className="mt-6 px-6 py-3 rounded-xl bg-green-600 hover:scale-105 transition"
            >
              Generate Tracking Message
            </button>
          </div>
        )}

        <textarea
          value={generatedMessage}
          readOnly
          rows={16}
          className="w-full p-6 rounded-2xl bg-white/10 border border-white/20"
        />

        <div className="flex gap-4 mt-6">
          <button
            onClick={copyMessage}
            className="px-6 py-3 rounded-xl bg-white text-black hover:scale-105 transition"
          >
            Copy
          </button>

          <button
            onClick={openWhatsApp}
            className="px-6 py-3 rounded-xl bg-green-600 hover:scale-105 transition"
          >
            Open WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}