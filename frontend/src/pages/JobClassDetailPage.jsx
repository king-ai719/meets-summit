import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SignInButton, SignedOut } from '@clerk/clerk-react'

const API = 'https://meets-summit-api.tk-xx719.workers.dev'

const DIFFICULTY = [
  { key: 'normal', label: 'ノーマル', icon: '🗡️', desc: '基礎知識・3問', color: '#4CAF50' },
  { key: 'hard', label: 'ハード', icon: '⚔️', desc: '専門知識・3問', color: '#FF9800' },
  { key: 'very_hard', label: 'ベリーハード', icon: '💀', desc: '資格試験レベル・5問', color: '#cc3333' },
]

const RANKS_NORMAL = [
  { key: 'kou', desc: '経営者・社長・代表' },
  { key: 'ou', desc: '役員・取締役' },
  { key: 'shou', desc: '管理職・マネージャー' },
  { key: 'shi', desc: '社員・スタッフ' },
  { key: 'hito', desc: 'アルバイト・パート' },
]

const RANKS_NIGHT_WOM = [
  { key: 'kou', label: '夜皇姫', desc: 'オーナー・代表' },
  { key: 'ou', label: '夜王妃', desc: 'ナンバーワン' },
  { key: 'shou', label: '夜将姫', desc: 'ベテラン' },
  { key: 'shi', label: '夜士女', desc: 'スタッフ' },
  { key: 'hito', label: '夜の人', desc: '新人' },
]

const RANKS_NIGHT_MEN = [
  { key: 'kou', desc: 'オーナー・代表' },
  { key: 'ou', desc: 'ナンバーワン' },
  { key: 'shou', desc: 'ベテラン' },
  { key: 'shi', desc: 'スタッフ' },
  { key: 'hito', desc: '新人' },
]

export default function JobClassDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/job-classes`)
      .then(res => res.json())
      .then(data => {
        const jobs = Array.isArray(data.data) ? data.data : []
        const found = jobs.find(j => j.id === id)
        setJob(found || null)
        setLoading(false)
      })
  }, [id])

  const getRanks = () => {
    if (!job) return []
    if (job.category === 'night_wom') return RANKS_NIGHT_WOM
    if (job.category === 'night_men') return RANKS_NIGHT_MEN
    return RANKS_NORMAL
  }

  const getRankLabel = (rank) => {
    if (!job) return ''
    if (job.category === 'night_wom') return rank.label || ''
    return `${job.rp_prefix}${rank.key === 'kou' ? '皇' : rank.key === 'ou' ? '王' : rank.key === 'shou' ? '将' : rank.key === 'shi' ? '士' : 'の人'}`
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
      読み込み中...
    </div>
  )

  if (!job) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
      職業が見つかりません
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'sans-serif', padding: '2rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        {/* ヘッダー */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
          <div style={{ fontSize: '3rem' }}>{job.icon}</div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 600 }}>{job.name}</h1>
            <p style={{ color: '#888', fontSize: '13px' }}>
              {job.category === 'night_wom' ? '夜皇姫〜夜の人' : `${job.rp_prefix}皇〜${job.rp_prefix}の人`}
            </p>
          </div>
        </div>

        {/* 称号一覧 */}
        <div style={{ background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '0.85rem', letterSpacing: '2px', color: '#888', marginBottom: '1rem' }}>RANK & 称号</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {getRanks().map(rank => (
              <div key={rank.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: '#1a1a2e', borderRadius: '8px' }}>
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#B4965A', minWidth: '80px' }}>
                  {getRankLabel(rank)}
                </span>
                <span style={{ fontSize: '12px', color: '#666' }}>{rank.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ゲスト体験クイズ */}
        <div style={{ background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '0.85rem', letterSpacing: '2px', color: '#888', marginBottom: '4px' }}>GUEST QUIZ</h2>
          <p style={{ color: '#666', fontSize: '12px', marginBottom: '1rem' }}>難易度を選んでクイズに挑戦！登録不要で体験できます</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
            {DIFFICULTY.map(d => (
              <div key={d.key}
                onClick={() => setSelectedDifficulty(d.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '14px 16px', borderRadius: '10px', cursor: 'pointer',
                  border: `1px solid ${selectedDifficulty === d.key ? d.color : '#2a2a3e'}`,
                  background: selectedDifficulty === d.key ? d.color + '11' : '#1a1a2e',
                  transition: 'all .2s'
                }}>
                <span style={{ fontSize: '1.4rem' }}>{d.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: selectedDifficulty === d.key ? d.color : 'white' }}>{d.label}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{d.desc}</div>
                </div>
                {selectedDifficulty === d.key && (
                  <span style={{ fontSize: '12px', color: d.color }}>選択中</span>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              if (!selectedDifficulty) return alert('難易度を選んでください')
              navigate(`/guest-quest/${id}?difficulty=${selectedDifficulty}`)
            }}
            style={{
              width: '100%', padding: '14px',
              background: selectedDifficulty ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#2a2a3e',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '15px', letterSpacing: '2px', cursor: selectedDifficulty ? 'pointer' : 'default',
              transition: 'all .2s'
            }}>
            ⚔️ クイズに挑戦する
          </button>
        </div>

        {/* 登録誘導 */}
        <SignedOut>
          <div style={{ background: '#1a160a', border: '1px solid #B4965A33', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🏰</div>
            <div style={{ fontWeight: 600, color: '#B4965A', marginBottom: '4px' }}>ギルドに参加して仲間を見つけよう</div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '1rem' }}>登録するとギルドへの参加・チャット・マッチングが解放されます</div>
            <SignInButton mode="modal">
              <button style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
                無料で始める
              </button>
            </SignInButton>
          </div>
        </SignedOut>

      </div>
    </div>
  )
}