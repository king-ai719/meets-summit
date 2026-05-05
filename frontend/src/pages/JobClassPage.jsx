import { useState, useEffect } from 'react'
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

const API = 'https://meets-summit-api.tk-xx719.workers.dev'

function Avatar({ seed, size = 60, badge = null }) {
  const icons = ['🌻', '🌸', '🌺', '🌹', '🌼', '🌷', '🍀', '🌈', '⭐', '🎀']
  const bgColors = ['#1a1a2e', '#1a160a', '#0f1a1a', '#1a0f1a', '#0f0f1a', '#1a1a0f']
  const idx = Math.abs((seed || 'user').split('').reduce((a, c) => a + c.charCodeAt(0), 0))
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div style={{ width: size, height: size, borderRadius: '50%', border: '2px solid #667eea', background: bgColors[idx % bgColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5 }}>
        {icons[idx % icons.length]}
      </div>
      {badge && (
        <div style={{ position: 'absolute', top: -8, right: -8, fontSize: '1.2rem', filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))' }}>
          {badge}
        </div>
      )}
    </div>
  )
}

const RANK_LABELS = {
  kou: '皇', ou: '王', shou: '将', shi: '士', hito: 'の人'
}

export default function JobClassPage() {
  const [jobClasses, setJobClasses] = useState([])
  const [profile, setProfile] = useState(null)
  const [myGuilds, setMyGuilds] = useState([])
  const navigate = useNavigate()
  const { user } = useUser()

  useEffect(() => {
    fetch(`${API}/api/job-classes`)
      .then(res => res.json())
      .then(data => setJobClasses(Array.isArray(data.data) ? data.data : []))
  }, [])

  useEffect(() => {
    if (!user) return
    fetch(`${API}/api/users?clerk_id=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data.length > 0) setProfile(data.data[0])
      })
  }, [user])

  useEffect(() => {
    if (!profile) return
    fetch(`${API}/api/my-guilds?user_id=${profile.id}`)
      .then(res => res.json())
      .then(data => setMyGuilds(Array.isArray(data.data) ? data.data : []))
  }, [profile])

  const getTitle = () => {
    if (!profile || !profile.job_class_id || !profile.job_rank) return '冒険者'
    const job = jobClasses.find(j => j.id === profile.job_class_id)
    if (!job) return '冒険者'
    if (job.category === 'night_wom') {
      const womRanks = { kou: '夜皇姫', ou: '夜王妃', shou: '夜将姫', shi: '夜士女', hito: '夜の人' }
      return womRanks[profile.job_rank] || '冒険者'
    }
    const rank = RANK_LABELS[profile.job_rank] || ''
    return `${job.rp_prefix}${rank}`
  }

  const getBadge = () => {
    if (!profile) return null
    if (profile.user_type === 'guild_master') return '🏰'
    if (profile.user_type === 'premium') return '👑'
    return null
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, padding: '2rem' }}>
        <h1 style={{ textAlign: 'center', fontSize: '3rem', background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Meets Summit - ミーツサミット
        </h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '4px' }}>クイズRPG × マッチング</p>
        <p style={{ textAlign: 'center', color: '#B4965A', fontSize: '13px', letterSpacing: '3px', marginBottom: '2rem' }}>知識が、出逢いになる。</p>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <SignedOut>
            <SignInButton mode="modal">
              <button style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' }}>
                ⚔️ 冒険を始める
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Avatar seed={profile?.username || user?.id || 'default'} size={60} badge={getBadge()} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 'bold' }}>{profile?.username || user?.firstName || '冒険者'}</div>
                <div style={{ fontSize: '0.85rem', color: '#B4965A' }}>{getTitle()}</div>
              </div>
              <UserButton />
              <button onClick={() => navigate('/profile')} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>
                プロフィール設定
              </button>
              <button onClick={() => navigate('/guilds')} style={{ background: 'linear-gradient(135deg, #764ba2, #667eea)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>
                🏰 ギルド
              </button>
            </div>

            {myGuilds.length > 0 && (
              <div style={{ maxWidth: '900px', margin: '1.5rem auto 0', textAlign: 'left' }}>
                <p style={{ fontSize: '0.75rem', letterSpacing: '2px', color: '#888', marginBottom: '8px' }}>参加中のギルド</p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {myGuilds.map((m, i) => (
                    <div key={i} onClick={() => navigate(`/guilds/${m.guild_id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', transition: 'all .2s' }}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#B4965A'}
                      onMouseOut={e => e.currentTarget.style.borderColor = '#2a2a3e'}>
                      <span style={{ fontSize: '1.2rem' }}>{m.guilds?.icon || '⚔️'}</span>
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{m.guilds?.name || 'ギルド'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SignedIn>
        </div>

        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>職業クラス一覧</h2>
        <p style={{ textAlign: 'center', color: '#666', fontSize: '12px', marginBottom: '1.5rem' }}>職業をタップしてクイズに挑戦！</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', maxWidth: '900px', margin: '0 auto' }}>
          {jobClasses.map(job => (
            <div key={job.id}
              onClick={() => navigate(`/job-classes/${job.id}`)}
              style={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = '#667eea' }}
              onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#333' }}>
              <div style={{ fontSize: '2.5rem' }}>{job.icon}</div>
              <div style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>{job.name}</div>
              <div style={{ color: '#888', fontSize: '0.85rem' }}>{job.rp_prefix}皇〜{job.rp_prefix}の人</div>
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#667eea' }}>クイズに挑戦 →</div>
            </div>
          ))}
        </div>
      </div>

      {/* ★ フッター */}
      <footer style={{ borderTop: '1px solid #1e1e2e', padding: '2rem', marginTop: '4rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px', marginBottom: '1.5rem' }}>
            <span onClick={() => navigate('/terms')} style={{ fontSize: '12px', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}>利用規約</span>
            <span onClick={() => window.open('https://meets-summit.pages.dev/policy.html', '_blank')} style={{ fontSize: '12px', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}>プライバシーポリシー</span>
            <span onClick={() => window.open('mailto:tms.9020@gmail.com')} style={{ fontSize: '12px', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}>お問い合わせ</span>
            <span onClick={() => navigate('/withdraw')} style={{ fontSize: '12px', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}>退会</span>
          </div>
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#444' }}>© 2025 株式会社Techno Management Service</p>
        </div>
      </footer>
    </div>
  )
}