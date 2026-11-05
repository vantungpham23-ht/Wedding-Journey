"use client";

/**
 * NÚT TẮT / BẬT TIẾNG — điều khiển toàn bộ âm thanh của web.
 *
 * ── VÌ SAO CẦN? ──
 * Trước đây `setMuted()` / `isMuted()` tồn tại trong `soundscape.ts`
 * nhưng KHÔNG có UI nào gọi tới → người xem không có cách tắt tiếng.
 *
 * Sau khi thêm nhạc nền "Golden Hour" cho các section, việc có nút
 * tắt trở nên QUAN TRỌNG hơn nhiều:
 *   • Khách mở web ở chỗ đông người (quán cà phê, lớp học) → không
 *     muốn nhạc phát ra
 *   • Người dùng mobile hay bật im lặng khi mở link trong Zalo/Messenger
 *     → nhưng autoplay policy chỉ cho phát sau tương tác
 *
 * ── ẨN THÔNG MINH ──
 * Nút tự ẩn sau 3 giây không có tương tác (màn hình loading không
 * được phủ bởi UI) → giữ nguyên cảm giác "toàn màn hình là 3D".
 * Mọi tương tác → hiện lại.
 */

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { isMuted, setMuted } from "@/components/soundscape";

interface MuteButtonProps {
  /** ClassName cho vị trí (fixed/absolute) */
  className?: string;
  /** Bật tự ẩn sau khi không tương tác */
  autoHide?: boolean;
  /** Thời gian ẩn (ms) */
  hideDelay?: number;
}

export default function MuteButton({
  className = "",
  autoHide = true,
  hideDelay = 3000,
}: MuteButtonProps) {
  const [muted, setMutedState] = useState(false);
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Đồng bộ state với module (có thể đã bị tắt từ nơi khác)
  useEffect(() => {
    setMutedState(isMuted());
  }, []);

  const scheduleHide = useCallback(() => {
    if (!autoHide) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), hideDelay);
  }, [autoHide, hideDelay]);

  // Hiện lại khi user di chuyển chuột / chạm
  useEffect(() => {
    if (!autoHide) {
      setVisible(true);
      return;
    }
    const onActivity = () => {
      setVisible(true);
      scheduleHide();
    };
    window.addEventListener("pointermove", onActivity);
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onActivity);
    scheduleHide();
    return () => {
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [autoHide, scheduleHide]);

  const toggle = useCallback(() => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    // Chạm vào nút → giữ nút hiện thêm một chút
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), hideDelay);
  }, [muted, hideDelay]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={toggle}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
          aria-pressed={muted}
          className={`pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#c4a484]/25 bg-[#2d1f15]/50 backdrop-blur-sm transition-colors hover:border-[#c4a484]/60 ${className}`}
        >
          {muted ? (
            // Loa tắt — 2 sóng bị gạch
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c4a484"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M11 5 6 9H2v6h4l5 4V5Z" />
              <line x1="22" y1="9" x2="16" y2="15" />
              <line x1="16" y1="9" x2="22" y2="15" />
            </svg>
          ) : (
            // Loa bật — sóng âm
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#c4a484"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M11 5 6 9H2v6h4l5 4V5Z" />
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              <path d="M18.5 5.5a9 9 0 0 1 0 13" />
            </svg>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
