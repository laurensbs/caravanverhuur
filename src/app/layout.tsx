import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import ScrollToTop from "@/components/ScrollToTop";
import { LayoutWrapper } from "@/components/LayoutWrapper";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "Caravanverhuur Spanje | Caravan Huren Costa Brava — Volledig Uitgerust",
  description:
    "Huur een volledig uitgeruste caravan op de mooiste campings van de Costa Brava. Beddengoed, kookgerei & inventaris inbegrepen. Vanaf €50/dag. Boek seizoen 2026!",
  keywords: [
    "caravan huren",
    "Costa Brava",
    "camping Spanje",
    "caravanverhuur",
    "stacaravan huren",
    "vakantie Spanje",
    "camping Costa Brava",
    "caravan met inventaris",
  ],
  openGraph: {
    title: "Caravanverhuur Spanje — Zorgeloze Caravanvakantie",
    description: "Volledig uitgeruste caravan op de Costa Brava. Uitstappen en genieten — wij regelen de rest. Vanaf €50/dag.",
    url: "https://caravanverhuurspanje.com",
    siteName: "Caravanverhuur Spanje",
    locale: "nl_NL",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1280,
        height: 640,
        alt: "Caravanvakantie op de Costa Brava",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Caravanverhuur Spanje — Zorgeloze Caravanvakantie",
    description: "Volledig uitgeruste caravan op de Costa Brava. Vanaf €50/dag. Boek seizoen 2026!",
    images: ["/og-image.jpg"],
  },
  metadataBase: new URL("https://caravanverhuurspanje.com"),
  alternates: {
    canonical: "/",
  },
};

// JSON-LD structured data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Caravanverhuur Spanje",
  description: "Huur een volledig uitgeruste caravan op de mooiste campings van de Costa Brava.",
  url: "https://caravanverhuurspanje.com",
  logo: "https://u.cubeupload.com/laurensbos/Caravanverhuur1.png",
  image: "https://u.cubeupload.com/laurensbos/Caravanverhuur1.png",
  address: {
    "@type": "PostalAddress",
    addressRegion: "Costa Brava",
    addressCountry: "ES",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 41.9,
    longitude: 3.1,
  },
  areaServed: "Costa Brava, Spanje",
  priceRange: "€50-€95 per dag",
  telephone: "+34650036755",
  email: "info@caravanverhuurspanje.com",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["Dutch", "English", "Spanish"],
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "09:00",
    closes: "18:00",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "350",
    bestRating: "5",
    worstRating: "1",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${dmSans.variable} antialiased`}
      >
        <LayoutWrapper
          header={<Header />}
          footer={<Footer />}
          scrollToTop={<ScrollToTop />}
          cookieConsent={<CookieConsent />}
        >
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
