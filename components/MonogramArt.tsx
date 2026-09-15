"use client";

import { motion } from "framer-motion";
import { ease } from "./animation";

/**
 * Section 2 Art — TH Monogram (SVG paths animation)
 * Chủ đề: "Lời mời" — giới thiệu cặp đôi
 * 
 * Animation: Paths rơi xuống đuổi nhau, thành hình, sparkles
 */

interface MonogramArtProps {
  size?: number;
  theme?: "dark" | "light";
  delay?: number;
  active?: boolean;
}

export default function MonogramArt({
  size = 120,
  theme = "dark",
  delay = 0,
  active = true,
}: MonogramArtProps) {
  const isDark = theme === "dark";
  const goldColor = "#c4a584";
  const mainColor = isDark ? goldColor : "#c4a584";

  // Paths từ SVG gốc - tách riêng
  const paths = [
    // T letter
    "M602.23,850.83c17.72-13.39,23.11-32.87,23.11-54.38l.05-204.88-237.92-.02.31,76.21c.06,15.81,3.67,30.41,11.16,43.85,16.64,26.5,36.69,31.03,66.75,33.22.47,1.72.46,3.32.01,4.89-33.6.54-65.75-8.44-93.04-27.64-17.4-12.24-31.42-27.32-40.61-46.51-8.16-17.72-11.12-36.04-11.48-55.83l-.08-136.78,66.92-37.47.1,128.98,237.71-.04.5-10.24c24.82,9.05,49.87,12.85,76.25,11.19l.06,35.66.07,183.65,1.66,22.1c6.66,36.54,44.2,51.45,78.74,54.3.33,1.65.46,3.03,0,5.02l-237.46.06c-.6-2.04-.37-3.55-.05-4.93,20.81-1.06,40.37-7.65,57.23-20.39v-.02Z",
    // H letter top
    "M387.44,263.89c-25.19-18.24-51.78-32.97-81.07-43.44l.03-171.43c0-14.49-1.05-27.41-14.48-30.31-9.55-2.07-19.14-2.7-29.13-2.71h-47.95c-19.45-.02-37.74,2.58-56.41,7.42-32.42,8.41-60.75,25.02-83.98,49.05-14.78,15.29-26.77,32.02-35.44,51.51-4.52,10.17-7.79,20.11-11.56,30.56-.7,1.93-5.34,1.52-5.87-.57,2.59-24.1,6.02-46.79,9.88-70.58L44.95,0h612.93l12.21,82.66,8.75,69.41c-1.02,1.25-5.34,1.77-6.65.39-18.5-46.85-43.65-95.08-91.11-116.83-41.97-19.23-82.9-19.93-128.25-19.77-17.03.06-33.34-.39-50.09,1.76-4.83.62-9.35,2.09-12.12,6.02-2.31,4.51-2.57,8.93-3.03,14.46l-.14,225.79h-.01Z",
    // H letter bottom
    "M393.51,876.09l-242.51.12c-.71-1.76-.62-2.91-.37-4.93,24.47-1.71,47.93-11.39,65.84-28.72,9.09-8.8,14.06-20.28,16.71-32.37l2.51-22.57.07-271.33c26.04-6.67,49.98-15.63,74.09-26.83l.04,309.14c1.04,23.64,9.4,42.44,29.21,54.98,16.5,10.45,34.95,15.84,54.53,17.54.34,1.1.75,2.31-.12,4.97h0Z",
    // Decorative center
    "M701.94,549.01c-28.37-1.32-53.31-13.52-76.52-29.13l-.08-186.47c0-22.2-3.53-41.29-21.98-54.14-18.64-12.98-37.31-11.88-39.16-13.36-.85-.68-1.22-2.43-.79-5.15l219.04-.16c.52,2.05.42,3.4.1,5.28-17.39,1-33.64,5.41-48.96,13.77-18.79,10.25-31.29,28.51-31.32,50.66l-.33,218.71h0Z",
    // Border shape
    "M641.71,560.84c-49.96-15.03-94.44-47.26-131.94-82.95-17.3-16.46-32.52-33.85-48.19-51.73l-9.06-10.33c-16.86.69-32.33,5.4-47.85,11.94l-46.21,23.75-52.63,30.38c-41.15,20.46-85.95,32.39-131.87,35.94-67.07,5.19-134.39-22.44-162.97-85.09-24.78-54.32-5.17-109,33.89-150.79,15.67-16.77,33.16-29.78,53.18-40.92,24.06-13.39,48.89-22.62,76.35-26.62,31.97-4.66,63.73-3.83,95.32,3.56,72.45,16.93,130.94,59.33,179.33,114.6,17.42,19.9,32.54,40.34,48.99,61.04l54.43,68.5,36.25,38.77c14.07,13.14,28.36,24.38,45.09,33.97,37.56,21.52,81.85,27.17,123.32,14.41,18.38-5.66,33.29-15.58,50.01-25.58-42.28,45.61-107.72,54.53-165.45,37.17v-.02Z",
    // T-H connection fill
    "M290.07,462.18c-65.38,32.99-145.37,58.85-214.12,23.55-13.06-6.71-24.44-14.92-33.8-26.19-27.15-32.69-31.56-77.82-12.28-115.83,27.38-53.99,77.86-89.02,135.92-104.78,12.97-3.52,25.44-5.3,39.11-5.21,50.87.32,98.75,19.67,136.45,53.65,21.91,19.75,40.64,41.73,59.23,64.71l46.87,57.91c-39.15-.8-71.51,9.94-105.5,26.03l-51.88,26.18v-.02Z",
    // Vertical lines T
    "M309.79,442.69l-28.55,14.63c-14.43,7.39-28.85,13.87-44.51,19.13l-.03-231.35c26.03,4.35,50.48,13.23,73.04,27.19l.06,170.39h-.01Z",
  ];

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      initial={{ opacity: 0 }}
      animate={active ? { opacity: 1, transition: { duration: 0.3, delay } } : {}}
    >
      {/* Glow backdrop */}
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={active ? { opacity: 1, scale: 1, transition: { duration: 1.5, delay: delay + 1.5 } } : {}}
        style={{
          background: `radial-gradient(circle at center, ${isDark ? "rgba(196, 164, 132, 0.18)" : "rgba(74, 53, 37, 0.1)"} 0%, transparent 70%)`,
          filter: "blur(16px)",
        }}
      />

      {/* SVG Container */}
      <svg
        viewBox="0 0 807.15 876.21"
        width={size * 0.85}
        height={size * 0.85}
        style={{ overflow: "visible" }}
      >
        {paths.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            fill={i === 5 ? "#2d1f15" : mainColor}
            initial={{ 
              opacity: 0, 
              y: -80 - i * 20,
              scale: 0.85,
            }}
            animate={active ? { 
              opacity: 1, 
              y: 0,
              scale: 1,
              transition: { 
                duration: 1.2, 
                delay: delay + i * 0.15, 
                ease 
              }
            } : {}}
            style={{
              filter: isDark 
                ? "drop-shadow(0 2px 6px rgba(196, 164, 132, 0.25))" 
                : "drop-shadow(0 2px 4px rgba(74, 53, 37, 0.12))",
            }}
          />
        ))}
      </svg>

      {/* Sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {[...Array(6)].map((_, i) => {
          const positions = [
            { left: "8%", top: "12%" },
            { left: "82%", top: "15%" },
            { left: "5%", top: "50%" },
            { left: "88%", top: "55%" },
            { left: "15%", top: "82%" },
            { left: "78%", top: "85%" },
          ];
          return (
            <motion.span
              key={i}
              className="absolute"
              style={{
                left: positions[i].left,
                top: positions[i].top,
                width: i % 2 === 0 ? 4 : 3,
                height: i % 2 === 0 ? 4 : 3,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={active ? {
                opacity: [0, 0.9, 0],
                scale: [0, 1.2, 0],
                rotate: [0, 180],
              } : {}}
              transition={{ 
                duration: 2.5, 
                delay: delay + 1.5 + i * 0.2, 
                repeat: Infinity, 
                ease: "easeInOut",
                repeatDelay: 1.5,
              }}
            >
              <svg viewBox="0 0 24 24" width="100%" height="100%" fill={goldColor}>
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
            </motion.span>
          );
        })}
      </div>

      {/* Floating animation */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={active ? { y: [0, -4, 0] } : {}}
        transition={{ duration: 5, delay: delay + 0.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
