"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
// @ts-ignore
import confetti from "canvas-confetti";

/* ---------------- Types ---------------- */

interface Product {
  _key: string;
  name: string;
  productId: string;
  image?: string;
}

interface Order {
  _id: string;
  orderId: string;
  products: Product[];
}

/* ---------------- Terms Modal ---------------- */

function WarrantyTermsModal({ onAccept }: { onAccept: () => void }) {

  const [open, setOpen] = useState(false);

  const accept = () => {
    onAccept();
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-blue-600 underline text-sm ml-1"
      >
        View Terms
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur flex items-center justify-center z-50">

          <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-2xl p-6">

            <h2 className="text-xl font-semibold mb-4">
              Warranty Terms & Conditions
            </h2>

            <div className="h-72 overflow-y-auto text-sm space-y-4">

              <p>
                This warranty applies only to black & white print fading
                of the product image under normal indoor usage.
              </p>

              <p>
                Warranty begins from the activation date and remains valid
                for the duration selected during activation.
              </p>

              <p>
                The warranty covers only fading of the printed image.
                Physical damage, water exposure, scratches,
                sunlight damage, or misuse are not covered.
              </p>

              <p>
                If a claim is approved, only the faded printed image will
                be replaced. The full product may be replaced only if
                necessary for reprinting.
              </p>

              <p>
                Warranty claims must include the Order ID and clear
                photos showing the faded print.
              </p>

            </div>

            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={accept}
                className="px-4 py-2 bg-black text-white rounded-lg"
              >
                I Agree
              </button>

            </div>

          </div>

        </div>
      )}
    </>
  );
}

/* ---------------- Background Blobs ---------------- */

function BackgroundBlobs() {

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">

      <motion.div
        animate={{ x: [0, 100, -50, 0], y: [0, -80, 60, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute w-125 h-125 bg-purple-300 opacity-30 blur-[120px] rounded-full left-10 top-10"
      />

      <motion.div
        animate={{ x: [0, -120, 60, 0], y: [0, 60, -80, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute w-125 h-125 bg-blue-300 opacity-30 blur-[120px] rounded-full right-10 bottom-10"
      />

    </div>
  );
}

/* ---------------- Warranty Progress ---------------- */

function WarrantyProgress({ duration }: { duration: number }) {

  const percent = (duration / 12) * 100;

  return (
    <div className="mt-6">

      <p className="text-sm text-gray-600 mb-2">
        Warranty Coverage
      </p>

      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8 }}
          className="h-3 bg-black rounded-full"
        />

      </div>

      <p className="text-xs text-gray-500 mt-2">
        {duration} months coverage
      </p>

    </div>
  );
}

/* ---------------- Page ---------------- */

export default function ActivateGuaranteePage() {

  const { user, isLoaded } = useUser();

  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [duration, setDuration] = useState(12);
  const [activated, setActivated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  /* ---------------- Fetch Orders ---------------- */

  useEffect(() => {

    if (!user) return;

    const fetchOrders = async () => {

      const email = user.primaryEmailAddress?.emailAddress;

      const res = await fetch(`/api/getUserOrders?email=${email}`);
      const data = await res.json();

      setOrders(data);
    };

    fetchOrders();

  }, [user]);

  /* ---------------- Loading ---------------- */

  if (!isLoaded) {

    return (
      <div className="min-h-screen flex items-center justify-center">

        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full"
        />

      </div>
    );
  }

  /* ---------------- Not Logged In ---------------- */

  if (!user) {

    return (

      <>
        <BackgroundBlobs />

        <div className="min-h-screen flex items-center justify-center px-6">

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/40 backdrop-blur-xl border border-white/30 shadow-2xl rounded-2xl p-10 text-center max-w-md w-full"
          >

            <h1 className="text-2xl font-semibold">
              Activate Your Warranty
            </h1>

            <p className="text-gray-600 mt-3 mb-6">
              Login to register and manage your product guarantee.
            </p>

            <SignInButton mode="modal">
              <button className="bg-black text-white px-6 py-3 rounded-xl w-full hover:scale-105 transition">
                Login to Activate Guarantee
              </button>
            </SignInButton>

          </motion.div>

        </div>
      </>
    );
  }

  /* ---------------- Activate Warranty ---------------- */

  const activateGuarantee = async () => {

    if (!selectedProduct || !agreed) return;

    setLoading(true);

    const res = await fetch("/api/activateGuarantee", {

      method: "POST",

      body: JSON.stringify({
        orderId: selectedProduct.orderId,
        productId: selectedProduct.productId,
        productName: selectedProduct.name,
        userEmail: user.primaryEmailAddress?.emailAddress,
        durationMonths: duration
      })

    });

    const data = await res.json();

    if (data.success) {

      setActivated(true);

      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });

    }

    setLoading(false);
  };

  /* ---------------- UI ---------------- */

  return (

    <>
      <BackgroundBlobs />

      <div className="min-h-screen flex items-center justify-center px-6 py-20">

        <div className="max-w-5xl w-full">

          {/* HEADER */}

          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-12"
          >

            <h1 className="text-4xl font-semibold">
              Activate Product Warranty
            </h1>

            <p className="text-gray-600 mt-3">
              Register your purchase and manage warranty coverage
            </p>

          </motion.div>

          {/* GRID */}

          <div className="grid md:grid-cols-2 gap-8">

            {/* PRODUCT CARD */}

            <motion.div
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-white/40 backdrop-blur-xl border border-white/30 shadow-2xl rounded-2xl p-6"
            >

              <h2 className="font-semibold mb-4">
                Product Information
              </h2>

              {selectedProduct ? (

                <div>

                  <div className="flex items-center gap-4">

                    <img
                      src={selectedProduct.image || "/placeholder.png"}
                      className="w-20 h-20 rounded-xl object-cover shadow"
                    />

                    <div>

                      <p className="font-semibold">
                        {selectedProduct.name}
                      </p>

                      <p className="text-sm text-gray-500">
                        Order #{selectedProduct.orderId}
                      </p>

                    </div>

                  </div>

                  <WarrantyProgress duration={duration} />

                </div>

              ) : (

                <p className="text-gray-400 text-sm">
                  Select a product to view details
                </p>

              )}

            </motion.div>

            {/* FORM */}

            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-white/40 backdrop-blur-xl border border-white/30 shadow-2xl rounded-2xl p-6"
            >

              <label className="text-sm text-gray-600">
                Select Product
              </label>

              <select
                className="w-full border rounded-xl p-3 mt-2 bg-white/60"
                onChange={(e) => {

                  const value = e.target.value;

                  const product = orders
                    .flatMap(order =>
                      order.products.map(p => ({
                        ...p,
                        orderId: order.orderId
                      }))
                    )
                    .find(p => p.productId === value);

                  setSelectedProduct(product);

                }}
              >

                <option>Select Product</option>

                {orders.map(order => (

                  <optgroup key={order._id} label={`Order #${order.orderId}`}>

                    {order.products.map(product => (

                      <option key={product._key} value={product.productId}>
                        {product.name}
                      </option>

                    ))}

                  </optgroup>

                ))}

              </select>

              {/* WARRANTY */}

              {selectedProduct && (

                <div className="mt-6">

                  <label className="text-sm text-gray-600">
                    Warranty Duration
                  </label>

                  <select
                    className="w-full border rounded-xl p-3 mt-2 bg-white/60"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  >

                    <option value={1}>1 Month</option>
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>1 Year</option>

                  </select>

                </div>

              )}

              {/* TERMS */}

              {selectedProduct && (

                <div className="mt-6 flex items-center gap-2">

                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={() => setAgreed(!agreed)}
                  />

                  <p className="text-sm text-gray-600">
                    I agree to the warranty terms
                  </p>

                  <WarrantyTermsModal
                    onAccept={() => setAgreed(true)}
                  />

                </div>

              )}

              {/* BUTTON */}

              {selectedProduct && !activated && (

                <motion.button
                  whileHover={{ scale: agreed ? 1.05 : 1 }}
                  whileTap={{ scale: agreed ? 0.95 : 1 }}
                  onClick={activateGuarantee}
                  disabled={!agreed}
                  className={`w-full text-white py-3 rounded-xl mt-6 shadow-lg
                  ${agreed ? "bg-black" : "bg-gray-400 cursor-not-allowed"}
                  `}
                >
                  {loading ? "Activating..." : "Activate Warranty"}
                </motion.button>

              )}

              {/* SUCCESS */}

              {activated && (

                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5 text-center"
                >

                  <p className="text-green-700 font-semibold">
                    Warranty Activated Successfully ✓
                  </p>

                  <p className="text-sm text-green-600 mt-1">
                    Your product is now protected.
                  </p>

                </motion.div>

              )}

              <p className="text-xs text-gray-500 mt-4">
                ⚠ Warranty covers  print fading only within
                the selected warranty period.
              </p>

            </motion.div>

          </div>

        </div>

      </div>

    </>
  );
}
