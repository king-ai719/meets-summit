import { useState, useEffect, useRef } from 'react'

const BGM = {
  top: '/bgm/top.mp3',
  battle: '/bgm/battle.mp3',
  very_hard: '/bgm/Other_World.mp3',
  fanfare: '/bgm/fanfare.mp3',
}

export function useBgm() {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentBgm, setCurrentBgm] = useState(null)
  const [muted, setMuted] = useState(false)
  const pendingBgm = useRef(null)

  const play = (key) => {
    const src = BGM[key]
    if (!src) return
    pendingBgm.current = key

    // まだユーザー操作前なら保留
    if (!playing && currentBgm === null) return

    if (currentBgm !== key) {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      const audio = new Audio(src)
      audio.loop = true
      audio.volume = muted ? 0 : 0.3
      audio.play().catch(() => {})
      audioRef.current = audio
      setCurrentBgm(key)
      setPlaying(true)
    }
  }

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    setPlaying(false)
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0.3 : 0
    }
    setMuted(prev => !prev)
  }

  // 🎵ボタンを押したときに初回再生開始
  const startBgm = () => {
    const key = pendingBgm.current || 'top'
    const src = BGM[key]
    if (!src) return

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    const audio = new Audio(src)
    audio.loop = true
    audio.volume = muted ? 0 : 0.3
    audio.play().catch(() => {})
    audioRef.current = audio
    setCurrentBgm(key)
    setPlaying(true)
  }

  useEffect(() => {
    return () => { audioRef.current?.pause() }
  }, [])

  return { play, stop, toggleMute, startBgm, playing, muted, currentBgm }
}

export default function BgmButton({ bgm }) {
  const { toggleMute, startBgm, playing, muted } = bgm

  const handleClick = () => {
    if (!playing) {
      startBgm()
    } else {
      toggleMute()
    }
  }

  return (
    <button
      onClick={handleClick}
      style={{
        position: 'fixed', bottom: '1.5rem', right: '1.5rem',
        width: '44px', height: '44px',
        background: '#1a1a2e', border: '1px solid #2a2a3e',
        borderRadius: '50%', cursor: 'pointer',
        fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999, transition: 'all .2s',
        boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
      }}
      onMouseOver={e => e.currentTarget.style.borderColor = '#B4965A'}
      onMouseOut={e => e.currentTarget.style.borderColor = '#2a2a3e'}
      title={!playing ? '音楽をON' : muted ? '音楽をON' : '音楽をOFF'}
    >
      {!playing ? '🎵' : muted ? '🔇' : '🎵'}
    </button>
  )
}