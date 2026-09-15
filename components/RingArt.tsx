"use client";

import { motion } from "framer-motion";
import { ease, easeBack } from "./animation";

/**
 * Section 4 Art — 2 Wedding Rings với infinity
 * Chủ đề: "Countdown + RSVP" — Kết hợp, vĩnh cửu
 * Style: 2 nhẫn cưới đan xen, dấu vô cực, sparkles
 */

interface RingArtProps {
  size?: number;
  theme?: "dark" | "light";
  delay?: number;
  active?: boolean;
}

export default function RingArt({
  size = 180,
  theme = "dark",
  delay = 0,
  active = true,
}: RingArtProps) {
  const isDark = theme === "dark";
  const ringColor = isDark ? "#fdfbf7" : "#4a3525";
  const accentColor = "#c4a484";
  const glowColor = isDark ? "rgba(196, 164, 132, 0.3)" : "rgba(74, 53, 37, 0.2)";

  const fadeIn = (d: number) => ({
    initial: { opacity: 0 },
    animate: active
      ? { opacity: 1, transition: { duration: 1.0, delay: delay + d, ease } }
      : { opacity: 0 },
  });

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow halo */}
      <motion.div
        className="absolute inset-0 rounded-full"
        {...fadeIn(0)}
        style={{
          background: `radial-gradient(circle at center, ${
            isDark ? "rgba(196, 164, 132, 0.15)" : "rgba(74, 53, 37, 0.1)"
          } 0%, transparent 70%)`,
          filter: "blur(20px)",
        }}
      />

      {/* Outer decorative ring */}
      <svg className="absolute inset-0" viewBox="0 0 100 100" width={size} height={size}
        preserveAspectRatio="xMidYMid meet">
        <circle cx="50" cy="50" r="46" fill="none" stroke={glowColor} strokeWidth="0.3" strokeDasharray="0.5 2" />
        <circle cx="50" cy="50" r="42" fill="none" stroke={glowColor} strokeWidth="0.15" />
      </svg>

      {/* Main rings SVG */}
      <motion.svg className="absolute inset-0" viewBox="0 0 100 100" width={size} height={size}
        preserveAspectRatio="xMidYMid meet">

        {/* Left ring — T (gold band) */}
        <motion.circle
          cx="42" cy="50" r="18"
          fill="none"
          stroke={accentColor}
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={
            active
              ? {
                  opacity: [0, 1, 0.8],
                  pathLength: 1,
                  transition: { duration: 1.5, delay: delay + 0.3, ease: "easeInOut" },
                }
              : { opacity: 0 }
          }
        />
        {/* T stone */}
        <motion.circle
          cx="42" cy="32" r="3.5"
          fill={isDark ? "#fdfbf7" : "#4a3525"}
          initial={{ opacity: 0, scale: 0 }}
          animate={
            active
              ? {
                  opacity: [0, 1, 0.9],
                  scale: [0, 1.1, 1],
                  transition: { duration: 0.7, delay: delay + 1.0, ease: "easeOut" },
                }
              : { opacity: 0 }
          }
          style={{ transformOrigin: "42px 32px" }}
        />

        {/* Right ring — H (gold band) */}
        <motion.circle
          cx="58" cy="50" r="18"
          fill="none"
          stroke={accentColor}
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={
            active
              ? {
                  opacity: [0, 1, 0.8],
                  pathLength: 1,
                  transition: { duration: 1.5, delay: delay + 0.5, ease: "easeInOut" },
                }
              : { opacity: 0 }
          }
        />
        {/* H stone */}
        <motion.circle
          cx="58" cy="32" r="3.5"
          fill={isDark ? "#fdfbf7" : "#4a3525"}
          initial={{ opacity: 0, scale: 0 }}
          animate={
            active
              ? {
                  opacity: [0, 1, 0.9],
                  scale: [0, 1.1, 1],
                  transition: { duration: 0.7, delay: delay + 1.2, ease: "easeOut" },
                }
              : { opacity: 0 }
          }
          style={{ transformOrigin: "58px 32px" }}
        />

        {/* Infinity / love path connecting the two rings */}
        <motion.path
          d="M 42 50 Q 30 35 42 28 Q 50 24 58 28 Q 70 35 58 50"
          fill="none"
          stroke={accentColor}
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeDasharray="40 100"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={
            active
              ? {
                  opacity: [0, 0.6, 0.4],
                  pathLength: 1,
                  transition: { duration: 2.0, delay: delay + 0.8, ease: "easeInOut" },
                }
              : { opacity: 0 }
          }
        />

        {/* Heart at intersection */}
        <motion.path
          d="M 50 32 C 50 29 47 27 47 29 C 47 27 44 29 44 32 C 44 35 50 39 50 39 C 50 39 56 35 56 32 C 56 29 53 27 53 29 C 53 27 50 29 50 32"
          fill={accentColor}
          initial={{ opacity: 0, scale: 0 }}
          animate={
            active
              ? {
                  opacity: [0, 0.9, 0.6],
                  scale: [0, 1.2, 1],
                  transition: { duration: 0.8, delay: delay + 1.4, ease: easeBack },
                }
              : { opacity: 0 }
          }
          style={{ transformOrigin: "50px 33px" }}
        />
      </motion.svg>

      {/* Sparkles around rings */}
      <motion.svg className="absolute inset-0 pointer-events-none" viewBox="0 0 100 100" width={size} height={size}>
        {[
          { x: 30, y: 22, delay: 0.1 },
          { x: 70, y: 22, delay: 0.3 },
          { x: 22, y: 50, delay: 0.5 },
          { x: 78, y: 50, delay: 0.7 },
          { x: 35, y: 78, delay: 0.9 },
          { x: 65, y: 78, delay: 1.1 },
        ].map((s, i) => (
          <motion.path
            key={i}
            d={`M ${s.x} ${s.y - 2} L ${s.x + 1} ${s.y} L ${s.x} ${s.y + 2} L ${s.x - 1} ${s.y} Z`}
            fill={accentColor}
            initial={{ opacity: 0, scale: 0 }}
            animate={
              active
                ? {
                    opacity: [0, 0.8, 0],
                    scale: [0, 1, 0],
                    transition: { duration: 2.5, delay: delay + 1.5 + s.delay, repeat: Infinity, ease: "easeInOut" },
                  }
                : {}
            }
          />
        ))}
      </motion.svg>

      {/* Pulsing center glow */}
      <svg className="absolute inset-0" viewBox="0 0 100 100" width={size} height={size}>
        <motion.circle
          cx="50" cy="50" r="8"
          fill={accentColor}
          opacity="0.15"
          animate={
            active
              ? {
                  opacity: [0.1, 0.25, 0.1],
                  scale: [1, 1.3, 1],
                  transition: { duration: 3, delay: delay + 1.6, repeat: Infinity, ease: "easeInOut" },
                }
              : {}
          }
          style={{ transformOrigin: "50px 50px" }}
        />
      </svg>

      {/* "27.12" label below */}
      <motion.p
        className="absolute bottom-[6%] left-1/2 -translate-x-1/2 font-[family-name:var(--font-playfair)] italic"
        style={{
          fontSize: size * 0.09,
          color: accentColor,
          lineHeight: 1,
          opacity: 0.8,
        }}
        initial={{ opacity: 0, y: 5 }}
        animate={
          active
            ? { opacity: 0.8, y: 0, transition: { duration: 0.8, delay: delay + 1.0, ease } }
            : { opacity: 0 }
        }
      >
        27·12
      </motion.p>
    </div>
  );
}
