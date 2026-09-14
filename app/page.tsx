"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IntroScreen from "@/components/IntroScreen";
import RevealScreen from "@/components/RevealScreen";
import { DetailsSections } from "@/components/DetailsScreen";

type Stage = "intro" | "revealing" | "revealed";

export default function Page() {
  const [stage, setStage] = useState<Stage>("intro");
  const [musicStarted, setMusicStarted] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const sectionsRef = useRef<HTMLDivElement>(null);

  const handleUnlock = useCallback(() => {
    setStage("revealing");
    setMusicStarted(true);
    setTimeout(() => setStage("revealed"), 100);
  }, []);

  // Snap scroll detection - track which section is visible
  useEffect(() => {
    if (stage !== "revealed") return;
    const container = sectionsRef.current;
    if (!container) return;

    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        const h = container.offsetHeight;
        const idx = Math.max(
          0,
          Math.min(
            3, // total 4 sections (0-3) - section 6 đã gộp vào section 4
            Math.round(container.scrollTop / h)
          )
        );
        setActiveSection(idx);
      });
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [stage]);

  const scrollToSection = (index: number) => {
    if (!sectionsRef.current) return;
    const target = sectionsRef.current.offsetHeight * index;
    sectionsRef.current.scrollTo({ top: target, behavior: "smooth" });
  };

  return (
    <main className="relative h-screen w-full overflow-hidden">
      {/* Intro Screen Overlay */}
      <AnimatePresence>
        {stage === "intro" && (
          <motion.div
            key="intro"
            className="fixed inset-0 z-50"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.6 },
            }}
          >
            <IntroScreen
              onUnlock={handleUnlock}
              bride="Thuý Hằng"
              groom="Tùng Phạm"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section snap scroll container */}
      <AnimatePresence>
        {stage !== "intro" && (
          <motion.div
            key="sections-container"
            ref={sectionsRef}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: 1.2, ease: "easeOut" },
            }}
            className="reveal-bg snap-scroll-container absolute inset-0 overflow-x-hidden"
            style={{
              scrollSnapType: "y mandatory",
              scrollBehavior: "smooth",
              WebkitOverflowScrolling: "touch",
              overflowY: "scroll",
            }}
          >
            {/* SECTION 1: Reveal / Save the Date */}
            <section
              className="flex h-screen w-full items-center justify-center"
              style={{ scrollSnapAlign: "start" }}
            >
              <RevealScreen
                groom="Tùng Phạm"
                bride="Thuý Hằng"
                active={activeSection === 0}
              />
            </section>

            {/* SECTION 2-5: Details sections (each full screen, snap) */}
            <DetailsSections
              groomInit="T"
              brideInit="H"
              groom="Tùng Phạm"
              bride="Thuý Hằng"
              activeSection={activeSection}
              onSectionClick={scrollToSection}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page dots indicator */}
      {stage === "revealed" && (
        <div className="fixed right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2 sm:right-4 sm:gap-3">
          {[0, 1, 2, 3].map((i) => {
            const isDark = i === 1 || i === 3; // Section 2 và 4 nền nâu
            const activeColor = isDark ? "bg-[#c4a484]" : "bg-[#c4a484]";
            const inactiveColor = isDark
              ? "bg-[#fdfbf7]/30 hover:bg-[#fdfbf7]/60"
              : "bg-[#c4a484]/30 hover:bg-[#c4a484]/60";
            return (
              <button
                key={i}
                onClick={() => scrollToSection(i)}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                  activeSection === i
                    ? `scale-125 ${activeColor}`
                    : inactiveColor
                }`}
                aria-label={`Section ${i + 1}`}
              />
            );
          })}
        </div>
      )}

      {/* Header - thay đổi màu theo section */}
      {stage === "revealed" && (() => {
        const isDark = activeSection === 1 || activeSection === 3;
        const textColor = isDark ? "text-[#fdfbf7]/80" : "text-[#4a3525]/70";
        const accentColor = isDark ? "text-[#c4a484]" : "text-[#c4a484]";
        return (
          <div
            className="pointer-events-none fixed left-0 right-0 top-0 z-30 flex items-center justify-between px-4 py-4 sm:px-6"
            style={{
              transition: "all 0.6s ease",
            }}
          >
            <span className={`font-serif text-[10px] uppercase tracking-[0.3em] sm:text-xs ${textColor}`}>
              Tùng & Hằng
            </span>
            <span className={`font-serif text-[10px] uppercase tracking-[0.3em] sm:text-xs ${accentColor}`}>
              27·12·2026
            </span>
          </div>
        );
      })()}

      {/* Audio player */}
      {musicStarted && <AudioPlayer />}
    </main>
  );
}

function AudioPlayer() {
  useEffect(() => {
    const audio = new Audio("/audio/golden-hour.mp3");
    audio.loop = true;
    audio.volume = 0.5;
    audio.preload = "auto";

    const tryPlay = () => {
      const p = audio.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          const resume = () => {
            audio.play().catch(() => {});
            document.removeEventListener("click", resume);
            document.removeEventListener("touchstart", resume);
          };
          document.addEventListener("click", resume);
          document.addEventListener("touchstart", resume);
        });
      }
    };
    tryPlay();

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  return null;
}
