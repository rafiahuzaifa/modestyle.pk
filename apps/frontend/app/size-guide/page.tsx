export default function SizeGuidePage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-secondary text-white py-20 text-center">
        <h1 className="font-display text-4xl md:text-5xl mb-3">Size Guide</h1>
        <p className="text-white/60 text-sm">Find your perfect fit</p>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="space-y-12">

          {/* How to Measure */}
          <div>
            <h2 className="font-display text-2xl text-secondary mb-6">How to Measure</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { title: "Chest", desc: "Measure around the fullest part of your chest, keeping the tape parallel to the floor.", icon: "📏" },
                { title: "Waist", desc: "Measure around your natural waistline, at the narrowest part of your torso.", icon: "📐" },
                { title: "Length", desc: "Measure from the back of your neck to the desired garment length.", icon: "📌" },
              ].map((m) => (
                <div key={m.title} className="bg-gray-50 rounded-xl p-5">
                  <div className="text-3xl mb-2">{m.icon}</div>
                  <p className="font-medium text-secondary text-sm mb-1">{m.title}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hijab Sizes */}
          <div>
            <h2 className="font-display text-2xl text-secondary mb-5">Hijab Sizes</h2>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-white">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs uppercase">Style</th>
                    <th className="text-left px-6 py-3 text-xs uppercase">Dimensions</th>
                    <th className="text-left px-6 py-3 text-xs uppercase">Best For</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { style: "Square Hijab", dim: "110 × 110 cm", best: "Classic styles, turban looks" },
                    { style: "Rectangular Shawl", dim: "70 × 180 cm", best: "Draping, layered styles" },
                    { style: "Chiffon Dupatta", dim: "100 × 200 cm", best: "Modest draping, formal events" },
                    { style: "Georgette Panel", dim: "60 × 175 cm", best: "Everyday wear, easy styling" },
                  ].map((r) => (
                    <tr key={r.style} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-800">{r.style}</td>
                      <td className="px-6 py-4 text-gray-600">{r.dim}</td>
                      <td className="px-6 py-4 text-gray-500">{r.best}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Abaya Sizes */}
          <div>
            <h2 className="font-display text-2xl text-secondary mb-5">Abaya Sizes</h2>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-white">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs uppercase">Size</th>
                    <th className="text-left px-6 py-3 text-xs uppercase">Chest (cm)</th>
                    <th className="text-left px-6 py-3 text-xs uppercase">Waist (cm)</th>
                    <th className="text-left px-6 py-3 text-xs uppercase">Length (cm)</th>
                    <th className="text-left px-6 py-3 text-xs uppercase">Height</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { size: "XS", chest: "82–86", waist: "68–72", length: "140", height: "5'0\"–5'2\"" },
                    { size: "S", chest: "86–90", waist: "72–76", length: "144", height: "5'2\"–5'4\"" },
                    { size: "M", chest: "90–96", waist: "76–82", length: "148", height: "5'4\"–5'6\"" },
                    { size: "L", chest: "96–102", waist: "82–88", length: "150", height: "5'5\"–5'7\"" },
                    { size: "XL", chest: "102–110", waist: "88–96", length: "152", height: "5'6\"–5'8\"" },
                    { size: "XXL", chest: "110–118", waist: "96–104", length: "154", height: "5'7\"–5'9\"" },
                  ].map((r) => (
                    <tr key={r.size} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-secondary">{r.size}</td>
                      <td className="px-6 py-4 text-gray-600">{r.chest}</td>
                      <td className="px-6 py-4 text-gray-600">{r.waist}</td>
                      <td className="px-6 py-4 text-gray-600">{r.length}</td>
                      <td className="px-6 py-4 text-gray-500">{r.height}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-3">* All measurements are in centimetres. For the best fit, go up one size if you&apos;re between sizes.</p>
          </div>

          {/* Tips */}
          <div className="bg-gold-50 border border-gold-100 rounded-xl p-6">
            <h3 className="font-semibold text-gold-800 mb-3">Fit Tips from Our Stylists</h3>
            <ul className="text-sm text-gold-700 space-y-2">
              <li>🌟 If you&apos;re between sizes, choose the larger size for a more comfortable, modest fit.</li>
              <li>🌟 Chiffon and georgette hijabs drape beautifully when 10–15 cm longer than your usual preference.</li>
              <li>🌟 For abayas, measure your height while standing straight without shoes.</li>
              <li>🌟 Not sure? Contact our styling team on WhatsApp — we&apos;re happy to help!</li>
            </ul>
          </div>

        </div>
      </section>
    </main>
  );
}
