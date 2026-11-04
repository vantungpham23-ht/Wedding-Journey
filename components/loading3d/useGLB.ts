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
 * DRACOLoader dùng chung cho mọi model — tạo 1 lần, dispose khi hết.
 */
let sharedDraco: DRACOLoader | null = null;

function getDracoLoader(): DRACOLoader {
  if (!sharedDraco) {
    sharedDraco = new DRACOLoader();
    // Decoder local trong /public/draco — khớp version three đang dùng
    sharedDraco.setDecoderPath("/draco/");
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
    // Báo "model này đã sẵn sàng" → timeline chỉ chạy khi TẤT CẢ xong
    assetTracker.markLoaded(path);
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
