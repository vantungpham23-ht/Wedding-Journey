"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IntroScreen from "@/components/IntroScreen";
import RevealScreen from "@/components/RevealScreen";
import { DetailsSections } from "@/components/DetailsScreen";
import ContinuityLayer from "@/components/ContinuityLayer";
import Loading3DWrapper from "@/components/loading3d/Loading3DWrapper";
import MuteButton from "@/components/MuteButton";
import { installAudioUnlock, isMuted, playShimmer } from "@/components/soundscape";
import { preload } from "react-dom";
import {
  WEDDING_DATE_SHORT,
  WEDDING_DATE_LUNAR_TEXT,
} from "@/lib/weddingDate";
import { BRIDE_NAME, GROOM_NAME } from "@/lib/weddingNames";
import { MODEL } from "@/components/loading3d/useGLB";

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
      {/* Tải nền phần còn lại (backdrop + nhân vật) — ưu tiên thấp */}
      <PreloadAssets />

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

      {/* ============ NÚT TẮT TIẾNG ============
          Dùng chung 1 AudioContext cho toàn bộ sound tổng hợp.
          Nhạc nền MP3 đi qua `Audio` element riêng → cần cầu nối
          thủ công (xem `AudioPlayer` bên dưới). */}
      {(stage === "intro" || stage === "revealed" || stage === "revealing") && (
        <MuteButton className="fixed right-4 top-4 z-50 sm:right-6 sm:top-6" />
      )}

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

/**
 * PRELOAD ASSET 3D — chạy NGAY khi HTML vừa tới.
 *
 * ── VÌ SAO CẦN ──
 * ⚠ VẤN ĐỀ GỐC: trình duyệt chỉ biết tải GLB sau khi:
 *   1. HTML tới
 *   2. JS bundle (960KB three.js + r3f + drei) tải xong
 *   3. React hydrate, Canvas mount
 *   4. `useLoader` mới bắt đầu fetch GLB
 *
 *   → 4 bước TUẦN TỰ trên mạng di động = 5-15 giây chờ TRƯỚC khi
 *     byte đầu tiên của model bắt đầu tải.
 *
 * ── VÌ SAO DÙNG `preload()` THAY VÌ `fetch()` THỦ CÔNG ──
 * ⚠ LỖI ĐÃ GẶP (đo bằng Performance Resource Timing):
 *   `fetch(url)` trong `useEffect` + `GLTFLoader` cùng tải 1 URL →
 *   **2 request SONG SONG** cho cùng 1 file.
 *
 *   Đo thực tế: `wedding-backdrop.glb` bị tải 2 lần (4.6MB + 4.6MB),
 *   `bride.glb` 2 lần, `groom.glb` 2 lần → **~8MB băng thông thừa**
 *   trên mạng di động → đúng triệu chứng "chờ rất lâu".
 *
 *   Nguyên nhân: browser KHÔNG dedupe 2 request `fetch` đang in-flight
 *   (chỉ dedupe `<link rel=preload>` với request cùng credentials).
 *
 *   → `ReactDOM.preload()` inject `<link rel="preload" as="fetch">` vào
 *     `<head>` → browser gộp chung với request của `GLTFLoader`
 *     (cùng URL + cùng `crossOrigin`) → **1 request duy nhất**.
 *
 * ⚠ `crossOrigin: "anonymous"` PHẢI khớp với `FileLoader` của Three.js
 *   (luôn dùng CORS mode) — nếu lệch thì browser coi là 2 resource
 *   khác nhau và tải 2 lần.
 */
function PreloadAssets() {
  // Không còn fetch thủ công — preload đã xử lý ở module scope.
  // Component giữ lại để cấu trúc gọi trong JSX rõ ràng.
  return null;
}

/**
 * PRELOAD 2 NHẪN — ưu tiên CAO.
 *
 * ── VÌ SAO RIÊNG? ──
 * 2 nhẫn là thứ khách THẤY ĐẦU TIÊN. Chúng phải có mặt sớm nhất.
 *
 * ⚠ Gọi ở MODULE SCOPE (không phải trong component/useEffect):
 *   React 19 thu thập `preload()` lúc RENDER để inject `<link>` vào
 *   `<head>` của HTML tĩnh. Nếu gọi trong `useEffect` → chạy SAU khi
 *   HTML đã gửi → không có link nào trong HTML → mất tác dụng.
 *
 * ⚠ `as: "fetch"` + `crossOrigin: "anonymous"` khớp với cách
 *   Three.js `FileLoader` fetch (luôn CORS mode) → preload được
 *   TÁI SỬ DỤNG, không phải tải 2 lần.
 *
 * ⚠ React tự dedupe → không có duplicate preload (khác vì thêm
 *   `<link>` thủ công trong layout.tsx).
 */
preload(MODEL.brideRing, {
  as: "fetch",
  crossOrigin: "anonymous",
  fetchPriority: "high",
});
preload(MODEL.groomRing, {
  as: "fetch",
  crossOrigin: "anonymous",
  fetchPriority: "high",
});

/**
 * PRELOAD 3 MODEL NỀN — ưu tiên THẤP.
 *
 * Backdrop + 2 nhân vật (~7.8MB) tải song song với JS + 2 nhẫn,
 * nhưng KHÔNG chặn cảnh (xem `assetTracker` 2 chặng trong `store.ts`).
 *
 * ⚠ `fetchPriority: "low"` — không cạnh tranh băng thông với 2 nhẫn
 *   (chúng là thứ khách thấy đầu tiên) và với JS bundle.
 *
 * ⚠ Vẫn dùng `preload()` chứ không `fetch()` thủ công — cùng lý do:
 *   browser chỉ dedupe được `<link rel=preload>` với request của
 *   `GLTFLoader`, còn 2 `fetch()` song song sẽ tải trùng 2 lần.
 */
preload(MODEL.backdrop, {
  as: "fetch",
  crossOrigin: "anonymous",
  fetchPriority: "low",
});
preload(MODEL.groom, {
  as: "fetch",
  crossOrigin: "anonymous",
  fetchPriority: "low",
});
preload(MODEL.bride, {
  as: "fetch",
  crossOrigin: "anonymous",
  fetchPriority: "low",
});

/**
 * PRELOAD DRACO DECODER — 2 file, 345KB.
 *
 * ⚠ ĐO ĐƯỢC: trước khi có preload này, decoder chỉ bắt đầu tải khi
 *   Canvas mount (657ms) → mất 615ms chờ decode. Đây là nút thắt lớn
 *   nhất sau "darkness" 0.8s.
 *
 *   → Preload ở module scope = browser tải SONG SONG với JS bundle
 *     (bắt đầu ngay từ ~45ms thay vì 657ms) → decoder đã sẵn sàng
 *     khi cần → chỉ còn ~150ms init WASM.
 *
 * ⚠ `crossOrigin: "anonymous"` — khớp với `FileLoader` của Three.js
 *   (luôn CORS mode) → browser TÁI SỬ DỤNG response đã preload,
 *   không tải 2 lần.
 *
 * ⚠ Không có `fetchPriority` → mặc định "high" của preload. ĐÚNG ý:
 *   decoder là thứ chặn nhẫn xuất hiện → cần ưu tiên.
 */
preload("/draco/draco_wasm_wrapper.js", {
  as: "fetch",
  crossOrigin: "anonymous",
});
preload("/draco/draco_decoder.wasm", {
  as: "fetch",
  crossOrigin: "anonymous",
});

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

    // ⚠ NÚT MUTE phải tắt cả nhạc nền MP3 này.
    //   `setMuted()` chỉ điều khiển master gain của Web Audio — nhạc
    //   nền nằm ngoài hệ thống đó (dùng `HTMLAudioElement` riêng).
    //   → Cần đồng bộ 2 nguồn âm thanh.
    const syncMute = () => {
      audio.muted = isMuted();
      audio.volume = isMuted() ? 0 : 0.5;
    };
    syncMute();
    window.addEventListener("wedding:muted", syncMute);

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("error", onError);
      window.removeEventListener("wedding:muted", syncMute);
    };
  }, []);

  return null;
}
