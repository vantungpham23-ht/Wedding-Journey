"use client";

/**
 * LOADING 3D — cảnh mở đầu của web cưới.
 *
 * Câu chuyện (15.2 giây):
 *   1. Màn hình trống — chờ không khí
 *   2. 2 chiếc nhẫn bay vào từ 2 phía, quấn quít vào nhau, rồi tan
 *   3. Wedding backdrop mờ dần hiện ra
 *   4. Chú rể + cô dâu bước lên sân khấu, đứng yên, cúi chào khán giả
 *   5. Camera lùi ra → hiện nút "Mở thiệp mời"
 *
 * ── KHUNG HÌNH ──
 * Camera ở z = 3.6 (xa), KHÔNG dán sát màn hình: sân khấu chiếm
 * ~38% chiều rộng × 42% chiều cao, nhân vật ~28% → giữ được cảm
 * giác "nhìn từ xa" và có không khí xung quanh.
 *
 * ── VỀ HIỆU NĂNG ──
 * - `dpr={[1, 1.8]}`: giới hạn mật độ pixel trên màn Retina
 * - `powerPreference: "high-performance"`: dùng GPU rời khi có
 * - Không dùng shadows (rất tốn cho scene này)
 * - Backdrop có 4.45M vertex (Draco) → giữ nguyên tỉ lệ, không thêm
 *   lớp phủ (sàn/vòng sáng) vì sẽ che mất texture
 * - `StudioEnv` render 2 lần (`frames={2}`) → không tốn mỗi frame
 *
 * ── VỀ SSR ──
 * Next.js static export → Canvas phải render phía client.
 * Dùng `dynamic(() => import(...), { ssr: false })` ở `app/page.tsx`.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import Ring from "./Ring";
import CoupleScene from "./CoupleScene";
import { assetTracker, clock, resetClock } from "./store";
import { cameraYAt, cameraZAt, easeInOutSine, lerpProgress, T } from "./timeline";
import { MODEL } from "./useGLB";

/**
 * Ánh sáng toàn cảnh.
 *
 * Backdrop là mesh duy nhất, không có sàn nhân tạo → ánh sáng phải đủ
 * mạnh để texture trên vòm hiện rõ, đồng thời có đèn hắt từ trên
 * xuống để tách nhân vật khỏi nền.
 */
function Lights() {
  return (
    <>
      <ambientLight intensity={0.68} color="#f5e9d8" />
      {/* Key light chính — vàng ấm từ trên xuống trước */}
      <directionalLight
        position={[2.5, 4, 3]}
        intensity={2.5}
        color="#ffe6bd"
      />
      {/* Fill + rim gộp — xanh nhạt từ trái, tạo chiều sâu */}
      <directionalLight
        position={[-3, 1.5, 2]}
        intensity={1.05}
        color="#9fb8d4"
      />
      {/* Rim light — hồng ấm từ phía sau, viền sáng cho nhân vật */}
      <directionalLight
        position={[0, 2.5, -3.5]}
        intensity={1.35}
        color="#ffb98a"
      />
      {/* Spot light sân khấu — hắt thẳng xuống nhân vật đang đứng ở
          y = -0.40, tạo vòng sáng như đèn sân khấu thật.
          ⚠ Đèn này cũng chiếu sáng backdrop (vòm) phía trên → thay
            thế cho "spot light trên cao" đã bỏ. */}
      <spotLight
        position={[0, 2.6, 0.7]}
        angle={0.62}
        penumbra={0.7}
        intensity={30}
        color="#ffe9c4"
        distance={10}
      />
      {/* Ánh sáng nhẹ từ phía trước để rõ mặt khi nhân vật cúi chào
          (mặt nhân vật ở y ≈ 0.30) */}
      <pointLight
        position={[0, 0.55, 1.8]}
        intensity={2.6}
        color="#fff4e2"
        distance={5}
        decay={2}
      />
    </>
  );
}

/**
 * MÔI TRƯỜNG PHẢN XẠ — làm kim loại (nhẫn) bắt sáng rõ nét.
 *
 * ⚠ File GLB nhẫn để `metallic = 1` nhưng KHÔNG có envMap → kim
 * loại không có gì để phản xạ, mọi pixel đều xám đều, trông như
 * mảng sáng mờ (không thấy vành / đá / đường khắc).
 *
 * `Environment` + `Lightformer` tạo env map bằng cách render scene
 * vào cubemap — không cần tải HDRI từ CDN, hoàn toàn offline.
 *
 * Bố cục nguồn sáng (quyết định hình dáng highlight trên nhẫn):
 *   • Vòng sáng lớn phía trước-trên  → vệt sáng chính trên mặt nhẫn
 *   • Dải sáng dài ở bên trái       → vệt sáng chạy dọc vành nhẫn
 *   • Vòng nhỏ phía sau              → rim light viền sáng
 *   • Nền tối                       → tương phản, viền nổi bật
 */
function StudioEnv() {
  return (
    // `frames={2}` — frame 1 render trong layoutEffect (lúc vừa mount),
    // frame 2 render ở frame đầu tiên để chắc chắn mọi Lightformer
    // đã vào virtual scene. Tốn thêm đúng 1 lần render cubemap rồi dừng.
    <Environment resolution={128} frames={2}>
      {/* Nền tối — tạo tương phản để viền nhẫn nổi bật */}
      <color attach="background" args={["#1a120c"]} />

      {/* Vòng sáng lớn phía trước-trên: vệt sáng chính trên mặt nhẫn */}
      <Lightformer
        form="rect"
        intensity={6}
        color="#fff0d8"
        position={[0, 3, 4]}
        rotation={[-Math.PI / 2.6, 0, 0]}
        scale={[8, 4, 1]}
      />
      {/* Dải sáng dài bên trái: vệt sáng dọc theo vành nhẫn */}
      <Lightformer
        form="rect"
        intensity={4.5}
        color="#ffe2b8"
        position={[-4, 1, 1]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[6, 1.4, 1]}
      />
      {/* Dải sáng bên phải, lạnh hơn — tách bạch 2 chiếc nhẫn */}
      <Lightformer
        form="rect"
        intensity={3}
        color="#cfe0ff"
        position={[4, 0.5, 1]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[6, 1, 1]}
      />
      {/* Vòng nhỏ phía sau: rim light viền sáng */}
      <Lightformer
        form="ring"
        intensity={5}
        color="#ffd7a8"
        position={[0, 2, -4]}
        scale={[3, 3, 1]}
      />
      {/* Đèn phía dưới nhẹ — nhấn vành dưới của nhẫn */}
      <Lightformer
        form="rect"
        intensity={2}
        color="#ffb888"
        position={[0, -2.5, 1]}
        rotation={[Math.PI / 2.4, 0, 0]}
        scale={[5, 1.2, 1]}
      />
    </Environment>
  );
}

/**
 * Camera chạy theo timeline (`cameraZAt` / `cameraYAt`):
 *
 *   1. Bắt đầu: xa (z = 8.2), cao (y = 1.75) → màn hình trống, chờ
 *   2. Khi backdrop hiện: tiến vào (z = 3.6) → sân khấu chiếm ~38%
 *      chiều rộng × 42% chiều cao → có "không khí", KHÔNG dán sát
 *   3. LÚC CÚI CHÀO (8.4 → 10.0s): ZOOM VÀO (z = 2.2) + hạ camera
 *      xuống tầm mặt (y = 0.05) → nhân vật chiếm ~47% chiều cao
 *   4. Cuối: lùi ra (z = 4.3) ngay khi nhân vật vừa ngẩng lên
 *      (10.8 → 13.2s) → hiện nút "Mở thiệp mời"
 *
 * ── ĐO KHUNG HÌNH (phép chiếu, fov 42°, 16:9) ──
 *   z = 2.3 → backdrop rộng 60% · cao 66%   ← quá to, sân khấu dán sát
 *   z = 3.0 → backdrop rộng 46% · cao 50%
 *   z = 3.6 → backdrop rộng 38% · cao 42%   ← ✅ chọn (khung mở đầu)
 *   z = 2.2 → nhân vật cao 47%              ← ✅ chọn (lúc cúi)
 *   z = 4.3 → backdrop rộng 32% · cao 35%   ← ✅ chọn (handoff)
 */
function CameraRig() {
  const camera = useThree((s) => s.camera);

  useFrame(() => {
    const t = clock.time;

    camera.position.z = cameraZAt(t);
    camera.position.y = cameraYAt(t);
    camera.position.x = 0;

    // Nhìn vào giữa sân khấu. Khi zoom vào lúc cúi, hạ điểm nhìn
    // xuống tầm ngực để thấy rõ cúi chào; khi lùi ra, dâng lên lại.
    const outP = easeInOutSine(lerpProgress(t, T.cameraPull, T.done));
    const bowP = easeInOutSine(
      lerpProgress(t, T.coupleBow, T.coupleBow + 1.6),
    );
    const lookY = 0.02 + 0.06 * outP - 0.02 * bowP * (1 - outP);
    camera.lookAt(0, lookY, 0);
  });

  return null;
}

/**
 * Driver timeline — cập nhật `clock.time` mỗi frame.
 * Đây là "trái tim" của animation: mọi thứ khác chỉ đọc `clock.time`.
 */
function TimelineDriver({ onDone }: { onDone: () => void }) {
  const done = useRef(false);
  const elapsed = useRef(0);

  useEffect(() => {
    resetClock();
    elapsed.current = 0;
    done.current = false;

    // ⚠ ASSET GATE — đồng hồ CHỈ chạy khi mọi model đã tải xong.
    //
    //   Trước đây đồng hồ chạy ngay khi Canvas mount. Trong lúc tải
    //   ~13MB model, timeline đã trôi mất 2-4s → khi model xong:
    //     • nhân vật hiện ra đột ngột giữa cảnh (mất trôi chạy)
    //     • GPU phải compile shader NGAY LÚC ĐÓ → khựng lag
    //
    //   Giờ: đợi tải xong → reset → chạy từ 0. Màn hình đen trong
    //   lúc chờ (đúng như thiết kế "DARKNESS 0.0 → 0.8s").
    let started = false;
    const begin = () => {
      if (started) return;
      started = true;
      resetClock();
      elapsed.current = 0;
      clock.running = true;
    };

    const unwatch = assetTracker.onAllReady(begin);
    // Dự phòng: model lỗi / mạng chậm → vẫn phải chạy cảnh
    const clearTimer = assetTracker.startFallbackTimer(begin, 8000);

    return () => {
      unwatch();
      clearTimer();
    };
  }, []);

  useFrame((_, delta) => {
    if (clock.running) {
      elapsed.current += delta;
      clock.time = elapsed.current;
      if (clock.time >= T.done) {
        clock.running = false;
        clock.time = T.done;
      }
    }

    if (!done.current && clock.time >= T.done) {
      done.current = true;
      onDone();
    }
  });

  return null;
}

/**
 * KHÔNG có sàn nhân tạo.
 *
 * Trước đây có một đĩa tròn radius 5 ở y = -0.62 để "chặn sáng" —
 * nhưng nó phủ toàn bộ phía dưới khung hình, tạo ra một lớp tối
 * chồng lên backdrop, làm sân khấu bị mờ và nhân vật bị tách nền.
 *
 * Sàn sân khấu thật đã nằm sẵn trong mesh `wedding-backdrop.glb`
 * (mặt phẳng y ≈ -0.40) nên không cần lớp này.
 */

export default function Loading3D({ onDone }: { onDone: () => void }) {
  return (
    <Canvas
      camera={{ position: [0, 1.75, 8.2], fov: 42, near: 0.1, far: 100 }}
      // ── DPR ──
      // ⚠ `dpr={[1, 1.8]}` render 1.8× pixel trên Retina → gấp 3.24×
      //   số fragment phải shading. Đây là nguyên nhân lag rõ nhất
      //   trên màn Retina (mọi pixel × đèn × texture).
      //   Giảm xuống [1, 1.35] → ~2.2× ít fragment, hình ảnh vẫn
      //   mượt (vòm backdrop có texture lớn nên không bị rõ nét kém).
      dpr={[1, 1.35]}
      gl={{
        // ⚠ Tắt MSAA: với dpr 1.35 + texture webp, MSAA 4× tốn thêm
        //   ~2 lần fragment mà mắt gần như không thấy khác biệt.
        //   Thay vào đó dùng texture webp sẵn có (đã có sẵn antialias
        //   sẵn trong file).
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
        // Đừng để GPU driver tự ý tăng độ phân giải nội bộ
        stencil: false,
        depth: true,
      }}
      // Không dùng shadow — quá tốn cho 1 scene loading
      shadows={false}
      // `always` = render liên tục (cần cho animation)
      frameloop="always"
      style={{ background: "transparent" }}
    >
      <TimelineDriver onDone={onDone} />
      <CameraRig />
      <Lights />
      <StudioEnv />

      <Suspense fallback={null}>
        {/* Bối cảnh + nhân vật */}
        <CoupleScene />

        {/* 2 chiếc nhẫn — lệch phase để quấn quít */}
        <Ring side={1} url={MODEL.brideRing} tint="#ffe9c9" />
        <Ring side={-1} url={MODEL.groomRing} tint="#ffd9b0" />
      </Suspense>
    </Canvas>
  );
}
