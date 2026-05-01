import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

const API = 'https://meets-summit-api.tk-xx719.workers.dev'

function Avatar({ seed, size = 40 }) {
  const url = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`
  return <img src={url} width={size} height={size} style={{ borderRadius: '50%', border: '2px solid #667eea' }} />
}

export default function GuildDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const [guild, setGuild] = useState(null)
  const [members, setMembers] = useState([])
  const [profile, setProfile] = useState(null)
  const [isMember, setIsMember] = useState(false)
  const [joining, setJoining] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/guilds/${id}`)
      .then(res => res.json())
      .then(data => {
        setGuild(data.data)
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    fetch(`${API}/api/guilds/${id}/members`)
      .then(res => res.json())
      .then(data => setMembers(Array.isArray(data.data) ? data.data : []))
  }, [id])

  useEffect(() => {
    if (!user) return
    fetch(`${API}/api/users?clerk_id=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data.length > 0) setProfile(data.data[0])
      })
  }, [user])

  useEffect(() => {
    if (!profile || members.length === 0) return
    setIsMember(members.some(m => m.user_id === profile.id))
  }, [profile, members])

  const handleJoin = async () => {
    if (!profile) return alert('先にプロフィールを設定してください')
    setJoining(true)
    try {
      const res = await fetch(`${API}/api/guild-members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guild_id: id, user_id: profile.id, role: 'member' }),
      })
      const data = await res.json()
      if (data.success) {
        setIsMember(true)
        setMembers(prev => [...prev, { user_id: profile.id, username: profile.username }])
      } else alert('参加に失敗しました')
    } catch { alert('通信エラー') }
    finally { setJoining(false) }
  }

  const s = {
    page: { minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'sans-serif', padding: '2rem' },
    card: { maxWidth: '700px', margin: '0 auto', background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '16px', padding: '2rem' },
    divider: { height: '1px', background: '#1e1e2e', margin: '1.5rem 0' },
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
      読み込み中...
    </div>
  )

  if (!guild) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
      ギルドが見つかりません
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => navigate('/guilds')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
          <div style={{ fontSize: '3rem' }}>{guild.icon || '⚔️'}</div>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 600 }}>{guild.name}</h1>
            <p style={{ color: '#888', fontSize: '13px' }}>{guild.description}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
          <span style={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '99px', padding: '4px 12px', fontSize: '12px', color: '#888' }}>
            👥 {members.length}人
          </span>
          {guild.guild_type && (
            <span style={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '99px', padding: '4px 12px', fontSize: '12px', color: '#888' }}>
              {guild.guild_type === 'love' ? '❤️ 恋愛' : guild.guild_type === 'work' ? '💼 仕事' : guild.guild_type === 'hobby' ? '🎮 趣味' : '🌙 夜職'}
            </span>
          )}
        </div>

        {user && (
          isMember ? (
            <div style={{ background: '#0f1a0f', border: '1px solid #1a4a1a', borderRadius: '10px', padding: '12px', textAlign: 'center', color: '#4CAF50', marginBottom: '1.5rem' }}>
              ✅ このギルドに参加済み
            </div>
          ) : (
            <button onClick={handleJoin} disabled={joining} style={{ width: '100%', padding: '14px', border: '1px solid #B4965A', borderRadius: '10px', background: 'transparent', color: '#B4965A', fontSize: '15px', letterSpacing: '2px', cursor: 'pointer', marginBottom: '1.5rem', transition: 'all .2s' }}
              onMouseOver={e => { e.currentTarget.style.background = '#B4965A'; e.currentTarget.style.color = '#0a0a0f' }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#B4965A' }}>
              {joining ? '参加中...' : 'Join — このギルドに参加する'}
            </button>
          )
        )}

        <div style={s.divider} />

        <h2 style={{ fontSize: '1rem', letterSpacing: '2px', color: '#888', marginBottom: '1rem' }}>MEMBERS</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {members.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center' }}>まだメンバーがいません</p>
          ) : (
            members.map((member, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: '#1a1a2e', borderRadius: '10px' }}>
                <Avatar seed={member.user_id} size={40} />
                <div>
                  <div style={{ fontWeight: 500 }}>{member.username || '冒険者'}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{member.role === 'master' ? '🏰 ギルドマスター' : 'メンバー'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}