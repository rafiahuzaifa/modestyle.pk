export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-secondary text-white py-20 text-center">
        <h1 className="font-display text-4xl md:text-5xl mb-3">Privacy Policy</h1>
        <p className="text-white/60 text-sm">Last updated: February 2026</p>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="prose prose-sm max-w-none space-y-8 text-gray-600">

          <div className="bg-gold-50 border border-gold-100 rounded-xl p-5 text-sm text-gold-800">
            Your privacy matters to us. This policy explains what data we collect, how we use it,
            and how we protect it. By using ModestStyle.pk, you agree to this policy.
          </div>

          {[
            {
              title: "1. Information We Collect",
              content: [
                "Personal Information: Name, email address, phone number, and shipping address when you place an order or create an account.",
                "Payment Information: We do not store card details. All payments are processed securely by Safepay (PCI-DSS compliant), JazzCash, or EasyPaisa.",
                "Usage Data: Pages visited, products viewed, time spent on site, and browser/device information via analytics tools.",
                "Communications: Messages you send us via contact forms, WhatsApp, or email.",
              ],
            },
            {
              title: "2. How We Use Your Information",
              content: [
                "To process and fulfil your orders.",
                "To send order confirmations, shipping updates, and delivery notifications.",
                "To respond to your inquiries and provide customer support.",
                "To send promotional emails and offers (you can opt out anytime).",
                "To improve our website, products, and services.",
                "To prevent fraud and ensure platform security.",
              ],
            },
            {
              title: "3. Information Sharing",
              content: [
                "Courier Partners (TCS, Leopards, etc.): We share your name, address, and phone number to deliver your orders.",
                "Payment Gateways: Transaction data is shared with Safepay, JazzCash, or EasyPaisa to process payments.",
                "Analytics: We use anonymised data for Google Analytics.",
                "We never sell your personal data to third parties.",
              ],
            },
            {
              title: "4. Data Security",
              content: [
                "We use SSL/TLS encryption for all data transmitted between your browser and our servers.",
                "Payment processing uses industry-standard PCI-DSS compliant gateways.",
                "Access to your personal data is restricted to authorised team members only.",
                "We retain your data only as long as necessary to fulfil orders and comply with legal obligations.",
              ],
            },
            {
              title: "5. Your Rights",
              content: [
                "Access: You can request a copy of the personal data we hold about you.",
                "Correction: You can update your account information at any time.",
                "Deletion: You can request deletion of your account and associated data.",
                "Opt-Out: Unsubscribe from marketing emails at any time via the unsubscribe link.",
                "To exercise any of these rights, contact us at support@modestyle.pk.",
              ],
            },
            {
              title: "6. Cookies",
              content: [
                "We use cookies to maintain your session, remember your cart, and analyse site traffic.",
                "You can disable cookies in your browser settings, but some site features may not work correctly.",
              ],
            },
            {
              title: "7. Children's Privacy",
              content: [
                "ModestStyle.pk is not intended for children under 13. We do not knowingly collect data from children.",
              ],
            },
            {
              title: "8. Changes to This Policy",
              content: [
                "We may update this policy from time to time. We will notify you of significant changes via email or a notice on our website.",
              ],
            },
            {
              title: "9. Contact Us",
              content: [
                "For any privacy-related questions, contact us at support@modestyle.pk or WhatsApp +92 300 1234567.",
              ],
            },
          ].map((section) => (
            <div key={section.title}>
              <h2 className="font-display text-xl text-secondary mb-3">{section.title}</h2>
              <ul className="space-y-2">
                {section.content.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm text-gray-500 leading-relaxed">
                    <span className="text-gold-400 shrink-0 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
