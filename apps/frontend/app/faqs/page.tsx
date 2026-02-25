"use client";
import { useState } from "react";

const FAQS = [
  {
    category: "Orders & Shopping",
    items: [
      { q: "How do I place an order?", a: "Browse our collection, add items to your cart, then proceed to checkout. You can pay via Cash on Delivery, JazzCash, EasyPaisa, or Safepay (card)." },
      { q: "Can I modify or cancel my order?", a: "You can cancel or modify your order within 2 hours of placing it. Contact us immediately on WhatsApp at +92 300 1234567." },
      { q: "Do I need an account to order?", a: "No, you can checkout as a guest. However, creating an account lets you track orders and save your address for faster checkout." },
      { q: "Is my payment information secure?", a: "Yes. All card payments are processed by Safepay, a PCI-DSS compliant payment gateway. We never store your card details." },
    ],
  },
  {
    category: "Shipping & Delivery",
    items: [
      { q: "How long does delivery take?", a: "Lahore: 1–2 days. Karachi/Islamabad: 2–3 days. Other cities: 3–5 days. Orders placed before 2 PM are dispatched the same day (Mon–Sat)." },
      { q: "How much does shipping cost?", a: "Shipping is PKR 200 for orders under PKR 5,000. Orders above PKR 5,000 get FREE shipping nationwide." },
      { q: "Do you deliver on Sundays?", a: "Our courier partners (TCS, Leopards) deliver Mon–Sat. Sunday deliveries are not available." },
      { q: "Can I track my order?", a: "Yes! Once your order is dispatched, you'll receive an SMS with a tracking number from our courier partner." },
    ],
  },
  {
    category: "Returns & Exchanges",
    items: [
      { q: "What is your return policy?", a: "We accept returns within 7 days of delivery for unused items with original tags and packaging intact." },
      { q: "How do I return an item?", a: "Contact us on WhatsApp or email support@modestyle.pk with your order number. We'll guide you through the return process." },
      { q: "Can I exchange for a different size?", a: "Yes! Exchanges for a different size or color are available within 7 days. The exchanged item is dispatched once we receive your return." },
      { q: "Are sale items returnable?", a: "No, all sale and discounted items are final sale and cannot be returned or exchanged." },
    ],
  },
  {
    category: "Products",
    items: [
      { q: "Are your fabrics true to the photos?", a: "We strive to represent colors accurately. Slight variations may occur due to screen settings. Contact us if you'd like fabric samples for large orders." },
      { q: "How should I wash my hijab/abaya?", a: "We recommend hand washing in cold water with mild detergent, or gentle machine wash. Avoid tumble drying. Iron on low heat with a cloth barrier." },
      { q: "Do you restock sold-out items?", a: "Yes! Join our WhatsApp broadcast or subscribe to our newsletter to be notified when items are restocked." },
      { q: "Do you offer wholesale or bulk orders?", a: "Yes, we offer wholesale pricing for retailers and bulk buyers. Contact us at support@modestyle.pk for pricing." },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center py-4 text-left gap-4"
      >
        <span className="text-sm font-medium text-secondary">{q}</span>
        <span className={`text-gold-500 text-lg transition-transform shrink-0 ${open ? "rotate-45" : ""}`}>+</span>
      </button>
      {open && (
        <p className="text-sm text-gray-500 leading-relaxed pb-4">{a}</p>
      )}
    </div>
  );
}

export default function FAQsPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-secondary text-white py-20 text-center">
        <h1 className="font-display text-4xl md:text-5xl mb-3">Frequently Asked Questions</h1>
        <p className="text-white/60 text-sm">Everything you need to know</p>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="space-y-10">
          {FAQS.map((section) => (
            <div key={section.category}>
              <h2 className="font-display text-xl text-secondary mb-4 pb-2 border-b border-gold-200">
                {section.category}
              </h2>
              <div>
                {section.items.map((item) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}

          <div className="bg-gray-50 rounded-xl p-8 text-center mt-8">
            <p className="font-medium text-secondary mb-2">Still have questions?</p>
            <p className="text-gray-500 text-sm mb-5">Our team is happy to help you</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <a href="https://wa.me/923001234567" className="bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition">
                WhatsApp Us
              </a>
              <a href="/contact" className="bg-secondary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary/90 transition">
                Contact Form
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
