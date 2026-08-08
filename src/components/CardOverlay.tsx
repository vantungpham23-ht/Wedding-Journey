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
        <div className="cover-date-place">Cẩm Bình — Hà Tĩnh</div>
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
        Không cần một món quà thật đặc biệt.<br />
        Chỉ cần bạn đến,<br />
        ngày vui của chúng mình đã trọn vẹn hơn rồi.
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

/* ── SECTION 6 — Final / CTAs with Countdown ── */
const WEDDING_DATE = new Date('2026-12-27T10:00:00+07:00')
const UNLOCK_DATE = new Date('2026-12-13T00:00:00+07:00')

const Final: ComponentType<SectionProps> = ({ active }) => {
  const show = useInView(active, 200)
  const [now, setNow] = useState(Date.now())
  const [unlocked, setUnlocked] = useState(Date.now() >= UNLOCK_DATE.getTime())

  useEffect(() => {
    const t = setInterval(() => {
      const n = Date.now()
      setNow(n)
      setUnlocked(n >= UNLOCK_DATE.getTime())
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
      <div className="final-heart-big">
        <Heart size={80} />
      </div>

      <h2 className="overlay-final-h">
        <span className="overlay-final-h-line">Tùng</span>
        <Heart size={22} fill="#722F37" />
        <span className="overlay-final-h-line">Hằng</span>
      </h2>

      {/* Countdown */}
      <div className="countdown-block">
        <div className="countdown-label">Đếm ngược đến ngày trọng đại</div>
        <div className="countdown-grid">
          <div className="countdown-cell">
            <div className="countdown-num">{pad(days)}</div>
            <div className="countdown-unit">ngày</div>
          </div>
          <div className="countdown-sep">:</div>
          <div className="countdown-cell">
            <div className="countdown-num">{pad(hours)}</div>
            <div className="countdown-unit">giờ</div>
          </div>
          <div className="countdown-sep">:</div>
          <div className="countdown-cell">
            <div className="countdown-num">{pad(mins)}</div>
            <div className="countdown-unit">phút</div>
          </div>
          <div className="countdown-sep">:</div>
          <div className="countdown-cell">
            <div className="countdown-num">{pad(secs)}</div>
            <div className="countdown-unit">giây</div>
          </div>
        </div>
      </div>

      {/* Locked notice banner */}
      {!unlocked && (
        <div className="unlock-banner">
          <div className="unlock-banner-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </div>
          <div className="unlock-banner-text">
            <span className="unlock-banner-title">Đang chờ mở khóa</span>
            <span className="unlock-banner-sub">Xác nhận tham dự sẽ mở trước đám cưới 2 tuần</span>
          </div>
        </div>
      )}

      {/* CTA buttons */}
      <div className="final-cta-block">
        <a
          className={`final-cta ${unlocked ? 'final-cta-primary' : 'final-cta-locked'}`}
          href={unlocked ? "https://cuoithoi.pages.dev/" : undefined}
          target={unlocked ? "_blank" : undefined}
          rel={unlocked ? "noopener noreferrer" : undefined}
          aria-disabled={!unlocked}
          onClick={(e) => { if (!unlocked) e.preventDefault() }}
        >
          <span className="final-cta-icon">
            {unlocked ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            )}
          </span>
          <span className="final-cta-text">
            <span className="final-cta-title">
              {unlocked ? 'Xác nhận tham dự' : 'Xác nhận tham dự'}
            </span>
            <span className="final-cta-sub">
              {unlocked ? 'Giúp chúng mình chuẩn bị chu đáo' : 'Mở vào ngày 15.12.2026'}
            </span>
          </span>
          {unlocked ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          )}
        </a>

        <a
          className={`final-cta ${unlocked ? 'final-cta-secondary' : 'final-cta-locked'}`}
          href={unlocked ? "https://locnt1.my.canva.site/tungvahang" : undefined}
          target={unlocked ? "_blank" : undefined}
          rel={unlocked ? "noopener noreferrer" : undefined}
          aria-disabled={!unlocked}
          onClick={(e) => { if (!unlocked) e.preventDefault() }}
        >
          <span className="final-cta-icon">
            {unlocked ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="M3 9h18M7 13h4" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            )}
          </span>
          <span className="final-cta-text">
            <span className="final-cta-title">
              {unlocked ? 'Xem thiệp chi tiết' : 'Xem thiệp chi tiết'}
            </span>
            <span className="final-cta-sub">
              {unlocked ? 'Câu chuyện & khoảnh khắc' : 'Mở vào ngày 15.12.2026'}
            </span>
          </span>
          {unlocked ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          )}
        </a>

        {!unlocked && (
          <p className="final-cta-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            Các liên kết sẽ được mở khóa vào ngày <strong>15.12.2026</strong>
          </p>
        )}
      </div>

      <p className="overlay-final-credit">Crafted with ❤ — Tùng & Hằng</p>
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
