"use client";

/**
 * Hook load model GLB (Draco-compressed) từ /public/models.
 *
 * ── DRACO DECODER ──
 * File GLB đã được nén bằng Draco để giảm ~90% kích thước. Three.js
 * cần `DRACOLoader` + file decoder `.wasm` để giải nén lúc runtime.
 *
 * Decoder được copy từ `node_modules/three/examples/jsm/libs/draco/`
 * sang `public/draco/` → tải cùng origin, không phụ thuộc CDN, không
 * bị chặn bởi CSP, và luôn khớp version với `three` đang dùng.
 *
 * ── PROGRESS ──
 * Trả về `progress` (0..1) để hiện thanh loading.
 *
 * ── HERO vs FULL ──
 * ⚠ QUAN TRỌNG cho tốc độ: model được chia 2 nhóm.
 *   • "hero" — 2 chiếc nhẫn (~1MB). Tải xong → cảnh BẮT ĐẦU.
 *   • "full" — backdrop + nhân vật (~14MB). Tải NỀN, không chặn.
 *
 *   Trước đây cảnh đợi cả 15MB → trên mạng di động mất 10-20s.
 */

import { useLoader } from "@react-three/fiber";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useEffect, useMemo, useState } from "react";
import type { Mesh, Object3D } from "three";
import { assetTracker } from "./store";

/** Đường dẫn model trong /public */
export const MODEL = {
  brideRing: "/models/bride-ring.glb",
  groomRing: "/models/groom-ring.glb",
  bride: "/models/bride.glb",
  groom: "/models/groom.glb",
  backdrop: "/models/wedding-backdrop.glb",
} as const;

/**
 * Phân loại model: "hero" (chặn cảnh) hay "full" (tải nền).
 *
 * Khớp với `assetTracker.hero` / `assetTracker.full` trong `store.ts`.
 */
function kindOf(path: string): "hero" | "full" {
  return assetTracker.hero.some((name) => path.includes(name))
    ? "hero"
    : "full";
}

/**
 * DRACOLoader dùng chung cho mọi model — tạo 1 lần, dispose khi hết.
 */
let sharedDraco: DRACOLoader | null = null;

function getDracoLoader(): DRACOLoader {
  if (!sharedDraco) {
    sharedDraco = new DRACOLoader();
    // Decoder local trong /public/draco — khớp version three đang dùng
    sharedDraco.setDecoderPath("/draco/");

    // ⚠ `workerLimit` — SỬA LẠI (đợt trước đặt là 1 → SAI).
    //
    // Đo được: 2 nhẫn cần decode ~615ms với `workerLimit = 1`.
    // Lý do: DRACOLoader phân bổ task theo `worker._taskLoad` (chi phí
    // ước tính), KHÔNG phải round-robin. Với limit = 1, cả 2 nhẫn
    // (bride + groom) được giao cho CÙNG 1 worker → giải nén TUẦN TỰ
    // → thời gian decode = tổng của cả 2.
    //
    // Với limit = 2 (mặc định của three): 2 nhẫn decode SONG SONG trên
    // 2 worker → thời gian = max của 2 thay vì tổng → nhanh hơn ~2×.
    //
    // ⚠ Trade-off: 2 worker × WASM decoder ≈ vài MB RAM. Trên mobile vẫn
    //   rất nhỏ so với 8MB model + textures. Đáng để đổi lấy ~300ms.
    //
    // ⚠ GIỚI HẠN: `navigator.hardwareConcurrency` thường >= 4 trên
    //   mobile → không sợ oversubscribe. Nhưng ta chỉ cần 2 task cho
    //   2 nhẫn → set 2 là đủ, không cần 4.
    sharedDraco.setWorkerLimit(2);

    // ⚠ PRELOAD DECODER — gọi NGAY, không đợi model đầu tiên.
    //
    // Đo được timeline thực tế (dev, localhost):
    //   657ms  → Canvas mount, DRACOLoader bắt đầu tải decoder
    //   1271ms → decode xong → clock chạy
    //   ⇒ 615ms bị mất vào việc tải (344KB) + khởi tạo WASM
    //
    // `preload()` gọi `_initDecoder()` ngay → tải `draco_wasm_wrapper.js`
    // (59KB) + `draco_decoder.wasm` (286KB) SONG SONG với JS bundle.
    // Nhờ vậy decoder đã sẵn sàng khi Canvas mount → mất đúng ~150ms
    // init WASM thay vì 615ms.
    sharedDraco.preload();
  }
  return sharedDraco;
}

/** Giải phóng decoder WASM khi không còn dùng */
export function disposeDraco() {
  if (sharedDraco) {
    sharedDraco.dispose();
    sharedDraco = null;
  }
}

/**
 * Load 1 model GLB, kèm progress.
 *
 * @param path đường dẫn trong /public/models
 */
export function useGLB(path: string) {
  const [progress, setProgress] = useState(0);
  const draco = useMemo(() => getDracoLoader(), []);

  const gltf = useLoader(GLTFLoader, path, (loader) => {
    // Gắn Draco loader TRƯỚC khi loader bắt đầu tải
    (loader as GLTFLoader).setDRACOLoader(draco);
  }) as GLTF;

  useEffect(() => {
    setProgress(1);
    // Báo "model này đã sẵn sàng".
    //   • hero → mở chặng 1, timeline bắt đầu
    //   • full → mở chặng 2, nhân vật fade-in
    assetTracker.markLoaded(path, kindOf(path));
  }, [gltf, path]);

  return { gltf, progress };
}

/**
 * Load model + lấy mesh cụ thể theo tên.
 *
 * Với nhân vật Mixamo, mesh tên là "output". Với nhẫn/backdrop,
 * tên mesh rỗng → lấy mesh đầu tiên có geometry.
 */
export function useGLBMesh(path: string, meshName?: string) {
  const { gltf } = useGLB(path);

  return useMemo<Object3D>(() => {
    if (meshName) {
      const named = gltf.scene.getObjectByName(meshName);
      if (named) return named;
    }

    // Fallback: tìm mesh đầu tiên có geometry
    let found: Object3D | null = null;
    gltf.scene.traverse((obj) => {
      if (!found && (obj as Mesh).isMesh) found = obj;
    });
    return found ?? gltf.scene;
  }, [gltf, meshName]);
}
