import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { ChatWidget } from "@/app/components/ChatWidget";
import { SlideoutCart } from "@/app/components/cart/slideout-cart";

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
  title: {
    default: "ModestStyle.pk — Premium Hijabs & Modest Fashion",
    template: "%s | ModestStyle.pk",
  },
  description:
    "Pakistan's finest modest fashion destination. Shop luxury hijabs, abayas, jilbabs & accessories with free shipping over PKR 5,000.",
  keywords: [
    "hijab", "abaya", "modest fashion", "Pakistan", "jilbab",
    "prayer wear", "Islamic fashion", "ModestStyle",
  ],
  openGraph: {
    siteName: "ModestStyle.pk",
    locale: "en_PK",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
        <body className="font-sans antialiased bg-white text-secondary">
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <SlideoutCart />
          <ChatWidget />
        </body>
      </html>
    </ClerkProvider>
  );
}
