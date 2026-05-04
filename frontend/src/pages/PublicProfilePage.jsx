import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

const API = 'https://meets-summit-api.tk-xx719.workers.dev'

const RARITY_COLOR = {
  S: '#ff4444',
  A: '#ff9900',
  B: '#667eea',
  C: '#4CAF50',
}

const RANK_LABEL = {
  hito: 'の人', shi: '士', shou: '将', ou: '王', kou: '皇'
}

const BADGE_DESC = {
  '🗡️': '基礎知識を証明するバッジ',
  '⚔️': '専門知識を証明するバッジ',
  '💀': 'マスターレベルを証明するバッジ',
}

function Avatar({ seed, size = 80 }) {
  const url = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9`
  return <img src={url} width={size} height={size} style={{ borderRadius: '50%', border: '3px solid #667eea' }} />
}

export default function PublicProfilePage() {
  const { user_id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()

  const [targetProfile, setTargetProfile] = useState(null)
  const [myProfile, setMyProfile] = useState(null)
  const [likes, setLikes] = useState({ love_count: 0, broken_count: 0, my_like: null })
  const [loading, setLoading] = useState(true)
  const [hoveredBadge, setHoveredBadge] = useState(null)
  const [liking, setLiking] = useState(false)
  const [limitError, setLimitError] = useState(null)
  const [remaining, setRemaining] = useState(null)
  const [matchNotice, setMatchNotice] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/users/${user_id}/profile`)
      .then(res => res.json())
      .then(data => { setTargetProfile(data.data); setLoading(false) })
  }, [user_id])

  useEffect(() => {
    if (!user) return
    fetch(`${API}/api/users?clerk_id=${user.id}`)
      .then(res => res.json())
      .then(data => { if (data.data?.[0]) setMyProfile(data.data[0]) })
  }, [user])

  useEffect(() => {
    if (!myProfile) return
    fetch(`${API}/api/profile-likes?to_user_id=${user_id}&from_user_id=${myProfile.id}`)
      .then(res => res.json())
      .then(data => { if (data.success) setLikes(data) })
  }, [user_id, myProfile])

  const handleLike = async (type) => {
    if (!myProfile || liking) return
    if (myProfile.id === user_id) return
    setLiking(true)
    setLimitError(null)
    setMatchNotice(false)
    try {
      const res = await fetch(`${API}/api/profile-likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from_user_id: myProfile.id, to_user_id: user_id, like_type: type }),
      })
      const result = await res.json()

      if (!result.success && result.limit_reached) {
        setLimitError(result.error)
        return
      }

      if (result.remaining !== undefined && result.remaining !== null) {
        setRemaining(result.remaining)
      }

      // マッチ通知
      if (result.matched) {
        setMatchNotice(true)
      }

      const r2 = await fetch(`${API}/api/profile-likes?to_user_id=${user_id}&from_user_id=${myProfile.id}`)
      const data = await r2.json()
      if (data.success) setLikes(data)
    } catch { }
    finally { setLiking(false) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
      読み込み中...
    </div>
  )

  if (!targetProfile) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
      ユーザーが見つかりません
    </div>
  )

  const jobClass = targetProfile.job_classes
  const title = jobClass ? `${jobClass.rp_prefix}${RANK_LABEL[targetProfile.job_rank] || ''}` : '冒険者'
  const badges = Array.isArray(targetProfile.badges) ? targetProfile.badges : []
  const titles = Array.isArray(targetProfile.titles) ? targetProfile.titles : []
  const isMe = myProfile?.id === user_id

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'sans-serif', padding: '2rem' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>

        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem', marginBottom: '1.5rem' }}>←</button>

        {/* マッチ通知バナー */}
        {matchNotice && (
          <div style={{
            background: '#667eea22', border: '1px solid #667eea',
            borderRadius: '12px', padding: '14px 18px', marginBottom: '1rem',
            textAlign: 'center', fontSize: '14px',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>💞</div>
            <div style={{ fontWeight: 600, color: '#667eea', marginBottom: '4px' }}>マッチしました！</div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>プロフィールのマッチタブからDMできます</div>
            <button
              onClick={() => navigate('/profile')}
              style={{ background: '#667eea', border: 'none', borderRadius: '8px', color: 'white', padding: '6px 16px', cursor: 'pointer', fontSize: '12px' }}
            >
              マッチタブを見る →
            </button>
          </div>
        )}

        {/* プロフィールカード */}
        <div style={{ background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '16px', padding: '2rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <Avatar seed={targetProfile.username || 'user'} size={80} />
            <div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{targetProfile.username}</div>
              <div style={{ fontSize: '14px', color: '#B4965A', marginTop: '4px' }}>
                {jobClass?.icon} {title}
              </div>
              {targetProfile.equipped_title && (
                <div style={{ marginTop: '6px' }}>
                  <span style={{ fontSize: '12px', background: '#ff990022', border: '1px solid #ff9900', borderRadius: '99px', padding: '2px 10px', color: '#ff9900' }}>
                    🏆 {targetProfile.equipped_title}
                  </span>
                </div>
              )}
            </div>
          </div>

          {targetProfile.bio && (
            <div style={{ background: '#1a1a2e', borderRadius: '10px', padding: '12px', fontSize: '14px', color: '#ccc', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {targetProfile.bio}
            </div>
          )}

          {!isMe && user && (
            <>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => handleLike('love')}
                  disabled={liking}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '10px', cursor: liking ? 'not-allowed' : 'pointer', fontSize: '1.2rem',
                    background: likes.my_like === 'love' ? '#ff444422' : '#1a1a2e',
                    border: `1px solid ${likes.my_like === 'love' ? '#ff4444' : '#2a2a3e'}`,
                    color: 'white', transition: 'all .2s', opacity: liking ? 0.6 : 1,
                  }}>
                  ❤️ {likes.love_count}
                </button>
                <button
                  onClick={() => handleLike('broken')}
                  disabled={liking}
                  style={{
                    flex: 1, padding: '12px', borderRadius: '10px', cursor: liking ? 'not-allowed' : 'pointer', fontSize: '1.2rem',
                    background: likes.my_like === 'broken' ? '#66666622' : '#1a1a2e',
                    border: `1px solid ${likes.my_like === 'broken' ? '#888' : '#2a2a3e'}`,
                    color: 'white', transition: 'all .2s', opacity: liking ? 0.6 : 1,
                  }}>
                  💔 {likes.broken_count}
                </button>
              </div>

              {limitError && (
                <div style={{
                  marginTop: '10px', padding: '10px 14px', borderRadius: '10px',
                  background: '#ff444415', border: '1px solid #ff444466',
                  fontSize: '12px', color: '#ff8888', textAlign: 'center', lineHeight: 1.5,
                }}>
                  ⚠️ {limitError}
                  <div style={{ marginTop: '6px' }}>
                    <span onClick={() => navigate('/plan')} style={{ color: '#667eea', cursor: 'pointer', textDecoration: 'underline', fontSize: '11px' }}>
                      プランをアップグレード →
                    </span>
                  </div>
                </div>
              )}

              {remaining !== null && !limitError && (
                <div style={{ marginTop: '8px', textAlign: 'center', fontSize: '12px', color: '#555' }}>
                  本日の残りいいね: {remaining}回
                </div>
              )}
            </>
          )}

          {isMe && (
            <div style={{ textAlign: 'center', color: '#666', fontSize: '13px' }}>
              ❤️ {likes.love_count} / 💔 {likes.broken_count}
            </div>
          )}
        </div>

        {badges.length > 0 && (
          <div style={{ background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '16px', padding: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ fontSize: '12px', color: '#888', letterSpacing: '2px', marginBottom: '12px' }}>🎖️ スキル証明バッジ</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {badges.map((b, i) => (
                <div key={i}
                  onMouseEnter={() => setHoveredBadge(i)}
                  onMouseLeave={() => setHoveredBadge(null)}
                  style={{
                    position: 'relative',
                    background: (RARITY_COLOR[b.rarity] || '#4CAF50') + '22',
                    border: `1px solid ${RARITY_COLOR[b.rarity] || '#4CAF50'}`,
                    borderRadius: '10px', padding: '8px 14px',
                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'default',
                  }}>
                  <span style={{ fontSize: '20px' }}>{b.icon}</span>
                  <span style={{ fontSize: '10px', color: '#666' }}>Rarity {b.rarity}</span>
                  {hoveredBadge === i && (
                    <div style={{
                      position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                      background: '#0f0f1a', border: `1px solid ${RARITY_COLOR[b.rarity] || '#4CAF50'}`,
                      borderRadius: '8px', padding: '6px 12px',
                      fontSize: '11px', color: 'white', whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none',
                    }}>
                      {b.label}の証明<br />
                      <span style={{ color: '#888' }}>{BADGE_DESC[b.icon] || 'スキル証明バッジ'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {titles.length > 0 && (
          <div style={{ background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ fontSize: '12px', color: '#888', letterSpacing: '2px', marginBottom: '12px' }}>🏆 獲得称号</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {titles.map((t, i) => (
                <div key={i} style={{
                  background: (RARITY_COLOR[t.rarity] || '#4CAF50') + '22',
                  border: `1px solid ${RARITY_COLOR[t.rarity] || '#4CAF50'}55`,
                  borderRadius: '99px', padding: '4px 12px',
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}>
                  {targetProfile.equipped_title === t.value && <span style={{ fontSize: '10px' }}>✅</span>}
                  <span style={{ fontSize: '12px', color: RARITY_COLOR[t.rarity] || '#4CAF50' }}>{t.value}</span>
                  <span style={{ fontSize: '10px', color: RARITY_COLOR[t.rarity] || '#4CAF50', opacity: 0.7 }}>{t.rarity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}