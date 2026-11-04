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
          <Loading3D onDone={onComplete} />
        </div>
      )}

      {/* Vignette cho cảm giác cinematic */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 60% at 50% 45%, transparent 40%, rgba(10,6,4,0.55) 100%)",
        }}
      />
    </div>
  );
}
