import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-secondary text-white py-24 text-center">
        <p className="text-gold-400 text-xs tracking-[0.3em] uppercase mb-4">Our Story</p>
        <h1 className="font-display text-4xl md:text-6xl mb-4">About ModestStyle.pk</h1>
        <p className="text-white/60 max-w-xl mx-auto text-sm leading-relaxed">
          Pakistan&apos;s finest destination for elegant modest fashion — where faith meets style.
        </p>
      </section>

      {/* Mission */}
      <section className="container mx-auto px-4 py-20 max-w-4xl text-center">
        <p className="text-gold-500 text-xs tracking-[0.3em] uppercase mb-3">Our Mission</p>
        <h2 className="font-display text-3xl md:text-4xl text-secondary mb-6">
          Elegance in Every Drape
        </h2>
        <p className="text-gray-500 leading-relaxed max-w-2xl mx-auto">
          At ModestStyle.pk, we believe that modest fashion is not a limitation — it is an
          expression of grace, identity, and confidence. Founded in Lahore, we curate premium
          hijabs, abayas, and modest wear that blend timeless elegance with everyday comfort.
          Every piece in our collection is thoughtfully selected to celebrate the modern
          Pakistani woman.
        </p>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-gold-500 text-xs tracking-[0.3em] uppercase mb-3">What We Stand For</p>
            <h2 className="font-display text-3xl text-secondary">Our Values</h2>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "✦", title: "Quality First", desc: "Every fabric is tested for durability, softness, and colour-fastness before it reaches you." },
              { icon: "🤍", title: "Modest & Stylish", desc: "We prove that modesty and style are not opposites — they are the perfect pair." },
              { icon: "🇵🇰", title: "Made in Pakistan", desc: "We proudly work with local artisans and manufacturers to support Pakistani craftsmanship." },
              { icon: "💛", title: "Customer Obsessed", desc: "From packaging to after-sales support, we go the extra mile for every customer." },
            ].map((v) => (
              <div key={v.title} className="bg-white rounded-xl p-6 text-center shadow-sm">
                <div className="text-3xl mb-3">{v.icon}</div>
                <h3 className="font-semibold text-secondary text-sm mb-2">{v.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="container mx-auto px-4 py-20 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-gold-500 text-xs tracking-[0.3em] uppercase mb-3">How It Started</p>
            <h2 className="font-display text-3xl text-secondary mb-5">Born from a Passion for Modest Fashion</h2>
            <div className="space-y-4 text-gray-500 text-sm leading-relaxed">
              <p>
                ModestStyle.pk was founded by a group of passionate women who were frustrated
                by the lack of high-quality modest fashion options in Pakistan. Shopping for
                elegant hijabs and abayas meant either settling for poor quality or paying
                exorbitant prices for imported pieces.
              </p>
              <p>
                We decided to change that. Starting from a small studio in Lahore, we began
                sourcing the finest fabrics — georgette, chiffon, crepe, and luxury cashmere —
                and working with skilled local tailors to create modest wear that Pakistani
                women truly deserve.
              </p>
              <p>
                Today, we ship across Pakistan, serving thousands of happy customers who trust
                us for their everyday modest wear, special occasions, and everything in between.
              </p>
            </div>
          </div>
          <div className="bg-gray-100 rounded-2xl h-80 flex items-center justify-center">
            <div className="text-center text-gray-300">
              <p className="font-display text-6xl mb-2">✦</p>
              <p className="text-sm">ModestStyle.pk</p>
              <p className="text-xs">Lahore, Pakistan</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-secondary text-white py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "5,000+", label: "Happy Customers" },
              { number: "200+", label: "Products" },
              { number: "50+", label: "Cities Served" },
              { number: "4.8★", label: "Average Rating" },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-display text-3xl text-gold-400 mb-1">{s.number}</p>
                <p className="text-white/60 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <h2 className="font-display text-3xl text-secondary mb-4">Explore Our Collection</h2>
        <p className="text-gray-500 text-sm mb-8">Discover hijabs, abayas & accessories curated just for you</p>
        <Link href="/products" className="bg-secondary text-white px-10 py-3.5 rounded-lg text-sm font-medium hover:bg-secondary/90 transition">
          Shop Now
        </Link>
      </section>
    </main>
  );
}
