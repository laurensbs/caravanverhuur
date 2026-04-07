import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import { LayoutWrapper } from "@/components/LayoutWrapper";
import { headers } from "next/headers";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "Caravanverhuur Spanje | Caravan Huren Costa Brava — Volledig Uitgerust",
  description:
    "Huur een volledig uitgeruste caravan op de mooiste campings van de Costa Brava. Kookgerei, servies & handdoeken inbegrepen. Beddengoed optioneel te huur. Vanaf €550/week. Boek seizoen 2026!",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const isAdminSubdomain = headersList.get('x-admin-subdomain') === '1';

  return (
    <html lang="nl" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${plusJakarta.variable} ${inter.variable} antialiased`}
        suppressHydrationWarning
      >
        <LayoutWrapper
          header={<Header />}
          footer={<Footer />}
          cookieConsent={<CookieConsent />}
          isAdminSubdomain={isAdminSubdomain}
        >
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
