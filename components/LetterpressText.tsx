"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";
import { SECTION_SIG } from "./animation";
import { createRandom, PARTICLE_SEED } from "@/lib/random";

/**
 * LetterpressText — Section 1 signature.
 *
 * Ý tưởng: chữ được "DẬP" xuống từ trên như con dấu triện.
 * Mỗi chữ rơi từ trên xuống, chạm mặt giấy → BỊ BẸP (scaleY xuống,
 * scaleX nở ra) như in mực, rồi nảy lại nhẹ và đứng yên.
 *
 * ── VÌ SAO KHÔNG DÙNG filter/blur ──
 * Hiệu ứng "dập nổ" được tạo bằng `scaleY/scaleX` + `textShadow` tĩnh.
 * Animate `blur()` sẽ ép repaint mỗi frame → lag rõ rệt trên mobile.
 *
 * ── NHỊP ──
 * Chữ rơi lệch pha (stagger nhỏ), chạm đất lệch nhịp → nhìn như
 * "nhiều con dấu đóng xuống cùng lúc" chứ không phải typewriter.
 */

interface LetterpressTextProps {
  text: string;
  active: boolean;
  delay?: number;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
  /** Bật/tắt vệt mực bắn ra khi chữ chạm */
  ink?: boolean;
}

interface InkDrop {
  id: number;
  x: number;
  y: number;
  size: number;
  dx: number;
  dy: number;
  delay: number;
}

export default function LetterpressText({
  text,
  active,
  delay = 0,
  className = "",
  as: Tag = "p",
  ink = true,
}: LetterpressTextProps) {
  const reduced = useReducedMotion();

  // Tách chữ, giữ khoảng trắng
  const chars = useMemo(() => text.split(""), [text]);

  // Vệt mực bắn ra — vị trí seed cố định để SSR/client khớp
  const drops = useMemo<InkDrop[]>(() => {
    const rnd = createRandom(PARTICLE_SEED + 222);
    return Array.from({ length: 12 }, (_, i) => {
      const ang = rnd() * Math.PI * 2;
      const dist = 14 + rnd() * 30;
      return {
        id: i,
        x: rnd() * 100,
        y: rnd() * 100,
        size: 1 + rnd() * 2.4,
        dx: Math.cos(ang) * dist,
        dy: Math.sin(ang) * dist,
        delay: rnd() * 0.4,
      };
    });
  }, []);

  if (reduced) {
    return (
      <Tag className={className}>
        {text}
      </Tag>
    );
  }

  return (
    <Tag className={`relative ${className}`}>
      {/* Vệt mực bắn ra khi chữ chạm mặt giấy */}
      {ink &&
        drops.map((d) => (
          <motion.span
            key={`ink-${d.id}`}
            className="pointer-events-none absolute rounded-full bg-[#c4a484]"
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: d.size,
              height: d.size,
            }}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={
              active
                ? {
                    x: d.dx,
                    y: d.dy,
                    scale: [0, 1, 0.2],
                    opacity: [0, 0.85, 0],
                    transition: {
                      duration: 0.75,
                      delay: delay + 0.35 + d.delay,
                      ease: "easeOut",
                    },
                  }
                : { x: 0, y: 0, scale: 0, opacity: 0 }
            }
          />
        ))}

      <span className="inline-block" style={{ perspective: "600px" }}>
        {chars.map((char, i) => {
          const isSpace = char === " ";
          // Chạm đất lệch nhịp nhẹ để có cảm giác "dập", không phải "gõ"
          const slam = delay + i * SECTION_SIG.letterpress.stagger;

          return (
            <motion.span
              key={`${char}-${i}`}
              className="inline-block"
              style={{
                whiteSpace: isSpace ? "pre" : "normal",
                transformOrigin: "50% 100%",
              }}
              initial={{
                y: "-0.9em",
                opacity: 0,
                scaleY: 1.5,
                scaleX: 0.7,
                rotateX: -50,
              }}
              animate={
                active
                  ? {
                      // keyframes: rơi → BỊ DẸP khi chạm → nảy lại
                      y: ["-0.9em", "0.06em", "0em", "-0.02em", "0em"],
                      opacity: [0, 1, 1, 1, 1],
                      scaleY: [1.5, 1, 0.76, 1.06, 1],
                      scaleX: [0.7, 1, 1.14, 0.98, 1],
                      rotateX: [-50, 0, 0, 0, 0],
                      transition: {
                        duration: 0.82,
                        delay: slam,
                        times: [0, 0.52, 0.68, 0.84, 1],
                        ease: SECTION_SIG.letterpress.ease,
                      },
                    }
                  : {
                      y: "-0.5em",
                      opacity: 0,
                      scaleY: 1.2,
                      scaleX: 0.9,
                      rotateX: -30,
                      transition: {
                        duration: 0.3,
                        delay: i * 0.012,
                        ease: "easeIn",
                      },
                    }
              }
            >
              {isSpace ? "\u00A0" : char}
            </motion.span>
          );
        })}
      </span>
    </Tag>
  );
}
