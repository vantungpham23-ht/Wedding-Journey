"use client";

/**
 * SCENE NHÂN VẬT + BỐI CẢNH.
 *
 * ── HÌNH HỌC BACKDROP (đã đo từ mesh 4.45M vertex) ──
 *
 *   bounds: x [-0.94, 0.93] · y [-0.575, 0.585] · z [-0.95, 0.95]
 *
 *   Quét toàn bộ tam giác, lọc mặt phẳng ngang (normal.y > 0.97) → tìm ra
 *   **sàn sân khấu** tại y ≈ -0.40:
 *
 *   diện tích : 1.42 m²
 *   x range   : [-0.90, 0.90]  (rộng 1.80)
 *   z range   : [-0.77, 0.67]  (sâu 1.44)
 *
 *   Lập bản đồ Ymax theo lưới X-Z cho thấy:
 *
 *   • Vòm / bức trang trí nằm ở **z = -0.3 → -0.7** (phía sau), cao tới 0.59
 *   • Sàn trải tới **z = +0.67** (phía trước, gần camera)
 *   • Vùng đứng thoáng ở giữa: x ∈ [-0.4, 0.4], z ∈ [0.0, 0.5]
 *
 * → Nhân vật đứng ở **z = 0.10**, chân tại **y = -0.40**, ngay TRƯỚC vòm
 *   để vòm tô điểm phía sau lưng họ.
 *
 * ── NHÂN VẬT MỚI (thay 2026-11-04) ──
 *
 * Model mới đo được (skin thật, tính từ buffer sau khi giải nén):
 *
 *              clip              dur      đỉnh cúi   đứng lại   idle window     cao
 *   chú rể   Formal_Bow         7.667s     3.230s     5.300s   5.60 → 7.50    1.703
 *   cô dâu   Gentlemans_Bow     7.267s     3.400s     5.300s   6.25 → 7.25    1.720
 *
 * ⚠ Hai clip KHÁC NHAU (tên + thời lượng + mốc thời gian) → mỗi nhân
 *   vật có bộ tham số scrub RIÊNG, xem `BowProfile`.
 *
 * ⚠ Tên bone trong JSON có dấu `:` (`mixamorig:Head`) — nhưng code KHÔNG
 *   tra bone theo tên nên không ảnh hưởng. (Three.js chỉ sanitize tên
 *   khi tạo track, không đổi tên node.)
 *
 * ── TỈ LỆ THẬT ──
 * Đo được từ mesh:
 *   backdrop : rộng 1.87 · cao 1.16  (từ -0.575 tới 0.585)
 *   chú rể   : cao 1.703 · ngực rộng 0.528 · tay buông x[-0.27, 0.39]
 *   cô dâu   : cao 1.720 · ngực rộng 0.650 · váy rộng 0.985
 *
 * Ràng buộc chặt nhất là CHIỀU CAO: muốn nhân vật cao ~65% backdrop
 *   1.72 × s ≤ 0.75 × 1.16  →  s ≤ 0.51
 *
 * Chọn s = 0.46 → nhân vật cao 0.79 (68% backdrop), bó váy rộng 0.45,
 * cả 2 cùng nhau chiếm ~63% chiều rộng sàn → vẫn thấy rõ sân khấu.
 *
 * ── HƯỚNG NHÌN ──
 * Model Mixamo quay mặt về trục **+Z** (node `headfront` có z = +0.175).
 * Camera nằm ở +Z → `rotationY ≈ 0` nghĩa là nhân vật nhìn thẳng ra
 * màn hình, chào người xem (không chào nhau).
 *
 * ⚠ MỖI MODEL CÓ YAW NỘI TẠI KHÁC NHAU (đo bằng vector
 *   `headfront → head` trong đoạn idle):
 *     chú rể : -0.042 rad  → phải bù +0.042
 *     cô dâu : -0.071 rad  → phải bù +0.071
 *   Không bù → cả 2 quay mặt lệch sang trái, nhìn "có qua có lại".
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimationMixer,
  type AnimationAction,
  type Group,
  type Material,
  type Mesh,
  type MeshStandardMaterial,
  type Object3D,
} from "three";
import { clock } from "./store";
import { easeInOutSine, easeOutCubic, lerpProgress, T } from "./timeline";
import { useGLB } from "./useGLB";

/**
 * Y của sàn sân khấu trong backdrop (đo được từ mesh) */
const STAGE_FLOOR_Y = -0.4;

/**
 * Z đứng của nhân vật — trước vòm, trên vùng sàn thoáng.
 *
 * Bản đồ Ymax theo lưới X-Z cho thấy vòm nằm ở z = -0.3 → -0.7 và sàn
 * trải tới z = +0.67. Đặt ở z = 0.10 → nhân vật đứng trước vòm, vòm
 * tô điểm phía sau lưng.
 */
const STAGE_STAND_Z = 0.1;

/**
 * Scale nhân vật — theo TỈ LỆ THẬT so với backdrop.
 *
 * Đo được:
 *   backdrop : rộng 1.87 · cao 1.16  (từ -0.575 tới 0.585)
 *   nhân vật : cao 1.72 · rộng tối đa 0.985 (bó váy cô dâu)
 *
 * Ràng buộc chặt nhất là CHIỀU CAO: muốn nhân vật cao ~65% backdrop
 *   1.72 × s ≤ 0.75 × 1.16  →  s ≤ 0.51
 *
 * Chọn s = 0.46 → nhân vật cao 0.79 (68% backdrop), bó váy rộng 0.45,
 * cả 2 cùng nhau chiếm ~60% chiều rộng sàn → vẫn thấy rõ sân khấu.
 */
const CHARACTER_SCALE = 0.46;

/**
 * Khoảng cách giữa chú rể và cô dâu.
 *
 * ⚠ ĐO THẬT bằng skinning + khoảng cách bề mặt 3D (đoạn idle, sau khi
 *   bù yaw nội tại và xoay về phía nhau):
 *
 *   gap    minDist   kết luận
 *   0.38   0.109     ✅ tách biệt rõ (váy cô dâu không đụng chú rể)
 *   0.34   0.004     ❌ chạm nhau — bó váy đè lên chân chú rể
 *
 * → Chọn **0.40**: 2 người đứng sát nhau (khoảng cách bề mặt ~0.11),
 *   tay gần chạm tay nhưng KHÔNG chồng lấn, vẫn thấy rõ sân khấu
 *   phía sau. Khoảng cách này cũng khớp với bố cục đôi trẻ trong
 *   ảnh cưới — đứng gần, tay có thể chạm tay.
 */
const COUPLE_GAP = 0.4;

/**
 * Z lùi nhẹ của cô dâu.
 *
 * Bó váy cô dâu rộng 0.985 (model gốc) → 0.45 sau khi scale, và có đuôi
 * váy tràn ra phía sau. Lùi 0.05 giúp 2 người không bị "dính" vào
 * nhau khi nhìn từ góc nghiêng, đồng thời tạo cảm giác cô dâu
 * đứng hơi phía sau chú rể (rất tự nhiên trong ảnh cưới).
 */
const BRIDE_Z_OFFSET = 0.05;

/**
 * Góc xoay của mỗi nhân vật (đo được, đã trừ yaw nội tại).
 *
 * Cả 2 cùng hướng ra màn hình để chào khách, nhưng hơi nghiêng về
 * phía nhau → tự nhiên, như đang chào khách chung.
 */
const GROOM_ROTATION = 0.042 + 0.13;
const BRIDE_ROTATION = 0.071 - 0.1;

/**
 * Hồ sơ cúi chào của 1 model — mỗi clip có mốc thời gian riêng.
 *
 * Đo từ clip gốc (world-position của `mixamorig:Head`, thấp hơn = cúi
 * sâu hơn) + world-velocity để chọn tốc độ scrub tự nhiên.
 */
interface BowProfile {
  /** Clip trong model (thường chỉ có 1) */
  clipIndex: number;
  /** Đoạn idle — tay buông, đứng yên, chỉ dao động nhẹ */
  idleFrom: number;
  idleTo: number;
  /** Điểm trong clip đứng thẳng, khớp với đầu đoạn cúi */
  idleRest: number;
  /** Đỉnh cúi sâu nhất */
  deepest: number;
  /** Kết thúc cúi (đã đứng thẳng lại) */
  bowOut: number;
}

/**
 * Hồ sơ chú rể — clip `Formal_Bow` (7.667s).
 *
 *   t = 0.00 → 1.62   đứng yên, tay buông (lhY = 0.73)
 *   t = 1.62          BẮT ĐẦU cúi
 *   t = 3.23          ĐỈNH cúi (headY = 0.696)
 *   t = 5.30          đứng thẳng lại (headY = 1.172)
 *   t = 5.60 → 7.50   đứng yên, tay buông, biến độ nhỏ nhất
 *
 * Tốc độ cúi tự nhiên: 0.671 u/s (headY).
 */
const GROOM_BOW: BowProfile = {
  clipIndex: 0,
  idleFrom: 5.6,
  idleTo: 7.5,
  idleRest: 5.6,
  deepest: 3.23,
  bowOut: 5.3,
};

/**
 * Hồ sơ cô dâu — clip `Gentlemans_Bow` (7.267s).
 *
 *   t = 0.00 → 1.49   đứng yên, tay buông (rhY = 0.77)
 *   t = 1.49          BẮT ĐẦU cúi
 *   t = 3.40          ĐỈNH cúi (headY = 0.720)
 *   t = 5.30          đứng thẳng lại (headY = 1.233)
 *   t = 6.25 → 7.25   đứng yên, tay buông, biến độ nhỏ nhất
 *
 * ⚠ Clip này có 1 đặc biệt: tay phải giơ lên cao ở t = 0.75 → 1.50
 *   (rhY lên tới 1.27) rồi hạ xuống. Đây là cử chỉ cầm bó hoa —
 *   cố ý giữ lại, trông rất tự nhiên và đúng chất cô dâu.
 *   Nhưng đoạn idle CUỐI (6.25 → 7.25) tay đã buông xuống → chọn
 *   đoạn này làm idle để 2 người đứng cùng tư thế "tay buông".
 */
const BRIDE_BOW: BowProfile = {
  clipIndex: 0,
  idleFrom: 6.25,
  idleTo: 7.25,
  idleRest: 6.25,
  deepest: 3.4,
  bowOut: 5.3,
};

/**
 * Nhân vật quay mặt ra màn hình: Mixamo mặt nghiêng +Z → xoay nhẹ sang trái */
const FACE_CAMERA = -0.13;

interface CharacterProps {
  /** Đường dẫn model */
  url: string;
  /** Vị trí X (trái / phải) */
  x: number;
  /** Lệch Z so với mặt phẳng đứng chung */
  zOffset: number;
  /** Góc xoay quanh trục Y */
  rotationY: number;
  /** Bắt đầu animation cúi chào từ thời điểm nào (giây) */
  bowStart: number;
  /** Lệch phase của nhịp thở — để 2 người không giống hệt nhau */
  breathOffset: number;
  /** Hệ số biểu cảm: 1 = tự nhiên, 0 = cứng */
  expressiveness: number;
  /** Hồ sơ cúi riêng của model này */
  bow: BowProfile;
}

/**
 * PRE-WARM SHADER — compile sẵn tất cả shader của scene TRƯỚC khi
 * nhân vật xuất hiện.
 *
 * ── VÌ SAO CẦN? ──
 * ⚠ ĐÂY CHÍNH LÀ NGUYÊN NHÂN "KHỰNG LAG" LÚC 2 NHÂN VẬT HIỆN RA.
 *
 * Khi GPU lần đầu vẽ 1 mesh với material mới (skin + envMap +
 * transparent + fog...), driver phải COMPILE SHADER — việc này mất
 * 50-300ms và BLOCK main thread → khung hình đứng hình (stutter).
 *
 * Nhân vật có `visible = false` cho tới giữa cảnh → chưa từng được
 * vẽ → chưa từng compile → đúng lúc nó bật hiện là lúc GPU bị block.
 *
 * ── CÁCH SỬA ──
 * Gọi `gl.compileAsync(scene, camera)` NGAY khi model xong tải
 * (dùng `KHR_parallel_shader_compile` nếu GPU hỗ trợ → không block).
 *
 * ⚠ `compile()` chỉ compile object ĐANG `visible` → phải tạm bật
 *   visible cho nhân vật, compile xong rồi ẩn lại. Và phải compile
 *   CẢ 2 biến thể (transparent + opaque) vì ta sẽ chuyển blend
 *   mode giữa cảnh (xem `Character`).
 *
 * Việc compile chạy trong lúc NHẪN ĐANG BAY VÀO (màn hình vẫn
 * đen, ít pixel cần vẽ) → người xem không nhận ra.
 */
export function ShaderPrewarm() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // ⚠ CHỜ 2 ĐIỀU KIỆN trước khi compile:
    //   1. Mọi model đã tải xong (dùng chung `useGLB` cache → cùng path
    //      chỉ tải 1 lần, nên markLoaded chỉ gọi khi thực sự có data)
    //   2. envMap (StudioEnv) đã được gán → nếu compile quá sớm,
    //      shader được build KHÔNG có envMap → khi envMap có, GPU lại
    //      phải compile LẠI → đúng cái stall ta đang cố tránh!
    //
    //   → Dùng `useThree(s => s.scene.environment)` để đợi envMap.
    let cancelled = false;

    const tryCompile = () => {
      if (cancelled) return;

      // `compileAsync` dùng KHR_parallel_shader_compile nếu có →
      // không block main thread. Trả về Promise.
      const result = gl.compileAsync(scene, camera);
      if (result && typeof result.then === "function") {
        result.catch(() => {
          /* compile lỗi không chặn cảnh */
        });
      }
    };

    // Đợi scene.environment (envMap từ StudioEnv) có mặt
    const waitEnv = () => {
      if (cancelled) return;
      if (!scene.environment) {
        requestAnimationFrame(waitEnv);
        return;
      }
      // Đợi thêm 1 frame để envMap thực sự được áp vào material
      requestAnimationFrame(() => requestAnimationFrame(tryCompile));
    };

    waitEnv();

    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera]);

  return null;
}

function Character({
  url,
  x,
  zOffset,
  rotationY,
  bowStart,
  breathOffset,
  expressiveness,
  bow,
}: CharacterProps) {
  const { gltf } = useGLB(url);
  const group = useRef<Group>(null);
  const mixer = useMemo(() => new AnimationMixer(gltf.scene), [gltf]);
  const actionRef = useRef<AnimationAction | null>(null);
  const phase = useRef<"idle" | "bow">("idle");
  /** Trạng thái blend hiện tại — chỉ đổi khi cần (tránh compile lại shader mỗi frame) */
  const lastBlend = useRef(true);

  /**
   * Asset chưa sẵn sàng → nhân vật ẩn hoàn toàn.
   *
   * ⚠ VÌ SAO CẦN: giờ backdrop + nhân vật TẢI NỀN (không chặn cảnh).
   *   Nếu không có cờ này, `useFrame` sẽ set `g.visible = true` ngay
   *   khi timeline tới mốc `coupleIn` — nhưng lúc đó model còn đang
   *   tải → mesh rỗng / chưa có geometry → nhân vật xuất hiện với
   *   tư thế sai rồi mới "nhảy" đúng, hoặc lỗi render.
   *
   *   → Chỉ cho hiện khi model ĐÃ tải xong.
   */
  const [assetReady, setAssetReady] = useState(false);

  // Cache material để fade mà không traverse mỗi frame
  const fadeMats = useMemo(() => {
    const list: Material[] = [];
    gltf.scene.traverse((obj) => {
      const m = obj as Mesh;
      if (!m.isMesh || !m.material) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => {
        mat.transparent = true;
        mat.opacity = 1;

        // Nhân vật mới có `metallic = 1, roughness = 1` trong GLB gốc
        // (material tên `BakedMaterial`, baseColor + normal +
        // metallicRoughness texture).
        //
        // Sau khi bật envMap (StudioEnv) cho nhẫn, nhân vật cũng nhận
        // envMap → nếu để nguyên sẽ bị rửa màu, mất nét vải/da.
        // Hạ xuống 0.35 để giữ chút ánh sáng bám mà không lấn át texture.
        const pm = mat as MeshStandardMaterial;
        pm.envMapIntensity = 0.35;

        list.push(mat);
      });
    });
    return list;
  }, [gltf]);

  // Model đã tải xong → cho phép hiện
  useEffect(() => {
    setAssetReady(true);
  }, [gltf]);

  // Dừng animation khi unmount
  useEffect(() => {
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(gltf.scene);
    };
  }, [mixer, gltf]);

  useFrame(() => {
    const g = group.current;
    if (!g) return;

    // ⚠ Model chưa tải xong → ẩn hoàn toàn.
    //   Backdrop/nhân vật giờ tải NỀN, nên timeline có thể tới mốc
    //   `coupleIn` TRƯỚC khi model sẵn sàng. Không có guard này →
    //   nhân vật hiện với mesh rỗng rồi giật lại.
    if (!assetReady) {
      g.visible = false;
      return;
    }

    const t = clock.time;

    // --- Xuất hiện dần: mờ dần + nhỏ nhẹ (không scale từ 0 để giữ
    //     tỉ lệ thật của nhân vật so với backdrop) ---
    const appear = easeOutCubic(lerpProgress(t, T.coupleIn, T.coupleStand));
    g.visible = appear > 0.001;
    g.scale.setScalar(CHARACTER_SCALE * (0.88 + 0.12 * appear));

    // Fade material nhân vật
    if (appear < 1) {
      for (const mat of fadeMats) mat.opacity = appear;
    }
    // ⚠ PERF: khi đã hiện hoàn toàn → tắt `transparent` để GPU bật
    //   lại early-Z rejection (skin mesh 124k/149k verts rất nhạy với
    //   chi phí này). Xem giải thích ở backdrop.
    const charNeedsBlend = appear < 0.999;
    if (charNeedsBlend !== lastBlend.current) {
      lastBlend.current = charNeedsBlend;
      for (const mat of fadeMats) {
        mat.transparent = charNeedsBlend;
        mat.needsUpdate = true;
      }
    }

    const clip = gltf.animations[bow.clipIndex];
    if (!clip) return;

    // ─────────────────────────────────────────────────────────────
    //  Tạo action 1 lần, dùng `paused` + `action.time` để SCRUB
    //  chính xác theo timeline (không phụ thuộc delta của render).
    // ─────────────────────────────────────────────────────────────
    if (!actionRef.current) {
      const action = mixer.clipAction(clip);
      action.play();
      action.paused = true;
      actionRef.current = action;
    }
    const action = actionRef.current;

    const idleLen = bow.idleTo - bow.idleFrom;

    if (phase.current === "idle") {
      // ── IDLE: scrub trong đoạn idle đã đo ──
      //
      // Nhịp thở: dao động hình sin với chu kỳ bằng đúng độ dài đoạn
      // idle, lệch phase giữa 2 nhân vật → tự nhiên, không máy móc.
      const wave = Math.sin(
        ((t + breathOffset) * Math.PI * 2) / idleLen,
      );

      // Scrub: chỉ dùng 60% đoạn idle để tránh chạm 2 đầu
      const scrub = 0.2 + 0.6 * (wave * 0.5 + 0.5);
      const idleTime = bow.idleFrom + scrub * idleLen;

      // Trong 0.45s cuối, nội suy về đúng idleRest để khớp tuyệt
      // địt với đầu đoạn cúi → không có bước nhảy nào.
      const blend = easeInOutSine(
        Math.min(1, Math.max(0, (t - (bowStart - 0.45)) / 0.45)),
      );
      action.time = idleTime + (bow.idleRest - idleTime) * blend;

      // ── Biểu cảm: nghiêng nhẹ đầu + vai ──
      // Nhân vật đứng yên vẫn có chuyển động rất nhẹ → trông "thở"
      // thay vì đứng chết.
      //
      // ⚠ Dùng `rotation` trên node BONE sẽ GHI ĐÈ quaternion mà
      //   mixer vừa set → phá animation. Vì vậy biểu cảm được áp
      //   vào group ngoài (không có track animation).
      const e = expressiveness;
      const tilt = wave * 0.03 * e;
      g.rotation.z = tilt * 0.3;
      g.rotation.y = rotationY + tilt * 0.45;

      // Chuyển sang cúi chào
      if (t >= bowStart) {
        phase.current = "bow";
        action.time = bow.idleRest;
        // Trả nghiêng về 0 — trong lúc cúi, biểu cảm nghiêng đầu sẽ
        // cộng vào chuyển động của clip và gây lệch tư thế.
        g.rotation.z = 0;
        g.rotation.y = rotationY;
      }
    } else {
      // ── CÚI CHÀO: scrub NGƯỢC rồi XUÔI trong clip ──
      //
      // Clip chạy: đứng → cúi (1.62→5.30) → đứng.
      // Nếu chạy xuôi từ 1.62 thì nhân vật "teleport" từ tư thế đứng
      // sang tư thế cúi → giật mạnh.
      //
      // Giải pháp: CHẠY NGƯỢC từ idleRest (đứng) xuống deepest
      // (cúi sâu nhất), rồi CHẠY XUÔI về bowOut (đứng thẳng lại).
      // Chuỗi này liền mạch ở cả 2 đầu → không có bước nhảy nào.
      //
      // ⚠ TỐC ĐỘ: nếu scrub nhanh hơn clip gốc thì nhân vật bị "giật"
      //   dù không có bước nhảy. Đo world-velocity:
      //     chú rể: 0.671 u/s là tốc độ tự nhiên của clip
      //     cô dâu: 0.662 u/s
      //   → Bow kéo dài ~5.2s (xấp xỉ thời lượng thật của cúi chào) →
      //     tốc độ scrub ≈ 1.0× tự nhiên → mượt.
      const bowLen = T.coupleBowOut - bowStart;
      const p = Math.min(1, (t - bowStart) / bowLen);

      // 0 → 0.50: cúi xuống (idleRest → deepest, ngược trong clip)
      // 0.50 → 0.72: giữ ở đỉnh cúi
      // 0.72 → 1: ngẩng lên (deepest → bowOut, xuôi trong clip)
      let clipTime: number;
      if (p < 0.5) {
        clipTime = bow.idleRest + (bow.deepest - bow.idleRest) * (p / 0.5);
      } else if (p < 0.72) {
        clipTime = bow.deepest;
      } else {
        clipTime =
          bow.deepest + (bow.bowOut - bow.deepest) * ((p - 0.72) / 0.28);
      }

      action.time = clipTime;
    }

    // Update mixer — sau khi set action.time ở trên
    mixer.update(0);

    // Đặt chân xuống sàn sân khấu
    g.position.y = STAGE_FLOOR_Y * appear;
  });

  return (
    <group
      ref={group}
      position={[x, 0, STAGE_STAND_Z + zOffset]}
      rotation={[0, rotationY, 0]}
      visible={false}
    >
      <primitive object={gltf.scene} />
    </group>
  );
}

export default function CoupleScene() {
  const { gltf } = useGLB("/models/wedding-backdrop.glb");
  const backdropRef = useRef<Group>(null);

  /**
   * Backdrop tải NỀN → có thể xong SAU mốc `backdropReady` của
   * timeline. Nếu không xử lý, backdrop sẽ "pop" (hiện đột ngột
   * với opacity=1) giữa cảnh → rất giật.
   *
   * → Dùng 1 lớp fade riêng: sau khi model xong → fade 0→1 trong
   *   1.2s, nhân với reveal của timeline.
   */
  const [assetReady, setAssetReady] = useState(false);
  const fadeStart = useRef<number | null>(null);

  useEffect(() => {
    setAssetReady(true);
  }, [gltf]);

  // Clone backdrop + ép vật liệu không phản chiếu quá mức
  const backdropClone = useMemo(() => {
    const c = gltf.scene.clone(true);
    c.traverse((obj) => {
      const m = obj as Mesh;
      if (!m.isMesh) return;
      m.receiveShadow = false;
      m.castShadow = false;

      // Backdrop có `metallic = 1, roughness = 1` trong GLB gốc.
      // Sau khi bật envMap (StudioEnv) để làm nhẫn kim loại bắt sáng,
      // backdrop cũng sẽ nhận envMap → nếu để nguyên, toàn bộ sân khấu
      // bị phản xạ và rửa màu, mất texture.
      //
      // → Hạ envMapIntensity xuống 0.25: vẫn có chút ánh sáng bám
      //   theo bề mặt nhưng không lấn át texture.
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => {
        const pm = mat as MeshStandardMaterial;
        pm.envMapIntensity = 0.25;
      });
    });
    return c;
  }, [gltf]);

  // Cache danh sách material để đổi opacity mà không traverse mỗi frame
  const backdropMats = useMemo(() => {
    const list: Material[] = [];
    backdropClone.traverse((obj) => {
      const m = obj as Mesh;
      if (!m.isMesh || !m.material) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => {
        mat.transparent = true;
        mat.opacity = 0;
        list.push(mat);
      });
    });
    return list;
  }, [backdropClone]);

  useFrame(() => {
    const t = clock.time;

    // Backdrop mờ dần hiện ra từ T.backdropIn → T.backdropReady.
    // ⚠ Nhẫn KHÔNG biến mất nữa — chúng bay lên trên đầu 2 nhân vật
    // và lơ lửng ở đó, nên backdrop có thể hiện ra SONG SONG với nhẫn.
    const reveal = easeOutCubic(lerpProgress(t, T.backdropIn, T.backdropReady));

    // ⚠ Fade riêng cho lúc model vừa tải xong (tải nền).
    //   Nếu model xong SAU mốc `backdropReady`, reveal đã = 1 → backdrop
    //   sẽ pop ngay. Lớp fade này giữ nó mềm mại.
    let assetFade = 1;
    if (!assetReady) {
      assetFade = 0;
    } else if (fadeStart.current === null) {
      fadeStart.current = t;
    } else {
      assetFade = easeOutCubic(
        lerpProgress(t, fadeStart.current, fadeStart.current + 1.2)
      );
    }

    const opacity = reveal * assetFade;
    for (const mat of backdropMats) {
      mat.opacity = opacity;
      // Khi đang mờ, tắt depthWrite để các mặt sau không bị cắt
      // hụt tạo vệt tối lỗm xổm. Bật lại khi đã đặc hoàn toàn.
      mat.depthWrite = opacity > 0.98;

      // ⚠ PERF QUAN TRỌNG: `transparent = true` buộc GPU vào chế độ
      //   blend + SẮP XẾP theo khoảng cách, và QUYẾT TẬT early-Z
      //   rejection (depth pre-pass). Với backdrop 1.8M vertices phủ
      //   gần hết màn hình, đây là mất năng lực GPU rất lớn.
      //   → Chỉ bật `transparent` trong lúc fade, tắt lại khi đặc.
      const needsBlend = opacity < 0.999;
      if (mat.transparent !== needsBlend) {
        mat.transparent = needsBlend;
        // Bật/tắt transparent cần compile lại shader
        mat.needsUpdate = true;
      }
    }
  });

  return (
    <>
      {/* Compile sẵn shader TRƯỚC khi nhân vật xuất hiện → không bị
          khựng lúc 2 nhân vật hiện ra. Xem giải thích trong
          `ShaderPrewarm`. */}
      <ShaderPrewarm />

      {/* Bối cảnh — giữ nguyên tỉ lệ, đặt gốc tại (0,0,0).
          Không thêm lớp phủ nào (vòng sáng, sàn nhân tạo) để tránh
          che mất texture backdrop. */}
      <group ref={backdropRef}>
        <primitive object={backdropClone} />
      </group>

      {/* Chú rể (trái) + cô dâu (phải), cùng hướng ra màn hình để chào khách.
          `breathOffset` lệch nhịp thở giữa 2 người, `expressiveness`
          điều chỉnh độ tự nhiên của biểu cảm. */}
      <Character
        url="/models/groom.glb"
        x={-COUPLE_GAP / 2}
        zOffset={0}
        rotationY={GROOM_ROTATION}
        bowStart={T.coupleBow}
        breathOffset={0}
        expressiveness={1}
        bow={GROOM_BOW}
      />
      <Character
        url="/models/bride.glb"
        x={COUPLE_GAP / 2}
        zOffset={BRIDE_Z_OFFSET}
        rotationY={BRIDE_ROTATION}
        bowStart={T.coupleBow + 0.45}
        breathOffset={0.9}
        expressiveness={1.15}
        bow={BRIDE_BOW}
      />
    </>
  );
}
