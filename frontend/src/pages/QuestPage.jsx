import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

const API = 'https://meets-summit-api.tk-xx719.workers.dev'

const RARITY_COLOR = {
  S: '#ff4444',
  A: '#ff9900',
  B: '#667eea',
  C: '#4CAF50',
}

const LOADING_MESSAGE = {
  normal: { icon: '📜', text: '試練の書を開いています...' },
  hard: { icon: '⚔️', text: '強敵があなたを待っています...' },
  very_hard: { icon: '💀', text: '伝説級の試練を召喚中...' },
}

function Avatar({ seed, size = 36 }) {
  const url = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`
  return <img src={url} width={size} height={size} style={{ borderRadius: '50%', border: '2px solid #667eea' }} />
}

export default function QuestPage({ bgm }) {
  const { quest_id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const [quest, setQuest] = useState(null)
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [lives, setLives] = useState(3)
  const [wrongCount, setWrongCount] = useState(0)
  const [phase, setPhase] = useState('loading')
  const [profile, setProfile] = useState(null)
  const [timeLeft, setTimeLeft] = useState(60)
  const [reward, setReward] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [clearers, setClearers] = useState([])

  useEffect(() => {
    if (!user) return
    fetch(`${API}/api/users?clerk_id=${user.id}`)
      .then(res => res.json())
      .then(data => { if (data.data?.[0]) setProfile(data.data[0]) })
  }, [user])

  useEffect(() => {
    fetch(`${API}/api/quests/${quest_id}`)
      .then(res => res.json())
      .then(data => setQuest(data.data))
  }, [quest_id])

  useEffect(() => {
    fetch(`${API}/api/quests/${quest_id}/results`)
      .then(res => res.json())
      .then(data => setClearers(Array.isArray(data.data) ? data.data : []))
  }, [quest_id])

  useEffect(() => {
    if (!quest) return
    if (quest.difficulty === 'tutorial') {
      fetch(`${API}/api/quests/${quest_id}/questions`)
        .then(res => res.json())
        .then(data => {
          setQuestions(Array.isArray(data.data) ? data.data : [])
          setPhase('playing')
        })
    } else {
      setGenerating(true)
      fetch(`${API}/api/quests/${quest_id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            setQuestions(data.data)
            setPhase('playing')
          } else {
            fetch(`${API}/api/quests/${quest_id}/questions`)
              .then(res => res.json())
              .then(data => {
                setQuestions(Array.isArray(data.data) ? data.data : [])
                setPhase('playing')
              })
          }
          setGenerating(false)
        })
        .catch(() => {
          setGenerating(false)
          setPhase('playing')
        })
    }
  }, [quest])

  // BGM制御
  useEffect(() => {
    if (!quest || !bgm) return
    if (phase === 'playing') {
      if (quest.difficulty === 'very_hard') {
        bgm.play('very_hard')
      } else {
        bgm.play('battle')
      }
    }
    if (phase === 'cleared') {
      bgm.play('fanfare')
    }
    if (phase === 'gameover') {
      bgm.stop()
    }
  }, [phase, quest])

  // ページ離脱時にトップBGMに戻す
  useEffect(() => {
    return () => {
      if (bgm) bgm.play('top')
    }
  }, [])

  useEffect(() => {
    if (phase !== 'playing') return
    setTimeLeft(quest?.time_limit || 60)
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
    const correct = questions[current]?.answer
    if (option === correct) {
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
      saveResult(false)
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
    if (cleared) {
      fetch(`${API}/api/quests/${quest_id}/results`)
        .then(res => res.json())
        .then(data => setClearers(Array.isArray(data.data) ? data.data : []))
    }
    if (cleared && quest?.reward_value) {
      const res = await fetch(`${API}/api/users/reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          reward_type: quest.reward_type || 'title',
          reward_value: quest.reward_value,
          reward_rarity: quest.reward_rarity || 'C',
        }),
      })
      const data = await res.json()
      if (data.success && !data.already_owned) {
        setReward({ value: quest.reward_value, rarity: quest.reward_rarity || 'C' })
      }
    }
  }

  const q = questions[current]
  const loadingMsg = LOADING_MESSAGE[quest?.difficulty] || LOADING_MESSAGE.normal

  const s = {
    page: { minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'sans-serif', padding: '2rem' },
    card: { maxWidth: '640px', margin: '0 auto', background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '16px', padding: '2rem' },
  }

  if (phase === 'loading' || generating) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{loadingMsg.icon}</div>
          <p style={{ color: '#B4965A', fontSize: '16px', letterSpacing: '1px' }}>{loadingMsg.text}</p>
        </div>
      </div>
    </div>
  )

  if (questions.length === 0) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
          <p style={{ color: '#888' }}>問題が見つかりませんでした</p>
          <button onClick={() => navigate(-1)}
            style={{ marginTop: '1rem', background: '#1a1a2e', color: 'white', border: '1px solid #333', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer' }}>
            戻る
          </button>
        </div>
      </div>
    </div>
  )

  if (phase === 'cleared') return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
          <h1 style={{ fontSize: '2rem', color: '#B4965A', marginBottom: '0.5rem' }}>クエストクリア！</h1>
          <p style={{ color: '#888', marginBottom: '1.5rem' }}>チャットが解放されました！</p>

          {reward && (
            <div style={{ background: '#1a1a2e', border: `1px solid ${RARITY_COLOR[reward.rarity]}`, borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🏆 報酬獲得！</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 600, color: RARITY_COLOR[reward.rarity], marginBottom: '4px' }}>
                称号「{reward.value}」
              </div>
              <div style={{ fontSize: '12px', background: RARITY_COLOR[reward.rarity] + '33', border: `1px solid ${RARITY_COLOR[reward.rarity]}`, borderRadius: '99px', padding: '2px 10px', display: 'inline-block', color: RARITY_COLOR[reward.rarity] }}>
                Rarity {reward.rarity}
              </div>
            </div>
          )}

          {clearers.length > 0 && (
            <div style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
              <div style={{ fontSize: '12px', color: '#888', letterSpacing: '2px', marginBottom: '10px' }}>
                ⚔️ このクエストのクリア者 ({clearers.length}人)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {clearers.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0f0f1a', borderRadius: '99px', padding: '4px 10px 4px 4px' }}>
                    <Avatar seed={c.users?.username || String(i)} size={24} />
                    <span style={{ fontSize: '12px', color: '#ccc' }}>{c.users?.username || '冒険者'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => navigate(-1)}
            style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer' }}>
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
          <p style={{ color: '#888', marginBottom: '0.5rem' }}>ライフがなくなりました</p>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '2rem' }}>もう一度挑戦しよう！</p>

          {clearers.length > 0 && (
            <div style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
              <div style={{ fontSize: '12px', color: '#888', letterSpacing: '2px', marginBottom: '10px' }}>
                ⚔️ クリア者 ({clearers.length}人)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {clearers.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0f0f1a', borderRadius: '99px', padding: '4px 10px 4px 4px' }}>
                    <Avatar seed={c.users?.username || String(i)} size={24} />
                    <span style={{ fontSize: '12px', color: '#ccc' }}>{c.users?.username || '冒険者'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => navigate(-1)}
            style={{ background: '#1a1a2e', color: 'white', border: '1px solid #333', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer' }}>
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

        {quest?.reward_value && (
          <div style={{ background: '#1a1a2e', borderRadius: '8px', padding: '8px 12px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#888' }}>クリア報酬：</span>
            <span style={{ fontSize: '12px', color: RARITY_COLOR[quest.reward_rarity] || '#B4965A', fontWeight: 600 }}>
              🏆 称号「{quest.reward_value}」
            </span>
            <span style={{ fontSize: '11px', background: (RARITY_COLOR[quest.reward_rarity] || '#B4965A') + '33', border: `1px solid ${RARITY_COLOR[quest.reward_rarity] || '#B4965A'}`, borderRadius: '99px', padding: '1px 6px', color: RARITY_COLOR[quest.reward_rarity] || '#B4965A' }}>
              {quest.reward_rarity || 'C'}
            </span>
          </div>
        )}

        {clearers.length > 0 && (
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', color: '#666' }}>クリア者：</span>
            {clearers.slice(0, 5).map((c, i) => (
              <div key={i} title={c.users?.username || '冒険者'}>
                <Avatar seed={c.users?.username || String(i)} size={24} />
              </div>
            ))}
            {clearers.length > 5 && (
              <span style={{ fontSize: '11px', color: '#666' }}>+{clearers.length - 5}人</span>
            )}
          </div>
        )}

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