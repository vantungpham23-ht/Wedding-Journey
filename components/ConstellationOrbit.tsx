"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { ease } from "./animation";

/**
 * Animated floating elements (stars, shapes) from SaveTheDate SVG
 * These orbit around the main ornament
 */

interface OrbitalElement {
  id: string;
  path: string;
  color: string;
  orbitRadius: number;
  orbitSpeed: number;
  startAngle: number;
  verticalOffset: number; // 0 = horizontal orbit, positive = upper, negative = lower
  scale: number;
  rotationSpeed: number;
}

// Extract key paths from SVG as orbital elements
const ORBITAL_ELEMENTS: Omit<OrbitalElement, 'id'>[] = [
  // Top diamond
  { path: "M620.86,193.92l-9.03-56.19-21.11,14.35,14.98-21-53.39-8.57,53.76-8.2-15-21.98,21.04,14.49,8.83-54.75,8.92,54.61,21.43-14.36-15.33,21.94,53.96,8.25-53.95,8.25,15.37,21.5-22.47-14.34-9.01,55.98Z", color: "#5c361d", orbitRadius: 280, orbitSpeed: 35, startAngle: 0, verticalOffset: -250, scale: 0.4, rotationSpeed: 0 },
  
  // Bottom diamond
  { path: "M620.86,1114.89l-8.56-57.42-22.48,16.03,16.37-22.97-55.46-8.51,55.09-8.1-15.74-23.13,22.17,15.89,8.7-56.52,8.41,56.46,22.23-15.37-15.81,22.55,55.63,8.21-55.78,8.37,16.68,22.93-22.84-16.08-8.61,57.66Z", color: "#5c361d", orbitRadius: 280, orbitSpeed: 38, startAngle: 180, verticalOffset: 250, scale: 0.4, rotationSpeed: 0 },
  
  // T top curve
  { path: "M933,782.89c-1.89.48-2.17-.26-.54-1.37,14.14-7.37,26.54-16.31,38.71-27,34.68-30.47,58.21-71.55,65.37-117.48,8.67-55.57-11.64-117.55-54.39-154.42-25.89-22.33-57.39-34.68-91.44-37.55-28.3-2.39-55.42,4.17-80.27,17.83-15.44,8.49-29.2,18.03-42.88,29.14l-43.02,34.93c-15.78,12.81-32.07,23.68-50.6,32.69,16.25-14.47,30.54-29.32,45.72-44.57l34.39-34.54c9.27-9.31,19.19-16.69,30.21-23.87,25.16-16.39,53.51-24.62,84.02-23.9,43.93,1.04,86.53,17.03,119.41,46.26,34.21,30.41,54.41,72.83,58.77,118.36,5.42,56.48-16.34,112.19-57.73,150.77-16.39,15.28-35.22,26.41-55.73,34.73Z", color: "#5c361d", orbitRadius: 320, orbitSpeed: 45, startAngle: 45, verticalOffset: 0, scale: 0.35, rotationSpeed: 0.3 },
  
  // Small star left
  { path: "M288.75,267.04l-4.7-23.87-9.67,5.57,5.11-10.14-17.73-4.48,17.91-4.67-4.75-9.82,8.8,5.51,5.02-23.05,4.6,22.72,9.08-5.37c-.83,3.73-2.7,5.96-4.75,9.64l17.84,4.81-17.69,4.85,5.17,9.86-9.6-5.41-4.62,23.84Z", color: "#c4a484", orbitRadius: 250, orbitSpeed: 28, startAngle: 120, verticalOffset: -180, scale: 0.5, rotationSpeed: 0.5 },
  
  // Small star mid left
  { path: "M187.75,379.77l-4.73-23.29-9.06,5.23,5.12-9.45-19.39-5.01,19.45-4.8c-2.02-3.35-4.04-5.97-5.14-9.9l9.1,5.46,4.52-22.61,4.41,22.81,9.33-5.55c-.91,3.73-3,6.18-5.14,9.68l18.43,4.9-18.19,4.89,4.87,9.46-9.21-5.43-4.37,23.62Z", color: "#c4a484", orbitRadius: 260, orbitSpeed: 32, startAngle: 200, verticalOffset: -100, scale: 0.45, rotationSpeed: 0.4 },
  
  // Star top left
  { path: "M166.64,625.95l-5.42-35.49-12.3,8.54,8.25-12.91-28.4-5.45,28.18-5.37-8.02-13.44,12.24,8.42,5.51-35.62,5.44,35.58,12.73-8.31-8.45,13.29,28.25,5.4-28.09,5.36,8.52,13.67-12.99-8.89-5.45,35.53Z", color: "#c4a484", orbitRadius: 270, orbitSpeed: 36, startAngle: 270, verticalOffset: 0, scale: 0.4, rotationSpeed: 0.3 },
  
  // Star bottom left
  { path: "M548.6,885.65l-5.85-38.54-13.78,9.57,9.44-14.01-34.52-5.63,34.54-5.92-9.56-14.59,14.04,9.57,5.69-38.8,5.76,38.78,13.76-9.67-9.6,14.51,34.86,6.14-34.52,5.47,8.56,13.43-13.18-9.58-5.64,39.27Z", color: "#c4a484", orbitRadius: 255, orbitSpeed: 30, startAngle: 340, verticalOffset: 120, scale: 0.45, rotationSpeed: 0.45 },
  
  // Small star bottom right
  { path: "M1066.68,950.52l-4.43-24.08-8.28,5.26,4.45-8.99-16.66-4.6,16.71-4.57-4.49-8.97,8.56,4.81,4.16-20.28,4.58,20.09,8.15-4.69-4.27,8.91,16.44,4.64-16.48,4.66,4.03,9.11-8.7-5.07-4.45,23.79Z", color: "#c4a484", orbitRadius: 265, orbitSpeed: 33, startAngle: 60, verticalOffset: 180, scale: 0.45, rotationSpeed: 0.4 },
  
  // Small star mid right
  { path: "M1071.66,758.61l-3.69-15.99c-2.67,1.67-4.62,3.42-7.85,4.11,1.5-3.08,3.22-4.72,3.91-8l-13.31-3.68,13.52-3.97c-1.32-3.05-2.77-4.57-3.29-7.55l6.81,3.94,3.9-17.3,3.65,17.38,7.02-4.1c-.47,3.08-2.03,4.61-3.39,7.58l13.73,3.92-13.54,3.9c.95,2.71,2.93,3.85,3.34,7.57l-7.05-3.8-3.77,15.99Z", color: "#c4a484", orbitRadius: 275, orbitSpeed: 38, startAngle: 15, verticalOffset: 80, scale: 0.5, rotationSpeed: 0.5 },
  
  // T-H connection accent
  { path: "M954.01,610.88c21.71,37.35-18.38,116.46-41.24,154.47l-.53-114.63c-.09-18.85,4.08-39.94,21.33-47.71,7.79-3.51,16.17.52,20.44,7.87Z", color: "#c4a484", orbitRadius: 240, orbitSpeed: 25, startAngle: 90, verticalOffset: -50, scale: 0.4, rotationSpeed: 0.2 },
  
  // H crossbar accent
  { path: "M267.26,646.1c-1.89-3.08-3.52-4.55-6.56-6.62,2.85-2.38,4.53-4.12,6.58-7.74,2.07,2.99,3.2,5.1,6.4,7.27l-6.42,7.09Z", color: "#c4a484", orbitRadius: 245, orbitSpeed: 27, startAngle: 300, verticalOffset: 60, scale: 0.6, rotationSpeed: 0.3 },
  
  // Side curve top
  { path: "M1058.29,456.09c.49,2.47-4.34,1.54-4.91-1.03-6.9-31.17-17.74-61.08-31.73-90.04-46.09-95.38-125.47-171.15-222.42-213.38-1.65-.72-2.26-1.18-2.4-2.46-.08-.76,1.05-2.61,2.04-2.21l20.02,8.03c87.05,42.32,158.4,111.86,202.7,198.13,16.68,32.48,29.39,66.34,36.71,102.96Z", color: "#5c361d", orbitRadius: 300, orbitSpeed: 40, startAngle: 160, verticalOffset: -200, scale: 0.3, rotationSpeed: 0.25 },
  
  // Star left
  { path: "M787.78,360.95l-6.27-48.62-16.81,11.75c3.08-6.67,7.31-10.97,11.75-16.97l-41.68-6.79,41.4-6.38-11.35-17.56,16.68,11.82,6.4-48.97,6.77,48.83,17.51-12.73-12.26,18.27,40.58,6.75-40.77,6.57,12.36,17.91-17.6-12.5-6.71,48.6Z", color: "#c4a484", orbitRadius: 290, orbitSpeed: 42, startAngle: 230, verticalOffset: -150, scale: 0.35, rotationSpeed: 0.35 },
  
  // Side curve bottom
  { path: "M428.25,989.23c1.12.57-1.08,4.48-2.34,3.92-44.83-19.82-85.33-47.65-120.83-81.53-57.15-54.53-98.79-122.92-122.88-197.81-.39-1.2,1.26-2.54,1.88-2.8.77-.34,2.31.52,2.85,2.11,11.59,34.13,26.21,66.82,44.79,97.93,40.14,67.2,96.22,122.97,164.2,161.61l32.34,16.57Z", color: "#5c361d", orbitRadius: 295, orbitSpeed: 44, startAngle: 320, verticalOffset: 220, scale: 0.3, rotationSpeed: 0.2 },
  
  // Small star right
  { path: "M933.88,951.8l-3.97-19.16-8.09,4.1,3.94-8.09-15.05-4.38,15.55-4.56c-1.81-2.88-3.4-4.93-4.24-8.14l7.66,4.47,4.1-17.88,4.36,17.61,7.19-3.92c-.58,3.62-2.17,5.17-3.57,8.23l14.17,4.42-14,4.14,4.21,8.12c-3.27-.83-5.1-2.84-7.92-4.38l-4.33,19.43Z", color: "#c4a484", orbitRadius: 235, orbitSpeed: 22, startAngle: 135, verticalOffset: 160, scale: 0.55, rotationSpeed: 0.55 },
  
  // Inner monogram T
  { path: "M530.31,304.07c-.64-3.25-2.56-4.8-5.34-5.39l-21.33-4.52c10.24-2.8,25.5-2.36,26.95-10.2l4.99-26.88c2.12,10.22,2.22,20.65,6.46,30.61,7.91,3.87,16.4,4.29,25.56,6.41-8.49,2.29-17.35,2.38-25.26,6.64-4.08,9.61-4.01,19.61-6.66,30.4l-5.37-27.07Z", color: "#5c361d", orbitRadius: 220, orbitSpeed: 20, startAngle: 70, verticalOffset: -120, scale: 0.5, rotationSpeed: 0.15 },
  
  // Inner monogram H
  { path: "M1082.56,618.64l-4.81-22.45c-.78-3.64-2.62-6.13-6.29-6.96l-18.54-4.2,19.88-4.72c2.72-.65,4.36-2.56,4.92-5.3l4.89-23.75c2.65,9.23,1.64,19.62,6.72,27.05,6.11,4.91,15.4,4.03,23.12,6.75l-18.48,4.24c-3.73.86-6.24,3.35-6.79,7.29l-4.62,22.05Z", color: "#5c361d", orbitRadius: 225, orbitSpeed: 24, startAngle: 290, verticalOffset: 140, scale: 0.5, rotationSpeed: 0.2 },
  
  // Inner monogram T bottom
  { path: "M503.65,213.94l-5.27-17.84c-3.42-3.39-10.37-3.42-14.34-4.92,4.32-2.73,11.2-1.82,14.32-5.35,3.67-4.16,2.48-11.16,5.31-16.5,1.98,4.78,1.42,12.2,5.07,16.58,3.03,3.52,9.23,2.88,13.64,5.16-4.47,1.44-9.42,2.31-14.1,4.84l-4.63,18.04Z", color: "#5c361d", orbitRadius: 210, orbitSpeed: 18, startAngle: 150, verticalOffset: -90, scale: 0.55, rotationSpeed: 0.25 },
  
  // Inner monogram H mid
  { path: "M867.47,384.92l-3.56-13.16c-.74-2.72-3.4-4.97-6.06-5.85l-9.05-3c5.3-2.07,11.1-2.05,14.23-6.52l4.25-14.43,3.8,13.7c1.25,4.49,10.68,4.67,14.26,7.65-5.09,1.52-11.08,2.22-13.72,6.68s-2.55,9.96-4.14,14.93Z", color: "#5c361d", orbitRadius: 215, orbitSpeed: 21, startAngle: 350, verticalOffset: -60, scale: 0.55, rotationSpeed: 0.3 },
  
  // Inner H top
  { path: "M763.54,970.75l-4.11-15.79c-.35-1.35-2.97-3.73-4.39-4.26l-10.97-4.11c5.92-2.07,12.43-2.53,15.26-7.51l4.16-14.78,3.48,14.57c4.27,6.17,10.49,4.77,15.3,8.25-5.24,1.11-12.01,2.41-14.84,7.8l-3.89,15.83Z", color: "#5c361d", orbitRadius: 230, orbitSpeed: 23, startAngle: 40, verticalOffset: 100, scale: 0.55, rotationSpeed: 0.2 },
];

interface ConstellationOrbitProps {
  size?: number;
  theme?: "dark" | "light";
  delay?: number;
  active?: boolean;
  className?: string;
}

export default function ConstellationOrbit({
  size = 280,
  theme = "dark",
  delay = 0,
  active = true,
  className = "",
}: ConstellationOrbitProps) {
  const isDark = theme === "dark";
  const mainColor = isDark ? "#5c361d" : "#4a3525";
  const accentColor = isDark ? "#c4a484" : "#d4b896";

  const elements = useMemo(() => {
    return ORBITAL_ELEMENTS.map((el, i) => ({
      ...el,
      id: `orbital-${i}`,
      color: el.color === "#5c361d" ? mainColor : accentColor,
      orbitRadius: el.orbitRadius * (size / 560),
      verticalOffset: el.verticalOffset * (size / 560),
    }));
  }, [size, mainColor, accentColor]);

  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      initial={{ opacity: 0 }}
      animate={active ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 1.5, delay }}
    >
      {/* Orbital elements */}
      {elements.map((el, i) => {
        const radiusX = el.orbitRadius;
        const radiusY = el.orbitRadius * 0.5; // Elliptical
        const startRad = (el.startAngle * Math.PI) / 180;
        
        // Calculate initial position on ellipse
        const initialX = Math.cos(startRad) * radiusX;
        const initialY = Math.sin(startRad) * radiusY + el.verticalOffset;

        return (
          <motion.svg
            key={el.id}
            viewBox="0 0 1241.65 1213.56"
            className="absolute overflow-visible"
            style={{
              width: size * el.scale,
              height: size * el.scale,
              left: "50%",
              top: "50%",
              marginLeft: -size * el.scale / 2,
              marginTop: -size * el.scale / 2,
            }}
            initial={{ 
              opacity: 0,
              x: initialX,
              y: initialY,
              rotate: 0,
            }}
            animate={active ? {
              opacity: [0, 0.9, 0.7, 0.9],
              x: [
                initialX,
                Math.cos(startRad + Math.PI * 0.5) * radiusX,
                Math.cos(startRad + Math.PI) * radiusX,
                Math.cos(startRad + Math.PI * 1.5) * radiusX,
                initialX,
              ],
              y: [
                initialY,
                Math.sin(startRad + Math.PI * 0.5) * radiusY + el.verticalOffset,
                Math.sin(startRad + Math.PI) * radiusY + el.verticalOffset,
                Math.sin(startRad + Math.PI * 1.5) * radiusY + el.verticalOffset,
                initialY,
              ],
              rotate: [0, el.rotationSpeed * 30, el.rotationSpeed * 60, el.rotationSpeed * 90, el.rotationSpeed * 120, 0],
            } : { opacity: 0, x: initialX, y: initialY, rotate: 0 }}
            transition={{
              duration: el.orbitSpeed,
              delay: delay + i * 0.12,
              repeat: Infinity,
              ease: "linear",
              opacity: {
                duration: el.orbitSpeed / 4,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          >
            <path d={el.path} fill={el.color} />
          </motion.svg>
        );
      })}

      {/* Central glow */}
      <motion.div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: size * 0.4,
          height: size * 0.4,
          marginLeft: -size * 0.2,
          marginTop: -size * 0.2,
          background: `radial-gradient(circle, ${accentColor}20 0%, transparent 70%)`,
          filter: "blur(30px)",
        }}
        animate={active ? {
          scale: [1, 1.15, 1],
          opacity: [0.5, 0.8, 0.5],
        } : {}}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}
