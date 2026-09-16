"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import ConstellationArt from "./ConstellationArt";
import MonogramArt from "./MonogramArt";
import LotusArt from "./LotusArt";
import RingArt from "./RingArt";
import {
  charDur,
  charStag,
  lineStag,
  blockDur,
  CONTENT_START,
  ease,
} from "./animation";

// ============== SPLIT TEXT — smooth, no blur ==============
interface SplitTextProps {
  text: string;
  active: boolean;
  delay?: number;
  stagger?: number;
  duration?: number;
  className?: string;
  as?: "p" | "h1" | "h2" | "h3" | "span";
}

function SplitText({
  text,
  active,
  delay = 0,
  stagger,
  duration,
  className = "",
  as: Tag = "p",
}: SplitTextProps) {
  const chars = text.split("");
  const _stagger = stagger ?? charStag();
  const _duration = duration ?? charDur();

  return (
    <Tag className={className}>
      <span className="inline-block">
        {chars.map((char, i) => (
          <motion.span
            key={`${char}-${i}`}
            className="inline-block"
            initial={{ opacity: 0, y: 12 }}
            animate={
              active
                ? {
                    opacity: 1,
                    y: 0,
                    transition: { duration: _duration, delay: delay + i * _stagger, ease },
                  }
                : {
                    opacity: 0,
                    y: -6,
                    transition: { duration: _duration * 0.5, delay: i * _stagger * 0.3, ease },
                  }
            }
            style={{ whiteSpace: char === " " ? "pre" : "normal" }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </span>
    </Tag>
  );
}

// ============== LINE REVEAL ==============
interface LineRevealProps {
  lines: string[];
  active: boolean;
  delay?: number;
  stagger?: number;
  duration?: number;
  className?: string;
  lineClassName?: string;
}

function LineReveal({
  lines,
  active,
  delay = 0,
  stagger,
  duration,
  className = "",
  lineClassName = "",
}: LineRevealProps) {
  const _stagger = stagger ?? lineStag();
  const _duration = duration ?? charDur() * 6;

  return (
    <div className={className}>
      {lines.map((line, i) => (
        <div key={i} className="overflow-hidden">
          <motion.div
            initial={{ y: "105%", opacity: 0 }}
            animate={
              active
                ? {
                    y: "0%",
                    opacity: 1,
                    transition: { duration: _duration, delay: delay + i * _stagger, ease },
                  }
                : {
                    y: "-105%",
                    opacity: 0,
                    transition: { duration: _duration * 0.6, delay: i * _stagger * 0.3, ease },
                  }
            }
            className={lineClassName}
          >
            {line}
          </motion.div>
        </div>
      ))}
    </div>
  );
}

// ============== FADE SLIDE — smooth, no blur ==============
interface FadeSlideProps {
  active: boolean;
  delay?: number;
  duration?: number;
  className?: string;
  children: React.ReactNode;
}

function FadeSlide({
  active,
  delay = 0,
  duration = 0.4,
  className = "",
  children,
}: FadeSlideProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={
        active
          ? {
              opacity: 1,
              y: 0,
              transition: { duration, delay, ease },
            }
          : {
              opacity: 0,
              y: -8,
              transition: { duration: duration * 0.5, ease },
            }
      }
    >
      {children}
    </motion.div>
  );
}

// ============== UI COMPONENTS ==============

function CountdownBox({
  label,
  value,
  theme = "light",
}: {
  label: string;
  value: string;
  theme?: "light" | "dark";
}) {
  const valueClass = "text-[#c4a484]";
  const labelClass =
    theme === "dark" ? "text-[#fdfbf7]/70" : "text-[#4a3525]/60";
  return (
    <div className="info-card flex min-w-[52px] flex-col items-center rounded-xl px-2 py-3 sm:min-w-[68px] sm:px-3 sm:py-4">
      <span className={`font-serif text-xl font-bold sm:text-3xl ${valueClass}`}>
        {value}
      </span>
      <span className={`mt-1 font-sans text-[8px] uppercase tracking-[0.25em] sm:text-[9px] sm:tracking-[0.3em] ${labelClass}`}>
        {label}
      </span>
    </div>
  );
}

// ============== SECTION WRAPPER — smooth, no blur ==============
interface SectionProps {
  active: boolean;
  children: React.ReactNode;
  theme?: "light" | "dark";
}

function Section({ active, children, theme = "light" }: SectionProps) {
  const bgClass = theme === "dark" ? "section-bg-dark" : "section-bg-light";

  return (
    <section
      className={`flex h-screen w-full items-center justify-center px-6 py-16 sm:px-8 ${bgClass}`}
      style={{ scrollSnapAlign: "start" }}
    >
      <motion.div
        className="flex h-full w-full max-w-2xl flex-col justify-center"
        initial={{ opacity: 0, y: 15 }}
        animate={
          active
            ? {
                opacity: 1,
                y: 0,
                transition: { duration: 0.8, ease },
              }
            : {
                opacity: 0,
                y: -10,
                transition: { duration: 0.5, ease },
              }
        }
      >
        {children}
      </motion.div>
    </section>
  );
}

// ============== SHARED ORNAMENTS ==============
function OrnamentFlourish({ className = "" }: { className?: string }) {
  return (
    <svg
      width="48"
      height="16"
      viewBox="0 0 72 24"
      fill="none"
      className={`text-[#c4a484] ${className}`}
    >
      <path
        d="M 4 12 Q 20 12 28 5 Q 34 -1 36 10 Q 38 21 44 5 Q 52 -1 68 12"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="36" cy="11" r="1.4" fill="currentColor" />
      <path
        d="M 12 12 Q 24 16 36 14 Q 48 16 60 12"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );
}

function OrnamentDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#c4a484]/40" />
      <OrnamentFlourish />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#c4a484]/40" />
    </div>
  );
}

// ============== MAIN: ALL DETAILS SECTIONS ==============

interface DetailsSectionsProps {
  groom: string;
  bride: string;
  groomInit: string;
  brideInit: string;
  activeSection: number;
}

export function DetailsSections({
  groom,
  bride,
  groomInit,
  brideInit,
  activeSection,
}: DetailsSectionsProps) {
  // ============ COUNTDOWN STATE ============
  const WEDDING_DATE = new Date("2026-12-27T11:00:00+07:00");
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    mins: 0,
    secs: 0,
  });

  useEffect(() => {
    const update = () => {
      const diff = WEDDING_DATE.getTime() - Date.now();
      const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
      const hours = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24));
      const mins = Math.max(0, Math.floor((diff / (1000 * 60)) % 60));
      const secs = Math.max(0, Math.floor((diff / 1000) % 60));
      setTimeLeft({ days, hours, mins, secs });
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");

  // =================================================================
  // PACING — mỗi section dùng blockDuration() để tính timeline
  // Section fade-in ( CONTENT_START = 0.5s )
  // rồi mỗi block tiếp theo bắt đầu ngay khi block trước ổn định.
  // =================================================================
  const S2a = blockDur("Vì bạn là một phần của hành trình");     // ≈ 1.04s
  const S2b = blockDur("Có những người không xuất hiện trong mọi khoảnh khắc, nhưng luôn có một vị trí rất riêng trong câu chuyện của chúng mình."); // ≈ 6.5s
  const S2c = blockDur("Và bạn là một trong những người như thế."); // ≈ 1.26s

  const S3a = blockDur("Hẹn gặp bạn");                           // ≈ 0.47s
  const S3b = blockDur("Sự hiện diện của bạn sẽ khiến ngày đặc biệt ấy trở nên ấm áp và ý nghĩa hơn với chúng mình."); // ≈ 2.7s
  const S3c = blockDur("Hẹn gặp bạn trong ngày chúng mình chính thức về chung một nhà."); // ≈ 2.7s

  const GAP = 0.12; // khoảng trống nhẹ giữa các block

  // Timeline cho Section 2 (Welcome)
  const s2_t1 = CONTENT_START;                                    // 0.5
  const s2_t2 = s2_t1 + S2a + GAP;                                    // ≈ 1.66
  const s2_t3 = s2_t2 + S2b + GAP;                                   // ≈ 8.28
  const s2_t4 = s2_t3 + S2c + GAP;                                    // ≈ 9.66

  // Timeline cho Section 3 (Hẹn gặp bạn)
  const s3_t1 = CONTENT_START;                                   // 0.5
  const s3_t2 = s3_t1 + S3a + GAP;                                    // ≈ 1.09
  const s3_t3 = s3_t2 + S3b + GAP;                                    // ≈ 3.91
  const s3_t4 = s3_t3 + S3c + GAP;                                    // ≈ 6.73

  const is2 = activeSection === 1;
  const is3 = activeSection === 2;
  const is4 = activeSection === 3;

  return (
    <>
      {/* ================================================================
          SECTION 2: WELCOME / LỜI MỜI  — Nền nâu, không gian ấm áp
          ================================================================ */}
      <Section active={is2} theme="dark">
        <div className="flex flex-col items-center gap-6 sm:gap-8">

          {/* Monogram: T & H */}
          <MonogramArt theme="dark" size={100} delay={s2_t1} active={is2} />

          {/* Eyebrow */}
          <FadeSlide active={is2} delay={s2_t1 + 0.1} duration={0.3}>
            <p className="font-sans text-[10px] uppercase tracking-[0.5em] text-[#c4a484] sm:text-xs">
              Lời mời
            </p>
          </FadeSlide>

          {/* Tiêu đề */}
          <div className="text-center">
            <SplitText
              as="h2"
              text="Vì bạn là một phần của hành trình"
              active={is2}
              delay={s2_t2}
              className="font-serif text-2xl font-bold leading-snug text-[#fdfbf7] sm:text-3xl md:text-4xl"
            />
          </div>

          {/* Đường kẻ */}
          <FadeSlide active={is2} delay={s2_t2 + 0.2} duration={0.4}>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#c4a484]/50 to-transparent" />
          </FadeSlide>

          {/* Nội dung — 3 dòng */}
          <div className="max-w-md space-y-0 text-center">
            <LineReveal
              lines={[
                "Có những người không xuất hiện trong mọi khoảnh khắc,",
                "nhưng luôn có một vị trí rất riêng",
                "trong câu chuyện của chúng mình.",
              ]}
              active={is2}
              delay={s2_t3}
              className="space-y-3 font-serif text-base leading-relaxed text-[#fdfbf7]/75 sm:text-lg"
            />
          </div>

          {/* Quote */}
          <FadeSlide active={is2} delay={s2_t4} duration={0.4}>
            <p className="max-w-sm font-serif text-base italic text-[#fdfbf7] sm:text-lg">
              Và bạn là một trong những người như thế.
            </p>
          </FadeSlide>

          {/* Divider */}
          <FadeSlide active={is2} delay={s2_t4 + 0.2} duration={0.5}>
            <OrnamentDivider className="w-48 opacity-60" />
          </FadeSlide>
        </div>
      </Section>

      {/* ================================================================
          SECTION 3: HẸN GẶP BẠN — Nền be, nhẹ nhàng và thân thiện
          ================================================================ */}
      <Section active={is3}>
        <div className="flex flex-col items-center gap-6 sm:gap-8">

          {/* Eyebrow + Constellation */}
          <FadeSlide active={is3} delay={s3_t1} duration={0.3}>
            <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.5em] text-[#c4a484] sm:text-xs">
              Gửi đến bạn
            </p>
          </FadeSlide>

          {/* Lotus: Hoa sen — Kênh, Cẩm Bình */}
          <LotusArt theme="light" size={120} delay={s3_t1 + 0.1} active={is3} />

          {/* Tiêu đề chính */}
          <div className="text-center">
            <SplitText
              as="h2"
              text="Hẹn gặp bạn"
              active={is3}
              delay={s3_t2}
              className="font-serif text-3xl font-bold text-[#4a3525] sm:text-4xl md:text-5xl"
            />
          </div>

          {/* Thông tin ngày-giờ-địa điểm */}
          <FadeSlide active={is3} delay={s3_t2 + 0.2} duration={0.5}>
            <div className="flex items-center gap-4 rounded-2xl border border-[#c4a484]/25 bg-[#fdfbf7]/60 px-6 py-4 backdrop-blur-sm sm:gap-6">
              {/* Date */}
              <div className="flex flex-col items-center">
                <span className="font-serif text-2xl font-bold text-[#4a3525] sm:text-3xl">27</span>
                <span className="font-sans text-[9px] uppercase tracking-widest text-[#c4a484]">Tháng 12</span>
              </div>
              <div className="h-10 w-px bg-[#c4a484]/30" />
              {/* Time */}
              <div className="flex flex-col items-center">
                <span className="font-serif text-2xl font-bold text-[#4a3525] sm:text-3xl">11:00</span>
                <span className="font-sans text-[9px] uppercase tracking-widest text-[#c4a484]">Chủ nhật</span>
              </div>
              <div className="h-10 w-px bg-[#c4a484]/30" />
              {/* Location */}
              <div className="flex flex-col items-center">
                <span className="font-serif text-2xl font-bold text-[#4a3525] sm:text-3xl">Kênh</span>
                <span className="font-sans text-[9px] uppercase tracking-widest text-[#c4a484]">Cẩm Bình · Hà Tĩnh</span>
              </div>
            </div>
          </FadeSlide>

          {/* Quote */}
          <FadeSlide active={is3} delay={s3_t3} duration={0.4}>
            <p className="max-w-md text-center font-serif text-base italic leading-relaxed text-[#4a3525]/80 sm:text-lg">
              Sự hiện diện của bạn sẽ khiến ngày đặc biệt ấy
              <br />
              trở nên ấm áp và ý nghĩa hơn với chúng mình.
            </p>
          </FadeSlide>

          {/* Hai dòng kết */}
          <div className="max-w-md text-center">
            <LineReveal
              lines={[
                "Hẹn gặp bạn trong ngày chúng mình",
                "chính thức về chung một nhà.",
              ]}
              active={is3}
              delay={s3_t4}
              className="space-y-3 font-serif text-base italic text-[#c4a484] sm:text-lg"
            />
          </div>

          {/* Divider */}
          <FadeSlide active={is3} delay={s3_t4 + 0.2} duration={0.5}>
            <OrnamentDivider className="w-48 opacity-60" />
          </FadeSlide>
        </div>
      </Section>

      {/* ================================================================
          SECTION 4: COUNTDOWN + CTA + FOOTER — Nền nâu, giàu thông tin
          ================================================================ */}
      <Section active={is4} theme="dark">
        <div className="flex flex-col items-center gap-5 sm:gap-7">

          {/* Ring Art: 2 Wedding Rings */}
          <RingArt theme="dark" size={120} delay={0.5} active={is4} />

          {/* Countdown */}
          <FadeSlide active={is4} delay={0.8} duration={0.5}>
            <div className="flex flex-col items-center gap-3">
              <p className="font-sans text-[10px] uppercase tracking-[0.5em] text-[#c4a484] sm:text-xs">
                Đếm ngược
              </p>
              <div className="flex items-center gap-2 sm:gap-3">
                <CountdownBox label="Ngày" value={pad(timeLeft.days)} theme="dark" />
                <span className="font-serif text-2xl text-[#c4a484]/40 sm:text-3xl">:</span>
                <CountdownBox label="Giờ" value={pad(timeLeft.hours)} theme="dark" />
                <span className="font-serif text-2xl text-[#c4a484]/40 sm:text-3xl">:</span>
                <CountdownBox label="Phút" value={pad(timeLeft.mins)} theme="dark" />
                <span className="font-serif text-2xl text-[#c4a484]/40 sm:text-3xl">:</span>
                <CountdownBox label="Giây" value={pad(timeLeft.secs)} theme="dark" />
              </div>
              <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-[#fdfbf7]/50 sm:text-xs">
                27 · 12 · 2026 — 11:00
              </p>
            </div>
          </FadeSlide>

          {/* CTA Cards — 2 cột trên desktop */}
          <motion.div
            initial="hidden"
            animate={is4 ? "visible" : "hidden"}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.15, delayChildren: 1.5 } },
            }}
            className="flex w-full max-w-lg flex-col gap-3 sm:flex-row"
          >
            {[
              {
                href: "https://cuoithoi.pages.dev/",
                title: "Xác nhận tham dự",
                desc: "Giúp chúng mình chuẩn bị chu đáo",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c4a484" strokeWidth="1.6">
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                ),
              },
              {
                href: "https://maps.app.goo.gl/e4oAwHzgSMPdMJQMA",
                title: "Địa điểm tổ chức",
                desc: "Kênh · Cẩm Bình · Hà Tĩnh",
                icon: (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c4a484" strokeWidth="1.6">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                ),
              },
            ].map((card, i) => (
              <motion.a
                key={i}
                href={card.href}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
                }}
                className="info-card group flex flex-1 items-center gap-3 rounded-2xl p-4 transition-all duration-700 sm:gap-4 sm:p-5"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#fdfbf7] ring-1 ring-[#c4a484]/30 sm:h-12 sm:w-12">
                  {card.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-base font-bold text-[#fdfbf7] sm:text-lg">
                    {card.title}
                  </span>
                  <span className="block truncate font-sans text-[11px] text-[#fdfbf7]/60 sm:text-xs">
                    {card.desc}
                  </span>
                </div>
                <div className="text-[#c4a484] transition-transform duration-700 group-hover:translate-x-1">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.a>
            ))}
          </motion.div>

          {/* Divider + lời chúc + footer */}
          <FadeSlide active={is4} delay={2.2} duration={0.5}>
            <OrnamentDivider className="w-40 opacity-70" />
          </FadeSlide>

          <SplitText
            as="p"
            text="Sự hiện diện của bạn là món quà quý giá nhất"
            active={is4}
            delay={2.4}
            className="text-center font-serif text-lg italic text-[#fdfbf7] sm:text-xl"
          />

          <FadeSlide active={is4} delay={2.8} duration={0.4}>
            <div className="flex flex-col items-center gap-1">
              <p className="font-serif text-lg text-[#fdfbf7] sm:text-xl">
                {groomInit} <span className="text-[#c4a484]">&</span> {brideInit}
              </p>
              <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-[#fdfbf7]/50 sm:text-xs">
                27 · 12 · 2026
              </p>
            </div>
          </FadeSlide>

          <FadeSlide active={is4} delay={3.0} duration={0.4}>
            <OrnamentFlourish className="w-12 opacity-50" />
          </FadeSlide>
        </div>
      </Section>
    </>
  );
}
