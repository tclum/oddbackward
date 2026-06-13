import type { Metadata } from "next";
import "./globals.css";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.urls.home),
  title: `${siteConfig.brandName} | Design. Development. Optimization.`,
  description:
    "Custom websites, apps, and workflow improvements for small businesses and teams.",
  openGraph: {
    title: `${siteConfig.brandName} | Design. Development. Optimization.`,
    description:
      "Custom websites, apps, and workflow improvements for small businesses and teams.",
    url: siteConfig.urls.home,
    siteName: siteConfig.brandName,
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
