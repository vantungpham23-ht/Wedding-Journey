#!/usr/bin/env node
/**
 * TỐI ƯU MODEL 3D — giảm vertex + nén Draco.
 *
 * ── VÌ SAO CẦN? ──
 * Backdrop gốc có 4.45M vertices (191MB VRAM). GPU phải xử lý 4.45M
 * đỉnh mỗi khung hình → lag rõ rệt trên máy yếu.
 *
 * Sau khi tối ưu:
 *   backdrop : 4.45M → 1.83M verts (15.8MB → 6.9MB)
 *   nhẫn     : 199k → 25k  ·  367k → 44k verts
 *
 * ── QUY TRÌNH ──
 *   1. `weld`      — gộp vertex trùng (split verts chặn simplification)
 *   2. `simplify`  — giảm tam giác, giới hạn sai số bằng `--error`
 *   3. `draco`     — nén lại để tải nhanh (Three.js decode lúc runtime)
 *
 * ⚠ `simplify` BỊ GIỚI HẠN bởi topology: muốn giảm nhiều hơn thì
 *   phải nới `--error` (sai số cho phép). Mặc định `--error 0.02`
 *   đạt ~1.8M verts cho backdrop — đây là điểm bão hoà của mesh.
 *
 * ── DÙNG ──
 *   node scripts/optimize-models.mjs                      # tối ưu tất cả
 *   node scripts/optimize-models.mjs backdrop             # chỉ backdrop
 *
 * ⚠ Script GHI ĐÈ file gốc trong public/models/. Luôn BACKUP trước.
 */

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Đường dẫn CLI gltf-transform (chạy qua npx, không cần cài global) */
const GLTF_TRANSFORM = ["npx", "--yes", "@gltf-transform/cli@4.2.0"];

/** Thư mục gốc của repo — để script chạy được từ BẤT KỲ đâu */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MODELS_DIR = join(REPO_ROOT, "public/models");

/**
 * Cấu hình tối ưu cho từng model.
 *
 * `ratio`  — tỉ lệ tam giác mục tiêu (0.05 = còn 5%)
 * `error`  — sai số tối đa cho phép (giữ hình dáng)
 */
const TARGETS = [
  {
    file: "wedding-backdrop.glb",
    ratio: 0.05,
    error: 0.02,
    note: "4.45M verts → ~1.83M",
  },
  {
    file: "bride-ring.glb",
    ratio: 0.08,
    error: 0.02,
    note: "199k verts → ~25k",
  },
  {
    file: "groom-ring.glb",
    ratio: 0.08,
    error: 0.02,
    note: "367k verts → ~44k",
  },
];

/**
 * Kiểm tra model ĐÃ ĐƯỢC TỐI ƯU CHƯA.
 *
 * ⚠ CỰC KỲ QUAN TRỌNG: chạy `simplify` trên model ĐÃ được simplify +
 *   draco sẽ PHÁ HỎNG model (mesh rút còn 25k verts → weld làm mất
 *   topology → simplify xuống ~0 verts → file còn 2.7KB, mất hết hình).
 *
 *   → Dùng `KHR_draco_mesh_compression` làm dấu hiệu: file có extension
 *     này = đã nén = đã qua pipeline.
 */
function isAlreadyOptimized(filePath) {
  try {
    const buf = readFileSync(filePath);
    const jsonLen = buf.readUInt32LE(12);
    const json = JSON.parse(buf.slice(20, 20 + jsonLen).toString("utf8"));
    return Boolean(json.extensionsUsed?.includes("KHR_draco_mesh_compression"));
  } catch {
    return false;
  }
}

/**
 * Chạy 1 lệnh gltf-transform.
 *
 * ⚠ `execFileSync` cần tên lệnh + args riêng, không spread mảng lồng —
 *   nên tách `GLTF_TRANSFORM` thành `cmd` + `prefix`.
 */
function gt(args) {
  const [cmd, ...prefix] = GLTF_TRANSFORM;
  return execFileSync(cmd, [...prefix, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 1024 * 1024 * 32,
  });
}

/** Tối ưu 1 model: weld → simplify → draco */
function optimize(target, workDir) {
  const src = join(MODELS_DIR, target.file);
  if (!existsSync(src)) {
    console.warn(`  ⚠ BỎ QUA ${target.file} — không tìm thấy file`);
    return false;
  }

  // ⚠ CHỐNG PHÁ HỎNG: bỏ qua model đã qua pipeline
  if (isAlreadyOptimized(src)) {
    console.log(
      `\n▸ ${target.file} — ĐÃ tối ưu (có Draco), bỏ qua để tránh hỏng model.`,
    );
    console.log(
      "  Muốn tối ưu lại? Xoá file gốc trước, hoặc dùng bản backup chưa nén.",
    );
    return false;
  }

  const backup = join(workDir, `${target.file}.backup`);
  copyFileSync(src, backup);

  const welded = join(workDir, `${target.file}.welded`);
  const simplified = join(workDir, `${target.file}.simplified`);
  const out = join(workDir, `${target.file}.out`);

  console.log(`\n▸ ${target.file}  (${target.note})`);

  // 1. WELD — gộp vertex trùng
  gt(["weld", src, welded]);

  // 2. SIMPLIFY — giảm tam giác
  gt([
    "simplify",
    welded,
    simplified,
    "--ratio",
    String(target.ratio),
    "--error",
    String(target.error),
  ]);

  // 3. DRACO — nén lại
  gt([
    "draco",
    simplified,
    out,
    "--method",
    "edgebreaker",
    "--quantize-position",
    "14",
    "--quantize-normal",
    "10",
    "--quantize-texcoord",
    "12",
  ]);

  // Ghi đè file gốc
  copyFileSync(out, src);

  console.log(`  ✓ xong — backup tại ${backup}`);
  return true;
}

function main() {
  const only = process.argv[2];
  const targets = only
    ? TARGETS.filter((t) => t.file.includes(only))
    : TARGETS;

  if (targets.length === 0) {
    console.error(`Không tìm thấy model nào khớp "${only}"`);
    process.exit(1);
  }

  const workDir = mkdtempSync(join(tmpdir(), "gltf-opt-"));
  console.log(`Thư mục làm việc: ${workDir}`);

  try {
    for (const target of targets) {
      optimize(target, workDir);
    }
    console.log("\n✓ Hoàn tất. Kiểm tra lại bằng:");
    console.log("  npx @gltf-transform/cli@4.2.0 inspect <file>");
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

main();
