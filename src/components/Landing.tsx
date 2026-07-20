import { useState, useEffect, useRef, useCallback } from 'react'
import './Landing.css'

interface Props {
  onEnter: () => void
}

export default function Landing({ onEnter }: Props) {
  const [phase, setPhase] = useState<'idle' | 'entering'>('idle')
  const [textIdx, setTextIdx] = useState(0)
  const [hearts, setHearts] = useState<Array<{ id: number; x: number; y: number; size: number; delay: number; color: string }>>([])
  const heartAnimatedRef = useRef(false)

  const texts = [
    'Chúng mình sắp kết hôn',
    '20 . 11 . 2026',
    'Tùng Phạm & Thuý Hằng',
  ]

  /* Cycle text lines */
  useEffect(() => {
    if (phase !== 'idle') return
    const cycle = setInterval(() => {
      setTextIdx(i => (i + 1) % texts.length)
    }, 2400)
    return () => clearInterval(cycle)
  }, [phase, texts.length])

  /* Floating hearts */
  useEffect(() => {
    const interval = setInterval(() => {
      const newHeart = {
        id: Date.now() + Math.random(),
        x: 10 + Math.random() * 80,
        y: 70 + Math.random() * 25,
        size: 0.4 + Math.random() * 0.6,
        delay: Math.random() * 0.4,
        color: Math.random() > 0.5 ? '#D7AE6A' : '#B8860B',
      }
      setHearts(h => [...h.slice(-20), newHeart])
      setTimeout(() => {
        setHearts(h => h.filter(x => x.id !== newHeart.id))
      }, 6500)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { heartAnimatedRef.current = true }, 600)
    return () => clearTimeout(t)
  }, [])

  const handleEnter = useCallback(() => {
    if (phase === 'entering') return
    setPhase('entering')
    onEnter()
  }, [phase, onEnter])

  return (
    <div className={`landing ${phase === 'entering' ? 'landing-entering' : ''}`}>
      {hearts.map(h => (
        <div
          key={h.id}
          className="landing-heart-float"
          style={{
            left: `${h.x}%`,
            top: `${h.y}%`,
            '--size': h.size,
            '--delay': `${h.delay}s`,
            '--color': h.color,
          } as React.CSSProperties}
        />
      ))}

      <div className="landing-inner">
        <p className="landing-eyebrow">— Thiệp mời cưới —</p>

        <svg
          className={`landing-heart ${heartAnimatedRef.current ? 'animate' : ''}`}
          viewBox="0 0 32 32"
          fill="none"
          style={{ animationDelay: '0.4s', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
        >
          <defs>
            <linearGradient id="landingHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E8C77A" />
              <stop offset="50%" stopColor="#D7AE6A" />
              <stop offset="100%" stopColor="#B8860B" />
            </linearGradient>
            <filter id="landingHeartShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#5a3a00" floodOpacity="0.4"/>
            </filter>
          </defs>
          <path
            d="M16 28 C16 28 4 19 4 11 C4 6 8 2 13 2 C14.5 2 16 3 16 3 C16 3 17.5 2 19 2 C24 2 28 6 28 11 C28 19 16 28 16 28Z"
            fill="url(#landingHeartGrad)"
            stroke="#C9A84C"
            strokeWidth="0.6"
            filter="url(#landingHeartShadow)"
          />
          {/* 3D highlight */}
          <path
            d="M10 9 C10 7 11 6 13 6 C13.5 6 14 6.2 14.5 6.5 C13 5.5 11.5 5.5 10 6.5 C9 7.5 9 9 10 9Z"
            fill="rgba(255,255,255,0.2)"
          />
        </svg>

        <div className="landing-text-wrap">
          {texts.map((t, i) => (
            <p
              key={i}
              className={`landing-text ${textIdx === i ? 'landing-text-active' : ''}`}
            >
              {t}
            </p>
          ))}
        </div>

        <div className="landing-names">
          <span>Tùng Phạm</span>
          <span className="landing-names-amp">&amp;</span>
          <span>Thuý Hằng</span>
        </div>

        <p className="landing-date">— 20 · 11 · 2026 —</p>

        <button className="landing-btn" onClick={handleEnter} disabled={phase === 'entering'}>
          <svg width="14" height="14" viewBox="0 0 32 32" fill="none" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
            <defs>
              <linearGradient id="btnHeartGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E8C77A" />
                <stop offset="100%" stopColor="#B8860B" />
              </linearGradient>
            </defs>
            <path d="M16 28 C16 28 4 19 4 11 C4 6 8 2 13 2 C14.5 2 16 3 16 3 C16 3 17.5 2 19 2 C24 2 28 6 28 11 C28 19 16 28 16 28Z" fill="url(#btnHeartGrad1)" />
          </svg>
          <span>Mở thiệp mời</span>
          <svg width="14" height="14" viewBox="0 0 32 32" fill="none" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>
            <defs>
              <linearGradient id="btnHeartGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E8C77A" />
                <stop offset="100%" stopColor="#B8860B" />
              </linearGradient>
            </defs>
            <path d="M16 28 C16 28 4 19 4 11 C4 6 8 2 13 2 C14.5 2 16 3 16 3 C16 3 17.5 2 19 2 C24 2 28 6 28 11 C28 19 16 28 16 28Z" fill="url(#btnHeartGrad2)" />
          </svg>
        </button>

        <p className="landing-hint">Nhấn để bắt đầu</p>
      </div>
    </div>
  )
}
