import Link from "next/link";
import { getOrderSummary, type OrderSummary } from "@/lib/orders";
import { whatsappLink } from "@/lib/site";

export const dynamic = "force-dynamic";

interface SearchParams {
  order_id?: string;
  pending?: string;
}

type State = "cod" | "paid" | "pending" | "failed" | "unknown";

function stateFor(order: OrderSummary | null, pendingHint: boolean): State {
  if (!order) return "unknown";
  if (order.payment_method === "cod") return "cod";
  if (order.payment_status === "paid") return "paid";
  if (order.payment_status === "failed") return "failed";
  return pendingHint || order.payment_status === "pending" ? "pending" : "unknown";
}

const COPY: Record<State, { title: string; body: string; tone: "green" | "amber" | "red" }> = {
  cod: {
    title: "Order Placed!",
    body: "Thank you! Our team will call you shortly to confirm your order. Please pay in cash when it's delivered.",
    tone: "green",
  },
  paid: {
    title: "Order Confirmed!",
    body: "Thank you! We've received your payment and your order is being prepared.",
    tone: "green",
  },
  pending: {
    title: "Payment Pending",
    body: "Please approve the payment request in your mobile wallet app. We'll confirm your order as soon as the payment comes through.",
    tone: "amber",
  },
  failed: {
    title: "Payment Unsuccessful",
    body: "Your payment didn't go through, so you haven't been charged. Please add the items to your bag again and choose Cash on Delivery, or message us on WhatsApp and we'll help you complete it.",
    tone: "red",
  },
  unknown: {
    title: "Thank You!",
    body: "We've received your order. If you have any questions, message us on WhatsApp with your order number.",
    tone: "green",
  },
};

const TONE_CLASSES = {
  green: "bg-green-50 text-green-500",
  amber: "bg-amber-50 text-amber-500",
  red: "bg-red-50 text-red-500",
};

const ICON_PATHS = {
  green: "M5 13l4 4L19 7",
  amber: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  red: "M6 18L18 6M6 6l12 12",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const orderId = params.order_id || "";
  const order = orderId ? await getOrderSummary(orderId).catch(() => null) : null;
  const state = stateFor(order, params.pending === "true");
  const copy = COPY[state];
  const ref = (order?.id || orderId).slice(0, 8).toUpperCase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-md px-4 py-16">
        <div className={`w-20 h-20 ${TONE_CLASSES[copy.tone]} rounded-full flex items-center justify-center mx-auto mb-6`}>
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICON_PATHS[copy.tone]} />
          </svg>
        </div>
        <h1 className="font-display text-3xl mb-3">{copy.title}</h1>
        <p className="text-gray-500 text-sm mb-4">{copy.body}</p>

        {ref && (
          <div className="bg-gray-50 rounded-xl px-5 py-4 mb-6 text-sm text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Order number</span>
              <span className="font-mono font-medium">#{ref}</span>
            </div>
            {order && (
              <div className="flex justify-between">
                <span className="text-gray-500">{state === "cod" ? "Amount to pay on delivery" : "Order total"}</span>
                <span className="font-medium">PKR {Math.round(order.total).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {state !== "failed" && (
          <p className="text-xs text-gray-400 mb-8">
            Delivery within 3-5 business days across Pakistan.
          </p>
        )}

        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/products"
            className="bg-secondary text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-secondary/90 transition"
          >
            {state === "failed" ? "Shop Again" : "Continue Shopping"}
          </Link>
          <a
            href={whatsappLink(ref ? `Assalam o Alaikum! My order number is #${ref}.` : undefined)}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-200 px-6 py-3 rounded-lg text-sm font-medium hover:border-gold-400 transition"
          >
            WhatsApp Us
          </a>
        </div>
      </div>
    </div>
  );
}
