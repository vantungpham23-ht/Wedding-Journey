"use client";

import { motion } from "framer-motion";
import { ease } from "./animation";

/**
 * Bầu trời tinh tú — Aries (Bạch Dương) & Virgo (Xử Nữ)
 *
 * Tùng: 22/03/1999 → Aries
 * Hằng: 23/09/1999 → Virgo
 *
 * Layout: vòng tròn, Aries trái ↔ Virgo phải, đường nối giữa
 *
 * SVG icons: vẽ tay, không dùng emoji/text symbol
 */

// =====================================================================
// ARIA ICON — đầu cừu stylized (SVG path)
// =====================================================================
// Hình: 2 sừng cong + mặt tròn nhỏ + 2 mắt
const ARIA_ICON_PATH = (
  <svg viewBox="0 0 60 50" fill="none" className="w-full h-full opacity-30">
    {/* Left horn */}
    <path
      d="M 18 28 Q 10 18 8 8 Q 14 14 20 22"
      stroke="#c4a484"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Right horn */}
    <path
      d="M 42 28 Q 50 18 52 8 Q 46 14 40 22"
      stroke="#c4a484"
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Face / body of ram */}
    <ellipse cx="30" cy="32" rx="14" ry="11" stroke="#c4a484" strokeWidth="1.3" fill="none" />
    {/* Left eye */}
    <circle cx="24" cy="29" r="2.2" fill="#c4a484" />
    {/* Right eye */}
    <circle cx="36" cy="29" r="2.2" fill="#c4a484" />
    {/* Snout */}
    <path d="M 26 37 Q 30 40 34 37" stroke="#c4a484" strokeWidth="1" strokeLinecap="round" fill="none" />
    {/* Ear left */}
    <path d="M 16 30 Q 12 28 13 34" stroke="#c4a484" strokeWidth="1" strokeLinecap="round" fill="none" />
    {/* Ear right */}
    <path d="M 44 30 Q 48 28 47 34" stroke="#c4a484" strokeWidth="1" strokeLinecap="round" fill="none" />
  </svg>
);

// =====================================================================
// VIRGO ICON — thiên nữ holding spike/spica (SVG path)
// =====================================================================
// Hình: đầu tròn + thân/váy xòe + đuốc/spica trên tay phải
const VIRGO_ICON_PATH = (
  <svg viewBox="0 0 60 50" fill="none" className="w-full h-full">
    {/* Head */}
    <circle cx="30" cy="12" r="8" stroke="#c4a484" strokeWidth="1.3" fill="none" />
    {/* Hair */}
    <path d="M 22 8 Q 20 2 26 3 Q 30 1 34 3 Q 40 2 38 8" stroke="#c4a484" strokeWidth="1" strokeLinecap="round" fill="none" />
    {/* Crown / spike base */}
    <circle cx="30" cy="3" r="1.8" fill="#c4a484" />
    {/* Spica (wheat/star) on top */}
    <path d="M 30 3 L 30 12" stroke="#c4a484" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M 26 6 L 30 3 L 34 6" stroke="#c4a484" strokeWidth="1" strokeLinecap="round" fill="none" />
    <path d="M 27 8 L 30 5 L 33 8" stroke="#c4a484" strokeWidth="0.8" strokeLinecap="round" fill="none" />
    {/* Body */}
    <path d="M 30 20 L 30 30" stroke="#c4a484" strokeWidth="1.2" strokeLinecap="round" />
    {/* Left arm */}
    <path d="M 30 23 Q 22 26 18 24" stroke="#c4a484" strokeWidth="1.1" strokeLinecap="round" fill="none" />
    {/* Right arm holding spica */}
    <path d="M 30 23 Q 38 26 42 22" stroke="#c4a484" strokeWidth="1.1" strokeLinecap="round" fill="none" />
    {/* Robe / dress */}
    <path d="M 24 28 Q 22 36 18 40" stroke="#c4a484" strokeWidth="1" strokeLinecap="round" fill="none" />
    <path d="M 36 28 Q 38 36 42 40" stroke="#c4a484" strokeWidth="1" strokeLinecap="round" fill="none" />
    <path d="M 18 40 Q 30 44 42 40" stroke="#c4a484" strokeWidth="0.8" strokeLinecap="round" fill="none" />
    {/* Belt */}
    <path d="M 24 30 Q 30 32 36 30" stroke="#c4a484" strokeWidth="0.8" strokeLinecap="round" fill="none" />
  </svg>
);

// =====================================================================
// STAR GENERATION — deterministic PRNG (Mulberry32)
// =====================================================================
function mulberry32(seed: number) {
  return () => {
    let s = seed;
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateBgStars(count: number, seed: number) {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => ({
    id: `bg-${i}`,
    cx: rand() * 100,
    cy: rand() * 100,
    r: 0.4 + rand() * 1.1,
  }));
}

// =====================================================================
// CONSTELLATION DATA — Aries & Virgo stars
// =====================================================================
const ARIA_STARS = [
  { id: "a1", cx: 50, cy: 30, r: 2.4 }, // α Hamal — sáng nhất
  { id: "a2", cx: 30, cy: 50, r: 1.6 }, // β Sheratan
  { id: "a3", cx: 70, cy: 50, r: 1.6 }, // γ Mesarthim
  { id: "a4", cx: 50, cy: 70, r: 1.2 }, // δ
];
const ARIA_LINES: [string, string][] = [
  ["a4", "a1"], ["a1", "a2"], ["a1", "a3"],
];

const VIRGO_STARS = [
  { id: "v1", cx: 50, cy: 22, r: 2.4 }, // α Spica
  { id: "v2", cx: 38, cy: 42, r: 1.6 }, // γ
  { id: "v3", cx: 62, cy: 42, r: 1.6 }, // δ
  { id: "v4", cx: 28, cy: 60, r: 1.4 }, // ε Vindemiatrix
  { id: "v5", cx: 50, cy: 60, r: 1.5 }, // ζ
  { id: "v6", cx: 72, cy: 60, r: 1.4 }, // η
  { id: "v7", cx: 50, cy: 78, r: 1.8 }, // chân thiên nữ
];
const VIRGO_LINES: [string, string][] = [
  ["v1", "v2"], ["v1", "v3"],
  ["v2", "v4"], ["v2", "v5"],
  ["v3", "v5"], ["v3", "v6"],
  ["v4", "v7"], ["v5", "v7"], ["v6", "v7"],
];

// =====================================================================
// MAIN COMPONENT
// =====================================================================
interface ConstellationArtProps {
  size?: number;
  theme?: "dark" | "light";
  delay?: number;
  active?: boolean;
  className?: string;
}

export default function ConstellationArt({
  size = 280,
  theme = "dark",
  delay = 0,
  active = true,
  className = "",
}: ConstellationArtProps) {
  const isDark = theme === "dark";
  const starFill = isDark ? "#d4b896" : "#4a3525";
  const starGlow = isDark ? "rgba(196, 164, 132, 0.6)" : "rgba(74, 53, 37, 0.25)";
  const lineColor = isDark ? "rgba(196, 164, 132, 0.5)" : "rgba(74, 53, 37, 0.4)";
  const accentFill = "#c4a484";

  const bgStars = generateBgStars(28, 42);

  const fadeIn = (d: number) => ({
    initial: { opacity: 0 },
    animate: active
      ? { opacity: 1, transition: { duration: 1.0, delay: delay + d, ease } }
      : { opacity: 0 },
  });

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {/* Outer halo glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        {...fadeIn(0)}
        style={{
          background: `radial-gradient(circle at center, ${
            isDark ? "rgba(196, 164, 132, 0.12)" : "rgba(74, 53, 37, 0.08)"
          } 0%, transparent 70%)`,
          filter: "blur(20px)",
        }}
      />

      {/* Outer decorative rings */}
      <motion.svg className="absolute inset-0" viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r="48" fill="none" stroke={lineColor} strokeWidth="0.3" strokeDasharray="0.5 1.5" />
        <circle cx="50" cy="50" r="44" fill="none" stroke={lineColor} strokeWidth="0.15" />
      </motion.svg>

      {/* Background twinkling stars */}
      <motion.svg className="absolute inset-0" viewBox="0 0 100 100" width={size} height={size}>
        {bgStars.map((s, i) => (
          <motion.circle
            key={s.id}
            cx={s.cx} cy={s.cy} r={s.r}
            fill={starFill}
            initial={{ opacity: 0 }}
            animate={
              active
                ? {
                    opacity: [0, 0.7, 0.3, 0.7],
                    transition: {
                      duration: 4 + (i % 5),
                      delay: delay + 0.2 + i * 0.04,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }
                : { opacity: 0 }
            }
          />
        ))}
      </motion.svg>

      {/* Destiny line connecting two zodiacs */}
      <motion.svg className="absolute inset-0" viewBox="0 0 100 100" width={size} height={size}>
        <motion.path
          d="M 25 50 Q 50 35 75 50"
          fill="none"
          stroke={accentFill}
          strokeWidth="0.4"
          strokeLinecap="round"
          strokeDasharray="60 100"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={
            active
              ? {
                  pathLength: 1,
                  opacity: [0, 0.8, 0.5],
                  transition: { duration: 2.0, delay: delay + 0.8, ease: "easeInOut" },
                }
              : { opacity: 0 }
          }
        />
        <motion.circle cx="38" cy="44" r="0.6" fill={accentFill}
          initial={{ opacity: 0, scale: 0 }}
          animate={active ? { opacity: 1, scale: 1, transition: { delay: delay + 1.2, duration: 0.5 } } : {}}
        />
        <motion.circle cx="62" cy="44" r="0.6" fill={accentFill}
          initial={{ opacity: 0, scale: 0 }}
          animate={active ? { opacity: 1, scale: 1, transition: { delay: delay + 1.4, duration: 0.5 } } : {}}
        />
      </motion.svg>

      {/* ========== ARIA — Left ========== */}
      <ConstellationZone
        stars={ARIA_STARS}
        lines={ARIA_LINES}
        cx={25} cy={50} radius={20}
        starFill={starFill} starGlow={starGlow} lineColor={lineColor}
        accentFill={accentFill}
        delay={delay + 0.3} active={active}
        label="Bạch Dương" sublabel="22.03"
        icon={ARIA_ICON_PATH}
        theme={theme}
      />

      {/* ========== VIRGO — Right ========== */}
      <ConstellationZone
        stars={VIRGO_STARS}
        lines={VIRGO_LINES}
        cx={75} cy={50} radius={20}
        starFill={starFill} starGlow={starGlow} lineColor={lineColor}
        accentFill={accentFill}
        delay={delay + 0.6} active={active}
        label="Xử Nữ" sublabel="23.09"
        icon={VIRGO_ICON_PATH}
        theme={theme}
      />

      {/* Center pulsing star */}
      <motion.svg className="absolute inset-0" viewBox="0 0 100 100" width={size} height={size}>
        <motion.circle
          cx="50" cy="50" r="1.4"
          fill={accentFill}
          initial={{ opacity: 0, scale: 0 }}
          animate={
            active
              ? {
                  opacity: [0.6, 1, 0.6],
                  scale: [0.8, 1.4, 0.8],
                  transition: { duration: 3.5, delay: delay + 1.6, repeat: Infinity, ease: "easeInOut" },
                }
              : { opacity: 0 }
          }
          style={{ filter: `drop-shadow(0 0 4px ${accentFill})` }}
        />
      </motion.svg>

      {/* Corner sparkles */}
      <motion.svg className="absolute inset-0 pointer-events-none" viewBox="0 0 100 100" width={size} height={size}>
        {[15, 35, 65, 85].map((x, i) => (
          <motion.path
            key={i}
            d={`M ${x} 12 L ${x + 1.5} 14.5 L ${x} 17 L ${x - 1.5} 14.5 Z`}
            fill={starFill}
            initial={{ opacity: 0, scale: 0 }}
            animate={
              active
                ? {
                    opacity: [0, 0.6, 0],
                    scale: [0, 1, 0],
                    transition: { duration: 3, delay: delay + 1.8 + i * 0.3, repeat: Infinity, ease: "easeInOut" },
                  }
                : { opacity: 0 }
            }
          />
        ))}
      </motion.svg>
    </div>
  );
}

// =====================================================================
// CONSTELLATION ZONE — 1 chòm sao + icon + label
// =====================================================================
function ConstellationZone({
  stars,
  lines,
  cx, cy, radius,
  starFill, starGlow, lineColor, accentFill,
  delay, active,
  label, sublabel,
  icon,
  theme,
}: {
  stars: { id: string; cx: number; cy: number; r: number }[];
  lines: [string, string][];
  cx: number; cy: number; radius: number;
  starFill: string; starGlow: string; lineColor: string; accentFill: string;
  delay: number; active: boolean;
  label: string; sublabel: string;
  icon: React.ReactNode;
  theme: "dark" | "light";
}) {
  const minX = cx - radius;
  const maxX = cx + radius;
  const minY = cy - radius;
  const maxY = cy + radius;
  const w = maxX - minX;
  const h = maxY - minY;
  const starMap = new Map(stars.map(s => [s.id, s]));

  const fadeIn = (d: number) => ({
    initial: { opacity: 0 },
    animate: active
      ? { opacity: 1, transition: { duration: 1.0, delay: delay + d, ease } }
      : { opacity: 0 },
  });

  return (
    <>
      {/* Icon — positioned at bottom of zone */}
      <motion.div
        className="absolute w-6 h-6"
        style={{
          left: `calc(${cx}% - 12px)`,
          top: `calc(${cy}% - 6px)`,
        }}
        {...fadeIn(0.2)}
      >
        {icon}
      </motion.div>

      {/* SVG constellation overlay */}
      <motion.svg
        className="absolute"
        style={{ left: `${minX}%`, top: `${minY}%`, width: `${w}%`, height: `${h}%` }}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        {...fadeIn(0.3)}
      >
        {/* Lines */}
        {lines.map(([from, to], i) => {
          const s1 = starMap.get(from);
          const s2 = starMap.get(to);
          if (!s1 || !s2) return null;
          const sx = ((s1.cx - minX) / w) * 100;
          const sy = ((s1.cy - minY) / h) * 100;
          const ex = ((s2.cx - minX) / w) * 100;
          const ey = ((s2.cy - minY) / h) * 100;
          return (
            <motion.line
              key={`${from}-${to}-${i}`}
              x1={sx} y1={sy} x2={ex} y2={ey}
              stroke={lineColor}
              strokeWidth="0.4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={
                active
                  ? { pathLength: 1, transition: { duration: 0.8, delay: delay + 0.4 + i * 0.08, ease: "easeOut" } }
                  : {}
              }
            />
          );
        })}

        {/* Stars */}
        {stars.map((s, i) => {
          const sx = ((s.cx - minX) / w) * 100;
          const sy = ((s.cy - minY) / h) * 100;
          return (
            <g key={s.id}>
              <motion.circle cx={sx} cy={sy} r={s.r * 2.5} fill={starGlow}
                initial={{ opacity: 0 }}
                animate={
                  active
                    ? { opacity: [0, 0.5, 0.4], transition: { duration: 2.5, delay: delay + 0.5 + i * 0.12, repeat: Infinity, ease: "easeInOut" } }
                    : { opacity: 0 }
                }
              />
              <motion.circle cx={sx} cy={sy} r={s.r} fill={starFill}
                initial={{ opacity: 0, scale: 0 }}
                animate={
                  active
                    ? { opacity: 1, scale: 1, transition: { duration: 0.5, delay: delay + 0.4 + i * 0.12, ease: "easeOut" } }
                    : { opacity: 0 }
                }
                style={{ transformOrigin: `${sx}px ${sy}px`, filter: `drop-shadow(0 0 ${s.r * 1.2}px ${starGlow})` }}
              />
              {s.r >= 1.8 && (
                <motion.circle cx={sx - s.r * 0.3} cy={sy - s.r * 0.3} r={s.r * 0.35} fill="white"
                  initial={{ opacity: 0 }}
                  animate={
                    active
                      ? { opacity: [0, 0.7, 0.5], transition: { duration: 2, delay: delay + 0.7 + i * 0.1, repeat: Infinity, ease: "easeInOut" } }
                      : { opacity: 0 }
                  }
                />
              )}
            </g>
          );
        })}
      </motion.svg>

      {/* Labels */}
      <motion.p
        className="absolute whitespace-nowrap font-sans text-[8px] uppercase tracking-[0.25em] text-[#c4a484]"
        style={{ left: `${cx}%`, top: `${cy + radius + 12}%`, transform: "translateX(-50%)" }}
        {...fadeIn(1.2)}
      >
        {label}
      </motion.p>
      <motion.p
        className="absolute whitespace-nowrap font-serif text-[10px] italic text-[#c4a484]/60"
        style={{ left: `${cx}%`, top: `${cy + radius + 18}%`, transform: "translateX(-50%)" }}
        {...fadeIn(1.3)}
      >
        {sublabel}
      </motion.p>
    </>
  );
}
