import type { Metadata } from "next";
import { Playfair_Display, Inter, Pinyon_Script } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  preload: true,
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

const pinyon = Pinyon_Script({
  subsets: ["latin"],
  variable: "--font-pinyon",
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Tùng & Hằng — Save The Date · 27.12.26",
  description:
    "Thiệp mời cưới của Tùng Phạm & Thuý Hằng — 27 Tháng 12, 2026 tại Kênh, Cẩm Bình, Hà Tĩnh.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${playfair.variable} ${inter.variable} ${pinyon.variable}`}>
      <body className="bg-beige text-mocha font-sans">{children}</body>
    </html>
  );
}
