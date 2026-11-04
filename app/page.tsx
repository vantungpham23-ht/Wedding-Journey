"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IntroScreen from "@/components/IntroScreen";
import RevealScreen from "@/components/RevealScreen";
import { DetailsSections } from "@/components/DetailsScreen";
import ContinuityLayer from "@/components/ContinuityLayer";
import Loading3DWrapper from "@/components/loading3d/Loading3DWrapper";
import { installAudioUnlock, playShimmer } from "@/components/soundscape";
import {
  WEDDING_DATE_SHORT,
  WEDDING_DATE_LUNAR_TEXT,
} from "@/lib/weddingDate";
import { BRIDE_NAME, GROOM_NAME } from "@/lib/weddingNames";

/**
 * Các giai đoạn của trang:
 *   loading3d → intro → revealing → revealed
 *
 * `loading3d` là cảnh 3D mở đầu (2 nhẫn quấn quít → nhân vật cúi chào).
 * Sau khi xong → `intro` (thiệp mời 2D như hiện tại).
 */
type Stage = "loading3d" | "intro" | "revealing" | "revealed";

interface Guest {
  to: string;
  to2: string;
  from: string;
  rel: string;
  we: string;
}

export default function Page() {
  const [stage, setStage] = useState<Stage>("loading3d");
  const [musicStarted, setMusicStarted] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [guest, setGuest] = useState<Guest>({
    to: "",
    to2: "",
    from: "",
    rel: "",
    we: "",
  });
  const [showAdminLink, setShowAdminLink] = useState(false);
  const sectionsRef = useRef<HTMLDivElement>(null);

  // ---- Đọc thông tin cá nhân hóa từ query string ----
  // ?to=Tên khách &to2=Tên người 2 &from=Người gửi &rel=anh &we=chúng em
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const to = (params.get("to") ?? "").trim();
    const to2 = (params.get("to2") ?? "").trim();
    const from = (params.get("from") ?? "").trim();
    const rel = (params.get("rel") ?? "").trim();
    const we = (params.get("we") ?? "").trim();
    if (to || to2 || from || rel || we) setGuest({ to, to2, from, rel, we });
    if (params.get("admin") === "1") setShowAdminLink(true);
  }, []);
  // ---- Mở khoá AudioContext khi user tương tác lần đầu ----
  useEffect(() => installAudioUnlock(), []);

  const handleUnlock = useCallback(() => {
    setStage("revealing");
    setMusicStarted(true);
    setTimeout(() => setStage("revealed"), 600);
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

  // Âm thanh "shimmer" nhẹ khi đổi section
  useEffect(() => {
    if (stage !== "revealed" || activeSection === 0) return;
    playShimmer();
  }, [activeSection, stage]);

  const scrollToSection = (index: number) => {
    if (!sectionsRef.current) return;
    const target = sectionsRef.current.offsetHeight * index;
    sectionsRef.current.scrollTo({ top: target, behavior: "smooth" });
  };

  return (
    <main className="relative h-screen w-full overflow-hidden">
      {/* ============ LOADING 3D ============
          Cảnh mở đầu: 2 nhẫn bay vào quấn quít → nhỏ dần rơi xuống →
          chú rể & cô dâu đứng trên backdrop cúi chào.
          Hiện overlay z-[60] nên nằm trên mọi thứ. */}
      <AnimatePresence>
        {stage === "loading3d" && (
          <motion.div
            key="loading3d"
            className="fixed inset-0 z-[60]"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 1.1, ease: "easeInOut" },
            }}
          >
            <Loading3DWrapper onComplete={() => setStage("intro")} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Intro Screen Overlay */}
      <AnimatePresence>
        {stage === "intro" && (
          <motion.div
            key="intro"
            className="fixed inset-0 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 1.2 },
            }}
          >
            <IntroScreen
              onUnlock={handleUnlock}
              bride={BRIDE_NAME}
              groom={GROOM_NAME}
              guestTo={guest.to}
              guestTo2={guest.to2}
              guestFrom={guest.from}
              guestRel={guest.rel}
              guestWe={guest.we}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ TẦNG 1 — CONTINUITY LAYER ============
          Nền + hạt bụi + quầng sáng chạy XUYEN SUỐT 4 section.
          Nhờ vậy khi đổi section không có gì bị "cắt" → chuyển cảnh mượt. */}
      {stage === "revealed" && (
        <ContinuityLayer
          scrollRef={sectionsRef}
          activeSection={activeSection}
        />
      )}

      {/* Section snap scroll container */}
      <AnimatePresence>
        {(stage === "revealing" || stage === "revealed") && (
          <motion.div
            key="sections-container"
            ref={sectionsRef}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: 2.4, ease: "easeOut" },
            }}
            className="snap-scroll-container absolute inset-0 z-[10] overflow-x-hidden"
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
              style={{ scrollSnapAlign: "start", backgroundColor: "#fdfbf7" }}
            >
              <RevealScreen
                groom={GROOM_NAME}
                bride={BRIDE_NAME}
                guestTo={guest.to}
                guestTo2={guest.to2}
                guestRel={guest.rel}
                guestWe={guest.we}
                active={activeSection === 0}
              />
            </section>

            {/* SECTION 2-5: Details sections (each full screen, snap) */}
            <DetailsSections
              groomInit="T"
              brideInit="H"
              groom={GROOM_NAME}
              bride={BRIDE_NAME}
              activeSection={activeSection}
              guestRel={guest.rel}
              guestWe={guest.we}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page dots indicator */}
      {stage === "revealed" && (
        <div className="pointer-events-none fixed right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2 sm:right-4 sm:gap-3">
          {[0, 1, 2, 3].map((i) => {
            const isDark = i === 1 || i === 3; // Section 2 và 4 nền nâu
            const activeColor = "bg-[#c4a484] shadow-[0_0_8px_rgba(196,164,132,0.6)]";
            const inactiveColor = isDark
              ? "bg-[#fdfbf7]/30 hover:bg-[#fdfbf7]/60"
              : "bg-[#c4a484]/30 hover:bg-[#c4a484]/60";
            return (
              <button
                key={i}
                onClick={() => scrollToSection(i)}
                className={`pointer-events-auto h-2.5 w-2.5 rounded-full transition-all duration-500 ${
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
              {WEDDING_DATE_SHORT} · {WEDDING_DATE_LUNAR_TEXT}
            </span>
          </div>
        );
      })()}

      {/* Audio player */}
      {musicStarted && <AudioPlayer />}

      {/* Link tới admin — chỉ hiện khi truy cập /?admin */}
      {stage === "revealed" && showAdminLink && (
        <motion.a
          href="/admin"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="pointer-events-auto fixed bottom-4 left-4 z-40 rounded-full border border-[#c4a484]/25 bg-[#2d1f15]/60 px-3 py-1.5 font-sans text-[9px] uppercase tracking-[0.2em] text-[#c4a484]/70 backdrop-blur-sm transition-colors hover:border-[#c4a484]/50 hover:text-[#c4a484]"
        >
          Admin
        </motion.a>
      )}
    </main>
  );
}

function AudioPlayer() {
  useEffect(() => {
    const audio = new Audio();
    audio.src = "/audio/golden-hour.mp3";
    audio.loop = true;
    audio.volume = 0.5;
    audio.preload = "auto";

    const onError = () => {
      // Audio file missing or failed - silent fail for production resilience
      console.warn("Audio: golden-hour.mp3 not available, continuing without music.");
    };
    audio.addEventListener("error", onError);

    const tryPlay = () => {
      const p = audio.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {
          const resume = () => {
            audio.play().catch(() => {});
            document.removeEventListener("click", resume);
            document.removeEventListener("touchstart", resume);
          };
          document.addEventListener("click", resume, { once: true });
          document.addEventListener("touchstart", resume, { once: true });
        });
      }
    };
    tryPlay();

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("error", onError);
    };
  }, []);

  return null;
}
