"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { charDur, charStag, ease } from "./animation";
import PetalBurst from "./PetalBurst";
import { playChime, playPaperRustle, playWaxThunk } from "./soundscape";
import { createRandom, PARTICLE_SEED } from "@/lib/random";
import { deriveWeWord, nameSegments } from "@/lib/invite";
import {
  WEDDING_DATE_DISPLAY,
  WEDDING_DATE_LUNAR_TEXT,
} from "@/lib/weddingDate";

// =====================================================================
// INTRO SCREEN — "Thiệp cưới" opening
// Giao diện giữ nguyên: eyebrow → tên → con dấu → hint → ngày
// Chuyển động nâng cấp: nếp gấp thiệp, bronze light sweep,
// wax seal "mở" ra, chữ hiện từng ký tự mượt mà.
// =====================================================================

// Lời mời chung — dùng khi khách mở link không có tên
const INTRO_EYEBROW = "We are getting married";
// Lời mời có tên — gộp liền thành 1 câu cho mạch lạc
const INVITE_PREFIX = "Kính mời";
const INVITE_SUFFIX = "tới dự hôn lễ của";

// Timeline (giây)
const T = {
  backdrop: 0, // nền espresso + vignette
  fold: 0.35, // nếp gấp thiệp cưới vẽ dọc
  glow: 0.6, // quầng bronze ở giữa
  eyebrow: 0.9, // "We are getting married"
  names: 1.45, // TÙNG PHẠM & THÚY HẰNG
  seal: 2.55, // con dấu wax bung ra
  hint: 3.5, // "chạm để mở"
  date: 3.9, // ngày
};

// Thời gian mở cửa
const TIMING = {
  doorOpenDuration: 3.6,
  doorOpenDelay: 0.6,
  totalExit: 4.5,
};

const easeSmooth = [0.4, 0, 0.2, 1];

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

// Ambient pulsing ring — báo hiệu có thể nhấn
const outerRingVariants = {
  animate: {
    scale: [1, 1.14, 1],
    opacity: [0.15, 0.32, 0.15],
  },
  transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
};

const sealGlowVariants = {
  animate: {
    scale: [1, 1.08, 1],
    opacity: [0.5, 0.8, 0.5],
  },
  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
};

// =====================================================================
// PARTICLES
// =====================================================================
function IntroParticles() {
  const particles = useMemo(
    () => {
      const random = createRandom(PARTICLE_SEED + 7);
      return Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: random() * 100,
        y: random() * 100,
        size: 1.5 + random() * 3,
        duration: 20 + random() * 24,
        delay: random() * 8,
      }));
    },
    []
  );

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
// =====================================================================
// WAX SEAL BUTTON — con dấu TH (mở ra mượt mà)
// =====================================================================
function WaxSealButton({
  onClick,
  visible,
  interactive,
}: {
  onClick: () => void;
  visible: boolean;
  interactive: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0 }}
      animate={visible ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5, ease }}
      whileHover={interactive && !prefersReducedMotion ? { scale: 1.04 } : undefined}
      whileTap={interactive && !prefersReducedMotion ? { scale: 0.96 } : undefined}
      className="relative flex h-28 w-28 cursor-pointer items-center justify-center rounded-full sm:h-36 sm:w-36"
      aria-label="Mở thiệp mời"
    >
      {/* ═══ Lớp pulse: zoom ra → zoom vào liên tục để gợi ý "nhấn vào" ═══ */}
      <motion.div
        className="relative flex h-full w-full items-center justify-center"
        animate={
          visible && !prefersReducedMotion ? { scale: [1, 1.05, 1] } : { scale: 1 }
        }
        transition={{
          duration: 2.4,
          repeat: visible && !prefersReducedMotion ? Infinity : 0,
          ease: "easeInOut",
        }}
      >
        {/* Vòng sóng nhựa — lan ra như sáp nóng chảy */}
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ border: "1px solid rgba(196, 164, 132, 0.5)" }}
          initial={{ opacity: 0, scale: 0.65 }}
          animate={
            visible
              ? {
                  opacity: [0, 0.6, 0],
                  scale: [0.65, 1.35, 1.7],
                  transition: { duration: 2.4, ease: easeSmooth },
                }
              : { opacity: 0, scale: 0.65 }
          }
        />

        {/* Outer pulsing ring */}
        <motion.span
          variants={outerRingVariants}
          className="absolute inset-0 rounded-full"
          style={{ border: "1px solid rgba(196, 164, 132, 0.4)" }}
        />

        {/* Glow ring */}
        <motion.span
          variants={sealGlowVariants}
          className="absolute inset-0 rounded-full"
          style={{
            background: "transparent",
            boxShadow:
              "0 0 32px 8px rgba(196, 164, 132, 0.25), 0 0 64px 16px rgba(196, 164, 132, 0.1)",
          }}
        />

        {/* Thân con dấu — bung ra + xoay nhẹ như được ấn */}
        <motion.div
          className="relative flex h-full w-full items-center justify-center rounded-full"
          style={{
            background:
              "linear-gradient(145deg, #8b6f47 0%, #6b5235 20%, #4a3525 50%, #3d2a1c 80%, #2d1f15 100%)",
            boxShadow:
              "inset 0 2px 4px rgba(255, 240, 220, 0.12), inset 0 -2px 4px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.5), 0 2px 4px rgba(0, 0, 0, 0.3)",
          }}
          initial={{ scale: 0.55, rotate: -14 }}
          animate={
            visible
              ? { scale: 1, rotate: 0, transition: { duration: 1.1, ease } }
              : { scale: 0.55, rotate: -14 }
          }
        >
          {/* Vòng khắc trong */}
          <div
            className="absolute rounded-full"
            style={{
              inset: 10,
              border: "1.5px solid rgba(196, 164, 132, 0.2)",
              boxShadow:
                "inset 0 1px 3px rgba(0, 0, 0, 0.5), inset 0 -1px 2px rgba(255, 240, 220, 0.06)",
            }}
          />

          {/* Vòng khắc trong 2 */}
          <div
            className="absolute rounded-full"
            style={{
              inset: 16,
              border: "0.75px solid rgba(196, 164, 132, 0.12)",
            }}
          />

          {/* Monogram TH — text thuần Playfair Display, T & H lồng nhẹ */}
          <motion.span
            className="relative z-10 select-none font-[family-name:var(--font-playfair)] text-[2rem] leading-none sm:text-[2.5rem]"
            style={{
              letterSpacing: "-0.04em",
              backgroundImage:
                "linear-gradient(155deg, #f3e3c6 0%, #c4a484 42%, #8b6f47 70%, #eadcbe 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter:
                "drop-shadow(0 1px 1.5px rgba(0,0,0,0.55)) drop-shadow(0 0 7px rgba(196, 164, 132, 0.25))",
            }}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={
              visible
                ? {
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.7, delay: 0.35, ease },
                  }
                : { opacity: 0, scale: 0.7 }
            }
          >
            <span className="italic">T</span>
            <span className="-ml-[0.14em] not-italic">H</span>
          </motion.span>
        </motion.div>
      </motion.div>
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
  /** Tên khách mời — lấy từ query `?to=` */
  guestTo?: string;
  /** Tên người thứ hai — lấy từ query `?to2=` (mời cặp anh chị) */
  guestTo2?: string;
  /** Người gửi lời mời — lấy từ query `?from=` */
  guestFrom?: string;
  /** Cách xưng với khách — lấy từ query `?rel=` (anh/chị/cô/chú/bác/em/bạn) */
  guestRel?: string;
  /** Cách hai vợ chồng tự xưng — lấy từ query `?we=` (chúng mình/chúng em/...) */
  guestWe?: string;
}

export default function IntroScreen({
  onUnlock,
  bride,
  groom,
  guestTo = "",
  guestTo2 = "",
  guestFrom = "",
  guestRel = "",
  guestWe = "",
}: IntroScreenProps) {
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [burst, setBurst] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(timer);
  }, []);

  // Chuông kêu đúng khoảnh khắc tên hiện xong
  useEffect(() => {
    if (!mounted) return;
    const timer = setTimeout(() => playChime(), 2200);
    return () => clearTimeout(timer);
  }, [mounted]);

  const handleClick = () => {
    if (exiting) return;
    setExiting(true);
    setBurst(true);

    // Haptics — rung nhẹ kiểu "chạm sáp"
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate?.([0, 18, 45, 22]);
      } catch {
        /* không hỗ trợ rung */
      }
    }

    // Âm thanh: ấn sáp ngay, tiếng giấy sau 0.35s
    playWaxThunk();
    setTimeout(() => playPaperRustle(1.6), 320);

    setTimeout(() => onUnlock(), TIMING.totalExit * 1000);
  };

  const groomChars = useMemo(() => groom.split(""), [groom]);
  const brideChars = useMemo(() => bride.split(""), [bride]);
  const interactive = mounted && !exiting;

  // Cách hai vợ chồng tự xưng — suy ra từ danh xưng nếu không chỉ định
  const weWord = useMemo(
    () => (guestWe.trim() || deriveWeWord(guestRel)).toLowerCase(),
    [guestWe, guestRel]
  );

  // Nhịp cho ký tự "&" nằm sau tên chú rể
  const ampDelay = T.names + groomChars.length * charStag() + 0.12;
  const brideStart = ampDelay + 0.28;

  return (
    <div className="intro-bg relative h-screen w-full overflow-hidden">
      {/* ============ BACKDROP espresso ============ */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 42%, rgba(92, 67, 44, 0.5) 0%, rgba(45, 31, 21, 0.92) 55%, rgba(22, 14, 9, 1) 100%)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: mounted ? 1 : 0 }}
        transition={{ duration: 1.3, ease: easeSmooth }}
      />

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 38%, rgba(14, 9, 6, 0.78) 100%)",
        }}
      />

      {/* Ambient particles */}
      <IntroParticles />

      {/* ============ NẾP GẤP THIỆP CƯỚI ============ */}
      <motion.div
        className="pointer-events-none absolute top-0 left-1/2 z-[5] w-px -translate-x-1/2"
        style={{
          height: "100%",
          background:
            "linear-gradient(180deg, transparent 0%, rgba(196, 164, 132, 0.1) 14%, rgba(196, 164, 132, 0.5) 50%, rgba(196, 164, 132, 0.1) 86%, transparent 100%)",
          transformOrigin: "top center",
        }}
        initial={{ scaleY: 0, opacity: 0 }}
        animate={
          mounted
            ? {
                scaleY: 1,
                opacity: 1,
                transition: { duration: 1.7, delay: T.fold, ease: easeSmooth },
              }
            : { scaleY: 0, opacity: 0 }
        }
      />

      {/* Ánh sáng lướt dọc theo nếp gấp */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-0 z-[5] h-28 w-px -translate-x-1/2"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(255, 232, 196, 0.95) 50%, transparent 100%)",
          boxShadow: "0 0 14px 3px rgba(255, 226, 180, 0.35)",
        }}
        initial={{ y: "-12%", opacity: 0 }}
        animate={
          mounted
            ? {
                y: ["-12%", "108%"],
                opacity: [0, 1, 0],
                transition: {
                  duration: 2,
                  delay: T.fold + 1.2,
                  repeat: prefersReducedMotion ? 0 : Infinity,
                  repeatDelay: 4,
                  ease: "easeInOut",
                },
              }
            : { opacity: 0 }
        }
      />

      {/* Quầng bronze ở giữa */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 z-[6] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at center, rgba(196, 164, 132, 0.13) 0%, rgba(139, 111, 71, 0.06) 45%, transparent 72%)",
          filter: "blur(10px)",
        }}
        initial={{ opacity: 0, scale: 0.75 }}
        animate={
          mounted
            ? {
                opacity: 1,
                scale: 1,
                transition: { duration: 2.4, delay: T.glow, ease: easeSmooth },
              }
            : { opacity: 0, scale: 0.75 }
        }
      />

      {/* ============ PETAL / GOLD DUST BURST ============ */}
      <PetalBurst active={burst} />

      {/* Background hint — nội dung bên trong lộ ra khi cửa bay */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, #fdfbf7 0%, #f5ebd9 50%, #e8d4b8 100%)",
        }}
        initial={{ opacity: 0 }}
        animate={exiting ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1.5, delay: TIMING.doorOpenDelay + 0.7, ease: easeSmooth }}
      />

      {/* Light beam at door seam */}
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
            ? { opacity: [0, 1, 0.5], scaleX: [0, 1.5, 3] }
            : { opacity: 0, scaleX: 0 }
        }
        transition={{
          duration: TIMING.doorOpenDuration,
          delay: TIMING.doorOpenDelay,
          times: [0, 0.4, 1],
          ease: easeSmooth,
        }}
      />

      {/* ====== TWO PAPER DOORS ====== */}
      <div className="absolute inset-0" style={{ zIndex: 20, pointerEvents: "none" }}>
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

      {/* ====== CENTER CONTENT ====== */}
      <motion.div
        className="absolute inset-0 z-30 flex flex-col items-center justify-center px-8 text-center"
        initial={{ opacity: 0 }}
        animate={mounted && !exiting ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: easeSmooth }}
        style={{ pointerEvents: exiting ? "none" : "auto" }}
      >
        {/* ---------- LỜI MỜI ----------
            Có tên:  "Kính mời Anh <Tên> tới dự hôn lễ của chúng em"
            Cặp:    "Kính mời Anh <Tên 1> & Chị <Tên 2> tới dự hôn lễ của chúng em"
            Không tên: "We are getting married"
        */}
        {guestTo || guestTo2 ? (
          <motion.p
            className="mb-6 max-w-md font-[family-name:var(--font-playfair)] text-lg italic leading-relaxed text-[#fdfbf7]/85 sm:mb-8 sm:text-2xl"
            initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
            animate={
              mounted
                ? {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    transition: { duration: 1.1, delay: T.eyebrow, ease },
                  }
                : { opacity: 0, y: 12, filter: "blur(6px)" }
            }
          >
            {INVITE_PREFIX} {nameSegments(guestTo, guestTo2, guestRel).map((seg, i) => (
              <span
                key={i}
                className={
                  seg.kind === "name"
                    ? "not-italic text-[#c4a484]"
                    : "not-italic text-[#fdfbf7]/85"
                }
              >
                {seg.text}
              </span>
            ))}{" "}
            {INVITE_SUFFIX}{" "}
            <span className="not-italic text-[#fdfbf7]/85">{weWord}</span>
          </motion.p>
        ) : (
          <motion.p
            className="mb-6 font-sans text-[10px] uppercase tracking-[0.5em] text-[#c4a484]/70 sm:mb-8 sm:text-xs"
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={
              mounted
                ? {
                    opacity: 0.7,
                    y: 0,
                    filter: "blur(0px)",
                    transition: { duration: 1, delay: T.eyebrow, ease },
                  }
                : { opacity: 0, y: 10, filter: "blur(4px)" }
            }
          >
            {INTRO_EYEBROW}
          </motion.p>
        )}

        {/* ---------- NAMES ---------- */}
        <motion.div
          className="mb-8 flex flex-col items-center gap-2 sm:mb-12"
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.3, delay: T.names }}
        >
          <span className="flex flex-wrap items-center justify-center">
            {groomChars.map((char, i) => (
              <motion.span
                key={`g-${i}`}
                className="inline-block font-[family-name:var(--font-playfair)] text-4xl font-medium leading-tight text-[#fdfbf7] sm:text-5xl md:text-6xl"
                style={{ letterSpacing: "-0.01em" }}
                initial={{ opacity: 0, y: 26, filter: "blur(6px)" }}
                animate={
                  mounted
                    ? {
                        opacity: 1,
                        y: 0,
                        filter: "blur(0px)",
                        transition: {
                          duration: charDur() * 7,
                          delay: T.names + i * charStag(),
                          ease,
                        },
                      }
                    : { opacity: 0, y: 26, filter: "blur(6px)" }
                }
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </span>

          <motion.span
            className="font-[family-name:var(--font-playfair)] text-2xl italic text-[#c4a484] sm:text-3xl"
            initial={{ opacity: 0, scale: 0.5, filter: "blur(3px)" }}
            animate={
              mounted
                ? {
                    opacity: 1,
                    scale: 1,
                    filter: "blur(0px)",
                    transition: { duration: 0.7, delay: ampDelay, ease },
                  }
                : { opacity: 0, scale: 0.5, filter: "blur(3px)" }
            }
          >
            &
          </motion.span>

          <span className="flex flex-wrap items-center justify-center">
            {brideChars.map((char, i) => (
              <motion.span
                key={`b-${i}`}
                className="inline-block font-[family-name:var(--font-playfair)] text-4xl font-medium leading-tight text-[#fdfbf7] sm:text-5xl md:text-6xl"
                style={{ letterSpacing: "-0.01em" }}
                initial={{ opacity: 0, y: 26, filter: "blur(6px)" }}
                animate={
                  mounted
                    ? {
                        opacity: 1,
                        y: 0,
                        filter: "blur(0px)",
                        transition: {
                          duration: charDur() * 7,
                          delay: brideStart + i * charStag(),
                          ease,
                        },
                      }
                    : { opacity: 0, y: 26, filter: "blur(6px)" }
                }
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </span>
        </motion.div>

        {/* ---------- WAX SEAL ---------- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.3, delay: T.seal }}
        >
          <WaxSealButton
            onClick={handleClick}
            visible={mounted && !exiting}
            interactive={interactive}
          />

          {/* Hint — "chạm để mở" */}
          <motion.p
            initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
            animate={
              mounted
                ? {
                    opacity: 0.45,
                    y: 0,
                    filter: "blur(0px)",
                    transition: { duration: 0.9, delay: T.hint, ease },
                  }
                : { opacity: 0, y: 6, filter: "blur(3px)" }
            }
            className="mt-4 text-center font-sans text-[10px] uppercase tracking-[0.3em] text-[#fdfbf7]/60 sm:text-[11px]"
          >
            Chạm để mở
          </motion.p>
        </motion.div>

        {/* ---------- DATE ----------
            ⚠ ĐÃ TÁCH DÒNG: trước đây gộp "27 · 12 · 2026 · tức
            19.11.2026 âm lịch" trên 1 dòng → dài và rối (2 dấu · liền
            nhau, tự nó đã là dấu ngăn dòng). Nay:
              dòng 1 — ngày dương (sáng hơn)
              dòng 2 — ngày âm lịch (mờ hơn, nhỏ hơn) */}
        <div className="absolute bottom-8 flex flex-col items-center gap-1.5 sm:bottom-10">
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={
              mounted
                ? { opacity: 0.4, y: 0, transition: { duration: 1, delay: T.date, ease } }
                : { opacity: 0, y: 4 }
            }
            className="font-sans text-[9px] uppercase tracking-[0.4em] text-[#fdfbf7]/45 sm:text-[10px]"
          >
            {WEDDING_DATE_DISPLAY}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={
              mounted
                ? {
                    opacity: 0.28,
                    y: 0,
                    transition: { duration: 1, delay: T.date + 0.15, ease },
                  }
                : { opacity: 0, y: 4 }
            }
            className="font-sans text-[9px] uppercase tracking-[0.35em] text-[#fdfbf7]/40 sm:text-[9px]"
          >
            {WEDDING_DATE_LUNAR_TEXT}
          </motion.p>
        </div>

        {/* ---------- NGƯỜI GỬI ---------- */}
        {guestFrom && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={
              mounted
                ? {
                    opacity: 0.45,
                    y: 0,
                    transition: { duration: 1, delay: T.date + 0.15, ease },
                  }
                : { opacity: 0, y: 4 }
            }
            className="absolute bottom-[4.2rem] font-sans text-[9px] uppercase tracking-[0.3em] text-[#c4a484]/70 sm:bottom-[4.5rem] sm:text-[10px]"
          >
            {guestFrom}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
