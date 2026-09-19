import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// Fraunces is variable: omit `weight` so the full axis range ships, and pull in
// the optical-size and softness axes that give the headings their warmth.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Bake Baba'z — Handcrafted cakes & bakes in Bikaner",
    template: "%s · Bake Baba'z",
  },
  description:
    "Celebration cakes, custom cake design, gift hampers and fresh everyday bakes, handcrafted in Bikaner and delivered to your door.",
  applicationName: "Bake Baba'z",
  keywords: [
    "bakery Bikaner",
    "custom cakes Bikaner",
    "birthday cake delivery",
    "eggless cakes",
    "gift hampers",
    "wedding cakes Rajasthan",
  ],
  openGraph: {
    type: "website",
    siteName: "Bake Baba'z",
    locale: "en_IN",
    url: appUrl,
    title: "Bake Baba'z — Handcrafted cakes & bakes in Bikaner",
    description:
      "Celebration cakes, custom cake design, gift hampers and fresh everyday bakes, handcrafted in Bikaner.",
    images: [
      {
        url: "/brand/bake-babaz-og.jpg",
        width: 1200,
        height: 630,
        alt: "Bake Baba'z",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bake Baba'z — Handcrafted cakes & bakes in Bikaner",
    description:
      "Celebration cakes, custom cake design and fresh everyday bakes, handcrafted in Bikaner.",
    images: ["/brand/bake-babaz-og.jpg"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#fffaf4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${fraunces.variable} ${dmSans.variable}`}
    >
      <body className="min-h-dvh">
        {children}
        <Toaster
          position="bottom-right"
          // Clear the floating WhatsApp button on desktop and the fixed
          // action bar on phones.
          offset={{ bottom: 96, right: 28 }}
          mobileOffset={{ bottom: 168 }}
          toastOptions={{
            style: {
              background: "#fffaf4",
              border: "1px solid rgba(61,37,33,.14)",
              color: "#3d2521",
              borderRadius: "14px",
              fontFamily: "var(--font-dm-sans), sans-serif",
              boxShadow: "0 18px 44px rgba(76,43,34,.14)",
            },
          }}
        />
      </body>
    </html>
  );
}
