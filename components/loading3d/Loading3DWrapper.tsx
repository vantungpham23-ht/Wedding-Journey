"use client";

/**
 * WRAPPER LOADING 3D — Canvas + overlay UI.
 *
 * ── VÌ SAO CẦN WRAPPER? ──
 * `Loading3D.tsx` là module 3D thuần (chỉ phụ thuộc three.js).
 * Wrapper này lo phần UI: nền gradient, kiểm tra WebGL, và việc dynamic
 * import với `ssr: false` (bắt buộc cho static export).
 *
 * ── GIAO DIỆN ──
 * Cố ý KHÔNG có overlay text, thanh tiến trình hay nút "Bỏ qua":
 * toàn bộ màn hình thuộc về scene 3D. Người dùng bị "chặn" tự nhiên
 * cho tới khi cảnh mở đầu chạy xong.
 *
 * ── DỰ PHÒNG ──
 * Nếu WebGL không khả dụng → vào thẳng thiệp mời, không để trắng màn.
 */

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

/** Canvas 3D — chỉ load phía client */
const Loading3D = dynamic(() => import("./Loading3D"), { ssr: false });

interface Props {
  /** Báo khi scene 3D chạy xong → chuyển sang intro screen */
  onComplete: () => void;
}

export default function Loading3DWrapper({ onComplete }: Props) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  /** Scene đã bắt đầu chạy (đồng hồ chạy) → ẩn overlay */
  const [sceneStarted, setSceneStarted] = useState(false);

  // Kiểm tra WebGL có khả dụng không
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) {
        setFailed(true);
        return;
      }
      setReady(true);
    } catch {
      setFailed(true);
    }
  }, []);

  // Nếu WebGL không hỗ trợ → vào thẳng, không chặn người dùng
  useEffect(() => {
    if (failed) onComplete();
  }, [failed, onComplete]);

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-[#160e09]">
      {/* Nền gradient động */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 42%, #4a3525 0%, #2d1f15 45%, #160e09 100%)",
        }}
      />

      {/* Scene 3D */}
      {ready && !failed && (
        <div className="absolute inset-0">
          <Loading3D onDone={onComplete} onStart={() => setSceneStarted(true)} />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          OVERLAY "ĐANG CHUẨN BỊ" — chỉ hiện khi scene CHƯA chạy.

          ⚠ VÌ SAO CẦN:
          Đo được Canvas cần ~520ms (parse JS + hydrate React + setup
          r3f) trước khi frame đầu tiên vẽ được. Trên mạng di động +
          máy yếu con, con số này dễ lên 1-2s. User nhìn màn hình
          đen TRỐNG và tưởng web bị treo → bấm thoát.

          1 dòng chữ nhẹ + 3 chấm nhấp nháy giải quyết đúng vấn đề đó,
          mà không cần thanh tiến trình (sẽ phải làm giả số %).

          ⚠ Tự mờ dần khi scene bắt đầu → không giật màn hình.
          ═══════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {ready && !failed && !sceneStarted && (
          <motion.div
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-[#c4a484]/70 sm:text-[11px]">
              Đang chuẩn bị
              <motion.span
                className="inline-block"
                animate={{ opacity: [0, 1, 0] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                ...
              </motion.span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vignette cho cảm giác cinematic */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 60% at 50% 45%, transparent 40%, rgba(10,6,4,0.55) 100%)",
        }}
      />

      {/* ⚠ ĐÃ BỎ NÚT TẮT TIẾNG Ở MÀN LOADING.
          Lý do: âm thanh của cảnh loading đã bị gỡ (2026-11-05) →
          nút loa ở đây không còn tác dụng gì. Để lại chỉ khiến khách
          bấm vào rồi không thấy gì xảy ra → tệ hơn là không có nút.
          Nút mute thật nằm ở `app/page.tsx`, hiện từ stage "intro" trở
          đi (lúc đó đã có nhạc nền section). */}
    </div>
  );
}
