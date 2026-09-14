"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

interface Particle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  type: "circle" | "leaf";
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: 3 + Math.random() * 5,
    duration: 20 + Math.random() * 30,
    delay: Math.random() * 15,
    drift: -20 + Math.random() * 40,
    type: Math.random() > 0.4 ? "circle" : "leaf",
  }));
}

interface RevealScreenProps {
  groom: string;
  bride: string;
  active?: boolean;
}

// Timing cho reveal sequence sau khi doors mở
// Doors finish opening ~6.0s, content fades in starting 6.0s (timeline kéo dài ~2x)
const REVEAL_TIMING = {
  startDelay: 6.0, // Doors mở xong
  eyebrow: 6.4,
  monogram: 7.0,
  flourish: 7.6,
  date: 8.2,
  names: 9.2,
  location: 9.8,
  bottomDecor: 10.6,
  scrollHint: 11.4,
};

// === EASING CURVES (cubic-bezier) ===
const ease = [0.16, 1, 0.3, 1]; // Expo out - mượt mà
const easeBack = [0.34, 1.56, 0.64, 1]; // Back out - bounce nhẹ

// === TEXT REVEAL: Từng ký tự fade + blur ===
const charVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 1.8,
      delay: i * 0.1,
      ease: ease,
    },
  }),
};

// === MASK REVEAL: từ dưới lên ===
const maskVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: {
      duration: 2.4,
      ease: ease,
    },
  },
};

// === GOLDEN SHIMMER: gradient sweep across text ===
const shimmerVariants = {
  hidden: { backgroundPosition: "200% center" },
  visible: {
    backgroundPosition: "0% center",
    transition: {
      duration: 4,
      ease: "easeOut",
    },
  },
};

export default function RevealScreen({
  groom,
  bride,
  active = true,
}: RevealScreenProps) {
  const prefersReducedMotion = useReducedMotion();

  // Reduce particles on mobile for perf
  const particles = useMemo(
    () => generateParticles(typeof window !== "undefined" && window.innerWidth < 768 ? 12 : 24),
    []
  );

  // Item animation wrapper
  const itemAnim = (delay: number, fromBlur = true) => ({
    initial: {
      opacity: 0,
      y: 25,
      filter: fromBlur ? "blur(8px)" : "blur(0px)",
    },
    animate: active
      ? {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 2.6, delay, ease },
        }
      : {
          opacity: 0,
          y: -20,
          filter: fromBlur ? "blur(8px)" : "blur(0px)",
          transition: { duration: 1.2, ease },
        },
  });

  // === Split text thành từng ký tự để animate riêng ===
  const groomChars = groom.split("");
  const brideChars = bride.split("");
  const dateString = "27·12·2026";
  const dateChars = dateString.split("");

  return (
    <section className="reveal-bg relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6 sm:py-20">
      {/* ========== BACKGROUND LAYERS ========== */}

      {/* Layer 1: Vignette gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(74, 53, 37, 0.04) 100%)",
        }}
      />

      {/* Layer 2: Floating particles - sinh động với nhiều hình dạng */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p, i) => (
          <motion.span
            key={p.id}
            className={`reveal-particle ${p.type === "leaf" ? "leaf-particle" : ""}`}
            style={{
              left: `${p.x}%`,
              width: p.size,
              height: p.size,
            }}
            initial={{ opacity: 0, y: "100vh", x: 0 }}
            animate={
              prefersReducedMotion
                ? { opacity: 0.3, y: "-20vh", x: p.drift }
                : {
                    opacity: [0, 0.7, 0.5, 0],
                    y: "-20vh",
                    x: p.drift,
                    rotate: [0, 180, 360],
                    scale: [0.8, 1.2, 0.9],
                  }
            }
            transition={{
              duration: p.duration,
              delay: p.delay + (i % 5) * 0.3, // stagger
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Layer 3: Glow động - pulse nhẹ phía sau content */}
      <motion.div
        className="date-glow pointer-events-none absolute left-1/2 top-1/2 h-[60vh] w-[60vw] -translate-x-1/2 -translate-y-1/2"
        animate={
          active
            ? { scale: [1, 1.1, 1], opacity: [0.6, 0.9, 0.6] }
            : { scale: 1, opacity: 0 }
        }
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Layer 4: Top light rays */}
      <motion.div
        className="pointer-events-none absolute top-0 left-1/2 h-[40vh] w-[100vw] -translate-x-1/2"
        style={{
          background:
            "linear-gradient(180deg, rgba(255, 240, 220, 0.08) 0%, transparent 100%)",
          filter: "blur(40px)",
        }}
        initial={{ opacity: 0, y: -50 }}
        animate={active ? { opacity: 1, y: 0 } : { opacity: 0 }}
        transition={{ duration: 4, delay: 6.4, ease }}
      />

      {/* Layer 5: Floating bokeh - các quả cầu ánh sáng lơ lửng */}
      {[20, 50, 80].map((pos, i) => (
        <motion.div
          key={`bokeh-${i}`}
          className="pointer-events-none absolute"
          style={{
            left: `${pos}%`,
            top: `${20 + i * 25}%`,
            width: 60 + i * 20,
            height: 60 + i * 20,
            background:
              "radial-gradient(circle, rgba(196, 164, 132, 0.15) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(20px)",
          }}
          animate={
            active
              ? {
                  y: [0, -30, 0],
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.2, 1],
                }
              : { opacity: 0 }
          }
          transition={{
            duration: 16 + i * 4,
            repeat: Infinity,
            delay: i * 1.6,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* ========== MAIN CONTENT ========== */}
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center text-center">
        {/* === EYEBROW: Save the Date === */}
        <motion.div
          {...itemAnim(REVEAL_TIMING.eyebrow)}
          className="mb-6 flex items-center gap-3 overflow-hidden sm:mb-10 sm:gap-5"
        >
          {/* Left line with slide-in */}
          <motion.span
            className="block h-px bg-gradient-to-r from-transparent to-[#c4a484]/50 sm:w-20"
            initial={{ width: 0, opacity: 0 }}
            animate={active ? { width: 80, opacity: 1 } : { width: 0, opacity: 0 }}
            transition={{ duration: 2, delay: REVEAL_TIMING.eyebrow + 0.6, ease }}
            style={{ width: "80px" }}
          />
          <span className="font-sans text-[9px] uppercase tracking-[0.5em] text-[#c4a484] sm:text-xs">
            Save the Date
          </span>
          {/* Right line with slide-in */}
          <motion.span
            className="block h-px bg-gradient-to-l from-transparent to-[#c4a484]/50 sm:w-20"
            initial={{ width: 0, opacity: 0 }}
            animate={active ? { width: 80, opacity: 1 } : { width: 0, opacity: 0 }}
            transition={{ duration: 2, delay: REVEAL_TIMING.eyebrow + 0.6, ease }}
            style={{ width: "80px" }}
          />
        </motion.div>

        {/* === MONOGRAM: T ❀ H === */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={
            active
              ? { opacity: 1, y: 0, scale: 1, transition: { duration: 2.6, delay: REVEAL_TIMING.monogram, ease: easeBack } }
              : { opacity: 0, y: -20 }
          }
          className="mb-6 flex items-center justify-center sm:mb-8"
        >
          {/* Chữ T - Playfair Display sang trọng hiện đại */}
          <motion.span
            className="font-[family-name:var(--font-playfair)] text-4xl leading-none text-[#c4a484] sm:text-5xl"
            style={{ fontWeight: 500, letterSpacing: "-0.02em" }}
            initial={{ opacity: 0, x: -30 }}
            animate={active ? { opacity: 1, x: 0 } : { opacity: 0 }}
            transition={{ duration: 2, delay: REVEAL_TIMING.monogram + 0.4, ease }}
          >
            T
          </motion.span>

          {/* Calligraphy flourish - với rotation reveal */}
          <motion.svg
            width="36"
            height="12"
            viewBox="0 0 60 20"
            fill="none"
            initial={{ opacity: 0, scaleX: 0, rotate: -10 }}
            animate={active ? { opacity: 1, scaleX: 1, rotate: 0 } : { opacity: 0 }}
            transition={{ duration: 2, delay: REVEAL_TIMING.flourish, ease }}
            className="mx-3 text-[#c4a484] sm:mx-4 sm:h-4 sm:w-14"
            style={{ transformOrigin: "center" }}
          >
            <path
              d="M 2 10 Q 15 10 22 4 Q 28 -1 30 8 Q 32 17 38 4 Q 45 -1 58 10"
              stroke="currentColor"
              strokeWidth="0.8"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="30" cy="10" r="1.2" fill="currentColor" />
            <path
              d="M 8 10 Q 20 14 30 12 Q 40 14 52 10"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
            />
          </motion.svg>

          {/* Chữ H - Playfair Display italic, rotate from opposite */}
          <motion.span
            className="font-[family-name:var(--font-playfair)] text-4xl leading-none text-[#c4a484] sm:text-5xl"
            style={{ fontWeight: 500, letterSpacing: "-0.02em", fontStyle: "italic" }}
            initial={{ opacity: 0, x: 30 }}
            animate={active ? { opacity: 1, x: 0 } : { opacity: 0 }}
            transition={{ duration: 2, delay: REVEAL_TIMING.monogram + 0.8, ease }}
          >
            H
          </motion.span>
        </motion.div>

        {/* === THE DATE: từng số fade-up + glow effect === */}
        <motion.h1
          className="font-serif leading-none tracking-tight text-[#4a3525] title-glow"
          style={{
            fontSize: "clamp(3.5rem, 16vw, 10rem)",
            minHeight: "1em",
          }}
        >
          {/* Inline-flex để từng ký tự đứng cạnh nhau */}
          <span className="inline-flex">
            {dateChars.map((char, i) => (
              <motion.span
                key={`date-${i}`}
                custom={i}
                variants={charVariants}
                initial="hidden"
                animate={active ? "visible" : "hidden"}
                className={`inline-block ${char === "·" ? "text-[#c4a484]" : ""}`}
                style={{
                  transitionDelay: active
                    ? `${REVEAL_TIMING.date + i * 0.14}s`
                    : "0s",
                  width: char === "·" ? "0.5em" : "auto",
                  transform: char === "·" ? "translateY(-0.15em)" : "none",
                }}
              >
                {char}
              </motion.span>
            ))}
          </span>
        </motion.h1>

        {/* === UNDERLINE: animated line below date === */}
        <motion.div
          className="mt-2 h-px bg-gradient-to-r from-transparent via-[#c4a484]/40 to-transparent sm:mt-4"
          initial={{ width: 0, opacity: 0 }}
          animate={active ? { width: "60%", opacity: 1 } : { width: 0 }}
          transition={{ duration: 3, delay: REVEAL_TIMING.date + 1.0, ease }}
          style={{ maxWidth: "400px" }}
        />

        {/* === NAMES: từng chữ fade-up với stagger === */}
        <motion.div
          className="mt-8 flex flex-col items-center sm:mt-16"
        >
          {/* Groom name - từng ký tự */}
          <p
            className="font-serif text-xl italic text-[#4a3525] sm:text-4xl md:text-5xl"
            style={{ letterSpacing: "0.02em" }}
          >
            <motion.span className="inline-block">
              {groomChars.map((char, i) => (
                <motion.span
                  key={`g-${i}`}
                  custom={i}
                  variants={charVariants}
                  initial="hidden"
                  animate={active ? "visible" : "hidden"}
                  className="inline-block"
                  style={{
                    transitionDelay: active
                      ? `${REVEAL_TIMING.names + i * 0.12}s`
                      : "0s",
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </motion.span>
            <motion.span
              className="mx-2 text-[#c4a484] sm:mx-3"
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={
                active
                  ? { opacity: 1, scale: 1, rotate: 0 }
                  : { opacity: 0, scale: 0 }
              }
              transition={{ duration: 1.6, delay: REVEAL_TIMING.names + 0.8, ease: easeBack }}
            >
              &
            </motion.span>
            <motion.span className="inline-block">
              {brideChars.map((char, i) => (
                <motion.span
                  key={`b-${i}`}
                  custom={i}
                  variants={charVariants}
                  initial="hidden"
                  animate={active ? "visible" : "hidden"}
                  className="inline-block"
                  style={{
                    transitionDelay: active
                      ? `${REVEAL_TIMING.names + 1.0 + i * 0.12}s`
                      : "0s",
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </motion.span>
          </p>

          {/* Date subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={
              active
                ? { opacity: 1, y: 0, transition: { delay: REVEAL_TIMING.location, duration: 2, ease } }
                : { opacity: 0 }
            }
            className="mt-4 font-sans text-[9px] uppercase tracking-[0.3em] text-[#4a3525]/50 sm:mt-6 sm:text-xs sm:tracking-[0.4em]"
          >
            Chủ Nhật · 27 Tháng 12 · 2026
          </motion.p>

          {/* Location - với line drawing effect */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={active ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: REVEAL_TIMING.location + 0.4, duration: 2, ease }}
            className="relative mt-2 font-sans text-[9px] uppercase tracking-[0.3em] text-[#c4a484] sm:mt-3 sm:text-xs sm:tracking-[0.4em]"
          >
            Kênh · Cẩm Bình · Hà Tĩnh
            {/* Underline animated */}
            <motion.span
              className="absolute -bottom-1 left-1/2 h-px bg-[#c4a484]/40"
              initial={{ width: 0, x: "-50%" }}
              animate={active ? { width: "100%" } : { width: 0 }}
              transition={{ delay: REVEAL_TIMING.location + 1.0, duration: 2.4, ease }}
            />
          </motion.p>
        </motion.div>

        {/* === BOTTOM ORNAMENT === */}
        <motion.div
          {...itemAnim(REVEAL_TIMING.bottomDecor)}
          className="mt-12 mb-4 flex items-center justify-center gap-3 text-[#c4a484] sm:mt-20 sm:mb-8"
        >
          <span className="h-px w-8 bg-[#c4a484]/30 sm:w-12" />
          <motion.svg
            width="18"
            height="18"
            viewBox="0 0 32 32"
            fill="currentColor"
            fillOpacity="0.3"
            stroke="currentColor"
            strokeWidth="1"
            animate={
              active
                ? { rotate: [0, 360] }
                : { rotate: 0 }
            }
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            <path d="M16 28 C16 28 4 19 4 11 C4 6 8 2 13 2 C14.5 2 16 3 16 3 C16 3 17.5 2 19 2 C24 2 28 6 28 11 C28 19 16 28 16 28Z" />
          </motion.svg>
          <span className="h-px w-8 bg-[#c4a484]/30 sm:w-12" />
        </motion.div>

        {/* === SCROLL HINT === */}
        <motion.div
          {...itemAnim(REVEAL_TIMING.scrollHint)}
          className="mt-8 flex flex-col items-center gap-3 sm:mt-12 sm:gap-4"
        >
          <motion.span
            className="font-sans text-[9px] uppercase tracking-[0.4em] text-[#4a3525]/40 sm:tracking-[0.5em]"
            animate={active ? { y: [0, -2, 0] } : {}}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            Vuốt lên để xem tiếp
          </motion.span>

          <motion.div
            className="relative h-10 w-px overflow-hidden bg-[#4a3525]/20 sm:h-12"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="absolute inset-x-0 top-0 h-1/2 bg-[#c4a484]"
              animate={prefersReducedMotion ? {} : { y: ["0%", "200%"] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Corner ornaments removed - keep layout clean */}
    </section>
  );
}
