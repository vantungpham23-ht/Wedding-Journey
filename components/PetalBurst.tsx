"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { createRandom, PARTICLE_SEED } from "@/lib/random";

/**
 * PetalBurst — cánh hoa + hạt vàng bắn ra khoảnh khắc mở thiệp.
 * Dùng chung cho IntroScreen (khi bấm con dấu).
 *
 * Dùng seeded PRNG để server & client render giống nhau (tránh hydration mismatch).
 */

interface PetalBurstProps {
  active: boolean;
  count?: number;
  /** bán kính tối đa (px) */
  spread?: number;
  className?: string;
}

interface Petal {
  id: number;
  angle: number;
  dist: number;
  size: number;
  dur: number;
  delay: number;
  rotate: number;
  drift: number;
  kind: "petal" | "dust";
  opacity: number;
}

export default function PetalBurst({
  active,
  count = 26,
  spread = 46,
  className = "",
}: PetalBurstProps) {
  const petals = useMemo<Petal[]>(() => {
    const random = createRandom(PARTICLE_SEED);
    return Array.from({ length: count }, (_, i) => {
      const isDust = i % 3 === 0;
      const angle = (i / count) * Math.PI * 2 + random() * 0.5;
      return {
        id: i,
        angle,
        dist: spread * (0.45 + random() * 0.75),
        size: isDust ? 2 + random() * 2 : 5 + random() * 7,
        dur: 1.6 + random() * 1.4,
        delay: random() * 0.35,
        rotate: (random() - 0.5) * 540,
        drift: (random() - 0.5) * 90,
        kind: isDust ? "dust" : "petal",
        opacity: isDust ? 0.5 + random() * 0.4 : 0.55 + random() * 0.4,
      };
    });
  }, [count, spread]);

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-40 overflow-hidden ${className}`}
      aria-hidden
    >
      {petals.map((p) => {
        const dx = Math.cos(p.angle) * p.dist;
        const dy = Math.sin(p.angle) * p.dist;
        return (
          <motion.span
            key={p.id}
            className="absolute left-1/2 top-1/2 block"
            style={{
              width: p.size,
              height: p.kind === "petal" ? p.size * 0.62 : p.size,
              marginLeft: -p.size / 2,
              marginTop: -(p.size * 0.62) / 2,
              borderRadius: p.kind === "petal" ? "60% 12% 60% 12%" : "50%",
              background:
                p.kind === "petal"
                  ? "linear-gradient(135deg, #f6e6d2 0%, #e8c9a6 55%, #c4a484 100%)"
                  : "#f4dfbe",
              boxShadow:
                p.kind === "dust"
                  ? "0 0 6px 1px rgba(244, 223, 190, 0.7)"
                  : "0 1px 3px rgba(120, 80, 50, 0.25)",
              opacity: p.opacity,
              filter: p.kind === "petal" ? "blur(0.2px)" : "blur(0.4px)",
            }}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.2, rotate: 0 }}
            animate={
              active
                ? {
                    opacity: [0, p.opacity, p.opacity, 0],
                    x: [0, dx * 0.45, dx + p.drift * 0.4, dx + p.drift],
                    y: [0, dy * 0.45, dy + 40, dy + 110],
                    scale: [0.2, 1.1, 1, 0.55],
                    rotate: [0, p.rotate * 0.4, p.rotate, p.rotate + 160],
                    transition: {
                      duration: p.dur,
                      delay: p.delay,
                      ease: [0.15, 0.6, 0.35, 1],
                    },
                  }
                : { opacity: 0, x: 0, y: 0, scale: 0.2, rotate: 0 }
            }
          />
        );
      })}
    </div>
  );
}
