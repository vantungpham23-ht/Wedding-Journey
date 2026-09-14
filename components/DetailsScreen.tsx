"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

// ============== ANIMATION HELPERS ==============
const ease = [0.16, 1, 0.3, 1]; // Cinematic ease (đã chậm hơn nhờ stagger/duration tăng)

// ============== SPLIT TEXT - từng chữ fade-up mượt mà ==============
// Hiệu ứng "lời thì thầm" - mỗi ký tự xuất hiện theo thứ tự
interface SplitTextProps {
  text: string;
  active: boolean;
  delay?: number;        // delay trước khi bắt đầu
  stagger?: number;       // khoảng cách giữa các chữ (giây)
  duration?: number;      // thời gian mỗi chữ
  className?: string;
  as?: "p" | "h1" | "h2" | "h3" | "span";
}

function SplitText({
  text,
  active,
  delay = 0,
  stagger = 0.08,
  duration = 1.6,
  className = "",
  as: Tag = "p",
}: SplitTextProps) {
  const prefersReducedMotion = useReducedMotion();
  const chars = text.split("");

  if (prefersReducedMotion) {
    return (
      <Tag className={className}>
        {text}
      </Tag>
    );
  }

  return (
    <Tag className={className}>
      <span className="inline-block">
        {chars.map((char, i) => (
          <motion.span
            key={`${char}-${i}`}
            className="inline-block"
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            animate={
              active
                ? {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    transition: {
                      duration,
                      delay: delay + i * stagger,
                      ease,
                    },
                  }
                : {
                    opacity: 0,
                    y: -8,
                    filter: "blur(4px)",
                    transition: {
                      duration: 0.6,
                      delay: i * 0.02,
                      ease,
                    },
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

// ============== LINE REVEAL - từng dòng fade-up (cho text dài nhiều dòng) ==============
interface LineRevealProps {
  lines: string[];
  active: boolean;
  delay?: number;
  stagger?: number;       // giữa các dòng
  duration?: number;
  className?: string;
  lineClassName?: string;
}

function LineReveal({
  lines,
  active,
  delay = 0,
  stagger = 0.36,
  duration = 2,
  className = "",
  lineClassName = "",
}: LineRevealProps) {
  return (
    <div className={className}>
      {lines.map((line, i) => (
        <div key={i} className="overflow-hidden">
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={
              active
                ? {
                    y: "0%",
                    opacity: 1,
                    transition: {
                      duration,
                      delay: delay + i * stagger,
                      ease,
                    },
                  }
                : {
                    y: "-100%",
                    opacity: 0,
                    transition: {
                      duration: 0.8,
                      delay: i * 0.1,
                      ease,
                    },
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

// ============== FADE BLUR - cho text ngắn (eyebrow, date...) ==============
interface FadeBlurProps {
  active: boolean;
  delay?: number;
  duration?: number;
  className?: string;
  children: React.ReactNode;
}

function FadeBlur({ active, delay = 0, duration = 2, className = "", children }: FadeBlurProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
      animate={
        active
          ? {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { duration, delay, ease },
            }
          : {
              opacity: 0,
              y: -10,
              filter: "blur(6px)",
              transition: { duration: 0.8, ease },
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
  const valueClass =
    theme === "dark" ? "text-[#c4a484]" : "text-[#c4a484]";
  const labelClass =
    theme === "dark" ? "text-[#fdfbf7]/70" : "text-[#4a3525]/60";
  return (
    <div className="info-card flex min-w-[55px] flex-col items-center rounded-xl px-2 py-3 sm:min-w-[72px] sm:px-3 sm:py-4">
      <span className={`font-serif text-xl font-bold sm:text-3xl ${valueClass}`}>
        {value}
      </span>
      <span
        className={`mt-1 font-sans text-[8px] uppercase tracking-[0.25em] sm:text-[9px] sm:tracking-[0.3em] ${labelClass}`}
      >
        {label}
      </span>
    </div>
  );
}

function CTACard({
  icon,
  title,
  desc,
  href,
  theme = "light",
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  href: string;
  theme?: "light" | "dark";
}) {
  const titleClass =
    theme === "dark" ? "text-[#fdfbf7]" : "text-[#4a3525]";
  const descClass =
    theme === "dark" ? "text-[#fdfbf7]/70" : "text-[#4a3525]/60";
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="info-card group flex items-center gap-3 rounded-2xl p-4 transition-all duration-700 sm:gap-4 sm:p-5"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#fdfbf7] ring-1 ring-[#c4a484]/30 sm:h-12 sm:w-12">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <span className={`block truncate font-serif text-base font-bold sm:text-lg ${titleClass}`}>
          {title}
        </span>
        <span className={`block truncate font-sans text-[11px] sm:text-xs ${descClass}`}>
          {desc}
        </span>
      </div>

      <div className="text-[#c4a484] transition-transform duration-700 group-hover:translate-x-1">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </div>
    </motion.a>
  );
}

// ============== SECTION WRAPPER ==============
// theme: "light" = nền be + chữ nâu | "dark" = nền nâu + chữ be

interface SectionProps {
  active: boolean;
  children: React.ReactNode;
  theme?: "light" | "dark";
}

function Section({ active, children, theme = "light" }: SectionProps) {
  const prefersReducedMotion = useReducedMotion();

  const bgClass =
    theme === "dark" ? "section-bg-dark" : "section-bg-light";

  return (
    <section
      className={`flex h-screen w-full items-center justify-center px-4 py-20 sm:px-6 ${bgClass}`}
      style={{ scrollSnapAlign: "start" }}
    >
      <motion.div
        className="w-full max-w-2xl"
        initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
        animate={
          active
            ? {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: { duration: 2, ease: [0.16, 1, 0.3, 1] },
              }
            : {
                opacity: 0,
                y: -20,
                filter: "blur(8px)",
                transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
              }
        }
      >
        {children}
      </motion.div>
    </section>
  );
}

// ============== MAIN: ALL DETAILS SECTIONS ==============

interface DetailsSectionsProps {
  groom: string;
  bride: string;
  groomInit: string;
  brideInit: string;
  activeSection: number;
  onSectionClick: (idx: number) => void;
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

  // ============ SECTION 2: WELCOME / LỜI MỜI ============
  // (Bỏ "Lời mời cưới" cover section vì trùng Save the Date)
  // Bắt đầu từ section 2: Welcome (lời mời/cảm ơn)
  return (
    <>
      {/* SECTION 2: WELCOME - NỀN NÂU */}
      <Section active={activeSection === 1} theme="dark">
        <div className="text-center">
          <FadeBlur active={activeSection === 1} delay={0.4} duration={2}>
            <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.5em] text-[#c4a484]">
              Lời mời
            </p>
          </FadeBlur>

          <SplitText
            as="h3"
            text="Vì bạn là một phần của hành trình"
            active={activeSection === 1}
            delay={0.8}
            stagger={0.07}
            duration={2}
            className="mb-8 font-serif text-2xl font-bold text-[#fdfbf7] sm:text-3xl md:text-4xl"
          />

          <LineReveal
            lines={[
              "Có những người không xuất hiện trong mọi khoảnh khắc,",
              "nhưng luôn có một vị trí rất riêng",
              "trong câu chuyện của chúng mình.",
            ]}
            active={activeSection === 1}
            delay={2.8}
            stagger={0.4}
            duration={2}
            className="mx-auto mb-6 max-w-md space-y-1 font-serif text-base leading-relaxed text-[#fdfbf7]/80 sm:text-lg"
            lineClassName=""
          />

          <FadeBlur active={activeSection === 1} delay={4.2} duration={2}>
            <p className="mx-auto max-w-md font-serif text-base font-semibold italic text-[#fdfbf7] sm:text-lg">
              Và bạn là một trong những người như thế.
            </p>
          </FadeBlur>

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={
              activeSection === 1
                ? { opacity: 1, scale: 1, transition: { delay: 4.8, duration: 1.2 } }
                : { opacity: 0, scale: 0 }
            }
            className="mt-8 flex justify-center sm:mt-10"
          >
            <svg width="20" height="6" viewBox="0 0 24 8" fill="none" className="text-[#c4a484]">
              <path d="M 1 4 Q 6 4 9 1.5 Q 11.5 -0.5 12 4 Q 12.5 8.5 15 1.5 Q 18 -0.5 23 4" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" fill="none" />
            </svg>
          </motion.div>
        </div>
      </Section>

      {/* SECTION 3: HẸN GẶP BẠN - nền be */}
      <Section active={activeSection === 2}>
        <div className="text-center">
          <FadeBlur active={activeSection === 2} delay={0.4} duration={2}>
            <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.5em] text-[#c4a484]">
              Gửi đến bạn
            </p>
          </FadeBlur>

          <SplitText
            as="h3"
            text="Hẹn gặp bạn"
            active={activeSection === 2}
            delay={0.8}
            stagger={0.14}
            duration={2}
            className="mb-8 font-serif text-3xl font-bold text-[#4a3525] sm:text-4xl md:text-5xl"
          />

          <FadeBlur active={activeSection === 2} delay={2.4} duration={2}>
            <p className="mx-auto mb-6 max-w-md font-serif text-base italic leading-relaxed text-[#4a3525]/80 sm:text-lg">
              Sự hiện diện của bạn sẽ khiến ngày đặc biệt ấy
              <br />
              trở nên ấm áp và ý nghĩa hơn với chúng mình.
            </p>
          </FadeBlur>

          <LineReveal
            lines={[
              "Hẹn gặp bạn trong ngày chúng mình",
              "chính thức về chung một nhà.",
            ]}
            active={activeSection === 2}
            delay={3.2}
            stagger={0.5}
            duration={2}
            className="font-serif text-base italic text-[#c4a484] sm:text-lg"
            lineClassName=""
          />

          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={
              activeSection === 2
                ? { opacity: 1, scale: 1, transition: { delay: 4.4, duration: 1.2 } }
                : { opacity: 0, scale: 0 }
            }
            className="mt-8 flex justify-center sm:mt-10"
          >
            <svg width="24" height="8" viewBox="0 0 60 20" fill="none" className="text-[#c4a484]">
              <path d="M 2 10 Q 15 10 22 4 Q 28 -1 30 8 Q 32 17 38 4 Q 45 -1 58 10" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" fill="none" />
              <circle cx="30" cy="10" r="1.1" fill="currentColor" />
            </svg>
          </motion.div>
        </div>
      </Section>

      {/* SECTION 4: COUNTDOWN + CTA CARDS + FOOTER (gộp) - NỀN NÂU */}
      <Section active={activeSection === 3} theme="dark">
        <div className="text-center">
          {/* Pulsing flourish thay cho heart */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={
              activeSection === 3
                ? { opacity: 1, scale: 1, transition: { delay: 0.4, duration: 1.6 } }
                : { opacity: 0 }
            }
            className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center sm:mb-8 sm:h-20 sm:w-20"
          >
            <motion.span
              className="absolute inset-0 rounded-full border border-[#c4a484]/30"
              animate={{ scale: [1, 1.4, 1.6], opacity: [0.5, 0.2, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.span
              className="absolute inset-0 rounded-full border border-[#c4a484]/30"
              animate={{ scale: [1, 1.4, 1.6], opacity: [0.5, 0.2, 0] }}
              transition={{ duration: 5, delay: 2.5, repeat: Infinity, ease: "easeOut" }}
            />
            <svg width="42" height="14" viewBox="0 0 60 20" fill="none" className="text-[#c4a484]">
              <path d="M 2 10 Q 15 10 22 4 Q 28 -1 30 8 Q 32 17 38 4 Q 45 -1 58 10" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" />
              <circle cx="30" cy="10" r="1.2" fill="currentColor" />
            </svg>
          </motion.div>

          {/* Names với flourish divider */}
          <FadeBlur active={activeSection === 3} delay={0.8} duration={2}>
            <div className="mb-6 flex items-center justify-center gap-3 sm:gap-4">
              <span className="h-px w-10 bg-[#c4a484]/40 sm:w-12" />
              <svg width="16" height="6" viewBox="0 0 24 8" fill="none" className="text-[#c4a484]">
                <path d="M 1 4 Q 6 4 9 1.5 Q 11.5 -0.5 12 4 Q 12.5 8.5 15 1.5 Q 18 -0.5 23 4" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" fill="none" />
              </svg>
              <span className="h-px w-10 bg-[#c4a484]/40 sm:w-12" />
            </div>
          </FadeBlur>

          {/* Names - SplitText */}
          <SplitText
            as="h3"
            text={`${groom} & ${bride}`}
            active={activeSection === 3}
            delay={1.2}
            stagger={0.08}
            duration={1.8}
            className="mb-8 font-serif text-xl font-bold text-[#fdfbf7] sm:text-2xl"
          />

          {/* Countdown */}
          <FadeBlur active={activeSection === 3} delay={2.8} duration={2}>
            <div className="my-6">
              <p className="mb-3 font-sans text-[10px] uppercase tracking-[0.4em] text-[#c4a484]">
                Đếm ngược
              </p>

              <div className="mx-auto flex max-w-md items-center justify-center gap-1.5 sm:gap-2">
                <CountdownBox label="Ngày" value={pad(timeLeft.days)} theme="dark" />
                <span className="font-serif text-lg text-[#c4a484]/40 sm:text-2xl">:</span>
                <CountdownBox label="Giờ" value={pad(timeLeft.hours)} theme="dark" />
                <span className="font-serif text-lg text-[#c4a484]/40 sm:text-2xl">:</span>
                <CountdownBox label="Phút" value={pad(timeLeft.mins)} theme="dark" />
                <span className="font-serif text-lg text-[#c4a484]/40 sm:text-2xl">:</span>
                <CountdownBox label="Giây" value={pad(timeLeft.secs)} theme="dark" />
              </div>

              <p className="mt-3 font-sans text-[10px] uppercase tracking-[0.4em] text-[#fdfbf7]/60">
                27 · 12 · 2026 — 11:00
              </p>
            </div>
          </FadeBlur>

          {/* CTA Cards - stagger */}
          <motion.div
            initial="hidden"
            animate={activeSection === 3 ? "visible" : "hidden"}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.3, delayChildren: 3.6 },
              },
            }}
            className="mx-auto mt-6 flex max-w-md flex-col gap-2.5 sm:gap-3"
          >
            {[
              {
                href: "https://cuoithoi.pages.dev/",
                title: "Xác nhận tham dự",
                desc: "Giúp chúng mình chuẩn bị chu đáo",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c4a484" strokeWidth="1.6">
                    <path d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                ),
              },
              {
                href: "https://maps.app.goo.gl/P9oQwKuYT3QgMK4x9",
                title: "Địa điểm tổ chức",
                desc: "Kênh · Cẩm Bình, Hà Tĩnh",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c4a484" strokeWidth="1.6">
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
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -20, filter: "blur(6px)" }}
                animate={
                  activeSection === 3
                    ? {
                        opacity: 1,
                        x: 0,
                        filter: "blur(0px)",
                        transition: { duration: 1.8, ease },
                      }
                    : {
                        opacity: 0,
                        x: -10,
                        filter: "blur(4px)",
                        transition: { duration: 0.6 },
                      }
                }
                className="info-card group flex items-center gap-3 rounded-2xl p-4 transition-all duration-700 sm:gap-4 sm:p-5"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#fdfbf7] ring-1 ring-[#c4a484]/30 sm:h-12 sm:w-12">
                  {card.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-base font-bold text-[#fdfbf7] sm:text-lg">
                    {card.title}
                  </span>
                  <span className="block truncate font-sans text-[11px] text-[#fdfbf7]/70 sm:text-xs">
                    {card.desc}
                  </span>
                </div>
                <div className="text-[#c4a484] transition-transform duration-700 group-hover:translate-x-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.a>
            ))}
          </motion.div>

          {/* === FOOTER (gộp vào đây) === */}
          {/* Divider flourish */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={
              activeSection === 3
                ? { opacity: 1, scaleX: 1, transition: { delay: 4.8, duration: 1.6 } }
                : { opacity: 0 }
            }
            className="mb-8 mt-12 flex items-center justify-center gap-3 sm:mb-12 sm:mt-16 sm:gap-4"
            style={{ transformOrigin: "center" }}
          >
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#c4a484]/40 sm:w-16" />
            <svg width="24" height="8" viewBox="0 0 60 20" fill="none" className="text-[#c4a484]">
              <path d="M 2 10 Q 15 10 22 4 Q 28 -1 30 8 Q 32 17 38 4 Q 45 -1 58 10" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" fill="none" />
              <circle cx="30" cy="10" r="1.2" fill="currentColor" />
            </svg>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#c4a484]/40 sm:w-16" />
          </motion.div>

          {/* Lời chúc cuối - SplitText */}
          <SplitText
            as="p"
            text="Sự hiện diện của bạn là món quà quý giá nhất"
            active={activeSection === 3}
            delay={5.2}
            stagger={0.08}
            duration={1.8}
            className="mb-8 font-serif text-xl italic text-[#fdfbf7] sm:text-2xl md:text-3xl"
          />

          <FadeBlur active={activeSection === 3} delay={6.8} duration={2}>
            <div className="flex flex-col items-center gap-2">
              <p className="font-serif text-lg text-[#fdfbf7] sm:text-xl">
                {groomInit} <span className="text-[#c4a484]">&</span> {brideInit}
              </p>
              <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-[#fdfbf7]/60">
                27 · 12 · 2026
              </p>
            </div>
          </FadeBlur>

          {/* Footer flourish - thay heart đập */}
          <motion.div
            className="mt-8 flex justify-center"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={
              activeSection === 3
                ? { opacity: 1, scaleX: 1, transition: { delay: 7.2, duration: 1.6 } }
                : { opacity: 0 }
            }
            style={{ transformOrigin: "center" }}
          >
            <svg width="32" height="10" viewBox="0 0 60 20" fill="none" className="text-[#c4a484]/60">
              <path d="M 2 10 Q 15 10 22 4 Q 28 -1 30 8 Q 32 17 38 4 Q 45 -1 58 10" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" fill="none" />
              <circle cx="30" cy="10" r="1" fill="currentColor" />
            </svg>
          </motion.div>
        </div>
      </Section>
    </>
  );
}
