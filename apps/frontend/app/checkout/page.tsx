"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/sanity/lib/cart-store";
import {
  PaymentSelector,
  type PaymentMethod,
} from "@/app/components/checkout/PaymentSelector";
import { WalletPayment } from "@/app/components/checkout/WalletPayment";

type Step = "info" | "shipping" | "payment";

interface CustomerInfo {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

const INPUT_CLASS =
  "w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-300";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore();
  const [step, setStep] = useState<Step>("info");
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express">(
    "standard"
  );

  const [info, setInfo] = useState<CustomerInfo>({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
  });

  const subtotal = totalPrice();
  const FREE_SHIPPING_THRESHOLD = 5000;
  const COD_FEE = 200;
  const shippingCost =
    shippingMethod === "express"
      ? 500
      : subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : 250;
  const discount = promoApplied ? Math.round(subtotal * 0.1) : 0;
  const codFee = paymentMethod === "cod" ? COD_FEE : 0;
  const total = subtotal + shippingCost - discount + codFee;

  const steps: { key: Step; label: string }[] = [
    { key: "info", label: "Information" },
    { key: "shipping", label: "Shipping" },
    { key: "payment", label: "Payment" },
  ];

  const updateInfo = (field: keyof CustomerInfo, value: string) => {
    setInfo((prev) => ({ ...prev, [field]: value }));
  };

  const validateInfo = () => {
    if (!info.email || !info.phone || !info.firstName || !info.address || !info.city) {
      setError("Please fill in all required fields.");
      return false;
    }
    setError("");
    return true;
  };

  // Build the order payload shared across all gateways
  const buildOrderPayload = (gateway: string, extras?: Record<string, string>) => ({
    items: items.map((i) => ({
      product_id: i._id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      size: i.size,
      color: i.color,
    })),
    customer_email: info.email,
    customer_name: `${info.firstName} ${info.lastName}`.trim(),
    customer_phone: info.phone,
    shipping_address: {
      address: info.address,
      city: info.city,
      province: info.province,
      postal_code: info.postalCode,
    },
    subtotal,
    shipping: shippingCost,
    discount,
    total,
    promo_code: promoApplied ? promoCode : undefined,
    payment_method: gateway,
    ...extras,
  });

  // ── Safepay Card Payment ────────────────────────────────────────
  const handleCardPayment = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payment/safepay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildOrderPayload("safepay")),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");
      if (data.checkout_url) {
        clearCart();
        window.location.href = data.checkout_url;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── JazzCash / EasyPaisa Wallet ─────────────────────────────────
  const handleWalletPayment = async (
    gateway: "jazzcash" | "easypaisa",
    mobileNumber: string
  ) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/payment/${gateway}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildOrderPayload(gateway, { mobile_number: mobileNumber })
        ),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payment failed");

      if (data.redirect_url) {
        clearCart();
        window.location.href = data.redirect_url;
      } else if (data.order_id) {
        // MWALLET flow: payment request sent to user's phone
        clearCart();
        window.location.href = `/checkout/success?order_id=${data.order_id}&pending=true`;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Wallet payment failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Cash on Delivery ────────────────────────────────────────────
  const handleCOD = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payment/cod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildOrderPayload("cod")),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order creation failed");
      clearCart();
      window.location.href = `/checkout/success?order_id=${data.order_id}`;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Order failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = () => {
    switch (paymentMethod) {
      case "card":
        return handleCardPayment();
      case "jazzcash":
        // handled by WalletPayment component
        break;
      case "easypaisa":
        // handled by WalletPayment component
        break;
      case "cod":
        return handleCOD();
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl mb-4">Your bag is empty</h1>
          <Link href="/products" className="text-gold-500 underline text-sm">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl">Checkout</h1>
          <div className="flex items-center justify-center gap-2 mt-6">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center">
                <button
                  onClick={() => {
                    if (s.key === "info" || (s.key === "shipping" && step !== "info") || s.key === step)
                      setStep(s.key);
                  }}
                  className={`text-xs tracking-wider uppercase px-3 py-1.5 rounded-full transition ${
                    step === s.key
                      ? "bg-secondary text-white"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {i + 1}. {s.label}
                </button>
                {i < steps.length - 1 && (
                  <div className="w-8 h-px bg-gray-200 mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Form */}
          <div className="lg:col-span-3 space-y-6">
            {/* ── Step 1: Information ────────────────────────── */}
            {step === "info" && (
              <div className="space-y-4">
                <h2 className="text-lg font-medium">Contact Information</h2>
                <input
                  type="email"
                  placeholder="Email *"
                  value={info.email}
                  onChange={(e) => updateInfo("email", e.target.value)}
                  className={INPUT_CLASS}
                />
                <input
                  type="tel"
                  placeholder="Phone Number * (03xx-xxxxxxx)"
                  value={info.phone}
                  onChange={(e) => updateInfo("phone", e.target.value)}
                  className={INPUT_CLASS}
                />

                <h2 className="text-lg font-medium pt-4">Shipping Address</h2>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="First Name *"
                    value={info.firstName}
                    onChange={(e) => updateInfo("firstName", e.target.value)}
                    className={INPUT_CLASS}
                  />
                  <input
                    placeholder="Last Name"
                    value={info.lastName}
                    onChange={(e) => updateInfo("lastName", e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <input
                  placeholder="Full Address *"
                  value={info.address}
                  onChange={(e) => updateInfo("address", e.target.value)}
                  className={INPUT_CLASS}
                />
                <div className="grid grid-cols-3 gap-4">
                  <input
                    placeholder="City *"
                    value={info.city}
                    onChange={(e) => updateInfo("city", e.target.value)}
                    className={INPUT_CLASS}
                  />
                  <input
                    placeholder="Province"
                    value={info.province}
                    onChange={(e) => updateInfo("province", e.target.value)}
                    className={INPUT_CLASS}
                  />
                  <input
                    placeholder="Postal Code"
                    value={info.postalCode}
                    onChange={(e) => updateInfo("postalCode", e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
                <button
                  onClick={() => {
                    if (validateInfo()) setStep("shipping");
                  }}
                  className="w-full bg-secondary text-white py-3.5 rounded-lg font-medium hover:bg-secondary/90 transition"
                >
                  Continue to Shipping
                </button>
              </div>
            )}

            {/* ── Step 2: Shipping ──────────────────────────── */}
            {step === "shipping" && (
              <div className="space-y-4">
                <h2 className="text-lg font-medium">Shipping Method</h2>
                <div className="space-y-3">
                  <label
                    className={`flex items-center justify-between border rounded-lg px-4 py-4 cursor-pointer transition ${
                      shippingMethod === "standard"
                        ? "border-gold-300 bg-gold-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingMethod === "standard"}
                        onChange={() => setShippingMethod("standard")}
                        className="accent-gold-500"
                      />
                      <div>
                        <p className="text-sm font-medium">Standard Delivery</p>
                        <p className="text-xs text-gray-500">
                          3-5 business days across Pakistan
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">
                      {subtotal >= FREE_SHIPPING_THRESHOLD
                        ? "FREE"
                        : "PKR 250"}
                    </span>
                  </label>

                  <label
                    className={`flex items-center justify-between border rounded-lg px-4 py-4 cursor-pointer transition ${
                      shippingMethod === "express"
                        ? "border-gold-300 bg-gold-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        checked={shippingMethod === "express"}
                        onChange={() => setShippingMethod("express")}
                        className="accent-gold-500"
                      />
                      <div>
                        <p className="text-sm font-medium">Express Delivery</p>
                        <p className="text-xs text-gray-500">
                          1-2 business days (Lahore, Karachi, Islamabad)
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">PKR 500</span>
                  </label>
                </div>

                {subtotal < FREE_SHIPPING_THRESHOLD && (
                  <div className="bg-gold-50 border border-gold-100 rounded-lg px-4 py-3 text-xs text-gold-700">
                    Add PKR{" "}
                    {(FREE_SHIPPING_THRESHOLD - subtotal).toLocaleString()} more
                    to get FREE standard shipping!
                  </div>
                )}

                <button
                  onClick={() => setStep("payment")}
                  className="w-full bg-secondary text-white py-3.5 rounded-lg font-medium hover:bg-secondary/90 transition"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {/* ── Step 3: Payment ───────────────────────────── */}
            {step === "payment" && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium">Payment Method</h2>

                <PaymentSelector
                  selected={paymentMethod}
                  onSelect={setPaymentMethod}
                />

                {/* Card: Safepay hosted checkout */}
                {paymentMethod === "card" && (
                  <div className="space-y-4 border border-gray-100 rounded-xl p-5 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💳</span>
                      <h3 className="text-sm font-medium">
                        Secure Card Payment
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500">
                      You will be redirected to Safepay&apos;s secure payment
                      page to enter your card details. Your card information is
                      never stored on our servers.
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      PCI-DSS compliant — 256-bit encryption
                    </div>
                    <button
                      onClick={handleCardPayment}
                      disabled={loading}
                      className="w-full bg-gold-500 text-white py-4 rounded-lg font-medium text-lg hover:bg-gold-600 transition disabled:opacity-50"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg
                            className="animate-spin h-5 w-5"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        `Pay PKR ${total.toLocaleString()} with Card`
                      )}
                    </button>
                  </div>
                )}

                {/* JazzCash Wallet */}
                {paymentMethod === "jazzcash" && (
                  <WalletPayment
                    gateway="jazzcash"
                    total={total}
                    loading={loading}
                    onSubmit={(mobile) =>
                      handleWalletPayment("jazzcash", mobile)
                    }
                  />
                )}

                {/* EasyPaisa Wallet */}
                {paymentMethod === "easypaisa" && (
                  <WalletPayment
                    gateway="easypaisa"
                    total={total}
                    loading={loading}
                    onSubmit={(mobile) =>
                      handleWalletPayment("easypaisa", mobile)
                    }
                  />
                )}

                {/* Cash on Delivery */}
                {paymentMethod === "cod" && (
                  <div className="space-y-4 border border-gray-100 rounded-xl p-5 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🏠</span>
                      <h3 className="text-sm font-medium">Cash on Delivery</h3>
                    </div>
                    <p className="text-xs text-gray-500">
                      Pay in cash when your order is delivered. A COD fee of PKR{" "}
                      {COD_FEE} applies.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
                      Please keep exact change ready. Our rider may not have
                      change for large bills.
                    </div>
                    <button
                      onClick={handleCOD}
                      disabled={loading}
                      className="w-full bg-gold-500 text-white py-4 rounded-lg font-medium text-lg hover:bg-gold-600 transition disabled:opacity-50"
                    >
                      {loading
                        ? "Placing order..."
                        : `Place Order — PKR ${total.toLocaleString()}`}
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-gray-400 text-center">
                  By placing your order, you agree to our Terms of Service and
                  Privacy Policy.
                </p>
              </div>
            )}
          </div>

          {/* ── Order Summary Sidebar ──────────────────────── */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 rounded-xl p-6 sticky top-24">
              <h3 className="font-medium mb-4">
                Order Summary ({items.length} items)
              </h3>
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={`${item._id}-${item.size}-${item.color}`}
                    className="flex gap-3"
                  >
                    <div className="relative w-14 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image && (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      )}
                      <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-400">
                        {item.size && `Size: ${item.size}`}
                        {item.color && ` / ${item.color}`}
                      </p>
                    </div>
                    <p className="text-sm font-medium whitespace-nowrap">
                      PKR {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  placeholder="Promo code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-300"
                />
                <button
                  onClick={() => {
                    if (promoCode === "MODEST10" || promoCode === "WELCOME10") {
                      setPromoApplied(true);
                      setError("");
                    } else if (promoCode) {
                      setError("Invalid promo code");
                    }
                  }}
                  disabled={promoApplied}
                  className="px-4 py-2 bg-secondary text-white text-sm rounded-lg hover:bg-secondary/90 transition disabled:opacity-50"
                >
                  {promoApplied ? "Applied" : "Apply"}
                </button>
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t border-gray-200 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>PKR {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `PKR ${shippingCost}`
                    )}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Promo Discount (10%)</span>
                    <span>-PKR {discount.toLocaleString()}</span>
                  </div>
                )}
                {codFee > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>COD Fee</span>
                    <span>PKR {codFee}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-medium pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>PKR {total.toLocaleString()}</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap justify-center gap-4 text-[10px] text-gray-400 uppercase tracking-wider">
                <span>🔒 Secure</span>
                <span>🚚 Tracked</span>
                <span>↩️ Easy Returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
