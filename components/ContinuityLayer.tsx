"use client";

import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { createRandom, PARTICLE_SEED } from "@/lib/random";

/**
 * ContinuityLayer — Tầng 1: khung xương chạy XUYEN SUỐT cả 4 section.
 *
 * Mục tiêu: khi lướt qua ranh giới section, không có gì bị "cắt" — nền
 * chuyển màu liên tục, hạt bụi bay không ngừng, ánh sáng trôi theo.
 *
 * ── QUY TẮC HIỆU NĂNG (quan trọng — đọc trước khi sửa) ──
 * 1. CHỈ animate `transform` (translate/scale/rotate) và `opacity`.
 *    2 thuộc tính này được GPU compositing → không repaint, không layout.
 * 2. TUYỆT ĐỐI không animate `filter: blur()`, `width`, `height`,
 *    `box-shadow`, `background-position` → đều ép repaint mỗi frame.
 * 3. Mọi chuyển động LẶP VÔ HẠN dùng CSS `@keyframes` (chạy trên
 *    compositor, 0 JS/frame), không dùng `animate={{...}}` của Framer.
 * 4. `will-change` chỉ đặt trên lớp thực sự chuyển động, và tự động
 *    bị gỡ khi không còn cần (tránh nhồi GPU layer).
 */

interface ContinuityLayerProps {
  /** Scroll container của 4 section */
  scrollRef?: React.RefObject<HTMLElement | null>;
  /** Section hiện tại — dùng để bắn light sweep khi đổi section */
  activeSection: number;
}

/** Số hạt cố định — không phụ thuộc viewport để SSR/client khớp */
const DUST_COUNT = 26;

interface Dust {
  id: number;
  x: number;
  y: number;
  size: number;
  dur: number;
  delay: number;
  drift: number;
}

export default function ContinuityLayer({
  scrollRef,
  activeSection,
}: ContinuityLayerProps) {
  const reduced = useReducedMotion();
  const [sweepKey, setSweepKey] = useState(0);
  const [velocity, setVelocity] = useState(0);

  // ------------------------------------------------------------------
  // Scroll progress của CONTAINER (không phải window)
  // ------------------------------------------------------------------
  const { scrollYProgress } = useScroll({
    container: scrollRef as React.RefObject<HTMLElement>,
    offset: ["start start", "end end"],
  });

  // Nền: KHÔNG dùng lớp `fixed` ở đây nữa — đã gán trực tiếp màu
  // trên từng <section> (xem DetailsScreen.tsx).
  //
  // LÝ DO (sửa lỗi nền bị lệch màu — ảnh 1 & 3):
  //   Cross-fade be (#fdfbf7) ↔ nâu (#2d1f15) đi qua màu trung gian
  //   rgb(149,141,134) — một màu XÁM XANH LỤC. Đó chính là nền
  //   "Hẹn gặp bạn" bị xấu. Trộn 2 màu không liên quan không bao
  //   giờ ra màu đẹp ở giữa.
  //
  //   Nay mỗi section tự mang màu nền của nó → nền đi theo content,
  //   không màu trung gian, không vệt sáng lệch góc, đồng bộ tuyệt đối.

  // Hạt bụi: đi chậm + xa dần (tạo chiều sâu)
  const dustY = useTransform(scrollYProgress, [0, 1], [0, -170]);
  const dustScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.55, 2.3]);
  const dustOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.55, 0.85, 0.5]);

  // Quầng sáng: cố định ở GIỮA, KHÔNG trôi theo scroll.
  // Lý do: dùng `style={{x,y}}` của Framer sẽ GHI ĐÈ transform của
  // Tailwind (`-translate-x-1/2 -translate-y-1/2`) → quầng sáng bị lệch
  // sang góc dưới-phải, tạo ra vùng nền sáng hơn lệch chỗ (ảnh 3).
  // Muốn di chuyển thì phải tự tính tâm trong `x`/`y` của Framer.
  const glowX = useTransform(scrollYProgress, [0, 1], ["-50%", "-50%"]);
  const glowY = useTransform(scrollYProgress, [0, 1], ["-50%", "-50%"]);

  // Vệt tốc độ: opacity theo velocity scroll (chỉ transform/opacity)
  // useSpring trả về MotionValue → dùng trực tiếp cho useTransform.
  const velocitySpring = useSpring(velocity, {
    stiffness: 260,
    damping: 40,
    mass: 0.4,
  });
  const streakOpacity = useTransform(
    velocitySpring,
    [-60, 0, 60],
    [0.35, 0, 0.35]
  );

  // ------------------------------------------------------------------
  // Light sweep khi đổi section
  // ------------------------------------------------------------------
  useEffect(() => {
    if (reduced) return;
    setSweepKey((k) => k + 1);
  }, [activeSection, reduced]);

  // ------------------------------------------------------------------
  // Scroll velocity (đo trên container)
  // ------------------------------------------------------------------
  const lastScroll = useRef(0);
  useEffect(() => {
    const el = scrollRef?.current;
    if (!el || reduced) return;
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const v = el.scrollTop - lastScroll.current;
        lastScroll.current = el.scrollTop;
        setVelocity(v);
      });
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [scrollRef, reduced]);

  // ------------------------------------------------------------------
  // Hạt bụi — vị trí seed cố định (SSR/client khớp)
  // ------------------------------------------------------------------
  const dust = useMemo<Dust[]>(() => {
    const rnd = createRandom(PARTICLE_SEED + 555);
    return Array.from({ length: DUST_COUNT }, (_, i) => ({
      id: i,
      x: rnd() * 100,
      y: rnd() * 100,
      size: 1.5 + rnd() * 3.5,
      dur: 14 + rnd() * 18,
      delay: rnd() * 12,
      drift: (rnd() - 0.5) * 80,
    }));
  }, []);

  return (
    <>
      {/* ============ NỀN — đã gán trực tiếp trên từng <section> ============
          KHÔNG dùng lớp nền `fixed` ở đây nữa.

          Lý do: lớp fixed phải cross-fade be ↔ nâu để đồng bộ với
          section, mà cross-fade 2 màu không liên quan đi qua màu
          trung gian rgb(149,141,134) — XÁM XANH LỤC (ảnh 1). Ngoài ra
          lớp fixed còn tạo vùng sáng lệch góc dưới-phải (ảnh 3).

          Nay mỗi <section> tự mang màu nền của nó → tuyệt đối đồng
          bộ, không màu trung gian, không vệt sáng lệch.

          Tầng này chỉ giữ: hạt bụi, quầng sáng, vệt tốc độ, light sweep. */}

      {/* ============ HẠT BỤI (parallax) ============ */}
      <motion.div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 2, y: dustY, scale: dustScale, opacity: dustOpacity }}
        aria-hidden
      >
        {dust.map((d) => (
          <span
            key={d.id}
            className="continuity-dust"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: d.size,
              height: d.size,
              animationDuration: `${d.dur}s`,
              animationDelay: `-${d.delay}s`,
              // drift nhẹ bằng CSS variable → không cần JS mỗi frame
              ["--drift" as string]: `${d.drift}px`,
            }}
          />
        ))}
      </motion.div>

      {/* ============ QUẦNG SÁNG TRÔI ============
          Cố định ở chính giữa màn hình, KHÔNG lệch góc.
          `x`/`y` đã bao gồm cả -50% (tự canh tâm) nên không dùng
          class Tailwind `-translate-x-1/2` (sẽ bị ghi đè).
          Gradient toả tròn rất mờ để nền vẫn phẳng, không lộ vệt. */}
      <motion.div
        className="pointer-events-none fixed left-1/2 top-1/2 h-[70vh] w-[80vw]"
        style={{
          zIndex: 2,
          x: glowX,
          y: glowY,
          background:
            "radial-gradient(circle at center, rgba(196,164,132,0.07) 0%, rgba(196,164,132,0.025) 45%, transparent 70%)",
        }}
        aria-hidden
      />

      {/* ============ VỆT TỐC ĐỘ (theo velocity) ============ */}
      <motion.div
        className="pointer-events-none fixed inset-0"
        style={{
          zIndex: 3,
          opacity: streakOpacity,
          background:
            "repeating-linear-gradient(102deg, rgba(196,164,132,0.05) 0px, rgba(196,164,132,0.05) 2px, transparent 2px, transparent 26px)",
        }}
        aria-hidden
      />

      {/* ============ LIGHT SWEEP khi đổi section ============ */}
      {!reduced && (
        <motion.div
          key={`sweep-${sweepKey}`}
          className="pointer-events-none fixed inset-0"
          initial={{ x: "-130%" }}
          animate={{ x: "130%" }}
          transition={{ duration: 1.15, ease: [0.4, 0, 0.2, 1] }}
          style={{
            zIndex: 6,
            background:
              "linear-gradient(90deg, transparent 38%, rgba(196,164,132,0.11) 50%, transparent 62%)",
          }}
          aria-hidden
        />
      )}
    </>
  );
}
