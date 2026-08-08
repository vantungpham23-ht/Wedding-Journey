import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const C = {
  bg:          '#1a0c0a',
  heart:       '#722F37',
  heartEm:     '#5A1A22',
  heartHi:     '#C9A84C',
  ring1:       '#C9A84C',
  ring2:       '#B8860B',
  particle:    '#C9A84C',
  dust:        '#D4B483',
  ambient:     '#E8D5B7',
}

const IS_MOBILE = (() => {
  if (typeof window === 'undefined') return false
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && window.innerWidth < 768)
})()

/* ── Heart geometry ── */
function useHeartGeo() {
  return useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, -0.5)
    shape.bezierCurveTo(0, -0.5, -0.08, -0.15, -0.55, -0.15)
    shape.bezierCurveTo(-1.0, -0.15, -1.15, -0.7, -1.15, -0.9)
    shape.bezierCurveTo(-1.15, -1.15, -0.7, -1.55, 0, -2.05)
    shape.bezierCurveTo(0.7, -1.55, 1.15, -1.15, 1.15, -0.9)
    shape.bezierCurveTo(1.15, -0.7, 1.0, -0.15, 0.55, -0.15)
    shape.bezierCurveTo(0.08, -0.15, 0, -0.5, 0, -0.5)

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.35,
      bevelEnabled: true,
      bevelSegments: IS_MOBILE ? 8 : 14,
      steps: 1,
      bevelSize: 0.1,
      bevelThickness: 0.1,
    })
    geo.center()
    return geo
  }, [])
}

/* ── Single thin halo ring ── */
function HaloRing({ radius, speed, color, opacity, thickness = 0.006 }: {
  radius: number; speed: number; color: string; opacity: number; thickness?: number;
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.z = clock.elapsedTime * speed
  })
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, thickness, 8, 120]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

/* ── Gentle floating particles (dust) ── */
function Dust() {
  const count = IS_MOBILE ? 25 : 50
  const meshRef = useRef<THREE.Points>(null)

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 8
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4
      speeds[i] = 0.03 + Math.random() * 0.06
    }
    return { positions, speeds }
  }, [])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3))
    return geo
  }, [positions])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const pos = meshRef.current.geometry.attributes.position.array as Float32Array
    const t = clock.elapsedTime
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += speeds[i] * 0.01
      if (pos[i * 3 + 1] > 3) pos[i * 3 + 1] = -3
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        color={C.dust}
        size={0.025}
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

/* ── Very subtle glow behind heart ── */
function HeartGlow() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.08 + Math.sin(t * 0.8) * 0.04
    ref.current.scale.setScalar(1.2 + Math.sin(t * 0.8) * 0.05)
  })
  return (
    <mesh ref={ref} position={[0, -0.1, -0.3]}>
      <sphereGeometry args={[1.2, 16, 16]} />
      <meshBasicMaterial color={C.heart} transparent opacity={0.1} depthWrite={false} />
    </mesh>
  )
}

/* ─── Preset-based scene ─── */
type Preset = 'hero' | 'rings'

interface Props {
  preset?: Preset
}

export default function InviteScene({ preset = 'hero' }: Props) {
  const heartGeo = useHeartGeo()
  const heartRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)

  const scale = IS_MOBILE ? 0.75 : 1.0

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (heartRef.current) {
      heartRef.current.scale.setScalar(scale * (1 + Math.sin(t * 0.9) * 0.03))
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.25
      ringRef.current.rotation.x = t * 0.15
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.2
      ring2Ref.current.rotation.y = t * 0.12
    }
  })

  return (
    <>
      <ambientLight intensity={0.6} color={C.ambient} />
      <pointLight position={[0, 1.5, 0]} intensity={2.5} color={C.heart} distance={8} decay={2} />
      <pointLight position={[1, 0, 1]} intensity={0.8} color={C.ring1} distance={5} decay={2} />
      <pointLight position={[-1, 0, -1]} intensity={0.5} color={C.dust} distance={5} decay={2} />

      {/* Heart (only on hero preset) */}
      {preset !== 'rings' && (
        <>
          <mesh ref={heartRef} geometry={heartGeo}>
            <meshPhysicalMaterial
              color={C.heart}
              emissive={C.heartEm}
              emissiveIntensity={0.4}
              roughness={0.03}
              metalness={0.1}
              reflectivity={1.0}
              clearcoat={1.0}
              clearcoatRoughness={0.01}
              sheen={0.4}
              sheenColor={C.heartHi}
              sheenRoughness={0.3}
              iridescence={0.15}
              iridescenceIOR={1.5}
              iridescenceThicknessRange={[100, 300]}
              side={THREE.DoubleSide}
            />
          </mesh>
          <HeartGlow />
        </>
      )}

      {/* Wedding rings (only on rings preset) */}
      {preset === 'rings' && (
        <>
          <mesh ref={ringRef} position={[0, -0.1, 0]}>
            <torusGeometry args={[1.0, 0.055, 16, 100]} />
            <meshPhysicalMaterial
              color={C.ring1}
              metalness={0.95}
              roughness={0.04}
              clearcoat={1.0}
              clearcoatRoughness={0.01}
            />
          </mesh>
          <mesh ref={ring2Ref} position={[0.12, -0.1, 0.08]}>
            <torusGeometry args={[0.9, 0.05, 16, 100]} />
            <meshPhysicalMaterial
              color={C.ring2}
              metalness={0.9}
              roughness={0.06}
              clearcoat={1.0}
              clearcoatRoughness={0.02}
            />
          </mesh>
        </>
      )}

      {/* Floating dust particles */}
      <Dust />
    </>
  )
}
