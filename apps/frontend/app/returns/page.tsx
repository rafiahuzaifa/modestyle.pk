import Link from "next/link";

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-secondary text-white py-20 text-center">
        <h1 className="font-display text-4xl md:text-5xl mb-3">Returns &amp; Exchange</h1>
        <p className="text-white/60 text-sm">Hassle-free returns within 7 days</p>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="space-y-10">

          {/* Policy Summary */}
          <div className="grid sm:grid-cols-3 gap-4 text-center">
            {[
              { icon: "📅", title: "7-Day Returns", desc: "Return any item within 7 days of delivery" },
              { icon: "🔄", title: "Easy Exchange", desc: "Swap for a different size or color" },
              { icon: "💳", title: "Full Refund", desc: "Store credit or original payment method" },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50 rounded-xl p-5">
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="font-medium text-secondary text-sm">{item.title}</p>
                <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Eligible Items */}
          <div>
            <h2 className="font-display text-2xl text-secondary mb-5">Return Eligibility</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-100 rounded-xl p-5">
                <p className="text-green-700 font-semibold text-sm mb-3">✅ Eligible for Return</p>
                <ul className="text-green-600 text-sm space-y-1.5">
                  <li>• Unused, unworn items</li>
                  <li>• Original tags attached</li>
                  <li>• Original packaging intact</li>
                  <li>• Returned within 7 days</li>
                  <li>• Defective or damaged items</li>
                  <li>• Wrong item received</li>
                </ul>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-xl p-5">
                <p className="text-red-700 font-semibold text-sm mb-3">❌ Not Eligible for Return</p>
                <ul className="text-red-600 text-sm space-y-1.5">
                  <li>• Worn or washed items</li>
                  <li>• Tags removed</li>
                  <li>• After 7 days of delivery</li>
                  <li>• Sale / discounted items</li>
                  <li>• Accessories (pins, jewelry)</li>
                  <li>• Custom/personalized orders</li>
                </ul>
              </div>
            </div>
          </div>

          {/* How to Return */}
          <div>
            <h2 className="font-display text-2xl text-secondary mb-5">How to Return</h2>
            <div className="space-y-3">
              {[
                { step: "01", title: "Contact Us", desc: "WhatsApp or email us at support@modestyle.pk with your order number and reason for return." },
                { step: "02", title: "Get Approval", desc: "We'll review and send you a return approval within 24 hours." },
                { step: "03", title: "Ship It Back", desc: "Pack the item securely and send it via your preferred courier to our Lahore address. Return shipping cost is your responsibility unless the item is defective." },
                { step: "04", title: "Get Refunded", desc: "Once we receive and inspect the item, your refund or exchange is processed within 3–5 business days." },
              ].map((s) => (
                <div key={s.step} className="flex gap-4 p-5 bg-gray-50 rounded-xl">
                  <span className="text-2xl font-display text-gold-400 w-10 shrink-0">{s.step}</span>
                  <div>
                    <p className="font-medium text-secondary text-sm">{s.title}</p>
                    <p className="text-gray-500 text-sm mt-0.5">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Refund Methods */}
          <div>
            <h2 className="font-display text-2xl text-secondary mb-5">Refund Methods</h2>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Timeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr><td className="px-6 py-4">Store Credit</td><td className="px-6 py-4">Instant</td></tr>
                  <tr><td className="px-6 py-4">JazzCash / EasyPaisa</td><td className="px-6 py-4">1–2 business days</td></tr>
                  <tr><td className="px-6 py-4">Bank Transfer</td><td className="px-6 py-4">3–5 business days</td></tr>
                  <tr><td className="px-6 py-4">Card Refund (Safepay)</td><td className="px-6 py-4">5–7 business days</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center pt-4">
            <p className="text-gray-500 text-sm mb-4">Still have questions?</p>
            <Link href="/contact" className="bg-secondary text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-secondary/90 transition">
              Contact Support
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}
