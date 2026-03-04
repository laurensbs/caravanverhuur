import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import ScrollToTop from "@/components/ScrollToTop";
import { LayoutWrapper } from "@/components/LayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Caravans Costa Brava | Caravan Huren Spanje — Volledig Uitgerust",
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
    title: "Caravans Costa Brava — Zorgeloze Caravanvakantie",
    description: "Volledig uitgeruste caravan op de Costa Brava. Uitstappen en genieten — wij regelen de rest. Vanaf €50/dag.",
    url: "https://caravanscostabrava.nl",
    siteName: "Caravans Costa Brava",
    locale: "nl_NL",
    type: "website",
    images: [
      {
        url: "https://images.unsplash.com/photo-1626680114529-3f6ffa002b80?w=1200&q=80",
        width: 1200,
        height: 630,
        alt: "Caravanvakantie op de Costa Brava",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Caravans Costa Brava — Zorgeloze Caravanvakantie",
    description: "Volledig uitgeruste caravan op de Costa Brava. Vanaf €50/dag. Boek seizoen 2026!",
    images: ["https://images.unsplash.com/photo-1626680114529-3f6ffa002b80?w=1200&q=80"],
  },
  metadataBase: new URL("https://caravanscostabrava.nl"),
  alternates: {
    canonical: "/",
  },
};

// JSON-LD structured data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Caravans Costa Brava",
  description: "Huur een volledig uitgeruste caravan op de mooiste campings van de Costa Brava.",
  url: "https://caravanscostabrava.nl",
  logo: "https://u.cubeupload.com/laurensbos/Caravanverhuur.png",
  image: "https://u.cubeupload.com/laurensbos/Caravanverhuur.png",
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
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    opens: "09:00",
    closes: "18:00",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "127",
    bestRating: "5",
  },
  sameAs: [],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
