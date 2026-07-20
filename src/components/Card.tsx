import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import InviteScene from './InviteScene'
import { sections } from './CardOverlay'
import './Card.css'

const IS_MOBILE = (() => {
  if (typeof window === 'undefined') return false
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && window.innerWidth < 768)
})()

interface Props {
  onBack?: () => void
}

export default function Card({ onBack }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState(0)
  const [showSwipeHint, setShowSwipeHint] = useState(true)

  /* Track active section based on scroll position */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    let rafId = 0
    const onScroll = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = 0
        const h = el.offsetHeight
        const idx = Math.max(0, Math.min(sections.length - 1, Math.round(el.scrollTop / h)))
        setActiveSection(idx)
        // Hide swipe hint after first scroll
        if (el.scrollTop > 50) {
          setShowSwipeHint(false)
        }
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

  const scrollToSection = (index: number) => {
    if (scrollRef.current) {
      const sectionEl = scrollRef.current.children[index] as HTMLElement | undefined
      const target = sectionEl ? sectionEl.offsetTop : scrollRef.current.offsetHeight * index
      scrollRef.current.scrollTo({ top: target, behavior: 'smooth' })
    }
  }

  return (
    <div className="card-view">
      {/* Background 3D scene */}
      <div className="card-3d-bg">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
          style={{ width: '100%', height: '100%' }}
        >
          <SceneForSection section={activeSection} />
        </Canvas>
      </div>

      {/* Scrollable content */}
      <div className="card-scroll" ref={scrollRef}>
        {sections.map((Section, i) => (
          <section key={i} className="card-section" id={`section-${i}`}>
            <Section active={activeSection === i} index={i} />
          </section>
        ))}
      </div>

      {/* Mobile: Swipe hint */}
      {IS_MOBILE && showSwipeHint && (
        <div className="card-swipe-hint">
          <div className="card-swipe-hint-icon">
            <svg width="20" height="28" viewBox="0 0 20 28" fill="none">
              <path d="M10 4V20M10 20L4 14M10 20L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span>Vuốt lên</span>
        </div>
      )}

      {/* Desktop: Navigation arrows */}
      {!IS_MOBILE && (
        <div className="card-nav-arrows">
          <button
            className="card-nav-btn card-nav-prev"
            onClick={() => scrollToSection(Math.max(0, activeSection - 1))}
            disabled={activeSection === 0}
            aria-label="Section trước"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12L12 5L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className="card-nav-btn card-nav-next"
            onClick={() => scrollToSection(Math.min(sections.length - 1, activeSection + 1))}
            disabled={activeSection === sections.length - 1}
            aria-label="Section tiếp"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 19V5M5 12L12 19L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Page indicators */}
      <div className="card-dots">
        {sections.map((_, i) => (
          <div
            key={i}
            className={`card-dot ${activeSection === i ? 'card-dot-active' : ''}`}
            onClick={() => scrollToSection(i)}
          />
        ))}
      </div>

      {/* Header bar */}
      <div className="card-header">
        <div className="card-header-names">Tùng Phạm & Thuý Hằng</div>
        <div className="card-header-date">27.12.2026</div>
      </div>
    </div>
  )
}

/* Maps section index to 3D scene preset */
function SceneForSection({ section }: { section: number }) {
  const preset =
    section === 0 ? 'hero' :
    section === 1 ? 'dove' :
    section === 2 ? 'petals' :
    section === 3 ? 'rings' :
    section === 4 ? 'rings' :
    section === 5 ? 'rings' :
    section === 6 ? 'dove' :
    'hero'
  return <InviteScene preset={preset} key={preset} />
}
