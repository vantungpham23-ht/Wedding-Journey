import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'
import './CardOverlay.css'

interface SectionProps {
  active: boolean
  index: number
}

const useInView = (active: boolean, delay = 0): boolean => {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (!active) { setShown(false); return }
    const t = setTimeout(() => setShown(true), delay)
    return () => clearTimeout(t)
  }, [active, delay])
  return shown
}

const Heart = ({ size = 24, fill = '#8B1A2B', stroke = '#C9A84C' }: { size?: number; fill?: string; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
    <defs>
      <linearGradient id={`heartGrad-${fill.replace('#','')}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={fill} />
        <stop offset="50%" stopColor={fill} />
        <stop offset="100%" stopColor="#4a1520" />
      </linearGradient>
      <filter id={`heartShadow-${fill.replace('#','')}`} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.8" floodColor="#2a0a10" floodOpacity="0.5"/>
      </filter>
    </defs>
    <path
      d="M16 28 C16 28 4 19 4 11 C4 6 8 2 13 2 C14.5 2 16 3 16 3 C16 3 17.5 2 19 2 C24 2 28 6 28 11 C28 19 16 28 16 28Z"
      fill={`url(#heartGrad-${fill.replace('#','')})`}
      stroke={stroke}
      strokeWidth="0.8"
      filter={`url(#heartShadow-${fill.replace('#','')})`}
    />
    {/* Highlight for 3D effect */}
    <path
      d="M10 9 C10 7 11 6 13 6 C13.5 6 14 6.2 14.5 6.5 C13 5.5 11.5 5.5 10 6.5 C9 7.5 9 9 10 9Z"
      fill="rgba(255,255,255,0.15)"
    />
  </svg>
)

const Ornament = () => (
  <div className="overlay-ornament">
    <span className="overlay-ornament-line" />
    <Heart size={14} />
    <span className="overlay-ornament-line" />
  </div>
)

const Plane = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1L15 22v-1.5L13 19v-5.5l8 2.5z"
      fill="#C9A84C" stroke="#C9A84C" strokeWidth="0.4" strokeLinejoin="round" />
  </svg>
)

const Ring = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <ellipse cx="16" cy="22" rx="9" ry="3" stroke="#C9A84C" strokeWidth="1.2" fill="none" />
    <path d="M11 22 L13 8 L19 8 L21 22" stroke="#C9A84C" strokeWidth="1.2" fill="rgba(201,168,76,0.18)" />
    <circle cx="16" cy="7" r="2" fill="#C9A84C" />
  </svg>
)

/* ═════════ SECTION 1 — Cover ═════════ */
const Cover: ComponentType<SectionProps> = ({ active }) => {
  const show = useInView(active, 200)
  return (
    <div className={`overlay overlay-center ${show ? 'overlay-show' : ''}`}>
      <p className="overlay-eyebrow">— Lời mời cưới —</p>
      <div className="cover-monogram">
        <span className="cover-mono-groom">T</span>
        <Heart size={28} fill="#C9A84C" stroke="#C9A84C" />
        <span className="cover-mono-bride">H</span>
      </div>
      <h1 className="overlay-title">
        <span className="overlay-title-line">Tùng Phạm</span>
        <span className="overlay-title-amp">&amp;</span>
        <span className="overlay-title-line">Thuý Hằng</span>
      </h1>
      <Ornament />
      <p className="overlay-eyebrow">trân trọng kính mời</p>
      <p className="overlay-place">đến dự lễ cưới của chúng mình</p>
      <div className="cover-date-block">
        <div className="cover-date-num">27 . 12 . 2026</div>
        <div className="cover-date-place">Cẩm Bình — Hà Tĩnh</div>
      </div>
    </div>
  )
}

/* ═════════ SECTION 2 — How we met ═════════ */
const HowWeMet: ComponentType<SectionProps> = ({ active }) => {
  const show = useInView(active, 200)
  return (
    <div className={`overlay overlay-story ${show ? 'overlay-show' : ''}`}>
      <div className="chapter-num">Chương I</div>
      <p className="overlay-eyebrow">Khi định mệnh gõ cửa</p>
      <h2 className="overlay-h2">Ta gặp nhau</h2>
      <Ornament />
      <p className="overlay-body overlay-body-center">
        Trong một lần trượt ngón trên mạng xã hội, một tin nhắn bằng tiếng Việt giữa đêm châu Âu
        đã thay đổi tất cả. Hai con người, hai phương trời — một đứa ở Hà Tĩnh, một đứa đang
        đi làm tại EU — chẳng ai nghĩ rằng một cuộc trò chuyện vu vơ lại trở thành định mệnh.
      </p>
      <div className="story-meta">
        <div className="story-meta-item">
          <span className="story-meta-num">7</span>
          <span className="story-meta-label">múi giờ</span>
        </div>
        <Heart size={12} fill="#C9A84C" />
        <div className="story-meta-item">
          <span className="story-meta-num">9.657</span>
          <span className="story-meta-label">km</span>
        </div>
      </div>
      <p className="overlay-quote-overlay">
        "Cách xa nửa vòng trái đất, mà sao lại gần đến thế."
      </p>
    </div>
  )
}

/* ═════════ SECTION 3 — Distance ═════════ */
const Distance: ComponentType<SectionProps> = ({ active }) => {
  const show = useInView(active, 200)
  const [hour, setHour] = useState(0)

  useEffect(() => {
    if (!active) return
    const interval = setInterval(() => setHour(h => (h + 1) % 24), 200)
    return () => clearInterval(interval)
  }, [active])

  return (
    <div className={`overlay overlay-story ${show ? 'overlay-show' : ''}`}>
      <div className="chapter-num">Chương II</div>
      <p className="overlay-eyebrow">Yêu xa không phải là yêu một mình</p>
      <h2 className="overlay-h2">Hai phương trời,<br />một nhịp đập</h2>
      <Ornament />

      <div className="clock-grid">
        <div className="clock-card">
          <div className="clock-flag">🇻🇳</div>
          <div className="clock-city">Hà Tĩnh</div>
          <div className="clock-time">{String((hour + 5) % 24).padStart(2, '0')}:00</div>
          <div className="clock-label">đêm — đang đợi</div>
        </div>
        <div className="clock-divider">
          <Heart size={20} fill="#C9A84C" stroke="#C9A84C" />
        </div>
        <div className="clock-card">
          <div className="clock-flag">🇪🇺</div>
          <div className="clock-city">EU</div>
          <div className="clock-time">{String(hour).padStart(2, '0')}:00</div>
          <div className="clock-label">chiều — đang đi làm</div>
        </div>
      </div>

      <p className="overlay-body overlay-body-center">
        Những cuộc gọi video kéo dài từ khuya đến rạng sáng, những dòng tin nhắn dài hơn cả
        email công việc. Có những đêm cả hai cùng không ngủ được — chỉ vì muốn nghe giọng
        của nhau thêm một chút.
      </p>
      <p className="overlay-quote-overlay">
        "Yêu xa là đếm ngày, đếm giờ, và đếm cả những cuộc gọi nhỡ."
      </p>
    </div>
  )
}

/* ═════════ SECTION 4 — First meet ═════════ */
const FirstMeet: ComponentType<SectionProps> = ({ active }) => {
  const show = useInView(active, 200)
  return (
    <div className={`overlay overlay-story ${show ? 'overlay-show' : ''}`}>
      <div className="chapter-num">Chương III</div>
      <p className="overlay-eyebrow">Chuyến bay định mệnh</p>
      <h2 className="overlay-h2">Lần đầu gặp mặt</h2>
      <Ornament />
      <div className="plane-journey">
        <div className="plane-end">
          <span className="plane-city">EU</span>
          <span className="plane-iata">KE</span>
        </div>
        <div className="plane-line-wrap">
          <span className="plane-dash" />
          <Plane size={26} />
          <span className="plane-dash" />
          <span className="plane-flight">15 giờ bay</span>
        </div>
        <div className="plane-end">
          <span className="plane-city">Việt Nam</span>
          <span className="plane-iata">VII</span>
        </div>
      </div>
      <p className="overlay-body overlay-body-center">
        Mười lăm tiếng trên máy bay, một trái tim đập liên hồi — vừa hồi hộp, vừa sợ đây
        chỉ là giấc mơ. Nhưng khi nhìn thấy nhau ở sân bay, mọi khoảng cách, mọi đêm dài
        chờ đợi — tan biến trong một cái ôm. Từ giây phút đó, "yêu xa" không còn là
        danh từ nữa.
      </p>
      <p className="overlay-quote-overlay">
        "Chỉ cần gặp một lần, đủ để tin rằng đây là người của mình."
      </p>
    </div>
  )
}

/* ═════════ SECTION 5 — Proposal ═════════ */
const Proposal: ComponentType<SectionProps> = ({ active }) => {
  const show = useInView(active, 200)
  return (
    <div className={`overlay overlay-center ${show ? 'overlay-show' : ''}`}>
      <div className="chapter-num">Chương IV</div>
      <p className="overlay-eyebrow">Câu trả lời em đã chờ</p>
      <h2 className="overlay-h2">Lời cầu hôn</h2>
      <Ornament />

      <div className="proposal-scene">
        <Ring size={56} />
        <p className="proposal-line">"Em làm đám cưới với anh nhé?"</p>
        <p className="proposal-answer">
          <span className="proposal-yes">Có</span>
          <Heart size={20} fill="#C9A84C" />
        </p>
      </div>

      <p className="overlay-body overlay-body-center">
        Không cần khung cảnh quá lộng lẫy, không cần hàng ngàn bông hoa — chỉ cần hai bàn tay
        nắm chặt, một câu hỏi và một nụ cười qua nước mắt. Khoảnh khắc ấy đơn giản vậy thôi,
        nhưng đủ để Tùng biết: cả cuộc đời còn lại, anh muốn đi cùng một người.
      </p>
      <p className="overlay-quote-overlay">
        "Em đồng ý — câu nói ngắn nhất, nhưng ý nghĩa nhất."
      </p>
    </div>
  )
}

/* ═════════ SECTION 6 — Save the Date ═════════ */
const SaveDate: ComponentType<SectionProps> = ({ active }) => {
  const show = useInView(active, 200)
  return (
    <div className={`overlay overlay-center ${show ? 'overlay-show' : ''}`}>
      <div className="chapter-num">Chương V</div>
      <p className="overlay-eyebrow">Save the date</p>
      <h2 className="overlay-h2">Ngày trọng đại</h2>
      <Ornament />

      <div className="date-mono-grid">
        <div className="date-mono-block">
          <span className="date-mono-letter">H</span>
          <span className="date-mono-sub">Hằng</span>
        </div>
        <div className="date-mono-block">
          <span className="date-mono-letter">T</span>
          <span className="date-mono-sub">Tùng</span>
        </div>
      </div>

      <p className="overlay-place-name">Cẩm Bình, Hà Tĩnh</p>

      <div className="overlay-row">
        <div className="overlay-col">
          <div className="overlay-num">27</div>
          <div className="overlay-label">Tháng 12</div>
        </div>
        <div className="overlay-col overlay-col-divider">
          <div className="overlay-num">2026</div>
          <div className="overlay-label">Năm</div>
        </div>
        <div className="overlay-col">
          <div className="overlay-num">10H</div>
          <div className="overlay-label">Bắt đầu</div>
        </div>
      </div>

      <Ornament />
      <p className="overlay-place-name overlay-place-quote">
        Sự hiện diện của bạn<br />là món quà tuyệt vời nhất
      </p>
    </div>
  )
}

/* ═════════ SECTION 7 — Wedding Day Timeline ═════════ */
const WeddingDay: ComponentType<SectionProps> = ({ active }) => {
  const show = useInView(active, 200)
  return (
    <div className={`overlay overlay-story ${show ? 'overlay-show' : ''}`}>
      <div className="chapter-num">Chương VI</div>
      <p className="overlay-eyebrow">Ngày ấy, ngày này</p>
      <h2 className="overlay-h2">Hành trình một ngày</h2>
      <Ornament />

      <div className="timeline">
        {[
          { time: '09:00', title: 'Rước dâu', desc: 'Đoàn rước dâu từ nhà trai' },
          { time: '10:30', title: 'Lễ cưới', desc: 'Nghi thức tại tư gia nhà gái' },
          { time: '12:00', title: 'Tiệc cưới', desc: 'Đãi tiệc thân mật cùng gia đình' },
          { time: '15:00', title: 'Chụp ảnh', desc: 'Khoảnh khắc cùng người thân' },
          { time: '19:00', title: 'Lễ tối', desc: 'Đón khách quý đến chung vui' },
        ].map((it, i) => (
          <div
            key={i}
            className={`timeline-item ${show ? 'timeline-item-show' : ''}`}
            style={{ transitionDelay: `${i * 120 + 300}ms` }}
          >
            <div className="timeline-time">{it.time}</div>
            <div className="timeline-dot" />
            <div className="timeline-content">
              <div className="timeline-title">{it.title}</div>
              <div className="timeline-desc">{it.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <Ornament />
      <p className="overlay-place-name overlay-place-quote">
        Một ngày đầy ắp tiếng cười,<br />nước mắt và những cái ôm
      </p>
    </div>
  )
}

/* ═════════ SECTION 8 — Final / CTAs ═════════ */
const Final: ComponentType<SectionProps> = ({ active }) => {
  const show = useInView(active, 200)
  return (
    <div className={`overlay overlay-center ${show ? 'overlay-show' : ''}`}>
      <div className="final-heart-big">
        <Heart size={80} fill="#C9A84C" stroke="#C9A84C" />
      </div>
      <p className="overlay-eyebrow">Cám ơn bạn đã đọc đến đây</p>
      <h2 className="overlay-final-h">
        <span className="overlay-final-h-line">Tùng</span>
        <Heart size={22} fill="#722F37" />
        <span className="overlay-final-h-line">Hằng</span>
      </h2>
      <p className="overlay-final-quote">See you on 27.12.2026</p>

      <div className="final-cta-block">
        <p className="overlay-final-hint">Chọn một để tiếp tục</p>

        <a
          className="final-cta final-cta-primary"
          href="https://locnt1.my.canva.site/tungvahang"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="final-cta-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 9h18M7 13h4" />
            </svg>
          </span>
          <span className="final-cta-text">
            <span className="final-cta-title">Xem thiệp chi tiết</span>
            <span className="final-cta-sub">Câu chuyện & khoảnh khắc</span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </a>

        <a
          className="final-cta final-cta-secondary"
          href="https://cuoithoi.pages.dev/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="final-cta-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </span>
          <span className="final-cta-text">
            <span className="final-cta-title">Xác nhận tham dự</span>
            <span className="final-cta-sub">Giúp chúng mình chuẩn bị chu đáo</span>
          </span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14M13 5l7 7-7 7" />
          </svg>
        </a>
      </div>

      <p className="overlay-final-credit">Crafted with ❤ — Tùng &amp; Hằng</p>
    </div>
  )
}

export const sections: ComponentType<SectionProps>[] = [
  Cover,
  HowWeMet,
  Distance,
  FirstMeet,
  Proposal,
  SaveDate,
  WeddingDay,
  Final,
]
