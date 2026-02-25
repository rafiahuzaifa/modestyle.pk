export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-secondary text-white py-20 text-center">
        <h1 className="font-display text-4xl md:text-5xl mb-3">Terms of Service</h1>
        <p className="text-white/60 text-sm">Last updated: February 2026</p>
      </section>

      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="space-y-8 text-gray-600">

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-sm text-blue-800">
            By accessing or using ModestStyle.pk, you agree to be bound by these Terms of Service.
            Please read them carefully before placing an order or using our services.
          </div>

          {[
            {
              title: "1. Acceptance of Terms",
              content: "By browsing our website, creating an account, or placing an order, you confirm that you have read, understood, and agree to these Terms of Service and our Privacy Policy.",
            },
            {
              title: "2. Products & Pricing",
              content: "All prices are listed in Pakistani Rupees (PKR) and are inclusive of applicable taxes. We reserve the right to change prices at any time. In the event of a pricing error, we will notify you and give you the option to confirm or cancel your order. Product images are for illustrative purposes — slight colour variations may occur due to screen settings.",
            },
            {
              title: "3. Orders & Payment",
              content: "Orders are confirmed once payment is received or, in the case of Cash on Delivery, once our team verifies the order. We reserve the right to refuse or cancel any order at our discretion. For COD orders, a non-refundable advance may be required for high-value orders. Accepted payment methods: Cash on Delivery, JazzCash, EasyPaisa, and Safepay (Visa/Mastercard).",
            },
            {
              title: "4. Shipping & Delivery",
              content: "We ship within Pakistan only. Delivery timelines are estimates and may vary due to courier delays, public holidays, or unforeseen circumstances. ModestStyle.pk is not liable for delays caused by courier partners. Risk of loss passes to you upon delivery to the courier.",
            },
            {
              title: "5. Returns & Exchanges",
              content: "Returns are accepted within 7 days of delivery for unused items in original condition. Sale items, accessories, and custom orders are non-returnable. Refer to our Returns & Exchange Policy for full details. Refunds are processed via the original payment method or as store credit.",
            },
            {
              title: "6. User Accounts",
              content: "You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorised use of your account. We reserve the right to suspend or terminate accounts that violate these terms.",
            },
            {
              title: "7. Intellectual Property",
              content: "All content on ModestStyle.pk — including images, text, logos, and design — is the property of ModestStyle.pk and is protected by Pakistani and international copyright laws. You may not reproduce, distribute, or use our content without express written permission.",
            },
            {
              title: "8. Prohibited Activities",
              content: "You agree not to: use our site for any unlawful purpose, attempt to gain unauthorised access to our systems, submit false or misleading information, or interfere with the proper operation of our platform.",
            },
            {
              title: "9. Limitation of Liability",
              content: "ModestStyle.pk is not liable for indirect, incidental, or consequential damages arising from the use of our products or services. Our maximum liability to you will not exceed the amount paid for the specific order in question.",
            },
            {
              title: "10. Governing Law",
              content: "These Terms are governed by the laws of the Islamic Republic of Pakistan. Any disputes shall be subject to the exclusive jurisdiction of the courts of Lahore, Punjab.",
            },
            {
              title: "11. Changes to Terms",
              content: "We reserve the right to update these Terms at any time. Continued use of our site after changes constitutes acceptance of the new Terms. We will notify you of material changes via email.",
            },
            {
              title: "12. Contact",
              content: "For questions about these Terms, contact us at support@modestyle.pk or WhatsApp +92 300 1234567.",
            },
          ].map((section) => (
            <div key={section.title}>
              <h2 className="font-display text-xl text-secondary mb-2">{section.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
