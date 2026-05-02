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
  const [quests, setQuests] = useState([])
  const [isMember, setIsMember] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [dissolving, setDissolving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/guilds/${id}`)
      .then(res => res.json())
      .then(data => { setGuild(data.data); setLoading(false) })
  }, [id])

  useEffect(() => {
    fetch(`${API}/api/guilds/${id}/members`)
      .then(res => res.json())
      .then(data => setMembers(Array.isArray(data.data) ? data.data : []))
  }, [id])

  useEffect(() => {
    fetch(`${API}/api/quests?guild_id=${id}`)
      .then(res => res.json())
      .then(data => setQuests(Array.isArray(data.data) ? data.data : []))
  }, [id])

  useEffect(() => {
    if (!user) return
    fetch(`${API}/api/users?clerk_id=${user.id}`)
      .then(res => res.json())
      .then(data => { if (data.data?.[0]) setProfile(data.data[0]) })
  }, [user])

  useEffect(() => {
    if (!profile || !guild) return
    setIsMember(members.some(m => m.user_id === profile.id))
    setIsOwner(guild.owner_id === profile.id)
  }, [profile, members, guild])

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

  const handleLeave = async () => {
    if (!window.confirm('このギルドから脱退しますか？')) return
    setLeaving(true)
    try {
      const res = await fetch(`${API}/api/guild-members/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guild_id: id, user_id: profile.id }),
      })
      const data = await res.json()
      if (data.success) {
        setIsMember(false)
        setMembers(prev => prev.filter(m => m.user_id !== profile.id))
      } else alert('脱退に失敗しました')
    } catch { alert('通信エラー') }
    finally { setLeaving(false) }
  }

  const handleDissolve = async () => {
    if (!window.confirm('本当にギルドを解散しますか？この操作は取り消せません。')) return
    setDissolving(true)
    try {
      const res = await fetch(`${API}/api/guilds/${id}/dissolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_id: profile.id }),
      })
      const data = await res.json()
      if (data.success) { window.location.href = '/' }
      else alert('解散に失敗しました：' + data.error)
    } catch { alert('通信エラー') }
    finally { setDissolving(false) }
  }

  const difficultyLabel = (d) => {
    if (d === 'normal') return { label: 'NORMAL', color: '#4CAF50' }
    if (d === 'hard') return { label: 'HARD', color: '#FF9800' }
    return { label: 'VERY HARD', color: '#cc3333' }
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

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '99px', padding: '4px 12px', fontSize: '12px', color: '#888' }}>
            👥 {members.length}人
          </span>
          {guild.guild_type && (
            <span style={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '99px', padding: '4px 12px', fontSize: '12px', color: '#888' }}>
              {guild.guild_type === 'love' ? '❤️ 恋愛' : guild.guild_type === 'work' ? '💼 仕事' : guild.guild_type === 'hobby' ? '🎮 趣味' : '🌙 夜職'}
            </span>
          )}
          {isOwner && (
            <span style={{ background: '#1a160a', border: '1px solid #B4965A', borderRadius: '99px', padding: '4px 12px', fontSize: '12px', color: '#B4965A' }}>
              🏰 ギルドマスター
            </span>
          )}
        </div>

        {user && (
          isMember ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
              <div style={{ background: '#0f1a0f', border: '1px solid #1a4a1a', borderRadius: '10px', padding: '12px', textAlign: 'center', color: '#4CAF50' }}>
                ✅ このギルドに参加済み
              </div>
              {!isOwner && (
                <button onClick={handleLeave} disabled={leaving}
                  style={{ width: '100%', padding: '10px', border: '1px solid #4a1a1a', borderRadius: '10px', background: 'transparent', color: '#888', fontSize: '13px', cursor: 'pointer', transition: 'all .2s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#cc3333'; e.currentTarget.style.color = '#cc3333' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#4a1a1a'; e.currentTarget.style.color = '#888' }}>
                  {leaving ? '脱退中...' : 'Leave — ギルドを脱退する'}
                </button>
              )}
              {isOwner && (
                <button onClick={handleDissolve} disabled={dissolving}
                  style={{ width: '100%', padding: '10px', border: '1px solid #4a1a1a', borderRadius: '10px', background: 'transparent', color: '#888', fontSize: '13px', cursor: 'pointer', transition: 'all .2s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#cc3333'; e.currentTarget.style.color = '#cc3333' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#4a1a1a'; e.currentTarget.style.color = '#888' }}>
                  {dissolving ? '解散中...' : 'Dissolve — ギルドを解散する'}
                </button>
              )}
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

        <h2 style={{ fontSize: '1rem', letterSpacing: '2px', color: '#888', marginBottom: '1rem' }}>QUESTS</h2>
        {quests.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', marginBottom: '1rem' }}>クエストがありません</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
            {quests.map(quest => {
              const diff = difficultyLabel(quest.difficulty)
              return (
                <div key={quest.id} style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>{quest.title}</div>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#0f0f1a', color: diff.color, border: `1px solid ${diff.color}` }}>
                      {diff.label}
                    </span>
                    <span style={{ fontSize: '11px', color: '#888', marginLeft: '8px' }}>⏱ {quest.time_limit}s</span>
                  </div>
                  {isMember && (
                    <button onClick={() => navigate(`/quests/${quest.id}`)}
                      style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      挑戦する
                    </button>
                  )}
                </div>
              )
            })}
          </div>
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