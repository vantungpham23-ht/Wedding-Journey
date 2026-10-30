"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/**
 * FlipClock — Đồng hồ lật cơ (flip clock) cho Section 3.
 *
 * Mỗi ô số gồm 4 lớp:
 *   • nửa TRÊN tĩnh  → hiện nửa trên của số MỚI
 *   • nửa DƯỚI tĩnh → hiện nửa dưới của số MỚI
 *   • nửa TRÊN lật   → hiện nửa trên của số CŨ, lật đi (rotateX → -90°)
 *   • nửa DƯỚI lật   → hiện nửa dưới của số MỚI, lật lên (rotateX 90° → 0)
 *
 * ── CÁCH CANH SỐ (quan trọng — đây là chỗ dễ sinh bug) ──
 * Chữ KHÔNG được dịch bằng `translateY(±50%)` rời rạc. Cách đó làm
 * số lệch khỏi ô (bug: số "5" bị cắt mép ở mép phải).
 *
 * Thay vào đó: mỗi lớp nửa chứa một span cao BẰNG TOÀN BỘ Ô
 * (`height: 200%` vì container chỉ cao 1/2 ô), canh giữa bằng flex.
 * Nhờ vậy tâm chữ LUÔN trùng tâm ô, và container `overflow:hidden`
 * tự cắt đúng 1/2 chữ ở vạch giữa — giống hệt đồng hồ thật.
 *
 *   lớp nửa TRÊN  : span top = 0        → tâm chữ ở H/2 ✓
 *   lớp nửa DƯỚI : span top = -100%    → tâm chữ ở H/2 ✓
 *
 * ── PERF ──
 * Chỉ animate `transform: rotateX()`. Không filter/shadow động.
 * Chỉ số GIÂY đổi mỗi giây → chỉ 1 ô flip, các ô khác đứng yên.
 */

interface FlipDigitProps {
  digit: string;
  isDark: boolean;
}

function FlipDigit({ digit, isDark }: FlipDigitProps) {
  const [current, setCurrent] = useState(digit);
  const [prev, setPrev] = useState(digit);
  const [flipping, setFlipping] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (digit === current) return;

    setPrev(current);
    setFlipping(true);

    if (timer.current) clearTimeout(timer.current);
    // Nửa trên lật đi trong 0.21s → đổi số ở giữa chừng
    timer.current = setTimeout(() => {
      setCurrent(digit);
      setFlipping(false);
    }, 210);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [digit]);

  const faceColor = isDark ? "rgba(253,251,247,0.05)" : "rgba(74,53,37,0.04)";
  const edgeColor = isDark ? "rgba(196,164,132,0.22)" : "rgba(196,164,132,0.4)";
  const numColor = isDark ? "#fdfbf7" : "#4a3525";

  const BOX_H = 46; // px — chiều cao ô
  const BOX_W = 31; // px — chiều rộng ô
  const FONT = 26; // px — cỡ chữ

  /**
   * Style span số — cao bằng TOÀN BỘ ô, canh giữa flex.
   *
   * `top` quyết định lớp nào (trên/dưới):
   *   lớp TRÊN  → top: 0
   *   lớp DƯỚI → top: -BOX_H / 2
   *
   * VÌ SAO là -BOX_H/2 chứ không phải -BOX_H?
   * Lớp "nửa dưới" nằm ở page y = BOX_H/2 .. BOX_H. Muốn hiện NỬA
   * DƯỚI của chữ (chữ cao BOX_H, canh giữa trong ô), span phải phủ
   * đúng đoạn page y = 0 .. BOX_H → tương đối với lớp nửa dưới thì
   * `top = 0 - BOX_H/2 = -BOX_H/2`.
   *
   * Nếu đặt -BOX_H (như bản cũ) → span phủ đoạn page y = -BOX_H/2 ..
   * 0 → nằm hoàn toàn TRÊN vùng clip của lớp nửa dưới → **không hiện
   * gì cả** → chỉ thấy nửa trên của số, thiếu mất nửa dưới.
   */
  const spanStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    width: "100%",
    height: BOX_H,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: FONT,
    lineHeight: 1,
    color: numColor,
    fontVariantNumeric: "tabular-nums",
  };

  /** Vị trí span cho lớp NỬA DƯỚI (dịch lên nửa ô) */
  const lowerSpanStyle: React.CSSProperties = {
    ...spanStyle,
    top: -BOX_H / 2,
  };

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden rounded-[3px]"
      style={{
        width: BOX_W,
        height: BOX_H,
        background: faceColor,
        border: `1px solid ${edgeColor}`,
        perspective: "600px",
        fontFamily: "var(--font-playfair), serif",
      }}
    >
      {/* ── Nửa TRÊN tĩnh ── */}
      <div
        className="absolute inset-x-0 top-0 h-1/2 overflow-hidden"
        style={{ background: faceColor }}
      >
        <span style={spanStyle}>{current}</span>
      </div>

      {/* ── Nửa DƯỚI tĩnh ── */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden"
        style={{ background: faceColor }}
      >
        {/* dịch lên nửa ô → nửa dưới của chữ khớp vạch giữa */}
        <span style={lowerSpanStyle}>{current}</span>
      </div>

      {/* Vạch ngang giữa ô — "khe" của đồng hồ lật */}
      <div
        className="absolute inset-x-0 top-1/2 z-10 h-px"
        style={{ background: edgeColor }}
      />

      {flipping && (
        <>
          {/* Nửa TRÊN lật đi — số CŨ */}
          <motion.div
            className="absolute inset-x-0 top-0 z-20 h-1/2 overflow-hidden"
            style={{
              background: faceColor,
              transformOrigin: "50% 100%",
              backfaceVisibility: "hidden",
            }}
            initial={{ rotateX: 0 }}
            animate={{ rotateX: -90 }}
            transition={{ duration: 0.21, ease: "easeIn" }}
          >
            <span style={spanStyle}>{prev}</span>
          </motion.div>

          {/* Nửa DƯỚI lật lên — số MỚI */}
          <motion.div
            className="absolute inset-x-0 bottom-0 z-20 h-1/2 overflow-hidden"
            style={{
              background: faceColor,
              transformOrigin: "50% 0%",
              backfaceVisibility: "hidden",
            }}
            initial={{ rotateX: 90 }}
            animate={{ rotateX: 0 }}
            transition={{ duration: 0.21, delay: 0.21, ease: "easeOut" }}
          >
            <span style={lowerSpanStyle}>{current}</span>
          </motion.div>
        </>
      )}
    </div>
  );
}

interface FlipClockProps {
  value: string;
  label: string;
  theme?: "dark" | "light";
  /** Delay trước khi hiện (dùng cho intro) */
  delay?: number;
}

export default function FlipClock({
  value,
  label,
  theme = "dark",
  delay = 0,
}: FlipClockProps) {
  const isDark = theme === "dark";
  const labelColor = isDark ? "rgba(253,251,247,0.45)" : "rgba(74,53,37,0.45)";

  return (
    <motion.div
      className="flex flex-col items-center gap-1.5"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* ── Các ô số ── */}
      <div className="flex items-center justify-center gap-[3px]">
        {value.split("").map((d, i) => (
          <FlipDigit key={`${label}-${i}`} digit={d} isDark={isDark} />
        ))}
      </div>

      {/* ── Nhãn ── */}
      <span
        className="font-sans text-[9px] uppercase tracking-widest"
        style={{ color: labelColor }}
      >
        {label}
      </span>
    </motion.div>
  );
}
