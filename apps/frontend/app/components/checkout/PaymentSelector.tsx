"use client";

export type PaymentMethod = "card" | "jazzcash" | "easypaisa" | "cod";

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string;
  available: boolean;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: "card",
    name: "Credit / Debit Card",
    description: "Visa, Mastercard via Safepay — secure hosted checkout",
    icon: "💳",
    available: true,
  },
  {
    id: "jazzcash",
    name: "JazzCash",
    description: "Pay with your JazzCash mobile wallet",
    icon: "📱",
    available: true,
  },
  {
    id: "easypaisa",
    name: "EasyPaisa",
    description: "Pay with your EasyPaisa mobile wallet",
    icon: "📲",
    available: true,
  },
  {
    id: "cod",
    name: "Cash on Delivery",
    description: "Pay when your order arrives — PKR 200 COD fee",
    icon: "🏠",
    available: true,
  },
];

interface Props {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
}

export function PaymentSelector({ selected, onSelect }: Props) {
  return (
    <div className="space-y-3">
      {PAYMENT_OPTIONS.filter((o) => o.available).map((option) => (
        <label
          key={option.id}
          className={`flex items-center gap-4 border rounded-lg px-4 py-4 cursor-pointer transition ${
            selected === option.id
              ? "border-gold-400 bg-gold-50 ring-1 ring-gold-300"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <input
            type="radio"
            name="payment-method"
            value={option.id}
            checked={selected === option.id}
            onChange={() => onSelect(option.id)}
            className="accent-gold-500"
          />
          <span className="text-xl">{option.icon}</span>
          <div className="flex-1">
            <p className="text-sm font-medium">{option.name}</p>
            <p className="text-xs text-gray-500">{option.description}</p>
          </div>
          {option.id === "card" && (
            <div className="flex gap-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">VISA</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-medium">MC</span>
            </div>
          )}
        </label>
      ))}
    </div>
  );
}
