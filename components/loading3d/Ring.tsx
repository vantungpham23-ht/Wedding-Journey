"use client";

/**
 * SCENE NHẪN CƯỚI — 2 chiếc nhẫn bay vào, quấn quít, rồi nhỏ dần rơi xuống.
 *
 * Cả 2 nhẫn dùng chung 1 component, chỉ khác `side` (+1 / -1) để lệch
 * phase trên quỹ đạo → nhìn như chúng xoay quanh nhau.
 *
 * Không dùng React state cho animation — mọi transform được ghi thẳng
 * vào `object3D` trong `useFrame` (60fps, 0 re-render).
 */

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  Color,
  FrontSide,
  type Group,
  type Material,
  type Mesh,
  type MeshStandardMaterial,
} from "three";
import { clock } from "./store";
import { ringStateAt, RING_SCALE } from "./timeline";
import { useGLBMesh } from "./useGLB";

interface RingProps {
  /** +1 = nhẫn bên phải, -1 = nhẫn bên trái */
  side: 1 | -1;
  /** Đường dẫn model */
  url: string;
  /** Màu ánh sáng phụ (key light) — tinh chỉnh để 2 nhẫn khác màu */
  tint?: string;
}

export default function Ring({ side, url, tint = "#f0dcbf" }: RingProps) {
  const mesh = useGLBMesh(url);
  const group = useRef<Group>(null);

  // Nhân bản scene để 2 nhẫn không dùng chung 1 object
  const cloned = useMemo(() => {
    const c = mesh.clone(true);
    // Scale gốc: nhẫn có bounds ~1.9 → thu nhỏ cho vừa khung hình
    c.scale.setScalar(RING_SCALE);

    // Cache material đã clone để không clone lại mỗi frame
    const materials: Material[] = [];
    c.traverse((obj) => {
      const m = obj as Mesh;
      if (!m.isMesh) return;
      m.castShadow = false;
      m.receiveShadow = false;

      const mats = Array.isArray(m.material) ? m.material : [m.material];
      const clonedMats = mats.map((mat) => {
        const cm = mat.clone();
        // ⚠ PERF: `DoubleSide` khiến GPU shading CẢ 2 mặt của mọi tam
        //   giác. Nhẫn có 200k-366k vertices → fragment cost × 2.
        //   `FrontSide` + `depthWrite` đủ để nhẫn không bị "tàng" khi xoay
        //   (mặt sau bị mặt trước che khi xoay nghiêng).
        cm.side = FrontSide;
        cm.transparent = true;

        // ⚠ QUAN TRỌNG — làm nhẫn RÕ NÉT:
        //
        // File GLB gốc để `metallic = 1` nhưng `roughness = 1` → kim
        // loại HOÀN TOÀN THÔ. Không có envMap nên mọi pixel đều xám đều,
        // không có highlight nào → nhẫn trông như một mảng sáng mờ,
        // không thấy được vành / đá / đường khắc.
        //
        // Sửa: hạ roughness xuống (bề mặt bóng, có highlight sắc),
        // giữ metallic = 1 (kim loại thật, phản xạ môi trường).
        //
        // Lưu ý: GLB không có extension `KHR_materials_clearcoat` nên
        // GLTFLoader tạo `MeshStandardMaterial` — dùng `clearcoat` sẽ
        // không có tác dụng. Chỉ cần roughness + envMapIntensity là đủ.
        //
        // `envMapIntensity` cao vì nhẫn là vật thể kim loại nổi bật —
        // nó cần phản xạ mạo để có dạng. (Backdrop + nhân vật dùng
        // envMapIntensity thấp hơn để không bị rửa màu.)
        const pm = cm as MeshStandardMaterial;
        pm.metalness = 1;
        pm.roughness = 0.18;
        pm.envMapIntensity = 2.4;

        // ⚠ KHÔNG `color.multiply(tint)` — màu nền của nhẫn đến từ
        //   texture, nhân vào sẽ làm nhẫn bị tối màu (mất độ sáng
        //   bạc). Thay vào đó dùng emissive rất nhẹ để phân biệt 2
        //   nhẫn mà không ảnh hưởng texture.
        pm.emissive = new Color(tint);
        pm.emissiveIntensity = 0.06;

        materials.push(cm);
        return cm;
      });
      m.material = Array.isArray(m.material) ? clonedMats : clonedMats[0];
    });

    (c as unknown as { __fadeMats: Material[] }).__fadeMats = materials;
    return c;
  }, [mesh]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;

    const s = ringStateAt(clock.time, side);

    g.position.set(s.x, s.y, s.z);
    g.rotation.set(s.rotX, s.rotY, s.rotZ);
    g.scale.setScalar(s.scale);

    // ⚠ Nhẫn KHÔNG biến mất — sau khi bay lên trên đầu 2 nhân vật
    // thì lơ lửng nhẹ nhàng tới hết cảnh. Chỉ ẩn khi màn hình trắng
    // hoàn toàn (trước lúc nhẫn bắt đầu bay vào).
    g.visible = s.opacity > 0.001;

    // ── DEBUG (chỉ dev): đo thời điểm nhẫn HIỆN THỰC SỰ ──
    // Đây là mốc user thực sự "thấy nhẫn" — khác với lúc clock bắt đầu.
    if (
      process.env.NODE_ENV !== "production" &&
      g.visible &&
      typeof window !== "undefined"
    ) {
      const w = window as unknown as { __ringVisibleAt?: number };
      if (w.__ringVisibleAt === undefined) {
        w.__ringVisibleAt = Math.round(performance.now());
      }
    }

    // Mờ dần — dùng material đã cache, không traverse lại mỗi frame
    const mats = (g.children[0] as unknown as { __fadeMats?: Material[] })
      ?.__fadeMats;
    if (mats) {
      for (const mat of mats) {
        mat.opacity = s.opacity;
        // Khi đang mờ, tắt depthWrite — nếu không, các mặt trong của
        // nhẫn tự cắt nhau tạo vệt sáng lỗm xổm trong lúc fade.
        // Bật lại khi đã đặc hoàn toàn để nhẫn hiện đúng khi sắp xếp.
        mat.depthWrite = s.opacity > 0.98;

        // ⚠ PERF: `transparent = true` tắt early-Z rejection. Nhẫn
        //   chiếm ~10-30% màn hình lúc bay vào → tắt blend khi đã đặc
        //   để GPU loại bỏ fragment phía sau trước khi shading.
        const needsBlend = s.opacity < 0.999;
        if (mat.transparent !== needsBlend) {
          mat.transparent = needsBlend;
          mat.needsUpdate = true;
        }
      }
    }
  });

  return (
    <group ref={group}>
      <primitive object={cloned} />
      {/* ⚠ PERF: KHÔNG thêm pointLight ở đây. 2 nhẫn × 1 pointLight =
          +2 đèn point cho MỌI fragment của cả scene → tốn nhiều hơn
          giá trị thẩm mỹ. Nhẫn đã bắt sáng nhờ envMap (StudioEnv)
          với envMapIntensity = 2.4 — sáng và rõ hơn nhiều.
          `tint` giờ chỉ dùng để tinh chỉnh màu qua material. */}
    </group>
  );
}
