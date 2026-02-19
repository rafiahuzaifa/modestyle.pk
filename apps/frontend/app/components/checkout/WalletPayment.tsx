"use client";

import { useState } from "react";

interface Props {
  gateway: "jazzcash" | "easypaisa";
  total: number;
  onSubmit: (mobileNumber: string) => void;
  loading: boolean;
}

export function WalletPayment({ gateway, total, onSubmit, loading }: Props) {
  const [mobile, setMobile] = useState("");

  const name = gateway === "jazzcash" ? "JazzCash" : "EasyPaisa";
  const prefix = gateway === "jazzcash" ? "03xx" : "03xx";

  return (
    <div className="space-y-4 border border-gray-100 rounded-xl p-5 bg-gray-50">
      <div className="flex items-center gap-2">
        <span className="text-lg">{gateway === "jazzcash" ? "📱" : "📲"}</span>
        <h3 className="text-sm font-medium">Pay with {name}</h3>
      </div>

      <div>
        <label className="text-xs text-gray-500 block mb-1">
          {name} Mobile Number
        </label>
        <input
          type="tel"
          placeholder={`${prefix}-XXXXXXX`}
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ""))}
          maxLength={11}
          className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-300"
        />
        <p className="text-[11px] text-gray-400 mt-1">
          You will receive a payment request on your {name} app.
          Approve it to complete the order.
        </p>
      </div>

      <button
        onClick={() => onSubmit(mobile)}
        disabled={mobile.length < 11 || loading}
        className="w-full bg-gold-500 text-white py-3.5 rounded-lg font-medium hover:bg-gold-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending request to {name}...
          </span>
        ) : (
          `Pay PKR ${total.toLocaleString()} via ${name}`
        )}
      </button>
    </div>
  );
}
