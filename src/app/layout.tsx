import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
