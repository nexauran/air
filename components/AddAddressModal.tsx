"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

export default function AddAddressModal({
  email,
  onSaved,
  children,
}: {
  email: string;
  onSaved?: (a: any) => void;
  children: React.ReactNode;
}) {
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");

  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    default: false,
  });

  const update = (key: any, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: any) {
    e.preventDefault();

    if (!phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Enter valid 10-digit phone number");
      return;
    }

    setSaving(true);

    const res = await fetch("/api/address", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        email,
        phone, // ✅ SEND PHONE
      }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error || "Failed");
      setSaving(false);
      return;
    }

    onSaved?.(data.address);
    toast.success("Address saved successfully");

    setSaving(false);

    // Reset form
    setPhone("");
    setForm({
      name: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      default: false,
    });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
  <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-4">
    <DialogHeader>
      <DialogTitle className="text-lg font-semibold">
        Add New Address
      </DialogTitle>
    </DialogHeader>
  </div>

  <div className="p-6">
    <form onSubmit={handleSubmit} className="space-y-5">
      
      {/* Address Name */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          Address Label
        </Label>
        <Input
          required
          placeholder="Home / Work"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          className="rounded-xl focus:ring-2 focus:ring-black"
        />
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          Phone Number
        </Label>
        <Input
          required
          placeholder="Enter 10-digit phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-xl focus:ring-2 focus:ring-black"
        />
      </div>

      {/* Street */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          Street Address
        </Label>
        <Input
          required
          value={form.address}
          onChange={(e) => update("address", e.target.value)}
          className="rounded-xl focus:ring-2 focus:ring-black"
        />
      </div>

      {/* City + State */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            District
          </Label>
          <Input
            required
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            className="rounded-xl focus:ring-2 focus:ring-black"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">
            State
          </Label>
          <Input
            required
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
            className="rounded-xl focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      {/* Zip */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          Zip Code
        </Label>
        <Input
          required
          value={form.zip}
          onChange={(e) => update("zip", e.target.value)}
          className="rounded-xl focus:ring-2 focus:ring-black"
        />
      </div>

      {/* Default */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border">
        <span className="text-sm font-medium text-gray-700">
          Set as default address
        </span>
        <input
          type="checkbox"
          checked={form.default}
          onChange={(e) => update("default", e.target.checked)}
          className="h-4 w-4 accent-black"
        />
      </div>

      {/* Button */}
      <Button
        type="submit"
        className="w-full rounded-xl bg-black hover:bg-gray-900 text-white font-semibold py-2.5 transition-all"
        disabled={saving}
      >
        {saving ? "Saving Address..." : "Save Address"}
      </Button>
    </form>
  </div>
</DialogContent>
    </Dialog>
  );
}