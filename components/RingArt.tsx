"use client";

import { motion } from "framer-motion";
import { ease } from "./animation";

/**
 * Section 4 Art — Wedding Rings (3 paths animation)
 * Chủ đề: "Countdown + RSVP" — Kết hợp, vĩnh cửu
 * 
 * Animation sequence:
 * 1. Path 1 (trên) - rơi xuống đầu tiên
 * 2. Path 2 (giữa) - đuổi theo
 * 3. Path 3 (dưới) - hình thành cuối cùng
 * 4. Sparkles xuất hiện xung quanh
 */

interface RingArtProps {
  size?: number;
  theme?: "dark" | "light";
  delay?: number;
  active?: boolean;
}

export default function RingArt({
  size = 140,
  theme = "dark",
  delay = 0,
  active = true,
}: RingArtProps) {
  const isDark = theme === "dark";
  const ringColor = "#c4a584";

  // Path data từ SVG gốc
  const path1 = "M812.64,766.35c44.79,7.13,90.99,3.17,132.34-16.44-18.73,20.18-41.03,34.74-66.13,45.27-65.69,27.55-137.13,22.71-201.75-6.37-71.25-32.06-130.33-86.35-168.31-154.58-14.26-25.62-24.45-52.4-29.71-81.23-9.13-49.18.71-98.92,28.04-140.73,19.13-27.69,45.03-50.55,77.39-63.58-19.64,18.48-34.42,38.41-42.58,63.48-9.91,27.14-11.82,55.28-8.41,84.14,6.89,53.21,34.52,107.37,69.17,148.06,54.1,63.52,126.93,108.77,209.96,121.97Z";
  
  const path2 = "M259.44,253.12c-60.66,57.72-104.1,138.94-105.37,222.94-.78,51.49,16.25,101.11,50.54,139.26,65.4,72.75,163.29,74.18,246.53,30.94-25.59,7.9-50.03,14.65-76.51,16.41-32.76,2.69-64.74-1.8-95.16-14.15-37.98-16.18-69.69-44.07-88.62-82.07,24.9,19.87,52.38,32.28,83.63,37.08,31.36,4.93,62.36,3.28,93.46-3.37,23.91-4.92,46.06-12.66,68.93-21.71,8.08,31.45,20.32,59.85,36.75,88.1-60.62,24.65-124.48,35.6-188.98,23.78-75.84-14.19-137.89-63.32-174.69-130.38-79.75-145.35-18.05-318.72,107.17-416.52,32.36-25.28,67.31-45.81,104.98-62,61.76-26.53,128.68-38.53,195.09-26.72,117.81,20.95,200.33,118.71,211.85,236.27,8.2,83.64-16.21,166.63-67.25,233.14-21.88,28.3-46.93,53.44-75.53,75.97-18.25-28.54-31.75-60.06-38.29-93.64,36.17-37.08,62.79-81.51,78.67-130.43,5.25-17.5,8.9-34,10.95-52.06,3.52-30.92,1.3-61.35-7.4-91.18-6.84-23.44-18.31-43.61-33.98-62.66,23.65,8.6,42.66,22.83,58.91,40.74,43.04,48.79,52.99,111.31,38.65,174.29-9.19,38.36-25.07,74.14-46.65,107.2-16.81,27.31-38.29,49.51-60.33,73.08,45.53-33.48,81.51-78.14,105.45-128.81,21.92-46.4,28.33-97.82,17.96-147.81l-8.65-29.42c-19.35-53.78-62.83-94.4-117.9-110.15-30.27-8.66-61.22-10.74-92.83-7.26-85.78,9.44-168.84,51.61-231.39,111.12Z";
  
  const path3 = "M502.15,335.8c33.55-36.68,74.21-65.11,121.36-82.76,4.21,22.01,5.05,44.63,2.82,67.17-48.08,7.15-90.43,30.71-120.69,67.69-49.36,62.65-56.15,141.48-27.89,215.36,24.95,65.23,75.22,120.2,132.01,159.98,56.13,39.31,124.96,66.8,194.13,67.73,45.22.6,88.85-12.73,124.97-39.85,25.74-19.33,45.54-44.46,59.81-73.21,29.03-58.46,32.47-125.52,10.22-186.99-13.99-38.11-35.82-72.59-63.49-102.38-51.22-54.9-118.06-92.18-192.47-107,.4-29.6-4.22-58.44-12.71-88.29,48.3-1.08,96.02,6.65,141.57,22.84,63.6,22.59,112.67,62.62,153.2,115.9,18.36,24.14,33.59,49.54,45.48,77.56,42.58,100.38,26.26,210.35-35.14,298.97-17.32,25-38.76,45.46-64.4,61.65-19.61,12.38-39.55,22.28-61.77,29.15-72.42,22.39-154.45,14.69-224.76-12.82-87.53-34.25-164.1-98.29-208.29-181.65-53.19-100.33-52.74-222.01,26.02-309.07Z";

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
      initial={{ opacity: 0 }}
      animate={active ? { opacity: 1, transition: { duration: 0.5, delay } } : { opacity: 0 }}
    >
      {/* Glow backdrop */}
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={active ? { opacity: 1, scale: 1, transition: { duration: 1.5, delay: delay + 2 } } : {}}
        style={{
          background: `radial-gradient(circle at center, ${isDark ? "rgba(196, 164, 132, 0.18)" : "rgba(74, 53, 37, 0.1)"} 0%, transparent 70%)`,
          filter: "blur(20px)",
        }}
      />

      {/* SVG Container */}
      <svg
        viewBox="0 0 1155.99 907.99"
        width={size * 0.9}
        height={size * 0.9}
        style={{ overflow: "visible" }}
      >
        {/* Path 1 - rơi xuống trước */}
        <motion.path
          d={path1}
          fill={ringColor}
          initial={{ 
            opacity: 0, 
            y: -150,
            scale: 0.9,
          }}
          animate={active ? { 
            opacity: 1, 
            y: 0,
            scale: 1,
            transition: { 
              duration: 1.2, 
              delay: delay + 0.2, 
              ease 
            }
          } : {}}
          style={{
            filter: isDark 
              ? "drop-shadow(0 2px 6px rgba(196, 164, 132, 0.25))" 
              : "drop-shadow(0 2px 4px rgba(74, 53, 37, 0.12))",
          }}
        />

        {/* Path 2 - đuổi theo, delay hơn */}
        <motion.path
          d={path2}
          fill={ringColor}
          initial={{ 
            opacity: 0, 
            y: -100,
            scale: 0.85,
          }}
          animate={active ? { 
            opacity: 1, 
            y: 0,
            scale: 1,
            transition: { 
              duration: 1.4, 
              delay: delay + 0.5, 
              ease 
            }
          } : {}}
          style={{
            filter: isDark 
              ? "drop-shadow(0 2px 6px rgba(196, 164, 132, 0.25))" 
              : "drop-shadow(0 2px 4px rgba(74, 53, 37, 0.12))",
          }}
        />

        {/* Path 3 - hình thành cuối cùng */}
        <motion.path
          d={path3}
          fill={ringColor}
          initial={{ 
            opacity: 0, 
            y: -60,
            scale: 0.8,
          }}
          animate={active ? { 
            opacity: 1, 
            y: 0,
            scale: 1,
            transition: { 
              duration: 1.5, 
              delay: delay + 0.9, 
              ease 
            }
          } : {}}
          style={{
            filter: isDark 
              ? "drop-shadow(0 2px 6px rgba(196, 164, 132, 0.25))" 
              : "drop-shadow(0 2px 4px rgba(74, 53, 37, 0.12))",
          }}
        />
      </svg>

      {/* Sparkles xung quanh - xuất hiện sau cùng */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {[...Array(8)].map((_, i) => {
          const positions = [
            { left: "5%", top: "15%" },
            { left: "85%", top: "10%" },
            { left: "0%", top: "45%" },
            { left: "90%", top: "50%" },
            { left: "10%", top: "80%" },
            { left: "80%", top: "85%" },
            { left: "45%", top: "5%" },
            { left: "50%", top: "90%" },
          ];
          return (
            <motion.span
              key={i}
              className="absolute inline-block"
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
                delay: delay + 2 + i * 0.2, 
                repeat: Infinity, 
                ease: "easeInOut",
                repeatDelay: 1.5,
              }}
            >
              {/* Star shape */}
              <svg viewBox="0 0 24 24" width="100%" height="100%" fill={ringColor}>
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
              </svg>
            </motion.span>
          );
        })}
      </div>

      {/* Twinkling dots */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {[...Array(6)].map((_, i) => {
          const positions = [
            { left: "15%", top: "25%" },
            { left: "75%", top: "20%" },
            { left: "8%", top: "60%" },
            { left: "88%", top: "65%" },
            { left: "25%", top: "75%" },
            { left: "70%", top: "78%" },
          ];
          return (
            <motion.span
              key={i}
              className="absolute inline-block rounded-full"
              style={{
                left: positions[i].left,
                top: positions[i].top,
                width: 2,
                height: 2,
                backgroundColor: isDark ? "#fdfbf7" : "#4a3525",
              }}
              animate={active ? {
                opacity: [0.2, 0.8, 0.2],
                scale: [0.8, 1.2, 0.8],
              } : {}}
              transition={{ 
                duration: 1.5 + i * 0.3, 
                delay: delay + 1.5 + i * 0.2, 
                repeat: Infinity, 
                ease: "easeInOut",
              }}
            />
          );
        })}
      </div>

      {/* Subtle floating animation after all paths appear */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={active ? { opacity: 1 } : {}}
        transition={{ delay: delay + 2.5 }}
        style={{
          animation: active ? "float 4s ease-in-out infinite" : "none",
        }}
      />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </motion.div>
  );
}
