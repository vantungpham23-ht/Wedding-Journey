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

// Per-section durations (ms). Final stays on screen for CTA interaction.
const SECTION_DURATIONS: number[] = IS_MOBILE
  ? [4200, 4500, 4200, 4200, 4800, 4200, 4800, 6000]
  : [4500, 4800, 4500, 4500, 5200, 4500, 5200, 6000]

interface Props {
  onBack?: () => void
}

export default function Card({ onBack }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState(0)
  const [autoScrollDone, setAutoScrollDone] = useState(false)
  const autoScrollTimerRef = useRef<number[]>([])

  // Cumulative timings for each section start
  const cumTimes = (() => {
    const arr: number[] = []
    let acc = 0
    SECTION_DURATIONS.forEach((d) => { arr.push(acc); acc += d })
    return arr
  })()

  /* Auto scroll through sections — instant jump to each section's top */
  useEffect(() => {
    autoScrollTimerRef.current.forEach(clearTimeout)
    autoScrollTimerRef.current = []

    sections.forEach((_, i) => {
      const t = window.setTimeout(() => {
        const el = scrollRef.current
        if (!el) return
        // Use the actual section element's offsetTop (handles sections of varying height)
        const sectionEl = el.children[i] as HTMLElement | undefined
        const target = sectionEl ? sectionEl.offsetTop : el.offsetHeight * i
        el.scrollTo({ top: target, behavior: 'auto' })
      }, cumTimes[i])
      autoScrollTimerRef.current.push(t)
    })

    // Mark auto-play done after the last section is shown
    const totalMs = cumTimes[cumTimes.length - 1] + 200
    const stopT = window.setTimeout(() => {
      setAutoScrollDone(true)
    }, totalMs)
    autoScrollTimerRef.current.push(stopT)

    return () => {
      autoScrollTimerRef.current.forEach(clearTimeout)
    }
  }, [])

  /* Stop autoplay on any user interaction */
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const stop = () => {
      if (autoScrollDone) return
      autoScrollTimerRef.current.forEach(clearTimeout)
      setAutoScrollDone(true)
    }

    el.addEventListener('wheel', stop, { passive: true })
    el.addEventListener('touchstart', stop, { passive: true })
    el.addEventListener('pointerdown', stop, { passive: true })
    el.addEventListener('keydown', stop)
    return () => {
      el.removeEventListener('wheel', stop)
      el.removeEventListener('touchstart', stop)
      el.removeEventListener('pointerdown', stop)
      el.removeEventListener('keydown', stop)
    }
  }, [autoScrollDone])

  /* Update active section based on scroll position (single source of truth) */
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
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [])

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
            <Section active={activeSection === i} autoplay={!autoScrollDone} index={i} />
          </section>
        ))}
      </div>

      {/* Page indicators */}
      <div className="card-dots">
        {sections.map((_, i) => (
          <div
            key={i}
            className={`card-dot ${activeSection === i ? 'card-dot-active' : ''}`}
            onClick={() => {
              if (scrollRef.current) {
                const sectionEl = scrollRef.current.children[i] as HTMLElement | undefined
                const target = sectionEl ? sectionEl.offsetTop : scrollRef.current.offsetHeight * i
                scrollRef.current.scrollTo({ top: target, behavior: 'smooth' })
              }
            }}
          />
        ))}
      </div>

      {/* Header bar */}
      <div className="card-header">
        <div className="card-header-names">Tùng Phạm & Thuý Hằng</div>
        <div className="card-header-date">20.11.2026</div>
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
