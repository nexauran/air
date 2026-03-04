"use client";

import { useState } from "react";

interface Props {
  onAccept: () => void;
}

export default function WarrantyTermsModal({ onAccept }: Props) {
  const [open, setOpen] = useState(false);

  const accept = () => {
    onAccept();
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-blue-600 underline text-sm hover:text-blue-800"
      >
        View Warranty Terms
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-[90%] max-w-2xl p-6">

            <h2 className="text-2xl font-semibold mb-4">
              Warranty Terms & Conditions
            </h2>

            <div className="h-80 overflow-y-auto space-y-4 text-sm pr-2">

              <p>
                This warranty applies only to printed image fading on products
                purchased from NexAuraCraft and activated through the official
                warranty activation system.
              </p>

              <h3 className="font-semibold">1. Warranty Coverage</h3>
              <p>
                The warranty covers black & white print fading of the product
                image during the active warranty period under normal use.
              </p>

              <h3 className="font-semibold">2. Warranty Period</h3>
              <p>
                Warranty begins on the activation date and lasts for the period
                selected by the customer (1 month to 12 months).
              </p>

              <h3 className="font-semibold">3. What Is Covered</h3>
              <ul className="list-disc pl-5">
                <li>Noticeable fading of the printed image</li>
                <li>Fading within the selected warranty duration</li>
                <li>Normal indoor usage conditions</li>
              </ul>

              <h3 className="font-semibold">4. What Is Not Covered</h3>
              <ul className="list-disc pl-5">
                <li>Water damage</li>
                <li>Scratches or physical damage</li>
                <li>Sunlight exposure</li>
                <li>Improper handling or misuse</li>
              </ul>

              <h3 className="font-semibold">5. Replacement Policy</h3>
              <p>
                If a warranty claim is approved, only the faded printed image
                will be replaced. The full product will only be replaced if
                necessary for reprinting.
              </p>

              <h3 className="font-semibold">6. Warranty Claims</h3>
              <p>
                Warranty claims must be submitted through WhatsApp with order
                ID and clear photos of the faded print.
              </p>

              <h3 className="font-semibold">7. Policy Changes</h3>
              <p>
                NexAuraCraft reserves the right to modify this warranty policy
                without prior notice.
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
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
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