"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/app/components/SettingsProvider";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "ms_discount_popup_dismissed_at";
const SNOOZE_DAYS = 7;
const SHOW_AFTER_MS = 5000;

export function DiscountPopup() {
  const { popupPromoCode: PROMO_CODE, popupPromoPercent } = useSettings();
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    // No active popup code configured in Admin → Settings: don't show the offer.
    if (!popupPromoPercent || !PROMO_CODE) return;
    try {
      const dismissedAt = localStorage.getItem(STORAGE_KEY);
      if (dismissedAt) {
        const elapsedDays = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (elapsedDays < SNOOZE_DAYS) return;
      }
    } catch {
      // localStorage unavailable — show anyway
    }

    const timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, [popupPromoPercent, PROMO_CODE]);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "popup" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setStatus("success");
      try {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      } catch {
        // ignore
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
          >
            <button
              onClick={dismiss}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 z-10"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="bg-secondary px-8 pt-10 pb-8 text-center">
              <p className="text-gold-400 text-xs tracking-[0.3em] uppercase mb-2">
                Welcome Offer
              </p>
              <h3 className="font-display text-3xl text-white mb-2">{popupPromoPercent}% Off</h3>
              <p className="text-white/60 text-sm">Your first order, just for joining us</p>
            </div>

            <div className="p-8">
              {status === "success" ? (
                <div className="text-center space-y-3">
                  <p className="text-sm text-gray-600">
                    You&apos;re in! Use this code at checkout:
                  </p>
                  <div className="border-2 border-dashed border-gold-300 rounded-lg py-3 px-4 bg-gold-50">
                    <span className="font-display text-xl text-gold-600 tracking-widest">
                      {PROMO_CODE}
                    </span>
                  </div>
                  <button
                    onClick={dismiss}
                    className="text-xs text-gray-400 hover:text-gray-600 transition"
                  >
                    Continue shopping
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-300"
                  />
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full bg-gold-500 hover:bg-gold-600 text-white py-3 rounded-lg text-sm font-medium transition disabled:opacity-50"
                  >
                    {status === "loading" ? "Please wait..." : "Claim My Discount"}
                  </button>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="w-full text-xs text-gray-400 hover:text-gray-600 transition"
                  >
                    No thanks
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
