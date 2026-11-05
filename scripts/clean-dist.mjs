#!/usr/bin/env node
/**
 * DỌN THƯ MỤC `dist/` TRƯỚC KHI DEPLOY.
 *
 * ── VÌ SAO CẦN? ──
 * ⚠ `next build` với `output: "export"` ghi thẳng kết quả export vào
 *   `dist/`. Nhưng nếu trước đó đã chạy `next dev` (với `distDir` cũ
 *   là `dist`), thì cache dev nằm ở `dist/dev/` — 115MB!
 *
 *   `wrangler pages deploy dist` đẩy TOÀN BỘ thư mục → cache dev
 *   bị deploy lên production. Không chỉ tốn bandwidth + thời gian
 *   deploy, mà còn có thể lộ file cache/source map không nên public.
 *
 * GIỜ: `next.config.js` đã tách `distDir` → dev dùng `.next-dev/`,
 * nên `dist/` về lý thuyết đã sạch. Script này là LƯỚI AN TOÀN:
 * dọn mọi thứ trong `dist/` KHÔNG thuộc static export.
 *
 * ── DANH SÁCH GIỮ LẠI ──
 * Mọi thứ `next build` sinh ra cho static export, cộng với `public/`
 * được copy vào: models, draco, audio, og-image, _headers, robots.txt,
 * icon.svg, các file HTML, _next/, admin/, 404...
 *
 * → Cách an toàn nhất: xoá các THƯ MỤC/GROUP không thuộc export
 *   (`dev`, `.next`, `cache`) và các file tạm. Không xoá mù quáng.
 */

import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(REPO_ROOT, "dist");

/**
 * Thư mục KHÔNG được deploy — là cache/tooling nội bộ.
 */
const JUNK_DIRS = ["dev", ".next", "cache", ".cache", "tmp"];

if (!existsSync(DIST)) {
  console.log("ℹ dist/ chưa tồn tại — không cần dọn.");
  process.exit(0);
}

let removed = 0;
let bytes = 0;

function dirSize(dir) {
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      total += dirSize(full);
    } else {
      try {
        total += statSync(full).size;
      } catch {
        /* bỏ qua file đã bị xoá */
      }
    }
  }
  return total;
}

for (const name of JUNK_DIRS) {
  const target = join(DIST, name);
  if (!existsSync(target)) continue;
  const size = dirSize(target);
  rmSync(target, { recursive: true, force: true });
  bytes += size;
  removed++;
  console.log(`  ✗ Đã xoá ${name}/ — ${(size / 1024 / 1024).toFixed(1)} MB`);
}

const remaining = readdirSync(DIST);
console.log(
  removed > 0
    ? `\n✓ Đã dọn ${removed} mục, giải phóng ${(bytes / 1024 / 1024).toFixed(1)} MB`
    : "\n✓ dist/ đã sạch — không có gì để dọn."
);
console.log(`  Còn lại ${remaining.length} mục trong dist/`);
