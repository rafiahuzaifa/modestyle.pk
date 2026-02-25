"use client";

import { useEffect, useState, useCallback } from "react";

const NAMES = [
  "Asma", "Ayesha", "Fatima", "Zainab", "Maryam",
  "Noor", "Sara", "Amna", "Rabia", "Hina",
  "Sana", "Iqra", "Madiha", "Urooj", "Bushra",
  "Usman", "Bilal", "Ahmed", "Hamza", "Ali",
];

const CITIES = [
  "Lahore", "Karachi", "Islamabad", "Rawalpindi",
  "Faisalabad", "Multan", "Peshawar", "Sialkot",
  "Gujranwala", "Quetta", "Hyderabad", "Abbottabad",
];

const PRODUCTS = [
  { name: "Classic Open Abaya", emoji: "🖤" },
  { name: "Crinkle Chiffon Hijab", emoji: "🌸" },
  { name: "Premium Georgette Hijab", emoji: "✨" },
  { name: "Embroidered Abaya", emoji: "💛" },
  { name: "Cashmere Winter Stole", emoji: "❄️" },
  { name: "Pleated Chiffon Abaya", emoji: "🌟" },
  { name: "Lawn Hijab Set", emoji: "🌺" },
  { name: "Prayer Wear Set", emoji: "🤲" },
  { name: "Fancy Sequin Abaya", emoji: "💫" },
  { name: "Cotton Underscarf Pack", emoji: "🎀" },
  { name: "Silk Stole", emoji: "✦" },
  { name: "Girls Abaya – Navy Blue", emoji: "💙" },
];

const ACTIONS = [
  "just purchased",
  "just ordered",
  "just added to cart",
  "just bought",
];

const TIME_AGOS = [
  "just now",
  "2 min ago",
  "5 min ago",
  "8 min ago",
  "12 min ago",
  "a few minutes ago",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface ToastData {
  id: number;
  name: string;
  city: string;
  productName: string;
  productEmoji: string;
  action: string;
  timeAgo: string;
}

export function SocialProofToast() {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [visible, setVisible] = useState(false);

  const showNextToast = useCallback(() => {
    const product = pick(PRODUCTS);
    setToast({
      id: Date.now(),
      name: pick(NAMES),
      city: pick(CITIES),
      productName: product.name,
      productEmoji: product.emoji,
      action: pick(ACTIONS),
      timeAgo: pick(TIME_AGOS),
    });
    setVisible(true);
  }, []);

  useEffect(() => {
    // First toast after 10 seconds
    const first = setTimeout(() => {
      showNextToast();
    }, 10000);

    // Subsequent toasts every 35-50 seconds
    let interval: ReturnType<typeof setInterval>;
    const startInterval = () => {
      interval = setInterval(() => {
        showNextToast();
      }, 35000 + Math.random() * 15000);
    };

    const afterFirst = setTimeout(startInterval, 10000);

    return () => {
      clearTimeout(first);
      clearTimeout(afterFirst);
      clearInterval(interval);
    };
  }, [showNextToast]);

  // Auto-hide after 5 seconds
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setToast(null), 400);
    }, 5000);
    return () => clearTimeout(t);
  }, [visible, toast?.id]);

  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-28 left-4 z-50 transition-all duration-300 ease-out ${
        visible
          ? "opacity-100 translate-y-0 translate-x-0"
          : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-w-[290px]">
        {/* Gold top accent */}
        <div className="h-0.5 bg-gradient-to-r from-gold-400 to-gold-600" />

        <div className="flex items-start gap-3 p-3.5">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
            {toast.name[0]}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pr-1">
            <p className="text-xs leading-snug text-gray-800">
              <span className="font-semibold text-secondary">{toast.name}</span>
              {" "}
              <span className="text-gray-500">from {toast.city}</span>
            </p>
            <p className="text-xs text-gray-600 mt-0.5 leading-snug">
              {toast.action}{" "}
              <span className="font-semibold text-secondary">
                {toast.productEmoji} {toast.productName}
              </span>
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0 animate-pulse" />
              <span className="text-[10px] text-gray-400">{toast.timeAgo}</span>
              <span className="text-[10px] text-gray-300">· ModestStyle.pk</span>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={() => {
              setVisible(false);
              setTimeout(() => setToast(null), 300);
            }}
            className="w-5 h-5 rounded-full flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition flex-shrink-0 mt-0.5"
            aria-label="Dismiss"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
