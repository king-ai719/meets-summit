import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

const API = 'https://meets-summit-api.tk-xx719.workers.dev'

export default function QuestPage() {
  const { quest_id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const [quest, setQuest] = useState(null)
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [lives, setLives] = useState(3)
  const [wrongCount, setWrongCount] = useState(0)
  const [phase, setPhase] = useState('playing') // playing / correct / wrong / cleared / gameover
  const [profile, setProfile] = useState(null)
  const [clearers, setClearers] = useState([])
  const [timeLeft, setTimeLeft] = useState(60)

  useEffect(() => {
    if (!user) return
    fetch(`${API}/api/users?clerk_id=${user.id}`)
      .then(res => res.json())
      .then(data => { if (data.data?.[0]) setProfile(data.data[0]) })
  }, [user])

  useEffect(() => {
    fetch(`${API}/api/quests/${quest_id}/questions`)
      .then(res => res.json())
      .then(data => setQuestions(Array.isArray(data.data) ? data.data : []))
  }, [quest_id])

  useEffect(() => {
    fetch(`${API}/api/quests/${quest_id}/results`)
      .then(res => res.json())
      .then(data => setClearers(Array.isArray(data.data) ? data.data : []))
  }, [quest_id])

  useEffect(() => {
    if (phase !== 'playing') return
    setTimeLeft(60)
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleWrong()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [current, phase])

  const handleAnswer = (option) => {
    if (phase !== 'playing') return
    setSelected(option)
    if (option === questions[current]?.answer) {
      setPhase('correct')
    } else {
      handleWrong()
    }
  }

  const handleWrong = () => {
    const newLives = lives - 1
    setLives(newLives)
    setWrongCount(prev => prev + 1)
    if (newLives <= 0) {
      setPhase('gameover')
    } else {
      setPhase('wrong')
    }
  }

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setPhase('cleared')
      saveResult(true)
    } else {
      setCurrent(prev => prev + 1)
      setSelected(null)
      setPhase('playing')
    }
  }

  const handleRetry = () => {
    setSelected(null)
    setPhase('playing')
  }

  const saveResult = async (cleared) => {
    if (!profile) return
    await fetch(`${API}/api/quest-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quest_id,
        user_id: profile.id,
        is_cleared: cleared,
        wrong_count: wrongCount,
      }),
    })
  }

  const q = questions[current]

  const s = {
    page: { minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'sans-serif', padding: '2rem' },
    card: { maxWidth: '640px', margin: '0 auto', background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '16px', padding: '2rem' },
  }

  if (questions.length === 0) return (
    <div style={s.page}>
      <div style={s.card}>
        <p style={{ textAlign: 'center', color: '#888' }}>問題を読み込み中...</p>
      </div>
    </div>
  )

  if (phase === 'cleared') return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ fontSize: '2rem', color: '#B4965A', marginBottom: '0.5rem' }}>クエストクリア！</h1>
          <p style={{ color: '#888', marginBottom: '2rem' }}>チャットが解放されました！</p>
          <button onClick={() => navigate(-1)} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer' }}>
            ギルドに戻る
          </button>
        </div>
      </div>
    </div>
  )

  if (phase === 'gameover') return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💀</div>
          <h1 style={{ fontSize: '2rem', color: '#cc3333', marginBottom: '0.5rem' }}>ゲームオーバー</h1>
          <p style={{ color: '#888', marginBottom: '2rem' }}>ライフがなくなりました</p>
          <button onClick={() => navigate(-1)} style={{ background: '#1a1a2e', color: 'white', border: '1px solid #333', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer' }}>
            ギルドに戻る
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[...Array(3)].map((_, i) => (
              <span key={i} style={{ fontSize: '1.2rem' }}>{i < lives ? '❤️' : '🖤'}</span>
            ))}
          </div>
          <div style={{ fontSize: '1.2rem', color: timeLeft <= 10 ? '#cc3333' : '#888' }}>⏱ {timeLeft}s</div>
        </div>

        <div style={{ fontSize: '12px', color: '#888', marginBottom: '1rem' }}>
          問題 {current + 1} / {questions.length}
        </div>

        <div style={{ background: '#1a1a2e', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem', fontSize: '1.1rem', lineHeight: 1.6 }}>
          {q?.question}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {q?.options && (typeof q.options === 'string' ? JSON.parse(q.options) : q.options).map((option, i) => {
            let bg = '#1a1a2e'
            let border = '#2a2a3e'
            if (selected) {
              if (option === q.answer) { bg = '#0f1a0f'; border = '#1a4a1a' }
              else if (option === selected && option !== q.answer) { bg = '#1a0f0f'; border = '#4a1a1a' }
            }
            return (
              <button key={i} onClick={() => handleAnswer(option)}
                style={{ padding: '12px 16px', background: bg, border: `1px solid ${border}`, borderRadius: '10px', color: 'white', fontSize: '14px', textAlign: 'left', cursor: 'pointer', transition: 'all .2s' }}>
                {option}
              </button>
            )
          })}
        </div>

        {phase === 'correct' && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <p style={{ color: '#4CAF50', marginBottom: '1rem' }}>✅ 正解！</p>
            {q?.explanation && <p style={{ color: '#888', fontSize: '13px', marginBottom: '1rem' }}>{q.explanation}</p>}
            <button onClick={handleNext} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer' }}>
              {current + 1 >= questions.length ? 'クリア！' : '次の問題'}
            </button>
          </div>
        )}

        {phase === 'wrong' && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <p style={{ color: '#cc3333', marginBottom: '0.5rem' }}>❌ 不正解</p>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '1rem' }}>残りライフ: {lives}</p>
            <button onClick={handleRetry} style={{ background: '#1a1a2e', color: 'white', border: '1px solid #333', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer' }}>
              もう一度
            </button>
          </div>
        )}
      </div>
    </div>
  )
}