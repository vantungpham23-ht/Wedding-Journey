"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo, useEffect, useState } from "react";
import { CPS, charDur, charStag, CONTENT_START, ease, easeBack, blockDur } from "./animation";
import WeddingLogo from "./WeddingLogo";
import ShatterLogo from "./ShatterLogo";
import { createRandom, PARTICLE_SEED } from "@/lib/random";
import { deriveWeWord, nameSegments } from "@/lib/invite";
import { WEDDING_DATE_LUNAR_TEXT, WEDDING_DATE_FULL } from "@/lib/weddingDate";
import { COUPLE_NAME } from "@/lib/weddingNames";

// =====================================================================
// REVEAL TIMING — smooth, liên tục, không delay thừa
// =====================================================================
const T0 = CONTENT_START; // 0.5s — section fade-in

// Eyebrow: bắt đầu ngay sau section vào
const T_EYEBROW = T0 + 0.15;             // 0.65s

// Ornament: xuất hiện cùng lúc với eyebrow
const T_MONO = T_EYEBROW;                 // 0.65s

// Date: ngay sau eyebrow + ornament
const DATE = "27·12·2026";
const T_DATE = T_EYEBROW + 0.35;          // 1.0s

// Names: liền sau date
const NAMES_TEXT = COUPLE_NAME;
const T_NAMES = T_DATE + 0.5;             // 1.5s

// Location: liền sau names
const T_LOCATION = T_NAMES + 0.5;          // 2.0s

// Bottom ornament
const T_BOTTOM = T_LOCATION + 0.4;         // 2.4s

// Scroll hint
const T_SCROLL = T_BOTTOM + 0.3;          // 2.7s

// =====================================================================
// SHARED EASING
// =====================================================================
const sharedEase = ease;
const sharedEaseBack = easeBack;

// =====================================================================
// CHAR / MASK VARIANTS — dùng pacing chuẩn CPS
// =====================================================================
const charVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
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
  const random = createRandom(PARTICLE_SEED + 21);
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: random() * 100,
    size: 3 + random() * 5,
    duration: 20 + random() * 30,
    delay: random() * 15,
    drift: -20 + random() * 40,
    type: random() > 0.4 ? "circle" : "leaf",
  }));
}

// =====================================================================
// ITEM ANIM (cho ornament / section wrapper con) — smooth, không blur
// =====================================================================
function itemAnim(active: boolean, delay: number) {
  return {
    initial: { opacity: 0, y: 15 },
    animate: active
      ? { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: sharedEase } }
      : { opacity: 0, y: -10, transition: { duration: 0.3, ease: sharedEase } },
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
  /** Tên khách mời — nhắc lại ở section 1 cho mạch lạc */
  guestTo?: string;
  /** Tên người thứ hai — mời cặp anh chị */
  guestTo2?: string;
  /** Danh xưng với khách: anh/chị/cô/chú/bác/em/bạn */
  guestRel?: string;
  /** Cách hai vợ chồng tự xưng: chúng mình/chúng em/... */
  guestWe?: string;
}

export default function RevealScreen({
  groom,
  bride,
  active = true,
  guestTo = "",
  guestTo2 = "",
  guestRel = "",
  guestWe = "",
}: RevealScreenProps) {
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  // Số lượng particle phụ thuộc viewport → phải đo SAU khi mount,
  // nếu đo lúc render thì server (24) ≠ client (12) → hydration mismatch.
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const particles = useMemo(
    () => generateParticles(isMobile ? 12 : 24),
    [isMobile]
  );

  const groomChars = groom.split("");
  const brideChars = bride.split("");
  const dateChars = DATE.split("");
  const weWord = (guestWe.trim() || deriveWeWord(guestRel)).toLowerCase();

  return (
    <section
      className="reveal-bg relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6 sm:py-20"
      style={{ background: "transparent" }}
    >

      {/* ========== BACKGROUND LAYERS ========== */}
      {/* Không dùng vignette/ellipse ở đây — gradient toả tạo vùng tối
          lệch góc, phá vỡ sự đồng bộ của nền giữa các section. */}

      {/* Floating particles — CSS keyframes (0 JS/frame) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {particles.map((p, i) => (
          <span
            key={p.id}
            className={`reveal-particle ${p.type === "leaf" ? "leaf-particle" : ""}`}
            style={{
              left: `${p.x}%`,
              width: p.size,
              height: p.size,
              ["--drift" as string]: `${p.drift}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay + (i % 5) * 0.3}s`,
            }}
          />
        ))}
      </div>

      {/* Glow behind content — CSS keyframes */}
      <div
        className="date-glow pointer-events-none absolute left-1/2 top-1/2 h-[60vh] w-[60vw] -translate-x-1/2 -translate-y-1/2"
        style={{
          animation: active
            ? "dateGlow 14s ease-in-out infinite"
            : "none",
          opacity: active ? 0.6 : 0,
        }}
      />

      {/* Top light rays — gradient tĩnh, không blur (blur gây vệt sáng lệch) */}
      <motion.div
        className="pointer-events-none absolute top-0 left-1/2 h-[40vh] w-[100vw] -translate-x-1/2"
        style={{ background: "linear-gradient(180deg, rgba(255, 240, 220, 0.06) 0%, transparent 100%)" }}
        {...(active
          ? { animate: { opacity: 1, y: 0 }, transition: { duration: 2, delay: T_EYEBROW, ease: sharedEase } }
          : { animate: { opacity: 0 }, transition: { duration: 1 } }
        )}
      />

      {/* Floating bokeh — CSS keyframes
          Vị trí phân bố ĐỐI XỨNG (trái↔phải, trên↔dưới) để không tạo
          vùng sáng lệch góc. Trước đây 3 bokeh lệch hết sang phải-dưới
          → nền bị 1 vệt sáng ở góc dưới-phải, không đồng bộ. */}
      {[
        { left: "18%", top: "22%" },
        { left: "82%", top: "22%" },
        { left: "50%", top: "76%" },
      ].map((pos, i) => (
        <div
          key={`bokeh-${i}`}
          className="pointer-events-none absolute"
          style={{
            left: pos.left,
            top: pos.top,
            width: 60 + i * 20,
            height: 60 + i * 20,
            background: "radial-gradient(circle, rgba(196, 164, 132, 0.12) 0%, transparent 70%)",
            borderRadius: "50%",
            filter: "blur(20px)",
            animation: active
              ? `bokehFloat ${16 + i * 4}s ease-in-out ${i * 1.6}s infinite`
              : "none",
            opacity: active ? 0.35 : 0,
          }}
        />
      ))}

      <style>{`
        @keyframes dateGlow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.8; }
        }
        @keyframes bokehFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-30px) scale(1.2); opacity: 0.6; }
        }
        @keyframes revealParticle {
          0% { transform: translate3d(0, 100vh, 0) rotate(0deg) scale(0.8); opacity: 0; }
          12% { opacity: 0.7; }
          50% { opacity: 0.5; }
          100% { transform: translate3d(var(--drift, 0px), -20vh, 0) rotate(360deg) scale(0.9); opacity: 0; }
        }
      `}</style>

      {/* ========== MAIN CONTENT ========== */}
      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center text-center">

        {/* --- WEDDING LOGO ---
            Narrative 2 tầng:
              1. ShatterLogo: 40 mảnh vỡ bay từ NGOÀI màn hình vào → lắp khớp
              2. WeddingLogo: nét chính vẽ tay (pathLength) đè lên, mảnh vụn tan
                 → cảm giác "logo được tinh lọc từ những mảnh vỡ".
            Cả 2 cùng tồn tại → giữ đúng ý bạn: giữ logo, thêm chuyển động. */}
        <motion.div
          {...itemAnim(active, T_EYEBROW)}
          className="relative mb-6 h-[240px] w-[240px] sm:mb-10 sm:h-[280px] sm:w-[280px]"
        >
          {/* Lớp 1 — mảnh vỡ bay vào (bên dưới) */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={
              active
                ? {
                    opacity: [0, 1, 1, 0],
                    transition: {
                      duration: 2.5,
                      times: [0, 0.08, 0.55, 1],
                      delay: T_EYEBROW - 0.1,
                      ease: "linear",
                    },
                  }
                : { opacity: 0, transition: { duration: 0.25 } }
            }
          >
            <ShatterLogo active={active} delay={T_EYEBROW - 0.1} />
          </motion.div>

          {/* Lớp 2 — nét chính vẽ tay (bên trên) */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={
              active
                ? {
                    opacity: 1,
                    transition: { duration: 0.5, delay: T_EYEBROW + 0.7 },
                  }
                : { opacity: 0, transition: { duration: 0.25 } }
            }
          >
            <WeddingLogo
              size={280}
              active={active}
              delay={T_EYEBROW + 0.75}
              className="!h-full !w-full"
            />
          </motion.div>
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

        {/* --- Ngày âm lịch (19.11.2026) --- */}
        <motion.p
          className="mt-3 font-sans text-[11px] uppercase tracking-[0.25em] text-[#4a3525]/55 sm:mt-4 sm:text-xs"
          initial={{ opacity: 0, y: 8 }}
          animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
          transition={{ duration: 0.9, delay: T_DATE + 0.75, ease: sharedEase }}
        >
          {WEDDING_DATE_LUNAR_TEXT}
        </motion.p>

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
            {WEDDING_DATE_FULL} ({WEDDING_DATE_LUNAR_TEXT})
          </motion.p>

          {/* Nhắc lại lời mời — "Kính mời ... tới dự hôn lễ của ..."
              (trước đây là "cùng chúng em" — nghe cụt, không có nghĩa) */}
          {(guestTo || guestTo2) && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={active ? { opacity: 1, y: 0 } : { opacity: 0 }}
              transition={{ duration: 0.7, delay: T_LOCATION - 0.2, ease: sharedEase }}
              className="mt-5 font-[family-name:var(--font-playfair)] text-base italic text-[#4a3525]/60 sm:mt-7 sm:text-lg"
            >
              Trân trọng mời{" "}
              {nameSegments(guestTo, guestTo2, guestRel).map((seg, i) => (
                <span
                  key={i}
                  className={seg.kind === "name" ? "not-italic" : undefined}
                >
                  {seg.text}
                </span>
              ))}{" "}
              tới dự hôn lễ của {weWord}
            </motion.p>
          )}

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
