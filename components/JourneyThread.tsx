"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ease } from "./animation";

/**
 * JourneyThread — shared-element animation xuyên suốt 4 section.
 *
 * 1. "Sợi chỉ vàng" nối liền các section: đường kẻ mảnh chạy dọc mép
 *    màn hình, độ dài bám theo tiến độ scroll.
 * 2. "Cánh hoa vàng" (shared element) dùng Framer Motion `layoutId` —
 *    cùng một vật thể di chuyển từ section này sang section kế tiếp.
 */

interface JourneyThreadProps {
  activeSection: number;
  total: number;
  enabled: boolean;
  /** Element chứa nội dung scroll — dùng để tính progress */
  scrollRef?: React.RefObject<HTMLDivElement | null>;
}

export default function JourneyThread({
  activeSection,
  total,
  enabled,
  scrollRef,
}: JourneyThreadProps) {
  const step = activeSection / Math.max(1, total - 1);
  const basePercent = 14 + step * 66;

  if (!enabled) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 hidden md:block" aria-hidden>
      {/* ===== Sợi chỉ vàng chạy dọc mép phải ===== */}
      <div className="absolute right-[7%] top-0 h-full w-px">
        {/* nền mờ */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#c4a484]/12 to-transparent" />
        {/* phần sáng theo section hiện tại */}
        <motion.div
          className="absolute left-0 top-0 w-px bg-gradient-to-b from-[#c4a484]/60 via-[#c4a484]/70 to-[#c4a484]/10"
          initial={{ height: "0%" }}
          animate={{ height: `${basePercent}%` }}
          transition={{ duration: 1, ease }}
        />
      </div>

      {/* ===== Hạt sáng đi theo sợi chỉ ===== */}
      <motion.div
        className="absolute right-[7%] h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#c4a484] shadow-[0_0_10px_2px_rgba(196,164,132,0.55)]"
        initial={{ top: "14%", opacity: 0 }}
        animate={{ top: `${basePercent}%`, opacity: 0.9 }}
        transition={{ type: "spring", stiffness: 90, damping: 20, mass: 0.9 }}
      />
    </div>
  );
}

/**
 * SharedPetal — shared element nằm trong nội dung từng section.
 * Chỉ render ở section đang active → Framer Motion `layoutId` tự animate
 * sự chuyển dịch từ section này sang section kế tiếp (cùng 1 vật thể).
 */
export function SharedPetal({
  show,
  className = "",
  style,
  size = 18,
}: {
  show: boolean;
  className?: string;
  style?: React.CSSProperties;
  size?: number;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          layoutId="journey-petal"
          className={`pointer-events-none absolute z-10 ${className}`}
          style={style}
          initial={{ opacity: 0, scale: 0.4, rotate: -90 }}
          animate={{ opacity: 0.9, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.4, rotate: 90 }}
          transition={{ type: "spring", stiffness: 110, damping: 17, mass: 0.8 }}
        >
          <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            fill="#c4a484"
            style={{ filter: "drop-shadow(0 1px 4px rgba(196,164,132,0.5))" }}
          >
            <path d="M12 0C8 4 5 8 5 12c0 4 3 8 7 12 4-4 7-8 7-12 0-4-3-8-7-12Z" />
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
