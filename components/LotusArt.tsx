"use client";

import { motion } from "framer-motion";
import { ease } from "./animation";

/**
 * Section 3 Art — Lotus (SVG)
 * Chủ đề: "Hẹn gặp bạn" — Địa điểm Kênh, Cẩm Bình (sông nước miền Trung)
 */

interface LotusArtProps {
  size?: number;
  theme?: "dark" | "light";
  delay?: number;
  active?: boolean;
}

export default function LotusArt({
  size = 220,
  theme = "dark",
  delay = 0,
  active = true,
}: LotusArtProps) {
  const isDark = theme === "dark";

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size * 0.9 }}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={
        active
          ? { opacity: 1, scale: 1, transition: { duration: 1.2, delay, ease } }
          : { opacity: 0, scale: 0.9, transition: { duration: 0.5 } }
      }
    >
      {/* Glow behind image */}
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ duration: 1.5, delay: delay + 0.3 }}
        style={{
          background: `radial-gradient(circle at center, ${
            isDark ? "rgba(196, 164, 132, 0.15)" : "rgba(74, 53, 37, 0.1)"
          } 0%, transparent 70%)`,
          filter: "blur(24px)",
        }}
      />

      {/* Lotus SVG */}
      <motion.img
        src="/art/lotus.png"
        alt="Lotus"
        className="object-contain"
        style={{
          width: size,
          height: size * 0.8,
          opacity: isDark ? 1 : 0.75,
        }}
        initial={{ opacity: 0, y: 15 }}
        animate={
          active
            ? { opacity: isDark ? 1 : 0.75, y: 0, transition: { duration: 1.0, delay: delay + 0.2, ease } }
            : { opacity: 0 }
        }
      />

      {/* Floating petals overlay — subtle sparkle */}
      <motion.div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 0.4 } : {}}
        transition={{ duration: 2, delay: delay + 0.8 }}
      >
        {[...Array(6)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute inline-block rounded-full"
            style={{
              left: `${15 + i * 14}%`,
              top: `${20 + (i % 3) * 25}%`,
              width: 4,
              height: 4,
              backgroundColor: "#c4a484",
            }}
            animate={
              active
                ? {
                    opacity: [0, 0.6, 0],
                    y: [-5, -20, -5],
                    scale: [0.5, 1, 0.5],
                    transition: { duration: 4, delay: delay + 1 + i * 0.4, repeat: Infinity, ease: "easeInOut" },
                  }
                : {}
            }
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
