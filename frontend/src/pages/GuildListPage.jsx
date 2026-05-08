import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { getPlanGlow, getPlanBorderColor } from '../utils/planBadge'

const API = 'https://meets-summit-api.tk-xx719.workers.dev'

const PLAN_GUILD_LIMIT = { free: 1, light: 3, standard: 5, premium: -1 }
const RANK_MAP = { hito: 'の人', shi: '士', shou: '将', ou: '王', kou: '皇' }

function MemberAvatar({ member, size = 36 }) {
  const borderColor = getPlanBorderColor(member?.plan)
  const glow = getPlanGlow(member?.plan)
  const style = {
    width: size, height: size, borderRadius: '50%',
    border: `2px solid ${borderColor}`,
    boxShadow: glow || 'none',
    objectFit: 'cover', flexShrink: 0,
  }
  if (member?.avatar_url) {
    return <img src={member.avatar_url} style={style} />
  }
  const icons = ['🌻', '🌸', '🌺', '🌹', '🌼', '🌷', '🍀', '🌈', '⭐', '🎀']
  const bgColors = ['#1a1a2e', '#1a160a', '#0f1a1a', '#1a0f1a', '#0f0f1a', '#1a1a0f']
  const idx = Math.abs((member?.username || 'user').split('').reduce((a, c) => a + c.charCodeAt(0), 0))
  return (
    <div style={{ ...style, background: bgColors[idx % bgColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5 }}>
      {icons[idx % icons.length]}
    </div>
  )
}

export default function GuildListPage() {
  const [guilds, setGuilds] = useState([])
  const [profile, setProfile] = useState(null)
  const [myGuildIds, setMyGuildIds] = useState([])
  const navigate = useNavigate()
  const { user } = useUser()

  useEffect(() => {
    fetch(`${API}/api/guilds?t=${Date.now()}`)
      .then(res => res.json())
      .then(data => setGuilds(Array.isArray(data.data) ? data.data : []))
  }, [])

  useEffect(() => {
    if (!user) return
    fetch(`${API}/api/users?clerk_id=${user.id}`)
      .then(res => res.json())
      .then(data => { if (data.data?.[0]) setProfile(data.data[0]) })
  }, [user])

  useEffect(() => {
    if (!profile) return
    fetch(`${API}/api/my-guilds?user_id=${profile.id}`)
      .then(res => res.json())
      .then(data => {
        const ids = Array.isArray(data.data) ? data.data.map(m => m.guild_id) : []
        setMyGuildIds(ids)
      })
  }, [profile])

  const isAdmin = profile?.user_type === 'guild_master'
  const planLimit = PLAN_GUILD_LIMIT[profile?.plan || 'free']
  const joinedCount = myGuildIds.length
  const canJoinMore = planLimit === -1 || joinedCount < planLimit

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'sans-serif', padding: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '2px' }}>⚔️ ギルド一覧</h1>
          {isAdmin ? (
            <button onClick={() => navigate('/guilds/create')}
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}>
              ＋ ギルド作成
            </button>
          ) : (
            <div style={{ width: '80px' }} />
          )}
        </div>

        {/* ギルド参加状況 */}
        {profile && (
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '12px', color: canJoinMore ? '#888' : '#cc3333' }}>
              参加中：{joinedCount} / {planLimit === -1 ? '無制限' : planLimit}ギルド
              {!canJoinMore && (
                <span
                  onClick={() => navigate('/plan')}
                  style={{ color: '#667eea', cursor: 'pointer', textDecoration: 'underline', marginLeft: '8px' }}>
                  プランをアップグレード →
                </span>
              )}
            </span>
          </div>
        )}

        {guilds.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#666', marginTop: '4rem' }}>
            <p style={{ fontSize: '3rem' }}>🏰</p>
            <p>まだギルドがありません</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {guilds.map(guild => {
              const isJoined = myGuildIds.includes(guild.id)
              const members = guild.preview_members || []
              const memberCount = guild.member_count || 0

              return (
                <div key={guild.id}
                  onClick={() => navigate(`/guilds/${guild.id}`)}
                  style={{ background: '#0f0f1a', border: `1px solid ${isJoined ? '#B4965A' : '#2a2a3e'}`, borderRadius: '12px', padding: '1.5rem', cursor: 'pointer', transition: 'all .2s', position: 'relative' }}
                  onMouseOver={e => e.currentTarget.style.borderColor = '#B4965A'}
                  onMouseOut={e => e.currentTarget.style.borderColor = isJoined ? '#B4965A' : '#2a2a3e'}>

                  {/* 参加中バッジ */}
                  {isJoined && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '10px', background: '#B4965A22', border: '1px solid #B4965A', borderRadius: '99px', padding: '2px 8px', color: '#B4965A' }}>
                      参加中
                    </div>
                  )}

                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{guild.icon || '⚔️'}</div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.3rem' }}>{guild.name}</div>
                  <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '1rem' }}>{guild.description}</div>

                  {/* メンバープレビュー */}
                  {members.length > 0 && (
                    <div style={{ borderTop: '1px solid #1e1e2e', paddingTop: '0.8rem' }}>
                      <div style={{ fontSize: '11px', color: '#666', marginBottom: '6px' }}>
                        冒険者 {memberCount}人
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {members.slice(0, 4).map((m, i) => (
                          <div key={i} title={m.username}>
                            <MemberAvatar member={m} size={32} />
                          </div>
                        ))}
                        {memberCount > 4 && (
                          <div style={{ fontSize: '11px', color: '#666', marginLeft: '4px' }}>
                            +{memberCount - 4}人
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 未参加＆上限の場合 */}
                  {!isJoined && !canJoinMore && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#cc3333' }}>
                      ⚠️ ギルド上限に達しています
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}