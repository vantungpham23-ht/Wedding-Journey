"use client";

import { motion, useReducedMotion } from "framer-motion";

// =====================================================================
// PACING CONSTANTS — tốc độ đọc duy nhất (≈14 chars/sec)
// Dùng xuyên suốt: Intro, RevealScreen, DetailsScreen
// =====================================================================
export const CPS = 22; // characters per second — nhanh hơn, vẫn đọc được

/** Duration mỗi ký tự: 1/CPS giây */
export const charDur = () => 1 / CPS; // ≈ 0.071s

/** Stagger giữa ký tự — chồng 50%: ký tự sau bắt đầu khi trước đang nửa đường */
export const charStag = () => 0.5 / CPS; // ≈ 0.036s

/** Stagger giữa dòng — ~8× charStagger */
export const lineStag = () => 4 / CPS; // ≈ 0.286s

/** Thời gian để 1 block text hoàn tất (từ ký tự đầu đến ký tự cuối ổn định) */
export function blockDur(text: string) {
  return text.length * charStag() + charDur();
}

/** Delay chuẩn để content block bắt đầu sau khi Section wrapper vào */
export const CONTENT_START = 0.5; // Section fade-in ≈ 0.5s

/** Khoảng trống nhẹ giữa các block liên tiếp */
export const BLOCK_GAP = 0.1;

const ease = [0.16, 1, 0.3, 1];   // Cinematic ease
const easeBack = [0.34, 1.56, 0.64, 1]; // Back out — bounce nhẹ
export { ease, easeBack };

// =====================================================================
// REUSABLE ANIMATION HELPERS
// =====================================================================

/** Fade + Blur: dùng cho eyebrow, label, tagline ngắn */
export function fadeBlurProps(active: boolean, delay = 0, dur = 0.5) {
  return {
    initial: { opacity: 0, y: 12, filter: "blur(6px)" },
    animate: active
      ? { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: dur, delay, ease } }
      : { opacity: 0, y: -8, filter: "blur(4px)", transition: { duration: dur * 0.6, ease } },
  };
}

/** Block animation: dùng cho ornament, divider xuất hiện */
export function blockAnim(active: boolean, delay = 0, dur = 0.8) {
  return {
    initial: { opacity: 0, scale: 0.8 },
    animate: active
      ? { opacity: 1, scale: 1, transition: { duration: dur, delay, ease } }
      : { opacity: 0, scale: 0.9, transition: { duration: dur * 0.5, ease } },
  };
}

/** Stagger grid cho nhiều child items */
export function staggerChildren(itemDelay = 0.2, stagger = 0.15) {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren: itemDelay } },
  };
}
