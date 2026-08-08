import { useState, useEffect, useRef, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Torus } from '@react-three/drei'
import * as THREE from 'three'
import './Landing.css'

interface Props {
  onEnter: () => void
}

export default function Landing({ onEnter }: Props) {
  const [phase, setPhase] = useState<'idle' | 'entering'>('idle')
  const [textIdx, setTextIdx] = useState(0)

  const texts = [
    'Chúng mình sắp kết hôn',
    '27 . 12 . 2026',
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

  const handleEnter = useCallback(() => {
    if (phase === 'entering') return
    setPhase('entering')
    onEnter()
  }, [phase, onEnter])

  return (
    <div className={`landing ${phase === 'entering' ? 'landing-entering' : ''}`}>
      <div className="landing-inner">
        <p className="landing-eyebrow">— Thiệp mời cưới —</p>

        {/* 3D Wedding Ring */}
        <div className="landing-3d-ring">
          <Canvas camera={{ position: [0, 0, 3], fov: 50 }} gl={{ antialias: true }}>
            <ambientLight intensity={1.0} color="#E8D5B7" />
            <pointLight position={[1, 1, 2]} intensity={2.0} color="#C9A84C" />
            <pointLight position={[-1, -1, 1]} intensity={0.8} color="#D4B483" />
            <LandingRing />
          </Canvas>
        </div>

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
          <span className="landing-names-amp">&</span>
          <span>Thuý Hằng</span>
        </div>

        <p className="landing-date">— 27 · 12 · 2026 —</p>

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

/* ── 3D Spinning Rings for Landing ── */
function LandingRing() {
  const ring1Ref = useRef<THREE.Group>(null)
  const ring2Ref = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.25
      ring1Ref.current.rotation.x = t * 0.15
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.2
      ring2Ref.current.rotation.y = t * 0.12
    }
  })

  return (
    <>
      <group ref={ring1Ref}>
        <Torus args={[0.85, 0.06, 16, 80]}>
          <meshPhysicalMaterial
            color="#C9A84C"
            metalness={0.95}
            roughness={0.04}
            clearcoat={1.0}
            clearcoatRoughness={0.01}
          />
        </Torus>
      </group>
      <group ref={ring2Ref}>
        <Torus args={[0.72, 0.055, 16, 80]}>
          <meshPhysicalMaterial
            color="#D4B483"
            metalness={0.9}
            roughness={0.06}
            clearcoat={1.0}
            clearcoatRoughness={0.02}
          />
        </Torus>
      </group>
    </>
  )
}
