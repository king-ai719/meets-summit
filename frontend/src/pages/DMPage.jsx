import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { getPlanIcon, getPlanGlow, getPlanBorderColor } from '../utils/planBadge'

const API = 'https://meets-summit-api.tk-xx719.workers.dev'

const RANK_MAP = { hito: 'の人', shi: '士', shou: '将', ou: '王', kou: '皇' }

function Avatar({ seed, avatarUrl, size = 36, plan }) {
  const glow = getPlanGlow(plan)
  const borderColor = getPlanBorderColor(plan)
  const style = {
    borderRadius: '50%',
    border: `2px solid ${borderColor}`,
    flexShrink: 0,
    objectFit: 'cover',
    boxShadow: glow || 'none',
  }
  if (avatarUrl) {
    return <img src={avatarUrl} width={size} height={size} style={style} />
  }
  const icons = ['🌻', '🌸', '🌺', '🌹', '🌼', '🌷', '🍀', '🌈', '⭐', '🎀']
  const bgColors = ['#1a1a2e', '#1a160a', '#0f1a1a', '#1a0f1a', '#0f0f1a', '#1a1a0f']
  const idx = Math.abs((seed || 'user').split('').reduce((a, c) => a + c.charCodeAt(0), 0))
  return (
    <div style={{ width: size, height: size, ...style, background: bgColors[idx % bgColors.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5 }}>
      {icons[idx % icons.length]}
    </div>
  )
}

export default function DMPage() {
  const { match_id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()

  const [myProfile, setMyProfile] = useState(null)
  const [messages, setMessages] = useState([])
  const [partner, setPartner] = useState(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!user) return
    fetch(`${API}/api/users?clerk_id=${user.id}`)
      .then(r => r.json())
      .then(d => { if (d.data?.[0]) setMyProfile(d.data[0]) })
  }, [user])

  useEffect(() => {
    if (!myProfile) return
    fetch(`${API}/api/matches?user_id=${myProfile.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data)) {
          const match = d.data.find(m => m.id === match_id)
          if (match) {
            const p = match.user_a_id === myProfile.id ? match.user2 : match.user1
            setPartner(p)
          }
        }
      })
  }, [myProfile, match_id])

  useEffect(() => {
    const fetchMessages = () => {
      fetch(`${API}/api/matches/${match_id}/messages`)
        .then(r => r.json())
        .then(d => {
          if (d.success && Array.isArray(d.data)) setMessages(d.data)
          else setMessages([])
          setLoading(false)
        })
        .catch(() => { setMessages([]); setLoading(false) })
    }
    fetchMessages()
    const timer = setInterval(fetchMessages, 3000)
    return () => clearInterval(timer)
  }, [match_id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !myProfile || sending) return
    setSending(true)
    try {
      await fetch(`${API}/api/matches/${match_id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: myProfile.id, content: input.trim() }),
      })
      setInput('')
      const r = await fetch(`${API}/api/matches/${match_id}/messages`)
      const d = await r.json()
      if (d.success && Array.isArray(d.data)) setMessages(d.data)
    } catch { }
    finally { setSending(false) }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>読み込み中...</div>
  )

  const partnerTitle = partner?.job_classes
    ? `${partner.job_classes.rp_prefix}${RANK_MAP[partner.job_rank] || ''}`
    : '冒険者'
  const partnerPlanIcon = getPlanIcon(partner?.plan)

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* ヘッダー */}
      <div style={{ background: '#0f0f1a', borderBottom: '1px solid #2a2a3e', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}>←</button>
        {partner && (
          <>
            <Avatar seed={partner.username || 'user'} avatarUrl={partner.avatar_url} size={40} plan={partner.plan} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ fontWeight: 600, fontSize: '15px' }}>{partner.username}</div>
                {partnerPlanIcon && <span style={{ fontSize: '14px' }}>{partnerPlanIcon}</span>}
              </div>
              <div style={{ fontSize: '11px', color: '#B4965A' }}>
                {partner.job_classes?.icon} {partnerTitle}
              </div>
            </div>
          </>
        )}
        {partner && (
          <button onClick={() => navigate(`/users/${partner.id}`)}
            style={{ marginLeft: 'auto', background: 'none', border: '1px solid #2a2a3e', borderRadius: '8px', color: '#888', cursor: 'pointer', fontSize: '11px', padding: '4px 10px' }}>
            プロフィール
          </button>
        )}
      </div>

      {/* メッセージ一覧 */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#555', marginTop: '4rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💞</div>
            <div style={{ fontSize: '14px' }}>マッチしました！最初のメッセージを送ってみよう</div>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.sender_id === myProfile?.id
          const senderName = msg.users?.username || '冒険者'
          const senderAvatar = msg.users?.avatar_url || null
          const senderPlan = msg.users?.plan || null
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: '8px' }}>
              {!isMe && <Avatar seed={senderName} avatarUrl={senderAvatar} size={32} plan={senderPlan} />}
              <div style={{ maxWidth: '70%' }}>
                {!isMe && (
                  <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px', paddingLeft: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {senderName}
                    {getPlanIcon(senderPlan) && <span>{getPlanIcon(senderPlan)}</span>}
                  </div>
                )}
                <div style={{
                  background: isMe ? '#667eea' : '#1a1a2e',
                  border: `1px solid ${isMe ? '#667eea' : '#2a2a3e'}`,
                  borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  padding: '10px 14px', fontSize: '14px', lineHeight: 1.5, wordBreak: 'break-word',
                }}>
                  {msg.content}
                </div>
                <div style={{ fontSize: '10px', color: '#555', marginTop: '4px', textAlign: isMe ? 'right' : 'left', paddingLeft: isMe ? 0 : '4px', paddingRight: isMe ? '4px' : 0 }}>
                  {new Date(msg.sent_at).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <div style={{ background: '#0f0f1a', borderTop: '1px solid #2a2a3e', padding: '1rem 1.5rem', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="メッセージを入力... (Enterで送信)"
          rows={1}
          style={{ flex: 1, background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '12px', padding: '10px 14px', color: 'white', fontSize: '14px', outline: 'none', resize: 'none', lineHeight: 1.5, maxHeight: '120px', overflowY: 'auto' }}
        />
        <button onClick={handleSend} disabled={sending || !input.trim()}
          style={{ background: sending || !input.trim() ? '#2a2a3e' : '#667eea', border: 'none', borderRadius: '12px', padding: '10px 16px', color: 'white', cursor: sending || !input.trim() ? 'not-allowed' : 'pointer', fontSize: '18px', transition: 'all .2s', flexShrink: 0 }}>
          ➤
        </button>
      </div>
    </div>
  )
}