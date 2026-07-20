import { useEffect, useRef } from 'react'

// Local MP3 served from /public — autoplay works since AudioGate mounts
// right after the user clicks "Mở thiệp mời" (still inside user-gesture context)
const MP3_URL = '/golden-hour.mp3'

export default function AudioGate(): null {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const armedFallbackRef = useRef(false)

  useEffect(() => {
    const audio = new Audio(MP3_URL)
    audio.loop = true
    audio.volume = 0.6
    audio.preload = 'auto'
    audioRef.current = audio

    const tryPlay = () => {
      const p = audio.play()
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          if (armedFallbackRef.current) return
          armedFallbackRef.current = true
          const resume = () => {
            audio.play().catch(() => {})
            document.removeEventListener('click', resume, true)
            document.removeEventListener('touchstart', resume, true)
            document.removeEventListener('touchend', resume, true)
            document.removeEventListener('pointerdown', resume, true)
            document.removeEventListener('keydown', resume, true)
          }
          document.addEventListener('click', resume, true)
          document.addEventListener('touchstart', resume, true)
          document.addEventListener('touchend', resume, true)
          document.addEventListener('pointerdown', resume, true)
          document.addEventListener('keydown', resume, true)
        })
      }
    }

    // Try immediately, and also on first user gesture as a safety net
    tryPlay()
    const onFirstGesture = () => {
      tryPlay()
      document.removeEventListener('click', onFirstGesture, true)
      document.removeEventListener('touchstart', onFirstGesture, true)
      document.removeEventListener('keydown', onFirstGesture, true)
    }
    document.addEventListener('click', onFirstGesture, true)
    document.addEventListener('touchstart', onFirstGesture, true)
    document.addEventListener('keydown', onFirstGesture, true)

    return () => {
      document.removeEventListener('click', onFirstGesture, true)
      document.removeEventListener('touchstart', onFirstGesture, true)
      document.removeEventListener('keydown', onFirstGesture, true)
      audio.pause()
      audio.src = ''
    }
  }, [])

  return null
}
