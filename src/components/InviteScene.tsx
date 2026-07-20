import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Sparkles } from '@react-three/drei'

const C = {
  bg:       '#1a0c0a',
  heart:    '#722F37',
  heartEm:  '#8B3A3A',
  heartHighlight: '#D4737A',
  glow1:    '#8B3A3A',
  glow2:    '#C9A882',
  glow3:    '#E8D5B7',
  accent:   '#C9A882',
  petal1:   '#D4A5A5',
  petal2:   '#B8860B',
  spark1:   '#C9A882',
  spark2:   '#D4A5A5',
}

const IS_MOBILE = (() => {
  if (typeof window === 'undefined') return false
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && window.innerWidth < 768)
})()

function useHeartGeo() {
  return useMemo(() => {
    const shape = new THREE.Shape()
    // Improved heart curve for more elegant shape
    shape.moveTo(0, -0.5)
    shape.bezierCurveTo(0, -0.5, -0.08, -0.15, -0.55, -0.15)
    shape.bezierCurveTo(-1.0, -0.15, -1.15, -0.7, -1.15, -0.9)
    shape.bezierCurveTo(-1.15, -1.15, -0.7, -1.55, 0, -2.05)
    shape.bezierCurveTo(0.7, -1.55, 1.15, -1.15, 1.15, -0.9)
    shape.bezierCurveTo(1.15, -0.7, 1.0, -0.15, 0.55, -0.15)
    shape.bezierCurveTo(0.08, -0.15, 0, -0.5, 0, -0.5)
    
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.45,
      bevelEnabled: true,
      bevelSegments: IS_MOBILE ? 8 : 14,
      steps: 1,
      bevelSize: 0.12,
      bevelThickness: 0.12,
    })
    geo.center()
    return geo
  }, [])
}

function Petal({ index }: { index: number }) {
  const ref = useRef<THREE.Mesh>(null)
  const offset = useMemo(() => Math.random() * Math.PI * 2, [])
  const speedX = useMemo(() => 0.1 + Math.random() * 0.12, [])
  const speedY = useMemo(() => 0.05 + Math.random() * 0.08, [])
  const startY = useMemo(() => (Math.random() - 0.5) * 3, [])
  const radius = useMemo(() => 1.0 + Math.random() * 0.8, [])
  const angle = useMemo(() => (index / 6) * Math.PI * 2, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime + offset
    ref.current.position.x = Math.cos(t * speedX + angle) * radius
    ref.current.position.z = Math.sin(t * speedX + angle) * radius
    ref.current.position.y = startY + Math.sin(t * speedY) * 0.4
    ref.current.rotation.x = t * 0.2
    ref.current.rotation.z = t * 0.15
  })

  const color = useMemo(() => Math.random() > 0.5 ? C.petal1 : C.petal2, [])

  return (
    <mesh ref={ref}>
      <planeGeometry args={[0.12, 0.06]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  )
}

function HaloRing({ radius, speed, color, opacity }: {
  radius: number; speed: number; color: string; opacity: number;
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.z = clock.elapsedTime * speed
    const mat = ref.current.material as THREE.MeshBasicMaterial
    mat.opacity = opacity * (0.6 + Math.sin(clock.elapsedTime * speed * 2) * 0.4)
  })
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.007, 8, 100]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </mesh>
  )
}

function OrbitDots({ radius, count, speed, color }: {
  radius: number; count: number; speed: number; color: string;
}) {
  const groupRef = useRef<THREE.Group>(null)
  const positions = useMemo(() => Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2
    return new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.3, Math.sin(angle) * radius)
  }), [radius, count])

  useFrame(({ clock }) => {
    if (groupRef.current) groupRef.current.rotation.z = clock.elapsedTime * speed
  })

  return (
    <group ref={groupRef}>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos.toArray()}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}

/* ─── Preset-based scene for invite page ───
   preset: 'hero' | 'dove' | 'petals' | 'rings'
*/
type Preset = 'hero' | 'dove' | 'petals' | 'rings'

interface Props {
  preset?: Preset
}

export default function InviteScene({ preset = 'hero' }: Props) {
  const heartGeo = useHeartGeo()
  const heartRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const glow2Ref = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)

  const petalCount = IS_MOBILE ? 3 : 5

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (heartRef.current) {
      heartRef.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.04)
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.15 + Math.sin(t * 1.6) * 0.07
      glowRef.current.scale.setScalar(1.1 + Math.sin(t * 1.6) * 0.12)
    }
    if (glow2Ref.current) {
      const mat = glow2Ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.06 + Math.sin(t * 1.0 + 0.5) * 0.04
      glow2Ref.current.scale.setScalar(1.4 + Math.sin(t * 1.0 + 0.5) * 0.15)
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.5
      ringRef.current.rotation.x = t * 0.3
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.4
      ring2Ref.current.rotation.y = t * 0.25
    }
  })

  const heartScale = IS_MOBILE ? 0.7 : 1.0

  return (
    <>
      <ambientLight intensity={0.8} color="#f0e0c8" />
      <pointLight position={[0, 1.5, 0]} intensity={3.0} color="#8B3A3A" distance={8} decay={2} />
      <pointLight position={[1.5, 0, 1]} intensity={1.0} color={C.accent} distance={5} decay={2} />
      <pointLight position={[-1.5, 0, -1]} intensity={0.8} color={C.petal1} distance={5} decay={2} />

      {/* Hero / Dove / General - show heart */}
      {(preset === 'hero' || preset === 'dove') && (
        <group>
          {/* Main heart with enhanced physical material */}
          <mesh ref={heartRef} geometry={heartGeo} scale={heartScale}>
            <meshPhysicalMaterial
              color={C.heart}
              emissive={C.heartEm}
              emissiveIntensity={0.6}
              roughness={0.02}
              metalness={0.15}
              reflectivity={1.0}
              clearcoat={1.0}
              clearcoatRoughness={0.01}
              sheen={0.5}
              sheenColor={C.heartHighlight}
              sheenRoughness={0.2}
              iridescence={0.3}
              iridescenceIOR={1.5}
              iridescenceThicknessRange={[100, 400]}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Soft inner glow sphere */}
          <mesh ref={glowRef}>
            <sphereGeometry args={[0.7, 14, 14]} />
            <meshBasicMaterial color={C.glow1} transparent opacity={0.18} depthWrite={false} />
          </mesh>
          
          {/* Outer soft glow */}
          <mesh ref={glow2Ref}>
            <sphereGeometry args={[0.7, 14, 14]} />
            <meshBasicMaterial color={C.glow2} transparent opacity={0.08} depthWrite={false} />
          </mesh>
        </group>
      )}

      {/* Petals preset - lots of petals, no heart */}
      {preset === 'petals' && (
        <group>
          <mesh ref={glowRef}>
            <sphereGeometry args={[1.2, 20, 20]} />
            <meshBasicMaterial color={C.glow1} transparent opacity={0.1} depthWrite={false} />
          </mesh>
          <mesh ref={glow2Ref}>
            <sphereGeometry args={[1.8, 20, 20]} />
            <meshBasicMaterial color={C.glow2} transparent opacity={0.05} depthWrite={false} />
          </mesh>
        </group>
      )}

      {/* Rings preset - two wedding rings */}
      {preset === 'rings' && (
        <group>
          <mesh ref={ringRef}>
            <torusGeometry args={[1.1, 0.08, 16, 100]} />
            <meshPhysicalMaterial
              color={C.accent}
              metalness={0.95}
              roughness={0.05}
              clearcoat={1.0}
              clearcoatRoughness={0.02}
            />
          </mesh>
          <mesh ref={ring2Ref}>
            <torusGeometry args={[1.0, 0.08, 16, 100]} />
            <meshPhysicalMaterial
              color={C.petal1}
              metalness={0.9}
              roughness={0.1}
              clearcoat={1.0}
              clearcoatRoughness={0.05}
            />
          </mesh>
          <Sparkles count={40} scale={[4, 4, 4]} size={2} speed={0.3} color={C.spark1} opacity={0.8} />
        </group>
      )}

      <HaloRing radius={1.5} speed={0.3}  color={C.accent} opacity={preset === 'rings' ? 0 : 0.3} />
      <HaloRing radius={1.9} speed={-0.2} color={C.petal1} opacity={preset === 'rings' ? 0 : 0.18} />

      <OrbitDots radius={1.7} count={IS_MOBILE ? 5 : 10} speed={0.4}  color={C.accent} />
      <OrbitDots radius={2.1} count={IS_MOBILE ? 6 : 12} speed={-0.25} color={C.petal1} />

      {Array.from({ length: preset === 'petals' ? (IS_MOBILE ? 8 : 15) : petalCount }, (_, i) => (
        <Petal key={i} index={i} />
      ))}

      <Sparkles count={preset === 'petals' ? 80 : IS_MOBILE ? 20 : 50}
                scale={preset === 'petals' ? [10, 8, 10] : [6, 4, 6]}
                size={2.5}
                speed={preset === 'petals' ? 0.6 : 0.4}
                color={C.spark1}
                opacity={0.6} />
    </>
  )
}
