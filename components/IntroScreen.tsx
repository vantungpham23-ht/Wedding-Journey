"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CONTENT_START, ease } from "./animation";

// =====================================================================
// PACING — Intro content: smooth, quick transitions
// =====================================================================
// Eyebrow: "We are getting married" (22 chars) + duration 1.5s
const INTRO_EYEBROW = "We are getting married";
const T_EYEBROW = CONTENT_START + 0.2;              // 0.7s — eyebrow appears

// Names block: appears quickly after eyebrow with minimal pause
const T_NAMES = T_EYEBROW + 1.2;                    // 1.9s — names fade in smoothly

// Seal button: appears right after names stabilize
const T_SEAL = T_NAMES + 0.5;                       // 2.4s — seal appears faster

// Footer date
const T_DATE = T_SEAL + 0.6;                       // 3.0s — date appears quickly

// =====================================================================
// PARTICLES
// =====================================================================
function IntroParticles() {
  const [particles, setParticles] = useState<
    { id: number; x: number; y: number; size: number; duration: number; delay: number }[]
  >([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1.5 + Math.random() * 3,
        duration: 20 + Math.random() * 24,
        delay: Math.random() * 8,
      }))
    );
  }, []);

  return (
    <>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="intro-particle"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.4, 0],
            scale: [0, 1, 0.5],
            y: [0, -40, -80],
          }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
}

// =====================================================================
// TIMING CONSTANTS
// =====================================================================
const TIMING = {
  doorOpenDuration: 3.6,
  doorOpenDelay: 0.6,
  totalExit: 4.5,
};

const easeSmooth = [0.4, 0, 0.2, 1];

// =====================================================================
// DOOR ANIMATIONS
// =====================================================================
const doorLeftVariants = {
  initial: { x: "0%", rotate: 0 },
  exit: {
    x: "-110%",
    rotate: -3,
    transition: { duration: TIMING.doorOpenDuration, delay: TIMING.doorOpenDelay, ease: easeSmooth },
  },
};

const doorRightVariants = {
  initial: { x: "0%", rotate: 0 },
  exit: {
    x: "110%",
    rotate: 3,
    transition: { duration: TIMING.doorOpenDuration, delay: TIMING.doorOpenDelay, ease: easeSmooth },
  },
};

// Ambient glow ring around seal
const sealGlowVariants = {
  animate: {
    scale: [1, 1.12, 1],
    opacity: [0.4, 0.7, 0.4],
  },
  transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
};

// =====================================================================
// WAX SEAL BUTTON
// =====================================================================
function WaxSealButton({ onClick, visible }: { onClick: () => void; visible: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
      whileHover={visible ? { scale: 1.04, y: -2 } : {}}
      whileTap={visible ? { scale: 0.97, y: 1 } : {}}
      transition={{ duration: 0.8, ease }}
      className="relative flex h-28 w-28 items-center justify-center rounded-full sm:h-36 sm:w-36"
      aria-label="Mở thiệp mời"
    >
      {/* Outer ambient glow ring */}
      <motion.span
        variants={sealGlowVariants}
        className="absolute inset-0 rounded-full"
        style={{
          background: "transparent",
          boxShadow: "0 0 32px 8px rgba(196, 164, 132, 0.25), 0 0 64px 16px rgba(196, 164, 132, 0.1)",
        }}
      />

      {/* Wax seal body — layered gradients for engraved depth */}
      <div
        className="relative flex h-full w-full items-center justify-center rounded-full"
        style={{
          background: "linear-gradient(145deg, #8b6f47 0%, #6b5235 20%, #4a3525 50%, #3d2a1c 80%, #2d1f15 100%)",
          boxShadow:
            "inset 0 2px 4px rgba(255, 240, 220, 0.12), inset 0 -2px 4px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Inner engraved ring */}
        <div
          className="absolute rounded-full"
          style={{
            inset: 10,
            border: "1.5px solid rgba(196, 164, 132, 0.2)",
            boxShadow:
              "inset 0 1px 3px rgba(0, 0, 0, 0.5), inset 0 -1px 2px rgba(255, 240, 220, 0.06)",
          }}
        />

        {/* Second inner ring (groove) */}
        <div
          className="absolute rounded-full"
          style={{
            inset: 16,
            border: "0.75px solid rgba(196, 164, 132, 0.12)",
          }}
        />

        {/* Monogram: T & H */}
        <div className="relative z-10 flex flex-col items-center">
          <span
            className="font-[family-name:var(--font-playfair)] text-3xl leading-none text-[#c4a484] sm:text-4xl"
            style={{
              fontWeight: 500,
              letterSpacing: "-0.01em",
              textShadow: "0 1px 3px rgba(0,0,0,0.6), 0 0 8px rgba(196, 164, 132, 0.3)",
            }}
          >
            T
          </span>
          <div className="my-0.5 h-px w-8 bg-gradient-to-r from-transparent via-[#c4a484]/60 to-transparent sm:my-1 sm:w-10" />
          <span
            className="font-[family-name:var(--font-playfair)] text-3xl leading-none italic text-[#c4a484] sm:text-4xl"
            style={{
              fontWeight: 500,
              letterSpacing: "-0.01em",
              textShadow: "0 1px 3px rgba(0,0,0,0.6), 0 0 8px rgba(196, 164, 132, 0.3)",
            }}
          >
            H
          </span>
        </div>
      </div>
    </motion.button>
  );
}

// =====================================================================
// INTRO SCREEN
// =====================================================================
interface IntroScreenProps {
  onUnlock: () => void;
  bride: string;
  groom: string;
}

export default function IntroScreen({ onUnlock, bride, groom }: IntroScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => onUnlock(), TIMING.totalExit * 1000);
  };

  return (
    <div className="intro-bg relative h-screen w-full overflow-hidden">

      {/* Ambient particles */}
      <IntroParticles />

      {/* Background hint — nội dung bên trong lộ ra khi cửa bay */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at center, #fdfbf7 0%, #f5ebd9 50%, #e8d4b8 100%)" }}
        initial={{ opacity: 0 }}
        animate={exiting ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.5, delay: TIMING.doorOpenDelay + 0.7, ease: easeSmooth }}
      />

      {/* Light beam at door seam */}
      <motion.div
        className="pointer-events-none absolute top-0 left-1/2 z-[5] h-full w-1/2 -translate-x-1/2"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255, 248, 220, 0.25) 50%, transparent 100%)",
          filter: "blur(30px)",
        }}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={exiting ? { opacity: [0, 1, 0.5], scaleX: [0, 1.5, 3] } : { opacity: 0, scaleX: 0 }}
        transition={{ duration: TIMING.doorOpenDuration, delay: TIMING.doorOpenDelay, times: [0, 0.4, 1], ease: easeSmooth }}
      />

      {/* ====== TWO PAPER DOORS ====== */}
      <div className="absolute inset-0" style={{ zIndex: 10, pointerEvents: "none" }}>
        <motion.div
          className="gpu absolute top-0 left-0 h-full w-1/2"
          variants={doorLeftVariants}
          initial="initial"
          exit="exit"
          animate={exiting ? "exit" : "initial"}
          style={{
            background: "linear-gradient(180deg, #3d2a1c 0%, #2a1c12 50%, #1e140d 100%)",
            transformOrigin: "left center",
            boxShadow: "inset -30px 0 50px rgba(0, 0, 0, 0.6)",
          }}
        />
        <motion.div
          className="gpu absolute top-0 right-0 h-full w-1/2"
          variants={doorRightVariants}
          initial="initial"
          exit="exit"
          animate={exiting ? "exit" : "initial"}
          style={{
            background: "linear-gradient(180deg, #3d2a1c 0%, #2a1c12 50%, #1e140d 100%)",
            transformOrigin: "right center",
            boxShadow: "inset 30px 0 50px rgba(0, 0, 0, 0.6)",
          }}
        />
      </div>

      {/* Center seam line */}
      <motion.div
        className="absolute top-0 left-1/2 z-20 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#c4a484]/40 to-transparent"
        animate={{ opacity: exiting ? 0 : mounted ? 0.6 : 0 }}
        transition={{ duration: 0.6 }}
      />

      {/* ====== CENTER CONTENT ====== */}
      <motion.div
        className="absolute inset-0 z-30 flex flex-col items-center justify-center px-8 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={mounted && !exiting ? { opacity: 1, scale: 1 } : { opacity: 0 }}
        transition={{ duration: 1.2, ease: easeSmooth }}
        style={{ pointerEvents: exiting ? "none" : "auto" }}
      >
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={mounted ? { opacity: 0.7, y: 0 } : { opacity: 0 }}
          transition={{ delay: T_EYEBROW, duration: 0.8, ease }}
          className="mb-6 font-sans text-[10px] uppercase tracking-[0.5em] text-[#c4a484]/70 sm:mb-8 sm:text-xs"
        >
          {INTRO_EYEBROW}
        </motion.p>

        {/* Names */}
        <motion.div
          className="mb-8 flex flex-col items-center gap-2 sm:mb-12"
          initial={{ opacity: 0, y: 12 }}
          animate={mounted ? { opacity: 1, y: 0 } : { opacity: 0 }}
          transition={{ delay: T_NAMES, duration: 0.6, ease }}
        >
          <span
            className="font-[family-name:var(--font-playfair)] text-4xl font-medium leading-tight text-[#fdfbf7] sm:text-5xl md:text-6xl"
            style={{ letterSpacing: "-0.01em" }}
          >
            {groom}
          </span>
          <span className="font-[family-name:var(--font-playfair)] text-2xl italic text-[#c4a484] sm:text-3xl">
            &
          </span>
          <span
            className="font-[family-name:var(--font-playfair)] text-4xl font-medium leading-tight text-[#fdfbf7] sm:text-5xl md:text-6xl"
            style={{ letterSpacing: "-0.01em" }}
          >
            {bride}
          </span>
        </motion.div>

        {/* Wax Seal Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={mounted ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ delay: T_SEAL, duration: 0.6, ease }}
        >
          <WaxSealButton onClick={handleClick} visible={mounted && !exiting} />
        </motion.div>

        {/* Hint text below seal */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 0.35 } : { opacity: 0 }}
          transition={{ delay: T_DATE, duration: 0.6, ease }}
          className="absolute bottom-10 font-sans text-[9px] uppercase tracking-[0.4em] text-[#fdfbf7]/40 sm:text-[10px]"
        >
          27 · 12 · 2026
        </motion.p>
      </motion.div>
    </div>
  );
}
