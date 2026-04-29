import { useState, useEffect } from 'react'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

const API = 'https://meets-summit-api.tk-xx719.workers.dev'

export default function JobClassPage() {
  const [jobClasses, setJobClasses] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${API}/api/job-classes`)
      .then(res => res.json())
      .then(data => setJobClasses(data.data))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center', fontSize: '3rem', background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        ⚔️ Meets Summit - ミーツサミット ⚔️
      </h1>
      <p style={{ textAlign: 'center', color: '#888', marginBottom: '3rem' }}>RPG × マッチング</p>

      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <SignedOut>
          <SignInButton mode="modal">
            <button style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' }}>
              ⚔️ 冒険を始める
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
            <UserButton />
            <button onClick={() => navigate('/profile')} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>
              プロフィール設定
            </button>
          </div>
        </SignedIn>
      </div>

      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>職業クラス一覧</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', maxWidth: '900px', margin: '0 auto' }}>
        {jobClasses && jobClasses.map(job => (
          <div key={job.id} style={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
            <div style={{ fontSize: '2.5rem' }}>{job.icon}</div>
            <div style={{ fontWeight: 'bold', marginTop: '0.5rem' }}>{job.name}</div>
            <div style={{ color: '#888', fontSize: '0.85rem' }}>{job.rp_prefix}皇〜{job.rp_prefix}の人</div>
          </div>
        ))}
      </div>
    </div>
  )
}