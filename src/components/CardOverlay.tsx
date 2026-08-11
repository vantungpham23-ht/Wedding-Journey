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

/* ── SVG Heart Icon ── */
const Heart = ({ size = 24, fill = '#C9A84C', stroke = '#C9A84C' }: { size?: number; fill?: string; stroke?: string }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" style={{ filter: 'drop-shadow(0 0 6px rgba(201, 168, 76, 0.4))' }}>
    <path
      d="M16 28.5 C16 28.5 4 19.5 4 11.5 C4 6.5 8 2.5 13 2.5 C14.5 2.5 16 3.5 16 3.5 C16 3.5 17.5 2.5 19 2.5 C24 2.5 28 6.5 28 11.5 C28 19.5 16 28.5 16 28.5Z"
      fill={fill}
      stroke={stroke}
      strokeWidth="1"
    />
  </svg>
)

/* ── SECTION 1 — Cover ── */
const Cover: ComponentType<SectionProps> = ({ active }) => {
  const show = useInView(active, 200)
  return (
    <div className={`overlay overlay-center ${show ? 'overlay-show' : ''}`}>
      <p className="overlay-eyebrow">— Lời mời cưới —</p>

      <div className="cover-monogram">
        <span className="cover-mono-groom">T</span>
        <Heart size={28} />
        <span className="cover-mono-bride">H</span>
      </div>

      <h1 className="overlay-title">
        <span className="overlay-title-line">Tùng Phạm</span>
        <span className="overlay-title-amp">&</span>
        <span className="overlay-title-line">Thuý Hằng</span>
      </h1>

      <div className="cover-divider">
        <span className="cover-divider-line" />
        <Heart size={14} />
        <span className="cover-divider-line" />
      </div>

      <p className="cover-trong">Trân trọng kính mời</p>
      <p className="overlay-place cover-attend">đến dự lễ cưới của chúng mình</p>

      <div className="cover-date-block">
        <div className="cover-date-num">27 . 12 . 2026</div>
        <div className="cover-date-place">Kênh - Cẩm Bình — Hà Tĩnh</div>
      </div>
    </div>
  )
}

/* ── SECTION 2 — Welcome ── */
const Welcome: ComponentType<SectionProps> = ({ active }) => {
  const show = useInView(active, 200)
  return (
    <div className={`overlay overlay-center ${show ? 'overlay-show' : ''}`}>
      <p className="overlay-eyebrow">Lời mời</p>
      <h2 className="overlay-h2">Vì bạn là một phần của hành trình</h2>

      <p className="overlay-body overlay-body-center">
        Có những người không xuất hiện trong mọi khoảnh khắc,<br />
        nhưng luôn có một vị trí rất riêng<br />
        trong câu chuyện của chúng mình.
      </p>

      <p className="overlay-body overlay-body-center welcome-highlight">
        Và bạn là một trong những người như thế.
      </p>

      <div className="cover-monogram" style={{ marginTop: '16px' }}>
        <Heart size={32} />
      </div>
    </div>
  )
}

/* ── SECTION 3 — Thank you / Hẹn gặp bạn ── */
const ThankYou: ComponentType<SectionProps> = ({ active }) => {
  const show = useInView(active, 200)
  return (
    <div className={`overlay overlay-center ${show ? 'overlay-show' : ''}`}>
      <p className="overlay-eyebrow">Gửi đến bạn</p>
      <h2 className="overlay-h2">Hẹn gặp bạn</h2>

      <p className="overlay-body overlay-body-center">
      Sự hiện diện của bạn sẽ khiến ngày đặc biệt ấy trở nên ấm áp và ý nghĩa hơn với chúng mình.
      </p>

      <p className="overlay-quote-overlay">
        Hẹn gặp bạn trong ngày chúng mình<br />chính thức về chung một nhà.
      </p>

      <div className="cover-monogram" style={{ marginTop: '16px' }}>
        <Heart size={32} />
      </div>
    </div>
  )
}

/* ── SECTION 4 — Save Date ── */
const SaveDate: ComponentType<SectionProps> = ({ active }) => {
  const show = useInView(active, 200)
  return (
    <div className={`overlay overlay-center ${show ? 'overlay-show' : ''}`}>
      <p className="overlay-eyebrow">Save the date</p>
      <h2 className="overlay-h2">Ngày trọng đại</h2>

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

      <p className="overlay-place-name">Kênh - Cẩm Bình, Hà Tĩnh</p>

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
          <div className="overlay-num">11H</div>
          <div className="overlay-label">Bắt đầu</div>
        </div>
      </div>

      <p className="overlay-place-name overlay-place-quote">
        Sự hiện diện của bạn<br />là món quà tuyệt vời nhất
      </p>
    </div>
  )
}

/* ── Pause audio helper ── */
const pauseWeddingAudio = () => {
  if (typeof window !== 'undefined' && (window as any).__weddingPauseAudio) {
    (window as any).__weddingPauseAudio()
  }
}

/* ── SECTION 5 — Final / Countdown + CTAs ── */
const WEDDING_DATE = new Date('2026-12-27T10:00:00+07:00')
const UNLOCK_CARD_DATE = new Date('2026-12-15T00:00:00+07:00')

const Final: ComponentType<SectionProps> = ({ active }) => {
  const show = useInView(active, 200)
  const [now, setNow] = useState(Date.now())
  const [cardUnlocked, setCardUnlocked] = useState(Date.now() >= UNLOCK_CARD_DATE.getTime())

  useEffect(() => {
    const t = setInterval(() => {
      const n = Date.now()
      setNow(n)
      setCardUnlocked(n >= UNLOCK_CARD_DATE.getTime())
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const diff = WEDDING_DATE.getTime() - now
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  const hours = Math.max(0, Math.floor((diff / (1000 * 60 * 60)) % 24))
  const mins = Math.max(0, Math.floor((diff / (1000 * 60)) % 60))
  const secs = Math.max(0, Math.floor((diff / 1000) % 60))

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className={`overlay overlay-center ${show ? 'overlay-show' : ''}`}>
      {/* Hero heart animation */}
      <div className="final-hero">
        <div className="final-hero-ring final-hero-ring-1" />
        <div className="final-hero-ring final-hero-ring-2" />
        <div className="final-hero-heart">
          <Heart size={72} fill="#722F37" />
        </div>
      </div>

      {/* Names with decorative line */}
      <div className="final-names-block">
        <div className="final-ornament">
          <span className="final-ornament-line" />
          <Heart size={12} />
          <span className="final-ornament-line" />
        </div>
        <h2 className="final-names-title">
          <span>Tùng Phạm</span>
          <span className="final-names-amp">&</span>
          <span>Thuý Hằng</span>
        </h2>
        <div className="final-ornament">
          <span className="final-ornament-line" />
          <Heart size={12} />
          <span className="final-ornament-line" />
        </div>
      </div>

      {/* Countdown grid */}
      <div className="final-countdown-wrapper">
        <p className="final-countdown-label">Ngày trọng đại</p>
        <div className="final-countdown-grid">
          <div className="final-countdown-item">
            <span className="final-countdown-num">{pad(days)}</span>
            <span className="final-countdown-unit">Ngày</span>
          </div>
          <div className="final-countdown-sep">:</div>
          <div className="final-countdown-item">
            <span className="final-countdown-num">{pad(hours)}</span>
            <span className="final-countdown-unit">Giờ</span>
          </div>
          <div className="final-countdown-sep">:</div>
          <div className="final-countdown-item">
            <span className="final-countdown-num">{pad(mins)}</span>
            <span className="final-countdown-unit">Phút</span>
          </div>
          <div className="final-countdown-sep">:</div>
          <div className="final-countdown-item">
            <span className="final-countdown-num">{pad(secs)}</span>
            <span className="final-countdown-unit">Giây</span>
          </div>
        </div>
        <p className="final-countdown-date">27 · 12 · 2026 — 11:00</p>
      </div>

      {/* CTA Cards */}
      <div className="final-cta-cards">
        {/* Card 1: Confirm Attendance - Always open */}
        <a
          className="final-card final-card-primary"
          href="https://cuoithoi.pages.dev/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={pauseWeddingAudio}
        >
          <div className="final-card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <div className="final-card-content">
            <span className="final-card-title">Xác nhận tham dự</span>
            <span className="final-card-desc">Giúp chúng mình chuẩn bị chu đáo</span>
          </div>
          <div className="final-card-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </div>
        </a>

        {/* Card 2: View Detailed Card - Locked until 15/12 */}
        <div className={`final-card-wrapper ${cardUnlocked ? 'final-card-wrapper-unlocked' : ''}`}>
          {!cardUnlocked && (
            <div className="final-card-lock-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              <span>Mở 15.12.2026</span>
            </div>
          )}
          <a
            className={`final-card ${cardUnlocked ? 'final-card-secondary' : 'final-card-locked'}`}
            href={cardUnlocked ? "https://locnt1.my.canva.site/tungvahang" : undefined}
            target={cardUnlocked ? "_blank" : undefined}
            rel={cardUnlocked ? "noopener noreferrer" : undefined}
            onClick={(e) => {
              if (!cardUnlocked) {
                e.preventDefault()
              } else {
                pauseWeddingAudio()
              }
            }}
          >
            <div className="final-card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 9h18M7 13h4" />
              </svg>
            </div>
            <div className="final-card-content">
              <span className="final-card-title">Xem thiệp chi tiết</span>
              <span className="final-card-desc">
                {cardUnlocked ? 'Câu chuyện & khoảnh khắc' : 'Nội dung đang được chuẩn bị'}
              </span>
            </div>
            <div className="final-card-arrow">
              {cardUnlocked ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
              )}
            </div>
          </a>
        </div>

        {/* Card 3: Map - Always open */}
        <a
          className="final-card final-card-tertiary"
          href="https://maps.app.goo.gl/P9oQwKuYT3QgMK4x9"
          target="_blank"
          rel="noopener noreferrer"
          onClick={pauseWeddingAudio}
        >
          <div className="final-card-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
          </div>
          <div className="final-card-content">
            <span className="final-card-title">Địa điểm tổ chức</span>
            <span className="final-card-desc">Kênh - Cẩm Bình, Hà Tĩnh</span>
          </div>
          <div className="final-card-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </div>
        </a>
      </div>

      {/* Closing message */}
      <div className="final-closing">
        <p className="final-closing-text">
          Sự hiện diện của bạn<br />
          <span>là món quà quý giá nhất</span>
        </p>
      </div>

      {/* Credit */}
      <div className="final-credit">
        <div className="final-credit-ornament">
          <span className="final-credit-line" />
          <Heart size={10} />
          <span className="final-credit-line" />
        </div>
        <p className="final-credit-text">Tùng Phạm & Thuý Hằng — 2026</p>
      </div>
    </div>
  )
}

export const sections: ComponentType<SectionProps>[] = [
  Cover,
  Welcome,
  ThankYou,
  SaveDate,
  Final,
]
