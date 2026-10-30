import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
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

/**
 * Domain chính thức — dùng cho OG / share card.
 * ĐỔI Ở ĐÂY nếu deploy tên miền riêng (vd: https://tung-hang.wedding).
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wedding-journey.pages.dev";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Tùng & Hằng — Save The Date · 27.12.26",
  description:
    "Thiệp mời cưới của Tùng Phạm & Thuý Hằng — 27 Tháng 12, 2026 tại Kênh, Cẩm Bình, Hà Tĩnh.",
  keywords: [
    "wedding",
    "thiệp mời cưới",
    "save the date",
    "Tùng Phạm",
    "Thuý Hằng",
    "27.12.2026",
    "Cẩm Bình",
    "Hà Tĩnh",
  ],
  authors: [{ name: "Tùng Phạm & Thuý Hằng" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    title: "Tùng & Hằng — Thiệp mời cưới · 27.12.2026",
    description:
      "Trân trọng mời bạn đến chung vui trong ngày trọng đại của chúng mình — 27 Tháng 12, 2026 tại Kênh, Cẩm Bình, Hà Tĩnh.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Thiệp mời cưới Tùng & Hằng — 27.12.2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tùng & Hằng — Thiệp mời cưới · 27.12.2026",
    description:
      "Trân trọng mời bạn đến chung vui trong ngày trọng đại của chúng mình.",
    images: ["/og-image.svg"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-beige text-mocha font-sans" suppressHydrationWarning>{children}</body>
    </html>
  );
}
