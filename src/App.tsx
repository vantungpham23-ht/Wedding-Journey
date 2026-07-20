import { useState, useEffect, useCallback, useRef } from 'react'
import Landing from './components/Landing'
import Card from './components/Card'
import AudioGate from './components/AudioGate'
import './App.css'

export default function App() {
  const [phase, setPhase] = useState<'landing' | 'card'>('landing')
  const [musicStarted, setMusicStarted] = useState(false)
  const handleEnterRef = useRef<() => void>()

  const handleEnter = useCallback(() => {
    if (phase !== 'landing') return
    setMusicStarted(true)
    setPhase('card')
  }, [phase])

  handleEnterRef.current = handleEnter

  return (
    <div className={`app ${phase === 'card' ? 'app-card' : ''}`}>
      {phase === 'landing' && <Landing onEnter={handleEnter} />}
      {phase === 'card' && <Card onBack={() => setPhase('landing')} />}
      {musicStarted && phase === 'card' && <AudioGate />}
    </div>
  )
}
