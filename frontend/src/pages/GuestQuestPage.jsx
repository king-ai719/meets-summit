import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { SignInButton } from '@clerk/clerk-react'

const API = 'https://meets-summit-api.tk-xx719.workers.dev'

const LOADING_MESSAGE = {
  normal: { icon: '📜', text: '試練の書を開いています...' },
  hard: { icon: '⚔️', text: '強敵があなたを待っています...' },
  very_hard: { icon: '💀', text: '伝説級の試練を召喚中...' },
}

const RARITY_COLOR = { S: '#ff4444', A: '#ff9900', B: '#667eea', C: '#4CAF50' }

export default function GuestQuestPage() {
  const { job_class_id } = useParams()
  const [searchParams] = useSearchParams()
  const difficulty = searchParams.get('difficulty') || 'normal'
  const navigate = useNavigate()

  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [lives, setLives] = useState(3)
  const [phase, setPhase] = useState('loading')
  const [score, setScore] = useState(0)
  const [job, setJob] = useState(null)

  const questionCount = difficulty === 'very_hard' ? 5 : 3
  const loadingMsg = LOADING_MESSAGE[difficulty] || LOADING_MESSAGE.normal

  useEffect(() => {
    // 職業情報取得
    fetch(`${API}/api/job-classes`)
      .then(res => res.json())
      .then(data => {
        const jobs = Array.isArray(data.data) ? data.data : []
        const found = jobs.find(j => j.id === job_class_id)
        setJob(found || null)
      })
  }, [job_class_id])

  useEffect(() => {
    if (!job) return
    // AI問題生成
    generateGuestQuestions()
  }, [job])

  const generateGuestQuestions = async () => {
    try {
      const res = await fetch(`${API}/api/guest-quiz/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_class_id,
          job_name: job?.name || '一般',
          difficulty,
          count: questionCount,
        }),
      })
      const data = await res.json()
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setQuestions(data.data)
        setPhase('playing')
      } else {
        setPhase('error')
      }
    } catch {
      setPhase('error')
    }
  }

  const handleAnswer = (option) => {
    if (phase !== 'playing') return
    setSelected(option)
    if (option === questions[current]?.answer) {
      setScore(prev => prev + 1)
      setPhase('correct')
    } else {
      const newLives = lives - 1
      setLives(newLives)
      setPhase(newLives <= 0 ? 'gameover' : 'wrong')
    }
  }

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      setPhase('cleared')
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

  const q = questions[current]

  const s = {
    page: { minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'sans-serif', padding: '2rem' },
    card: { maxWidth: '640px', margin: '0 auto', background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '16px', padding: '2rem' },
  }

  if (phase === 'loading') return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{loadingMsg.icon}</div>
          <p style={{ color: '#B4965A', fontSize: '16px', letterSpacing: '1px' }}>{loadingMsg.text}</p>
        </div>
      </div>
    </div>
  )

  if (phase === 'error') return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#888' }}>問題の生成に失敗しました</p>
          <button onClick={() => navigate(-1)} style={{ marginTop: '1rem', background: '#1a1a2e', color: 'white', border: '1px solid #333', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer' }}>
            戻る
          </button>
        </div>
      </div>
    </div>
  )

  if (phase === 'cleared' || phase === 'gameover') return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{phase === 'cleared' ? '🎉' : '💀'}</div>
          <h1 style={{ fontSize: '2rem', color: phase === 'cleared' ? '#B4965A' : '#cc3333', marginBottom: '0.5rem' }}>
            {phase === 'cleared' ? 'クリア！' : 'ゲームオーバー'}
          </h1>
          <p style={{ color: '#888', marginBottom: '0.5rem' }}>
            正解数：{score} / {questions.length}問
          </p>

          {/* 登録誘導 */}
          <div style={{ background: '#1a160a', border: '1px solid #B4965A55', borderRadius: '12px', padding: '1.5rem', margin: '1.5rem 0', textAlign: 'left' }}>
            <div style={{ fontWeight: 600, color: '#B4965A', marginBottom: '8px', textAlign: 'center' }}>
              🏰 ギルドに参加してもっと楽しもう！
            </div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '1rem', lineHeight: 1.8 }}>
              • 同じ職業の仲間とチャットできる<br />
              • クエストをクリアして称号をゲット<br />
              • 知識が、出逢いになる
            </div>
            <SignInButton mode="modal">
              <button style={{ width: '100%', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '15px', cursor: 'pointer', letterSpacing: '1px' }}>
                無料で始める →
              </button>
            </SignInButton>
          </div>

          <button onClick={() => navigate(`/job-classes/${job_class_id}`)}
            style={{ background: '#1a1a2e', color: 'white', border: '1px solid #333', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
            もう一度挑戦する
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* ヘッダー */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
          <div style={{ fontSize: '12px', color: '#888' }}>{job?.icon} {job?.name} ゲスト体験</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[...Array(3)].map((_, i) => (
              <span key={i} style={{ fontSize: '1rem' }}>{i < lives ? '❤️' : '🖤'}</span>
            ))}
          </div>
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
            <button onClick={handleNext}
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer' }}>
              {current + 1 >= questions.length ? 'クリア！' : '次の問題'}
            </button>
          </div>
        )}

        {phase === 'wrong' && (
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <p style={{ color: '#cc3333', marginBottom: '0.5rem' }}>❌ 不正解</p>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '1rem' }}>残りライフ: {lives}</p>
            <button onClick={handleRetry}
              style={{ background: '#1a1a2e', color: 'white', border: '1px solid #333', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer' }}>
              もう一度
            </button>
          </div>
        )}
      </div>
    </div>
  )
}