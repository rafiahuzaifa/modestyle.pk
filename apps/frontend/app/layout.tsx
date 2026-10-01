import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { ChatWidget } from "@/app/components/ChatWidget";
import { SlideoutCart } from "@/app/components/cart/slideout-cart";
import { SocialProofToast } from "@/app/components/SocialProofToast";
import { DiscountPopup } from "@/app/components/DiscountPopup";
import { SITE_URL } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ModestStyle.pk — Premium Hijabs & Modest Fashion in Pakistan",
    template: "%s | ModestStyle.pk",
  },
  description:
    "Pakistan's finest modest fashion destination. Shop luxury hijabs, abayas, jilbabs, prayer wear & accessories with nationwide delivery and free shipping over PKR 5,000.",
  keywords: [
    "hijab", "abaya", "modest fashion", "Pakistan", "jilbab",
    "prayer wear", "Islamic fashion", "ModestStyle", "buy hijab online Pakistan",
    "abaya online Pakistan", "modest clothing Pakistan",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    siteName: "ModestStyle.pk",
    locale: "en_PK",
    type: "website",
    url: SITE_URL,
    title: "ModestStyle.pk — Premium Hijabs & Modest Fashion in Pakistan",
    description:
      "Shop luxury hijabs, abayas, jilbabs, prayer wear & accessories with nationwide delivery across Pakistan.",
    images: [{ url: "/sc6.webp", width: 1200, height: 630, alt: "ModestStyle.pk" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "ModestStyle.pk — Premium Hijabs & Modest Fashion in Pakistan",
    description:
      "Shop luxury hijabs, abayas, jilbabs, prayer wear & accessories with nationwide delivery across Pakistan.",
    images: ["/sc6.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "ModestStyle.pk",
        url: SITE_URL,
        logo: `${SITE_URL}/sc6.webp`,
        sameAs: [
          "https://instagram.com/modestyle.pk",
          "https://facebook.com/modestyle.pk",
          "https://tiktok.com/@modestyle.pk",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "ModestStyle.pk",
        publisher: { "@id": `${SITE_URL}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/products?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
        <body className="font-sans antialiased bg-white text-secondary">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <SlideoutCart />
          <ChatWidget />
          <SocialProofToast />
          <DiscountPopup />
        </body>
      </html>
    </ClerkProvider>
  );
}
