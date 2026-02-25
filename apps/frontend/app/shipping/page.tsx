export default function ShippingPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-secondary text-white py-20 text-center">
        <h1 className="font-display text-4xl md:text-5xl mb-3">Shipping Policy</h1>
        <p className="text-white/60 text-sm">Fast, reliable delivery across Pakistan</p>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="space-y-10">

          {/* Delivery Times */}
          <div>
            <h2 className="font-display text-2xl text-secondary mb-5">Delivery Timeframes</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { city: "Lahore", time: "1–2 Days", icon: "🚀" },
                { city: "Karachi / Islamabad", time: "2–3 Days", icon: "📦" },
                { city: "Other Cities", time: "3–5 Days", icon: "🚚" },
              ].map((r) => (
                <div key={r.city} className="bg-gray-50 rounded-xl p-5 text-center">
                  <div className="text-3xl mb-2">{r.icon}</div>
                  <p className="font-medium text-secondary text-sm">{r.city}</p>
                  <p className="text-gold-600 font-semibold mt-1">{r.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Charges */}
          <div>
            <h2 className="font-display text-2xl text-secondary mb-5">Shipping Charges</h2>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Order Value</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Shipping Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr>
                    <td className="px-6 py-4 text-gray-700">Under PKR 5,000</td>
                    <td className="px-6 py-4 text-gray-700">PKR 200</td>
                  </tr>
                  <tr className="bg-green-50">
                    <td className="px-6 py-4 text-green-700 font-medium">PKR 5,000 &amp; above</td>
                    <td className="px-6 py-4 text-green-700 font-semibold">FREE 🎉</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* How it works */}
          <div>
            <h2 className="font-display text-2xl text-secondary mb-5">How It Works</h2>
            <div className="space-y-4">
              {[
                { step: "01", title: "Place Your Order", desc: "Order before 2 PM for same-day dispatch (Mon–Sat)." },
                { step: "02", title: "We Pack With Care", desc: "Each item is carefully packaged in our signature ModestStyle wrapping." },
                { step: "03", title: "Courier Pickup", desc: "Our trusted courier partners (TCS, Leopards) collect and scan your parcel." },
                { step: "04", title: "Delivered to You", desc: "You receive an SMS with tracking info once your parcel is on its way." },
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

          {/* Notes */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-sm text-amber-800 space-y-2">
            <p className="font-semibold">Important Notes</p>
            <ul className="list-disc list-inside space-y-1 text-amber-700">
              <li>Orders are processed Mon–Sat, excluding public holidays.</li>
              <li>Delivery times may vary during Eid, sale seasons &amp; extreme weather.</li>
              <li>We currently ship within Pakistan only.</li>
              <li>Contact us within 24 hours if your order hasn&apos;t arrived on time.</li>
            </ul>
          </div>

        </div>
      </section>
    </main>
  );
}
