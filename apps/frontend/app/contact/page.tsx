import { ContactForm } from "./ContactForm";
import { SUPPORT_EMAIL, WHATSAPP_DISPLAY } from "@/lib/site";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-secondary text-white py-20 text-center">
        <h1 className="font-display text-4xl md:text-5xl mb-3">Contact Us</h1>
        <p className="text-white/60 text-sm">We&apos;re here to help — reach out anytime</p>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="font-display text-2xl text-secondary mb-6">Send Us a Message</h2>
            <ContactForm />
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-2xl text-secondary mb-6">Get in Touch</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Our customer care team is available 6 days a week to assist you with orders,
                products, and anything else you need.
              </p>
            </div>

            {[
              {
                title: "WhatsApp",
                detail: WHATSAPP_DISPLAY,
                sub: "Mon–Sat, 9am–7pm PKT",
                icon: "📱",
              },
              {
                title: "Email",
                detail: SUPPORT_EMAIL,
                sub: "Response within 24 hours",
                icon: "✉️",
              },
              {
                title: "Location",
                detail: "Lahore, Pakistan",
                sub: "Nationwide shipping available",
                icon: "📍",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 p-5 bg-gray-50 rounded-xl">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="font-medium text-secondary text-sm">{item.title}</p>
                  <p className="text-gray-800 text-sm mt-0.5">{item.detail}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}

            <div className="bg-gold-50 border border-gold-200 rounded-xl p-5">
              <p className="text-sm font-medium text-gold-800 mb-1">Business Hours</p>
              <div className="text-xs text-gold-700 space-y-1">
                <p>Monday – Saturday: 9:00 AM – 7:00 PM</p>
                <p>Sunday: Closed</p>
                <p className="text-gold-500 mt-2">* All times in Pakistan Standard Time (PKT)</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
