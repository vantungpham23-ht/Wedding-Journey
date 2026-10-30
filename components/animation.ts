"use client";

import { motion, useReducedMotion } from "framer-motion";

// =====================================================================
// PACING CONSTANTS — tốc độ đọc duy nhất (≈14 chars/sec)
// Dùng xuyên suốt: Intro, RevealScreen, DetailsScreen
// =====================================================================
export const CPS = 22; // characters per second — nhanh hơn, vẫn đọc được

/** Duration mỗi ký tự: 1/CPS giây */
export const charDur = () => 1 / CPS; // ≈ 0.071s

/** Stagger giữa ký tự — nhanh hơn cho smooth feel */
export const charStag = () => 0.3 / CPS; // ≈ 0.027s

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
/** Chậm ở đầu → nhanh ở cuối (SHATTER, FLY-IN) */
const easeSlowFast = [0.62, 0.02, 0.2, 1];
/** Nhanh ở đầu → chậm ở cuối (LETTERPRESS) */
const easeFastSlow = [0.32, 0, 0.18, 1];
export { ease, easeBack, easeSlowFast, easeFastSlow };

// =====================================================================
// SIGNATURE TỪNG SECTION — gom 1 chỗ để chỉnh nhịp cho cả web
// =====================================================================
export const SECTION_SIG = {
  /** S0 — logo vỡ thành mảnh, bay từ ngoài vào */
  shatter: { stagger: 0.028, ease: easeSlowFast },
  /** S1 — chữ dập nổ, tách đôi rồi khép lại */
  letterpress: { stagger: 0.05, ease: easeFastSlow },
  /** S2 — hoa sen nở từ tâm, section sáng dần */
  bloom: { stagger: 0.11, ease: easeBack },
  /** S3 — nhẫn bay tới từ xa, đồng hồ lật cơ */
  flyIn: { stagger: 0.18, ease: easeSlowFast },
} as const;

// =====================================================================
// REUSABLE ANIMATION HELPERS
// =====================================================================

/** Fade + Slide: dùng cho eyebrow, label, tagline ngắn — smooth không blur */
export function fadeBlurProps(active: boolean, delay = 0, dur = 0.4) {
  return {
    initial: { opacity: 0, y: 10 },
    animate: active
      ? { opacity: 1, y: 0, transition: { duration: dur, delay, ease } }
      : { opacity: 0, y: -6, transition: { duration: dur * 0.4, ease } },
  };
}

/** Item animation: smooth fade + slide, không blur */
export function itemAnim(active: boolean, delay = 0, dur = 0.6) {
  return {
    initial: { opacity: 0, y: 15 },
    animate: active
      ? { opacity: 1, y: 0, transition: { duration: dur, delay, ease } }
      : { opacity: 0, y: -10, transition: { duration: dur * 0.5, ease } },
  };
}

/** Stagger grid cho nhiều child items */
export function staggerChildren(itemDelay = 0.2, stagger = 0.15) {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren: itemDelay } },
  };
}
