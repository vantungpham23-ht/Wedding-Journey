"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { buildLogoSvgUri } from "./logoArt";
import { createRandom, PARTICLE_SEED } from "@/lib/random";
import { SECTION_SIG } from "./animation";

/**
 * ShatterLogo — Section 0 signature: logo VỠ thành nhiều mảnh, mỗi mảnh
 * bay từ một hướng khác nhau ngoài màn hình rồi lắp vào đúng chỗ.
 *
 * ── KỸ THUẬT (quan trọng về hiệu năng) ──
 * Logo gốc có 40 path. Nếu render 40 bản copy SVG → 1600 path DOM → lag.
 * Thay vào đó:
 *   • Serialize logo thành 1 `data:image/svg+xml` URI (tạo 1 lần, cache).
 *   • Mỗi mảnh là 1 `<div>` có `background-image` + `clip-path` polygon.
 *   • → 40 div, 0 path. Browser decode 1 lần, mọi mảnh dùng chung.
 *
 * ── NHỊP "CHẬM RỒI NHANH" ──
 * Mỗi mảnh có `delay` ngẫu nhiên 0→0.35s nhưng `duration` ngắn (~0.7-1.1s).
 * Nghĩa là: đầu tiên những mảnh "nhanh" tới, cuối cùng mảnh "chậm" tới —
 * nhưng vì chạy song song nên nhìn chung là 1 đợt vỡ vụn rồi khớp lại.
 */

interface ShatterLogoProps {
  size?: number;
  active?: boolean;
  /** Delay trước khi bắt đầu (khớp timeline của section) */
  delay?: number;
  className?: string;
}

/** Lưới chia mảnh: 5 cột × 8 hàng = 40 mảnh */
const COLS = 5;
const ROWS = 8;

interface Shard {
  id: number;
  /** clip-path polygon (%), định vị trong ô */
  clip: string;
  /** offset bay vào (px) */
  dx: number;
  dy: number;
  rot: number;
  /** scale nhỏ lúc đầu → to dần */
  s0: number;
  delay: number;
  dur: number;
}

export default function ShatterLogo({
  size = 240,
  active = true,
  delay = 0,
  className = "",
}: ShatterLogoProps) {
  const reduced = useReducedMotion();

  // 1 lần duy nhất — URI có sẵn trong module scope để không rebuild
  const logoUri = useMemo(() => buildLogoSvgUri(), []);

  const shards = useMemo<Shard[]>(() => {
    const rnd = createRandom(PARTICLE_SEED + 101);
    const cw = 100 / COLS;
    const ch = 100 / ROWS;

    return Array.from({ length: COLS * ROWS }, (_, i) => {
      const c = i % COLS;
      const r = Math.floor(i / COLS);

      // Ô của mảnh, có nội suy lệch nhẹ để mép không thẳng hàng
      const x0 = c * cw;
      const y0 = r * ch;
      const jx = (rnd() - 0.5) * cw * 0.55;
      const jy = (rnd() - 0.5) * ch * 0.55;

      const clip = [
        `${x0 + jx}% ${y0 + jy}%`,
        `${x0 + cw}% ${y0 + jy}%`,
        `${x0 + cw}% ${y0 + ch + jy}%`,
        `${x0 + jx}% ${y0 + ch + jy}%`,
      ].join(", ");

      // Bay vào từ NGOÀI màn hình — hướng ngẫu nhiên, độ xa lớn
      const ang = rnd() * Math.PI * 2;
      const dist = 260 + rnd() * 220;

      return {
        id: i,
        clip: `polygon(${clip})`,
        dx: Math.cos(ang) * dist,
        dy: Math.sin(ang) * dist * 0.75,
        rot: (rnd() - 0.5) * 190,
        s0: 0.55 + rnd() * 0.5,
        // delay ngẫu nhiên nhỏ → mảnh tới không đồng loạt (tự nhiên hơn)
        delay: rnd() * 0.32,
        dur: 0.72 + rnd() * 0.45,
      };
    });
  }, []);

  // ── Reduced motion: hiện logo tĩnh, không vỡ ──
  if (reduced) {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          backgroundImage: `url(${logoUri})`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          opacity: active ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      />
    );
  }

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {shards.map((s) => (
        <motion.div
          key={s.id}
          className="absolute inset-0 gpu"
          style={{
            clipPath: s.clip,
            backgroundImage: `url(${logoUri})`,
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            // transform gốc để mảnh vừa khít vào ô
            transformOrigin: "50% 50%",
          }}
          initial={{
            x: s.dx,
            y: s.dy,
            rotate: s.rot,
            scale: s.s0,
            opacity: 0,
          }}
          animate={
            active
              ? {
                  x: 0,
                  y: 0,
                  rotate: 0,
                  scale: 1,
                  opacity: 1,
                }
              : {
                  // thoát: bay tiếp ra xa hơn một chút (mượt khi lướt ngược)
                  x: s.dx * 1.12,
                  y: s.dy * 1.12,
                  rotate: s.rot * 0.7,
                  scale: s.s0 * 0.85,
                  opacity: 0,
                }
          }
          transition={{
            duration: active ? s.dur : s.dur * 0.7,
            delay: active ? delay + s.delay : 0,
            ease: SECTION_SIG.shatter.ease,
          }}
        />
      ))}

      {/* ── Vòng xung "impact" khi mảnh cuối cùng lắp vào ── */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-full"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={
          active
            ? {
                scale: [0.85, 1.35, 1.6],
                opacity: [0, 0.35, 0],
                transition: {
                  duration: 0.85,
                  delay: delay + 0.75,
                  ease: "easeOut",
                },
              }
            : { scale: 0.85, opacity: 0 }
        }
        style={{
          border: "1px solid rgba(196,164,132,0.6)",
        }}
      />
    </div>
  );
}
