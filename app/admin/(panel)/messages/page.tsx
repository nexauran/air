"use client";

import { useEffect, useState } from "react";

export default function AdminMessagesPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [search, setSearch] = useState("");

  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [trackingData, setTrackingData] = useState({
    courier: "",
    trackingId: "",
    trackingLink: "",
    estimatedDelivery: "",
  });

  // ✅ Fetch orders (no auth here — middleware handles it)
  useEffect(() => {
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
  }, [search]);

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

      case "paymentConfirmed":
        message = `PAYMENT CONFIRMED

Hi ${selectedOrder.customerName},
We have successfully received your payment.
Order ID: ${selectedOrder.orderNumber}
Amount Paid: ₹${selectedOrder.totalPrice}
Your order is now confirmed and will be processed shortly.
We will notify you once your order is dispatched.
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
Track here:
${trackingData.trackingLink}
Estimated Delivery: ${trackingData.estimatedDelivery}
Thank you for shopping with Nexaura.in ❤️`;

        setShowTrackingForm(false);
        break;

      case "review":
        message = `THANK YOU FOR YOUR ORDER

Hi ${selectedOrder.customerName},
We hope you loved your order.
If you are happy with your purchase, we would truly appreciate a quick review.
Your feedback helps our small business grow ❤️
Thank you for choosing Nexaura.in ❤️`;
        break;

      case "warrantySuccess":
        message = `WARRANTY ACTIVATED SUCCESSFULLY

Hi ${selectedOrder.customerName},
Your warranty has been successfully activated.
Order ID: ${selectedOrder.orderNumber}
Track your warranty:
https://www.nexauracraft.shop/my-warranty
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

  return (
  <div className="min-h-screen bg-[#f6fef9] p-6">

    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-[#16a34a]">
          Nexaura – Message Center
        </h1>
        <p className="text-gray-500 text-sm">
          Generate and send customer messages easily
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by phone number"
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Select Order */}
      <select
        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#16a34a]"
        onChange={(e) =>
          setSelectedOrder(orders.find((o) => o._id === e.target.value))
        }
      >
        <option>Select Order</option>
        {orders.map((order) => (
          <option key={order._id} value={order._id}>
            {order.orderNumber} – {order.customerName}
          </option>
        ))}
      </select>

      {/* Buttons */}
      <div className="flex gap-3 flex-wrap">

        <button
          onClick={() => generateMessage("confirmation")}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:opacity-90"
        >
          Confirmation
        </button>

        <button
          onClick={() => generateMessage("payment")}
          className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:opacity-90"
        >
          Payment
        </button>

        <button
          onClick={() => generateMessage("paymentConfirmed")}
          className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:opacity-90"
        >
          Payment Confirmed
        </button>

        <button
          onClick={() => setShowTrackingForm(true)}
          className="px-4 py-2 rounded-lg bg-[#16a34a] text-white hover:opacity-90"
        >
          Tracking
        </button>

        <button
          onClick={() => generateMessage("review")}
          className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:opacity-90"
        >
          Review
        </button>

        <button
          onClick={() => generateMessage("warrantySuccess")}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:opacity-90"
        >
          Warranty
        </button>

      </div>

      {/* Tracking Form */}
      {showTrackingForm && (
        <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-3">

          <h2 className="text-lg font-semibold text-[#16a34a]">
            Tracking Details
          </h2>

          <input
            placeholder="Courier"
            className="w-full px-4 py-2 border rounded-lg"
            onChange={(e) =>
              setTrackingData({ ...trackingData, courier: e.target.value })
            }
          />

          <input
            placeholder="Tracking ID"
            className="w-full px-4 py-2 border rounded-lg"
            onChange={(e) =>
              setTrackingData({
                ...trackingData,
                trackingId: e.target.value,
              })
            }
          />

          <input
            placeholder="Tracking Link"
            className="w-full px-4 py-2 border rounded-lg"
            onChange={(e) =>
              setTrackingData({
                ...trackingData,
                trackingLink: e.target.value,
              })
            }
          />

          <input
            placeholder="Estimated Delivery"
            className="w-full px-4 py-2 border rounded-lg"
            onChange={(e) =>
              setTrackingData({
                ...trackingData,
                estimatedDelivery: e.target.value,
              })
            }
          />

          <button
            onClick={() => generateMessage("tracking")}
            className="bg-[#16a34a] text-white px-4 py-2 rounded-lg"
          >
            Generate Tracking Message
          </button>
        </div>
      )}

      {/* Message Box */}
      <textarea
        value={generatedMessage}
        readOnly
        rows={10}
        className="w-full p-4 rounded-xl border border-gray-200 bg-white"
      />

      {/* Actions */}
      <div className="flex gap-3">

        <button
          onClick={copyMessage}
          className="bg-gray-200 px-4 py-2 rounded-lg"
        >
          Copy
        </button>

        <button
          onClick={openWhatsApp}
          className="bg-[#16a34a] text-white px-4 py-2 rounded-lg"
        >
          WhatsApp
        </button>

      </div>

    </div>
  </div>
);
}