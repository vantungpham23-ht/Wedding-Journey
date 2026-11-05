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
 * PRELOAD ASSET 3D — bắt đầu tải model NGAY khi HTML tới.
 *
 * ── VÌ SAO CẦN? ──
 * ⚠ VẤN ĐỀ GỐC: trình duyệt chỉ biết tải GLB sau khi:
 *   HTML → JS bundle (960KB three.js) → React hydrate → Canvas mount
 *   → useLoader mới bắt đầu fetch GLB.
 *
 *   4 bước TUẦN TỰ trên mạng di động = 5-15 giây chờ TRƯỚC khi
 *   byte đầu tiên của model bắt đầu tải. Đây chính là lý do
 *   "phải chờ rất lâu mới load được đoạn nhẫn bay vào".
 *
 * GIỜ: `<link rel="preload">` trong HTML → trình duyệt tải GLB SONG
 * SONG với JS bundle. Chỉ cần 1 RTT là nhẫn có mặt.
 *
 * ⚠ CHỈ preload 2 NHẪN (432KB), KHÔNG preload backdrop/nhân vật:
 *   preload 8MB sẽ giành băng thông với JS → JS tới muộn hơn →
 *   Canvas mount muộn hơn → tệ hơn. Backdrop/nhân vật để `fetch()`
 *   với `priority: "low"` (xem `PreloadAssets` trong `app/page.tsx`).
 *
 * ⚠ `crossOrigin="anonymous"` BẮT BUỘC cho `as="fetch"`: fetch request
 *   luôn ở CORS mode, không có attribute này thì preload bị bỏ qua.
 *
 * ⚠ KHÔNG thêm `<link>` thủ công ở đây: Next.js 16 TỰ ĐỘNG inject
 *   preload cho file trong `public/` khi render (nếu không có sẽ thêm
 *   `<link rel="preload" as="fetch" type="model/gltf-binary">` vào
 *   `<head>`). Thêm thủ công → DUPLICATE preload (2 request cho 1 file).
 */
export const PRELOAD_MODEL_PATHS = [
  "/models/bride-ring.glb",
  "/models/groom-ring.glb",
] as const;

/**
 * Domain chính thức — dùng cho OG / share card.
 * ĐỔI Ở ĐÂY nếu deploy tên miền riêng (vd: https://tung-hang.wedding).
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tunghangwedding.life";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Tùng & Hằng — Save The Date · 27.12.26 (tức 19.11.2026 âm lịch)",
  description:
    "Thiệp mời cưới của Tùng Phạm & Thuý Hằng — 27 Tháng 12, 2026 (tức 19.11.2026 âm lịch) tại Kênh, Cẩm Bình, Hà Tĩnh.",
  keywords: [
    "wedding",
    "thiệp mời cưới",
    "save the date",
    "Tùng Phạm",
    "Thuý Hằng",
    "27.12.2026",
    "19.11.2026 âm lịch",
    "Cẩm Bình",
    "Hà Tĩnh",
  ],
  authors: [{ name: "Tùng Phạm & Thuý Hằng" }],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "/",
    title: "Tùng & Hằng — Thiệp mời cưới · 27.12.2026 (tức 19.11.2026 âm lịch)",
    description:
      "Trân trọng mời bạn đến chung vui trong ngày trọng đại của chúng mình — 27 Tháng 12, 2026 (tức 19.11.2026 âm lịch) tại Kênh, Cẩm Bình, Hà Tĩnh.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        type: "image/png",
        alt: "Thiệp mời cưới Tùng & Hằng — 27.12.2026 (tức 19.11.2026 âm lịch)",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tùng & Hằng — Thiệp mời cưới · 27.12.2026 (tức 19.11.2026 âm lịch)",
    description:
      "Trân trọng mời bạn đến chung vui trong ngày trọng đại của chúng mình.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
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
