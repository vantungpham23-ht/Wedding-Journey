"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { CPS, charDur, charStag, CONTENT_START, fadeBlurProps, ease, easeBack, blockDur } from "./animation";
import ConstellationArt from "./ConstellationArt";

// =====================================================================
// REVEAL TIMING — sau khi doors mở (intro exit ~6s)
// Dùng blockDur() cho text blocks để pacing đều với Details sections
// =====================================================================
const T0 = CONTENT_START; // 0.5s — section fade-in

// Eyebrow
const T_EYEBROW = T0 + 0.3;              // 0.8s

// Monogram T  bắt đầu xuất hiện
const T_MONO = T0 + 0.8;                  // 1.3s

// Flourish
const T_FLOURISH = T0 + 1.1;             // 1.6s

// Monogram H
const T_MONO_H = T0 + 1.3;               // 1.8s

// Date: block với staggered chars
const DATE = "27·12·2026";
const T_DATE = T0 + 1.8;                 // 2.3s  — date block starts

// Names
const NAMES_TEXT = "Tùng Phạm & Thuý Hằng";
const T_NAMES = T_DATE + blockDur(DATE) + 0.3; // ≈ 2.3 + 0.79 + 0.3 = 3.39s

// Location
const T_LOCATION = T_NAMES + blockDur(NAMES_TEXT) + 0.3; // ≈ 3.39 + 1.71 + 0.3 = 5.4s

// Bottom ornament
const T_BOTTOM = T_LOCATION + 0.8;       // ≈ 6.2s

// Scroll hint
const T_SCROLL = T_BOTTOM + 0.5;         // ≈ 6.7s

// =====================================================================
// SHARED EASING
// =====================================================================
const sharedEase = ease;
const sharedEaseBack = easeBack;

// =====================================================================
// CHAR / MASK VARIANTS — dùng pacing chuẩn CPS
// =====================================================================
const charVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: charDur(),
      delay: i * charStag(),
      ease: sharedEase,
    },
  }),
};

const maskVariants = {
  hidden: { y: "100%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: { duration: charDur() * 6, ease: sharedEase },
  },
};

// =====================================================================
// PARTICLE SYSTEM
// =====================================================================
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

// =====================================================================
// ITEM ANIM (cho ornament / section wrapper con)
// =====================================================================
function itemAnim(active: boolean, delay: number) {
  return {
    initial: { opacity: 0, y: 20, filter: "blur(6px)" },
    animate: active
      ? { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, delay, ease: sharedEase } }
      : { opacity: 0, y: -15, filter: "blur(4px)", transition: { duration: 0.5, ease: sharedEase } },
  };
}

// =====================================================================
// MONOGRAM ORNAMENT SVG
// =====================================================================
function FlourishOrnament({ width = 36, height = 12, className = "" }: { width?: number; height?: number; className?: string }) {
  return (
    <svg width={width} height={height} viewBox="0 0 60 20" fill="none" className={className}>
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
    </svg>
  );
}

// =====================================================================
// SECTION COMPONENT
// =====================================================================
interface RevealScreenProps {
  groom: string;
  bride: string;
  active?: boolean;
}

export default function RevealScreen({ groom, bride, active = true }: RevealScreenProps) {
  const prefersReducedMotion = useReducedMotion();

  const particles = useMemo(
    () => generateParticles(typeof window !== "undefined" && window.innerWidth < 768 ? 12 : 24),
    []
  );

  const groomChars = groom.split("");
  const brideChars = bride.split("");
  const dateChars = DATE.split("");

  return (
    <section className="reveal-bg relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6 sm:py-20">

      {/* ========== BACKGROUND LAYERS ========== */}

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(74, 53, 37, 0.04) 100%)",
        }}
      />

      {/* Floating particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p, i) => (
          <motion.span
            key={p.id}
            className={`reveal-particle ${p.type === "leaf" ? "leaf-particle" : ""}`}
            style={{ left: `${p.x}%`, width: p.size, height: p.size }}
            initial={{ opacity: 0, y: "100vh", x: 0 }}
            animate={
              prefersReducedMotion
                ? { opacity: 0.3, y: "-20vh", x: p.drift }
                : { opacity: [0, 0.7, 0.5, 0], y: "-20vh", x: p.drift, rotate: [0, 180, 360], scale: [0.8, 1.2, 0.9] }
            }
            transition={{ duration: p.duration, delay: p.delay + (i % 5) * 0.3, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>

      {/* Glow behind content */}
      <motion.div
        className="date-glow pointer-events-none absolute left-1/2 top-1/2 h-[60vh] w-[60vw] -translate-x-1/2 -translate-y-1/2"
        animate={active ? { scale: [1, 1.08, 1], opacity: [0.5, 0.8, 0.5] } : { scale: 1, opacity: 0 }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Top light rays */}
      <motion.div
        className="pointer-events-none absolute top-0 left-1/2 h-[40vh] w-[100vw] -translate-x-1/2"
        style={{ background: "linear-gradient(180deg, rgba(255, 240, 220, 0.08) 0%, transparent 100%)", filter: "blur(40px)" }}
        {...(active
          ? { animate: { opacity: 1, y: 0 }, transition: { duration: 2, delay: T_EYEBROW, ease: sharedEase } }
          : { animate: { opacity: 0 }, transition: { duration: 1 } }
        )}
      />

      {/* Floating bokeh */}
      {[20, 50, 80].map((pos, i) => (
        <motion.div
          key={`bokeh-${i}`}
          className="pointer-events-none absolute"
          style={{
            left: `${pos}%`, top: `${20 + i * 25}%`,
            width: 60 + i * 20, height: 60 + i * 20,
            background: "radial-gradient(circle, rgba(196, 164, 132, 0.15) 0%, transparent 70%)",
            borderRadius: "50%", filter: "blur(20px)",
          }}
          animate={active ? { y: [0, -30, 0], opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] } : { opacity: 0 }}
          transition={{ duration: 16 + i * 4, repeat: Infinity, delay: i * 1.6, ease: "easeInOut" }}
        />
      ))}

      {/* ========== MAIN CONTENT ========== */}
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center text-center">

        {/* --- EYEBROW: Save the Date --- */}
        <motion.div
          {...itemAnim(active, T_EYEBROW)}
          className="mb-5 flex items-center gap-3 overflow-hidden sm:mb-8"
        >
          <motion.span
            className="block h-px bg-gradient-to-r from-transparent to-[#c4a484]/50"
            initial={{ width: 0, opacity: 0 }}
            animate={active ? { width: 72, opacity: 1 } : { width: 0, opacity: 0 }}
            transition={{ duration: 1.2, delay: T_EYEBROW + 0.3, ease: sharedEase }}
          />
          <span className="whitespace-nowrap font-sans text-[9px] uppercase tracking-[0.5em] text-[#c4a484] sm:text-xs">
            Save the Date
          </span>
          <motion.span
            className="block h-px bg-gradient-to-l from-transparent to-[#c4a484]/50"
            initial={{ width: 0, opacity: 0 }}
            animate={active ? { width: 72, opacity: 1 } : { width: 0, opacity: 0 }}
            transition={{ duration: 1.2, delay: T_EYEBROW + 0.3, ease: sharedEase }}
          />
        </motion.div>

        {/* --- MONOGRAM: T ❀ H --- */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={
            active
              ? { opacity: 1, y: 0, scale: 1, transition: { duration: 1.0, delay: T_MONO, ease: sharedEaseBack } }
              : { opacity: 0, y: -15, transition: { duration: 0.6 } }
          }
          className="mb-5 flex items-center justify-center gap-2 sm:mb-7 sm:gap-3"
        >
          {/* T */}
          <motion.span
            className="font-[family-name:var(--font-playfair)] text-4xl text-[#c4a484] sm:text-5xl"
            style={{ fontWeight: 500, letterSpacing: "-0.02em" }}
            initial={{ opacity: 0, x: -20 }}
            animate={active ? { opacity: 1, x: 0, transition: { duration: 0.7, delay: T_MONO + 0.1, ease: sharedEase } } : { opacity: 0 }}
          >
            T
          </motion.span>

          {/* Flourish */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={active ? { opacity: 1, scaleX: 1, transition: { duration: 0.8, delay: T_FLOURISH, ease: sharedEase } } : { opacity: 0 }}
          >
            <FlourishOrnament className="text-[#c4a484]" />
          </motion.div>

          {/* H */}
          <motion.span
            className="font-[family-name:var(--font-playfair)] text-4xl italic text-[#c4a484] sm:text-5xl"
            style={{ fontWeight: 500, letterSpacing: "-0.02em" }}
            initial={{ opacity: 0, x: 20 }}
            animate={active ? { opacity: 1, x: 0, transition: { duration: 0.7, delay: T_MONO_H, ease: sharedEase } } : { opacity: 0 }}
          >
            H
          </motion.span>
        </motion.div>

        {/* --- CONSTELLATION: Bạch Dương ♈ & Xử Nữ ♍ --- */}
        <motion.div
          {...itemAnim(active, T_FLOURISH + 0.3)}
          className="mb-4 sm:mb-6"
        >
          <ConstellationArt size={180} theme="dark" delay={T_FLOURISH + 0.3} active={active} />
        </motion.div>

        {/* --- THE DATE: "27·12·2026" --- */}
        <motion.h1
          className="title-glow font-serif leading-none tracking-tight text-[#4a3525]"
          style={{ fontSize: "clamp(3.5rem, 16vw, 10rem)", minHeight: "1em" }}
        >
          <span className="inline-flex">
            {dateChars.map((char, i) => (
              <motion.span
                key={`date-${i}`}
                variants={charVariants}
                initial="hidden"
                animate={active ? "visible" : "hidden"}
                className={`inline-block ${char === "·" ? "text-[#c4a484]" : ""}`}
                style={{
                  transitionDelay: active ? `${T_DATE + i * charStag()}s` : "0s",
                  width: char === "·" ? "0.5em" : "auto",
                  transform: char === "·" ? "translateY(-0.15em)" : "none",
                }}
              >
                {char}
              </motion.span>
            ))}
          </span>
        </motion.h1>

        {/* Date underline */}
        <motion.div
          className="mt-2 h-px bg-gradient-to-r from-transparent via-[#c4a484]/40 to-transparent sm:mt-4"
          initial={{ width: 0, opacity: 0 }}
          animate={active ? { width: "55%", opacity: 1 } : { width: 0 }}
          transition={{ duration: 1.5, delay: T_DATE + 0.5, ease: sharedEase }}
          style={{ maxWidth: "380px" }}
        />

        {/* --- NAMES: Tùng Phạm & Thuý Hằng --- */}
        <motion.div
          className="mt-7 flex flex-col items-center sm:mt-14"
        >
          <p className="font-serif text-xl italic text-[#4a3525] sm:text-4xl md:text-5xl" style={{ letterSpacing: "0.02em" }}>
            {/* Groom */}
            <span className="inline-block">
              {groomChars.map((char, i) => (
                <motion.span
                  key={`g-${i}`}
                  variants={charVariants}
                  initial="hidden"
                  animate={active ? "visible" : "hidden"}
                  className="inline-block"
                  style={{ transitionDelay: active ? `${T_NAMES + i * charStag()}s` : "0s" }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </span>

            {/* Ampersand */}
            <motion.span
              className="mx-2 text-[#c4a484] sm:mx-3"
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={active ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0 }}
              transition={{ duration: 0.7, delay: T_NAMES + (groomChars.length - 1) * charStag() + 0.05, ease: sharedEaseBack }}
            >
              &
            </motion.span>

            {/* Bride */}
            <span className="inline-block">
              {brideChars.map((char, i) => (
                <motion.span
                  key={`b-${i}`}
                  variants={charVariants}
                  initial="hidden"
                  animate={active ? "visible" : "hidden"}
                  className="inline-block"
                  style={{ transitionDelay: active ? `${T_NAMES + (groomChars.length + 1) * charStag() + i * charStag()}s` : "0s" }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </span>
          </p>

          {/* Date subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={active ? { opacity: 1, y: 0 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: T_NAMES + blockDur(NAMES_TEXT) + 0.2, ease: sharedEase }}
            className="mt-4 font-sans text-[9px] uppercase tracking-[0.3em] text-[#4a3525]/50 sm:mt-6 sm:text-xs sm:tracking-[0.4em]"
          >
            Chủ Nhật · 27 Tháng 12 · 2026
          </motion.p>

          {/* Location */}
          <motion.p
            className="relative mt-2 font-sans text-[9px] uppercase tracking-[0.3em] text-[#c4a484] sm:mt-3 sm:text-xs sm:tracking-[0.4em]"
            initial={{ opacity: 0 }}
            animate={active ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: T_LOCATION, ease: sharedEase }}
          >
            Kênh · Cẩm Bình · Hà Tĩnh
            <motion.span
              className="absolute -bottom-1 left-1/2 h-px -translate-x-1/2 bg-[#c4a484]/40"
              initial={{ width: 0 }}
              animate={active ? { width: "100%" } : { width: 0 }}
              transition={{ duration: 1.2, delay: T_LOCATION + 0.4, ease: sharedEase }}
            />
          </motion.p>
        </motion.div>

        {/* --- BOTTOM ORNAMENT --- */}
        <motion.div
          {...itemAnim(active, T_BOTTOM)}
          className="mt-10 mb-3 flex items-center justify-center gap-4 text-[#c4a484] sm:mt-16 sm:mb-4"
        >
          <span className="h-px w-10 bg-[#c4a484]/30 sm:w-14" />
          <motion.svg
            width="18" height="18" viewBox="0 0 32 32" fill="currentColor" fillOpacity="0.3"
            stroke="currentColor" strokeWidth="1"
            animate={active ? { rotate: [0, 360] } : { rotate: 0 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            <path d="M16 28 C16 28 4 19 4 11 C4 6 8 2 13 2 C14.5 2 16 3 16 3 C16 3 17.5 2 19 2 C24 2 28 6 28 11 C28 19 16 28 16 28Z" />
          </motion.svg>
          <span className="h-px w-10 bg-[#c4a484]/30 sm:w-14" />
        </motion.div>

        {/* --- SCROLL HINT --- */}
        <motion.div
          {...itemAnim(active, T_SCROLL)}
          className="mt-8 flex flex-col items-center gap-3 sm:mt-12 sm:gap-4"
        >
          <motion.span
            className="font-sans text-[9px] uppercase tracking-[0.4em] text-[#4a3525]/40 sm:tracking-[0.5em]"
            animate={active ? { y: [0, -3, 0] } : {}}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            Vuốt lên để xem tiếp
          </motion.span>
          <motion.div
            className="relative h-10 w-px overflow-hidden bg-[#4a3525]/20 sm:h-12"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
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
    </section>
  );
}
