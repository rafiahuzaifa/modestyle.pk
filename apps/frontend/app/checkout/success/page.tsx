import Link from "next/link";

interface SearchParams {
  order_id?: string;
  pending?: string;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const orderId = params.order_id;
  const isPending = params.pending === "true";

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center max-w-md px-4">
        <div className={`w-20 h-20 ${isPending ? "bg-amber-50" : "bg-green-50"} rounded-full flex items-center justify-center mx-auto mb-6`}>
          {isPending ? (
            <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <h1 className="font-display text-3xl mb-3">
          {isPending ? "Payment Pending" : "Order Confirmed!"}
        </h1>
        <p className="text-gray-500 text-sm mb-2">
          {isPending
            ? "Please approve the payment request on your mobile wallet app to complete your order."
            : "Thank you for your order. We\u2019ve received your payment."}
        </p>
        {orderId && (
          <p className="text-xs text-gray-400 mb-6">
            Order ID: <span className="font-mono">{orderId.slice(0, 8)}</span>
          </p>
        )}
        <p className="text-sm text-gray-500 mb-8">
          You&apos;ll receive a confirmation email shortly with tracking details.
          Delivery within 3-5 business days across Pakistan.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/account?tab=orders"
            className="bg-secondary text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-secondary/90 transition"
          >
            View Order
          </Link>
          <Link
            href="/products"
            className="border border-gray-200 px-6 py-3 rounded-lg text-sm font-medium hover:border-gold-400 transition"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
