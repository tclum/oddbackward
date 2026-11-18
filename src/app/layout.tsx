import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const title = `${siteConfig.brandName} | Design. Development. Optimization.`;
const description = "Websites, tools, and less busywork for Hawaiʻi's teams.";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.urls.home),
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    url: siteConfig.urls.home,
    siteName: siteConfig.brandName,
    type: "website",
  },
  other: {
    "build-stamp": process.env.NEXT_PUBLIC_BUILD_STAMP ?? "nostamp",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
