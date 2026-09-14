"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface IntroScreenProps {
  onUnlock: () => void;
  bride: string;
  groom: string;
}

// Subtle floating particles
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
        duration: 10 + Math.random() * 12,
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
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.4, 0],
            scale: [0, 1, 0.5],
            y: [0, -40, -80],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}

// ============ ANIMATION TIMELINE (ĐƠN GIẢN - 2 tờ giấy) ============
// 0.0s: User clicks button
// 0.0s - 0.5s: Button + content fade out
// 0.3s - 2.3s: 2 tờ giấy nâu ghép vào nhau từ từ bay ra 2 bên (2s)
// 1.0s - 2.0s: Nội dung bên trong hiện ra (fade)
// 2.3s: onUnlock called

const TIMING = {
  doorOpenDuration: 2.0,         // 2 giây - đơn giản, nhanh gọn
  doorOpenDelay: 0.3,             // Bắt đầu bay sau khi button tan
  totalExit: 2.5,                 // Tổng thời gian
};

// Easing mượt - cubic-bezier cơ bản
const easeSmooth = [0.4, 0, 0.2, 1];   // Material ease - mượt, tự nhiên
const easeElegant = [0.65, 0, 0.35, 1]; // Smooth in-out

// ============ PAPER DOOR ANIMATIONS ============
// 2 tờ giấy nâu ghép vào nhau - bay dần ra 2 bên (gentle slide + slight rotate)
const doorLeftVariants = {
  initial: { x: "0%", rotate: 0 },
  exit: {
    x: "-110%",
    rotate: -3, // xoay nhẹ như tờ giấy thật
    transition: {
      duration: TIMING.doorOpenDuration,
      delay: TIMING.doorOpenDelay,
      ease: easeSmooth,
    },
  },
};

const doorRightVariants = {
  initial: { x: "0%", rotate: 0 },
  exit: {
    x: "110%",
    rotate: 3,
    transition: {
      duration: TIMING.doorOpenDuration,
      delay: TIMING.doorOpenDelay,
      ease: easeSmooth,
    },
  },
};

// Pulsing rings around button
const pulseRingVariants = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.4, 1.7],
    opacity: [0.5, 0.2, 0],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeOut",
    },
  },
};

const secondRingVariants = {
  initial: { scale: 1, opacity: 0.5 },
  animate: {
    scale: [1, 1.4, 1.7],
    opacity: [0.5, 0.2, 0],
    transition: {
      duration: 2.5,
      delay: 1.25,
      repeat: Infinity,
      ease: "easeOut",
    },
  },
};

interface IntroScreenPropsWithNames extends IntroScreenProps {}

export default function IntroScreen({ onUnlock, bride, groom }: IntroScreenPropsWithNames) {
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    if (exiting) return;
    setExiting(true);
    setTimeout(() => {
      onUnlock();
    }, TIMING.totalExit * 1000);
  };

  const previewDelay = TIMING.doorOpenDelay + 0.7;

  return (
    <div className="intro-bg relative h-screen w-full overflow-hidden">
      {/* Ambient particles */}
      <IntroParticles />

      {/* ====== BACKGROUND HINT - nội dung bên trong lộ ra khi cửa bay ====== */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, #fdfbf7 0%, #f5ebd9 50%, #e8d4b8 100%)",
        }}
        initial={{ opacity: 0 }}
        animate={exiting ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.5, delay: TIMING.doorOpenDelay + 0.7, ease: easeSmooth }}
      />

      {/* Tia sáng đơn giản ở khe cửa (chỉ chiếu khi cửa mở) */}
      <motion.div
        className="pointer-events-none absolute top-0 left-1/2 z-[5] h-full w-1/2 -translate-x-1/2"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255, 248, 220, 0.25) 50%, transparent 100%)",
          filter: "blur(30px)",
        }}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={
          exiting
            ? {
                opacity: [0, 1, 0.5],
                scaleX: [0, 1.5, 3],
              }
            : { opacity: 0, scaleX: 0 }
        }
        transition={{
          duration: TIMING.doorOpenDuration,
          delay: TIMING.doorOpenDelay,
          times: [0, 0.4, 1],
          ease: easeSmooth,
        }}
      />

      {/* ====== THE TWO PAPER DOORS (bay ra 2 bên) ====== */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        {/* LEFT PAPER */}
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

        {/* RIGHT PAPER */}
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

      {/* Center seam line (subtle) - fade out as doors open */}
      <motion.div
        className="absolute top-0 left-1/2 z-20 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#c4a484]/40 to-transparent"
        animate={{
          opacity: exiting ? 0 : (mounted ? 0.6 : 0),
        }}
        transition={{ duration: 0.6 }}
      />

      {/* ====== CENTER CONTENT (Button + Text) - FADES OUT FIRST ====== */}
      <motion.div
        className="absolute inset-0 z-30 flex flex-col items-center justify-center px-8 text-center"
        initial="hidden"
        animate={mounted && !exiting ? "visible" : "hidden"}
        variants={{
          hidden: { opacity: 0, scale: 0.95 },
          visible: {
            opacity: 1,
            scale: 1,
            transition: {
              duration: 1.2,
              ease: easeSmooth,
            },
          },
        }}
        style={{
          pointerEvents: exiting ? "none" : "auto",
        }}
      >
        {/* Names display */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={mounted ? { opacity: 0.7, y: 0 } : { opacity: 0 }}
          transition={{ delay: 0.3, duration: 1, ease: easeSmooth }}
          className="mb-4 font-sans text-[10px] uppercase tracking-[0.5em] text-[#c4a484]/70 sm:text-xs"
        >
          We are getting married
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
          animate={
            mounted && !exiting
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: -10 }
          }
          transition={{ delay: 0.5, duration: 1.1, ease: easeSmooth }}
          className="mb-2 max-w-2xl font-serif text-4xl leading-tight text-[#fdfbf7] sm:text-5xl md:text-6xl"
        >
          {groom}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, scale: 0 }}
          animate={
            mounted && !exiting
              ? { opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0 }
          }
          transition={{ delay: 0.8, duration: 0.8, ease: "backOut" }}
          className="mb-2 font-serif text-3xl italic text-[#c4a484] sm:text-4xl"
        >
          &
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 25, filter: "blur(8px)" }}
          animate={
            mounted && !exiting
              ? { opacity: 1, y: 0, filter: "blur(0px)" }
              : { opacity: 0, y: -10 }
          }
          transition={{ delay: 0.7, duration: 1.1, ease: easeSmooth }}
          className="mb-12 max-w-2xl font-serif text-4xl leading-tight text-[#fdfbf7] sm:text-5xl md:text-6xl"
        >
          {bride}
        </motion.h1>

        {/* Unlock Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={
            mounted && !exiting
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: -10, scale: 0.9 }
          }
          transition={{
            delay: 1,
            duration: 1,
            ease: easeSmooth,
          }}
          onClick={handleClick}
          disabled={exiting}
          className="btn-primary relative overflow-hidden rounded-full px-12 py-5"
          whileHover={!exiting ? { scale: 1.03 } : {}}
          whileTap={!exiting ? { scale: 0.97 } : {}}
        >
          {/* Pulsing rings */}
          <motion.span
            variants={pulseRingVariants}
            initial="initial"
            animate="animate"
            className="absolute inset-0 rounded-full border border-[#c4a484]/50"
          />
          <motion.span
            variants={secondRingVariants}
            initial="initial"
            animate="animate"
            className="absolute inset-0 rounded-full border border-[#c4a484]/50"
          />

          <span className="relative z-10 flex items-center gap-4 font-sans text-sm uppercase tracking-[0.25em] text-[#fdfbf7]">
            {/* Animated dot */}
            <motion.span
              className="h-2 w-2 rounded-full bg-[#c4a484]"
              animate={{
                opacity: [0.5, 1, 0.5],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <span className="whitespace-nowrap">Chạm để mở</span>
            <motion.span
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-[#c4a484]"
            >
              →
            </motion.span>
          </span>
        </motion.button>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 0.4 } : { opacity: 0 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 font-sans text-[9px] uppercase tracking-[0.4em] text-[#fdfbf7]/40 sm:text-[10px]"
        >
          27 · 12 · 2026
        </motion.p>
      </motion.div>
    </div>
  );
}
