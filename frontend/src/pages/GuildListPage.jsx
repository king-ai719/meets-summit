import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignedIn } from '@clerk/clerk-react'

const API = 'https://meets-summit-api.tk-xx719.workers.dev'

export default function GuildListPage() {
  const [guilds, setGuilds] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${API}/api/guilds`)
      .then(res => res.json())
      .then(data => setGuilds(data.data || []))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'sans-serif', padding: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '2px' }}>⚔️ ギルド一覧</h1>
          <SignedIn>
            <button onClick={() => navigate('/guilds/create')} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}>
              ＋ ギルド作成
            </button>
          </SignedIn>
        </div>

        {guilds.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', marginTop: '4rem' }}>
            <p style={{ fontSize: '3rem' }}>🏰</p>
            <p>まだギルドがありません</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {guilds.map(guild => (
              <div key={guild.id}
                onClick={() => navigate(`/guilds/${guild.id}`)}
                style={{ background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '12px', padding: '1.5rem', cursor: 'pointer', transition: 'all .2s' }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#B4965A'}
                onMouseOut={e => e.currentTarget.style.borderColor = '#2a2a3e'}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{guild.icon || '⚔️'}</div>
                <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.3rem' }}>{guild.name}</div>
                <div style={{ color: '#888', fontSize: '0.85rem' }}>{guild.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}