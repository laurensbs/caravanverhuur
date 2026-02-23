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
  title: "Caravanverhuur Costa Brava | Zorgeloze Caravanvakantie",
  description:
    "Huur een volledig uitgeruste caravan op de mooiste campings van de Costa Brava. Caravan staat klaar met volledige inventaris. Geen gedoe, alleen genieten!",
  keywords: [
    "caravan huren",
    "Costa Brava",
    "camping",
    "Spanje",
    "vakantie",
    "caravanverhuur",
  ],
  openGraph: {
    title: "Caravanverhuur Costa Brava",
    description: "Zorgeloze caravanvakantie op de Costa Brava",
    url: "https://caravanverhuurcostabrava.com",
    siteName: "Caravanverhuur Costa Brava",
    locale: "nl_NL",
    type: "website",
  },
  metadataBase: new URL("https://caravanverhuurcostabrava.com"),
  alternates: {
    canonical: "/",
  },
};

// JSON-LD structured data for SEO
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Caravanverhuur Costa Brava",
  description: "Huur een volledig uitgeruste caravan op de mooiste campings van de Costa Brava.",
  url: "https://caravanverhuurcostabrava.com",
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
    ratingValue: "5",
    reviewCount: "100",
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
