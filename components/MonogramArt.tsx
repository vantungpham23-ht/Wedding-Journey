"use client";

import { motion } from "framer-motion";
import { ease } from "./animation";

/**
 * Section 2 Art — TH Monogram (SVG)
 * Chủ đề: "Lời mời" — giới thiệu cặp đôi
 */

interface MonogramArtProps {
  size?: number;
  theme?: "dark" | "light";
  delay?: number;
  active?: boolean;
}

export default function MonogramArt({
  size = 260,
  theme = "dark",
  delay = 0,
  active = true,
}: MonogramArtProps) {
  const isDark = theme === "dark";

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size * 0.85 }}
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
          filter: "blur(30px)",
        }}
      />

      {/* Monogram SVG */}
      <motion.img
        src="/art/th-monogram.png"
        alt="TH Monogram"
        className="object-contain"
        style={{
          width: size * 0.9,
          height: size * 0.75,
          opacity: isDark ? 1 : 0.7,
        }}
        initial={{ opacity: 0, y: 15 }}
        animate={
          active
            ? { opacity: isDark ? 1 : 0.7, y: 0, transition: { duration: 1.0, delay: delay + 0.2, ease } }
            : { opacity: 0 }
        }
      />
    </motion.div>
  );
}
