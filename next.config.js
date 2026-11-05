/** @type {import('next').NextConfig} */

/**
 * Thư mục build — tách riêng DEV và PRODUCTION.
 *
 * ── VÌ SAO CẦN? ──
 * ⚠ VẤN ĐỀ: `next dev` ghi cache build vào `dist/dev/` (115MB!).
 *   `dist/` cũng chính là thư mục static export mà `wrangler pages
 *   deploy dist` đẩy lên Cloudflare.
 *
 *   → Cache dev (115MB) bị deploy LÊN PRODUCTION. Không chỉ tốn
 *     bandwidth/deploy time — mà còn làm lượng file của Pages bị phình
 *     to, và rủi ro lộ source map / code dev lên production.
 *
 * GIỜ: dev dùng `.next-dev/` (nằm ngoài `dist/`) → `dist/` chỉ chứa
 * đúng những gì cần deploy.
 *
 * ⚠ `NODE_ENV` do Next.js tự set: "development" khi `next dev`,
 *   "production" khi `next build`.
 */
const isDev = process.env.NODE_ENV === "development";

const nextConfig = {
  reactStrictMode: true,
  output: "export",
  distDir: isDev ? ".next-dev" : "dist",
  images: { unoptimized: true },
  // Static export friendly: keep client-side routing intact.
  trailingSlash: true,
};

module.exports = nextConfig;
