/**
 * Sinh ảnh OG (link preview) từ `assets/og-image-source.jpg`.
 *
 * Chạy:  node scripts/generate-og-image.mjs
 *
 * ── VÌ SAO CẦN SCRIPT NÀY ──
 * Facebook / Zalo / Messenger / Twitter KHÔNG render SVG cho `og:image`
 * — họ cần ảnh raster (PNG/JPEG). Ngoài ra nhiều nền tảng cache ảnh
 * preview rất lâu, nên ảnh phải có sẵn ở đúng kích thước chuẩn.
 *
 * Kích thước chuẩn OG: 1200 × 630 (tỉ lệ 1.91:1) — dùng chung được cho
 * Facebook, Zalo, Messenger, WhatsApp, LinkedIn, Instagram.
 * Twitter (`summary_large_image`) cắt theo 2:1 nên nội dung quan trọng
 * phải nằm trong vùng giữa — script crop theo `attention` để giữ chủ thể.
 *
 * Script này chạy offline (không cần network), dùng `sharp` đã có sẵn
 * trong devDependencies.
 *
 * Ảnh nguồn để ở `assets/` (KHÔNG phải `public/`) để không bị deploy
 * thừa lên Cloudflare Pages.
 */

import sharp from "sharp";
import { readFileSync, statSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const SOURCE = join(ROOT, "assets", "og-image-source.jpg");
const OUT_PNG = join(ROOT, "public", "og-image.png");
const OUT_JPG = join(ROOT, "public", "og-image.jpg");

const WIDTH = 1200;
const HEIGHT = 630;

mkdirSync(join(ROOT, "public"), { recursive: true });

const source = readFileSync(SOURCE);

const resize = () =>
  sharp(source, { failOn: "none" }).resize(WIDTH, HEIGHT, {
    fit: "cover",
    position: "attention", // tự canh vùng có chủ thể, tránh cắt mất mặt
  });

// ── Ảnh chính: PNG (lossless, gradient/text không bị dịch màu) ──
await resize().png({ quality: 90, compressionLevel: 9 }).toFile(OUT_PNG);

// ── Bản JPEG dự phòng cho nền tảng không nhận PNG ──
await resize().jpeg({ quality: 88, mozjpeg: true }).toFile(OUT_JPG);

const meta = await sharp(OUT_PNG).metadata();
console.log(
  `✓ og-image.png  ${meta.width}x${meta.height}  ${(
    statSync(OUT_PNG).size / 1024
  ).toFixed(0)} KB`
);
console.log(`✓ og-image.jpg  ${WIDTH}x${HEIGHT}  ${(statSync(OUT_JPG).size / 1024).toFixed(0)} KB`);
