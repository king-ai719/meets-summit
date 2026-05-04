import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

const API = 'https://meets-summit-api.tk-xx719.workers.dev'

const RANK_LABEL = {
  hito: 'の人', shi: '士', shou: '将', ou: '王', kou: '皇',
}

const RARITY_COLOR = {
  S: '#ff4444', A: '#ff9900', B: '#667eea', C: '#4CAF50',
}

function Avatar({ seed, avatarUrl, size = 40 }) {
  if (avatarUrl) {
    return <img src={avatarUrl} width={size} height={size} style={{ borderRadius: '50%', border: '2px solid #667eea', objectFit: 'cover' }} />
  }
  const url = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`
  return <img src={url} width={size} height={size} style={{ borderRadius: '50%', border: '2px solid #667eea' }} />
}

function buildTitle(userObj) {
  if (!userObj) return '冒険者'
  const prefix = userObj.job_classes?.rp_prefix || ''
  const rank = RANK_LABEL[userObj.job_rank] || ''
  if (!prefix && !rank) return '冒険者'
  return `${prefix}${rank}`
}

function formatTime(isoStr) {
  const d = new Date(isoStr)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

export default function GuildDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const [guild, setGuild] = useState(null)
  const [members, setMembers] = useState([])
  const [profile, setProfile] = useState(null)
  const [quests, setQuests] = useState([])
  const [questUnlocks, setQuestUnlocks] = useState({})
  const [isMember, setIsMember] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [dissolving, setDissolving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [sending, setSending] = useState(false)
  const [hasChatAccess, setHasChatAccess] = useState(false)
  const [activeTab, setActiveTab] = useState('quests')
  const [hoveredMsg, setHoveredMsg] = useState(null)
  const [reactions, setReactions] = useState({})
  const messagesEndRef = useRef(null)
  const pollingRef = useRef(null)

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

  useEffect(() => {
    if (!profile || !isMember) return
    fetch(`${API}/api/guilds/${id}/chat-access?user_id=${profile.id}`)
      .then(res => res.json())
      .then(data => setHasChatAccess(data.has_access))
  }, [profile, isMember, id])

  useEffect(() => {
    if (!profile || quests.length === 0) return
    const lockedQuests = quests.filter(q => q.unlock_condition)
    lockedQuests.forEach(quest => {
      fetch(`${API}/api/quests/${quest.id}/unlock-check?user_id=${profile.id}`)
        .then(res => res.json())
        .then(data => { setQuestUnlocks(prev => ({ ...prev, [quest.id]: data })) })
    })
  }, [profile, quests])

  const fetchMessages = () => {
    fetch(`${API}/api/guilds/${id}/messages`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data.data)) setMessages(data.data) })
  }

  useEffect(() => {
    if (activeTab === 'chat' && hasChatAccess) {
      fetchMessages()
      pollingRef.current = setInterval(fetchMessages, 5000)
    } else {
      clearInterval(pollingRef.current)
    }
    return () => clearInterval(pollingRef.current)
  }, [activeTab, hasChatAccess])

  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeTab])

  const fetchReaction = async (message_id) => {
    if (reactions[message_id]) return
    const res = await fetch(`${API}/api/message-reactions?message_id=${message_id}&user_id=${profile?.id || ''}`)
    const data = await res.json()
    if (data.success) setReactions(prev => ({ ...prev, [message_id]: data }))
  }

  const handleReaction = async (message_id, reaction_type) => {
    if (!profile) return
    await fetch(`${API}/api/message-reactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message_id, user_id: profile.id, reaction_type }),
    })
    const res = await fetch(`${API}/api/message-reactions?message_id=${message_id}&user_id=${profile.id}`)
    const data = await res.json()
    if (data.success) setReactions(prev => ({ ...prev, [message_id]: data }))
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !profile || sending) return
    setSending(true)
    try {
      const res = await fetch(`${API}/api/guilds/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: profile.id, content: chatInput }),
      })
      const data = await res.json()
      if (data.success) { setChatInput(''); fetchMessages() }
      else alert('送信に失敗しました')
    } catch { alert('通信エラー') }
    finally { setSending(false) }
  }

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
        fetch(`${API}/api/guilds/${id}/members`).then(res => res.json()).then(data => setMembers(Array.isArray(data.data) ? data.data : []))
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
      if (data.success) { setIsMember(false); setMembers(prev => prev.filter(m => m.user_id !== profile.id)) }
      else alert('脱退に失敗しました')
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
    if (d === 'normal') return { label: 'NORMAL', color: '#4CAF50', icon: '🗡️' }
    if (d === 'hard') return { label: 'HARD', color: '#FF9800', icon: '⚔️' }
    return { label: 'VERY HARD', color: '#cc3333', icon: '💀' }
  }

  const s = {
    page: { minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'sans-serif', padding: '2rem' },
    card: { maxWidth: '700px', margin: '0 auto', background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '16px', padding: '2rem' },
    divider: { height: '1px', background: '#1e1e2e', margin: '1.5rem 0' },
    tab: (active) => ({
      flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', letterSpacing: '1px',
      background: active ? '#1a1a2e' : 'transparent',
      color: active ? '#B4965A' : '#666',
      borderBottom: active ? '2px solid #B4965A' : '2px solid transparent',
      transition: 'all .2s',
    }),
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>読み込み中...</div>
  )

  if (!guild) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>ギルドが見つかりません</div>
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
            <button onClick={handleJoin} disabled={joining}
              style={{ width: '100%', padding: '14px', border: '1px solid #B4965A', borderRadius: '10px', background: 'transparent', color: '#B4965A', fontSize: '15px', letterSpacing: '2px', cursor: 'pointer', marginBottom: '1.5rem', transition: 'all .2s' }}
              onMouseOver={e => { e.currentTarget.style.background = '#B4965A'; e.currentTarget.style.color = '#0a0a0f' }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#B4965A' }}>
              {joining ? '参加中...' : 'Join — このギルドに参加する'}
            </button>
          )
        )}

        <div style={s.divider} />

        <div style={{ display: 'flex', borderBottom: '1px solid #2a2a3e', marginBottom: '1.5rem' }}>
          <button style={s.tab(activeTab === 'quests')} onClick={() => setActiveTab('quests')}>⚔️ QUESTS</button>
          <button style={s.tab(activeTab === 'chat')} onClick={() => setActiveTab('chat')}>
            💬 CHAT {!hasChatAccess && isMember ? '🔒' : ''}
          </button>
          <button style={s.tab(activeTab === 'members')} onClick={() => setActiveTab('members')}>👥 MEMBERS</button>
        </div>

        {activeTab === 'quests' && (
          <div>
            {quests.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', marginBottom: '1rem' }}>クエストがありません</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {quests.map(quest => {
                  const diff = difficultyLabel(quest.difficulty)
                  const unlockInfo = questUnlocks[quest.id]
                  const isLocked = quest.unlock_condition && (!unlockInfo || !unlockInfo.unlocked)
                  const lockReasons = unlockInfo?.conditions?.filter(c => !c.met).map(c => c.message) || []
                  return (
                    <div key={quest.id} style={{ background: isLocked ? '#141420' : '#1a1a2e', border: `1px solid ${isLocked ? '#333' : diff.color + '22'}`, borderRadius: '10px', padding: '1rem', opacity: isLocked ? 0.7 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{ fontSize: '18px' }}>{isLocked ? '🔒' : diff.icon}</span>
                            <span style={{ fontWeight: 600, fontSize: '15px', color: isLocked ? '#666' : 'white' }}>{quest.title}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: '#0f0f1a', color: isLocked ? '#555' : diff.color, border: `1px solid ${isLocked ? '#333' : diff.color}` }}>{diff.label}</span>
                            <span style={{ fontSize: '11px', color: '#888' }}>⏱ {quest.time_limit}s</span>
                            {quest.reward_value && <span style={{ fontSize: '11px', color: isLocked ? '#555' : '#B4965A' }}>🏆 {quest.reward_value}</span>}
                          </div>
                          {isLocked && lockReasons.length > 0 && (
                            <div style={{ marginTop: '8px', padding: '6px 10px', background: '#0f0f1a', borderRadius: '6px', border: '1px solid #2a2a3e' }}>
                              <div style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>解放条件（いずれか）：</div>
                              {lockReasons.map((reason, i) => (
                                <div key={i} style={{ fontSize: '11px', color: '#cc3333' }}>• {reason}</div>
                              ))}
                            </div>
                          )}
                          {isLocked && !unlockInfo && quest.unlock_condition && (
                            <div style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>🔒 解放条件あり</div>
                          )}
                        </div>
                        {isMember && !isLocked && (
                          <button onClick={() => navigate(`/quests/${quest.id}`)}
                            style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                            挑戦する
                          </button>
                        )}
                        {isMember && isLocked && (
                          <div style={{ fontSize: '12px', color: '#555', marginLeft: '12px', whiteSpace: 'nowrap' }}>🔒 ロック中</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div>
            {!isMember ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔒</div>
                <div>ギルドに参加するとチャットが使えます</div>
              </div>
            ) : !hasChatAccess ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666', background: '#1a1a2e', borderRadius: '12px' }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚔️</div>
                <div style={{ fontWeight: 600, marginBottom: '8px', color: '#888' }}>チャット解放条件</div>
                <div style={{ fontSize: '13px', lineHeight: '1.8' }}>
                  このギルドのクエストをクリアすると<br />フリーチャットが解放されます
                </div>
                <button onClick={() => setActiveTab('quests')}
                  style={{ marginTop: '16px', padding: '8px 20px', border: '1px solid #667eea', borderRadius: '8px', background: 'transparent', color: '#667eea', cursor: 'pointer', fontSize: '13px' }}>
                  クエストに挑戦する →
                </button>
              </div>
            ) : (
              <div>
                <div style={{ height: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '12px', padding: '4px' }}>
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#666', marginTop: '2rem', fontSize: '13px' }}>
                      まだメッセージがありません。最初の一言を送ろう！
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const u = msg.users || {}
                      const isMe = profile && msg.user_id === profile.id
                      const name = u.username || '冒険者'
                      const title = buildTitle(u)
                      const isMsgGM = members.some(m => m.user_id === msg.user_id && m.role === 'master')
                      const msgReaction = reactions[msg.id]
                      return (
                        <div key={i}
                          onMouseEnter={() => { setHoveredMsg(msg.id); fetchReaction(msg.id) }}
                          onMouseLeave={() => setHoveredMsg(null)}
                          style={{ display: 'flex', gap: '10px', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', position: 'relative' }}>
                          {!isMe && (
                            <div onClick={() => u.id && navigate(`/users/${u.id}`)} style={{ cursor: u.id ? 'pointer' : 'default' }}>
                              <Avatar seed={name} avatarUrl={u.avatar_url} size={32} />
                            </div>
                          )}
                          <div style={{ maxWidth: '70%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                              {isMsgGM && <span style={{ fontSize: '11px', background: '#1a160a', border: '1px solid #B4965A', borderRadius: '99px', padding: '1px 6px', color: '#B4965A' }}>🏰</span>}
                              <span onClick={() => u.id && navigate(`/users/${u.id}`)} style={{ fontSize: '11px', color: '#888', cursor: u.id ? 'pointer' : 'default' }}>{name}</span>
                              {!isMe && <span style={{ fontSize: '11px', color: '#B4965A' }}>{title}</span>}
                            </div>
                            <div style={{ background: isMe ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#1a1a2e', border: isMe ? 'none' : '1px solid #2a2a3e', borderRadius: isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px', padding: '10px 14px', fontSize: '14px', lineHeight: '1.5', wordBreak: 'break-word' }}>
                              {msg.content}
                            </div>
                            <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'center' }}>
                              <div style={{ fontSize: '10px', color: '#555' }}>{formatTime(msg.created_at)}</div>
                              {msgReaction && (msgReaction.love_count > 0 || msgReaction.broken_count > 0) && (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {msgReaction.love_count > 0 && (
                                    <span style={{ fontSize: '11px', background: '#ff444422', border: '1px solid #ff444466', borderRadius: '99px', padding: '1px 6px', cursor: 'pointer' }} onClick={() => handleReaction(msg.id, 'love')}>❤️ {msgReaction.love_count}</span>
                                  )}
                                  {msgReaction.broken_count > 0 && (
                                    <span style={{ fontSize: '11px', background: '#66666622', border: '1px solid #66666666', borderRadius: '99px', padding: '1px 6px', cursor: 'pointer' }} onClick={() => handleReaction(msg.id, 'broken')}>💔 {msgReaction.broken_count}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            {hoveredMsg === msg.id && profile && msg.user_id !== profile.id && (
                              <div style={{ position: 'absolute', [isMe ? 'left' : 'right']: '0', bottom: '30px', display: 'flex', gap: '4px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '20px', padding: '4px 8px', zIndex: 10 }}>
                                <button onClick={() => handleReaction(msg.id, 'love')} style={{ background: msgReaction?.my_reaction === 'love' ? '#ff444433' : 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '2px 4px', borderRadius: '99px' }}>❤️</button>
                                <button onClick={() => handleReaction(msg.id, 'broken')} style={{ background: msgReaction?.my_reaction === 'broken' ? '#66666633' : 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '2px 4px', borderRadius: '99px' }}>💔</button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                    placeholder="メッセージを入力..."
                    style={{ flex: 1, background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '14px', outline: 'none' }} />
                  <button onClick={handleSendMessage} disabled={sending || !chatInput.trim()}
                    style={{ padding: '10px 18px', background: chatInput.trim() ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#2a2a3e', border: 'none', borderRadius: '8px', color: 'white', cursor: chatInput.trim() ? 'pointer' : 'default', fontSize: '14px', transition: 'all .2s' }}>
                    {sending ? '...' : '送信'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {members.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center' }}>まだメンバーがいません</p>
            ) : (
              members.map((member, i) => {
                const u = member.users || {}
                const name = u.username || '冒険者'
                const title = buildTitle(u)
                const jobIcon = u.job_classes?.icon || '⚔️'
                const isGM = member.role === 'master'
                const badges = Array.isArray(u.badges) ? u.badges : []
                const titles = Array.isArray(u.titles) ? u.titles : []
                return (
                  <div key={i} style={{ padding: '12px', background: '#1a1a2e', borderRadius: '10px', border: isGM ? '1px solid #B4965A55' : '1px solid transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div onClick={() => u.id && navigate(`/users/${u.id}`)} style={{ cursor: u.id ? 'pointer' : 'default' }}>
                        <Avatar seed={name} avatarUrl={u.avatar_url} size={44} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div onClick={() => u.id && navigate(`/users/${u.id}`)} style={{ fontWeight: 600, fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: u.id ? 'pointer' : 'default' }}>
                          {name}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                          <span style={{ fontSize: '14px' }}>{jobIcon}</span>
                          <span style={{ fontSize: '12px', color: '#B4965A' }}>{title}</span>
                          {isGM && <span style={{ fontSize: '11px', background: '#1a160a', border: '1px solid #B4965A', borderRadius: '99px', padding: '1px 7px', color: '#B4965A', marginLeft: '4px' }}>GM</span>}
                        </div>
                      </div>
                    </div>
                    {badges.length > 0 && (
                      <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {badges.map((b, bi) => (
                          <div key={bi} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: (RARITY_COLOR[b.rarity] || '#4CAF50') + '22', border: `1px solid ${RARITY_COLOR[b.rarity] || '#4CAF50'}`, borderRadius: '99px', padding: '2px 8px' }}>
                            <span style={{ fontSize: '12px' }}>{b.icon}</span>
                            <span style={{ fontSize: '11px', color: RARITY_COLOR[b.rarity] || '#4CAF50' }}>{b.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {titles.length > 0 && (
                      <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {titles.map((t, ti) => (
                          <div key={ti} style={{ background: (RARITY_COLOR[t.rarity] || '#4CAF50') + '11', border: `1px solid ${RARITY_COLOR[t.rarity] || '#4CAF50'}55`, borderRadius: '99px', padding: '2px 8px' }}>
                            <span style={{ fontSize: '11px', color: RARITY_COLOR[t.rarity] || '#4CAF50' }}>🏆 {t.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

      </div>
    </div>
  )
}