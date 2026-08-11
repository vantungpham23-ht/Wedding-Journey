import { useEffect, useRef } from 'react'

const MP3_URL = '/golden-hour.mp3'
const AUDIO_STATE_KEY = 'wedding-journey-audio'

export default function AudioGate(): null {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const armedFallbackRef = useRef(false)
  const isPlayingRef = useRef(false)

  const pauseAudio = () => {
    if (isPlayingRef.current && audioRef.current) {
      audioRef.current.pause()
      isPlayingRef.current = false
      localStorage.removeItem(AUDIO_STATE_KEY)
    }
  }

  useEffect(() => {
    const audio = new Audio(MP3_URL)
    audio.loop = true
    audio.volume = 0.6
    audio.preload = 'auto'
    audioRef.current = audio

    const tryPlay = () => {
      if (isPlayingRef.current) return
      const p = audio.play()
      if (p && typeof p.catch === 'function') {
        p.then(() => {
          isPlayingRef.current = true
          localStorage.setItem(AUDIO_STATE_KEY, Date.now().toString())
        }).catch(() => {
          if (armedFallbackRef.current) return
          armedFallbackRef.current = true
          const resume = () => {
            audio.play().then(() => {
              isPlayingRef.current = true
              localStorage.setItem(AUDIO_STATE_KEY, Date.now().toString())
            }).catch(() => {})
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

    // Expose pause function globally for external links
    const pauseOnExternalClick = () => {
      pauseAudio()
    }
    ;(window as any).__weddingPauseAudio = pauseOnExternalClick

    // Listen for storage events from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUDIO_STATE_KEY && e.newValue !== null) {
        pauseAudio()
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

    window.addEventListener('storage', handleStorageChange)

    return () => {
      document.removeEventListener('click', onFirstGesture, true)
      document.removeEventListener('touchstart', onFirstGesture, true)
      document.removeEventListener('keydown', onFirstGesture, true)
      window.removeEventListener('storage', handleStorageChange)
      pauseAudio()
      audio.src = ''
      delete (window as any).__weddingPauseAudio
    }
  }, [])

  return null
}
