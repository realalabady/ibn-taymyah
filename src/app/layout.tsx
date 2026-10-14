import type { Metadata, Viewport } from "next";
import { Amiri, IBM_Plex_Sans_Arabic, Readex_Pro } from "next/font/google";
import { site } from "@/site.config";
import "./globals.css";

const display = Readex_Pro({
  variable: "--ff-display",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const body = IBM_Plex_Sans_Arabic({
  variable: "--ff-body",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const quran = Amiri({
  variable: "--ff-quran",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: site.name, template: `%s | ${site.shortName}` },
  description: site.description,
  openGraph: { title: site.name, description: site.description, locale: "ar_SA", type: "website" },
};

export const viewport: Viewport = {
  themeColor: "#f5f7f3",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${display.variable} ${body.variable} ${quran.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
