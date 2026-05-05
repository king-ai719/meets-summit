import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { getPlanIcon, getPlanGlow, getPlanBorderColor } from '../utils/planBadge'

const API = 'https://meets-summit-api.tk-xx719.workers.dev'

const RANKS = [
  { value: 'hito', label: '〇の人', desc: 'アルバイト・パート' },
  { value: 'shi', label: '〇士', desc: '平社員' },
  { value: 'shou', label: '〇将', desc: '役職者・管理職' },
  { value: 'ou', label: '〇王', desc: '役員' },
  { value: 'kou', label: '〇皇', desc: '社長・会長' },
]
const GENDERS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
  { value: 'secret', label: '秘密' },
]
const RARITY_COLOR = { S: '#ff4444', A: '#ff9900', B: '#667eea', C: '#4CAF50' }
const RANK_MAP = { hito: 'の人', shi: '士', shou: '将', ou: '王', kou: '皇' }
const NIGHT_WOM_MAP = { hito: '夜の人', shi: '夜士女', shou: '夜将姫', ou: '夜王妃', kou: '夜皇姫' }
const BADGE_DESC = {
  '🗡️': '基礎知識を証明するバッジ',
  '⚔️': '専門知識を証明するバッジ',
  '💀': 'マスターレベルを証明するバッジ',
}
const PLAN_CAN_UPLOAD = ['light', 'standard', 'premium']
const PLAN_CAN_SEE_LIKERS = ['standard', 'premium']

function Avatar({ seed, avatarUrl, size = 48, plan }) {
  const glow = getPlanGlow(plan)
  const borderColor = getPlanBorderColor(plan)
  const style = {
    borderRadius: '50%',
    border: `2px solid ${borderColor}`,
    objectFit: 'cover',
    flexShrink: 0,
    boxShadow: glow || 'none',
  }
  if (avatarUrl) {
    return <img src={avatarUrl} width={size} height={size} style={style} />
  }
  const icons = ['🌻', '🌸', '🌺', '🌹', '🌼', '🌷', '🍀', '🌈', '⭐', '🎀']
  const bgColors = ['#1a1a2e', '#1a160a', '#0f1a1a', '#1a0f1a', '#0f0f1a', '#1a1a0f']
  const idx = Math.abs((seed || 'user').split('').reduce((a, c) => a + c.charCodeAt(0), 0))
  const icon = icons[idx % icons.length]
  const bg = bgColors[idx % bgColors.length]
  return (
    <div style={{ width: size, height: size, ...style, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5 }}>
      {icon}
    </div>
  )
}

export default function ProfilePage() {
  const { user } = useUser()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [jobClasses, setJobClasses] = useState([])
  const [profile, setProfile] = useState(null)
  const [matches, setMatches] = useState([])
  const [likers, setLikers] = useState([])
  const [form, setForm] = useState({
    username: '', bio: '', job_class_id: null, job_rank: null, gender: '', equipped_title: null,
    birthday: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hoveredBadge, setHoveredBadge] = useState(null)
  const [hoveredRank, setHoveredRank] = useState(null)
  const [usernameChangeDaysLeft, setUsernameChangeDaysLeft] = useState(null)
  const [tab, setTab] = useState('profile')
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [showTermsModal, setShowTermsModal] = useState(false) // ★追加

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
        if (data.data && data.data.length > 0) {
          const u = data.data[0]
          setProfile(u)
          setAvatarUrl(u.avatar_url || null)
          setForm({
            username: u.username || '',
            bio: u.bio || '',
            job_class_id: u.job_class_id || null,
            job_rank: u.job_rank || null,
            gender: u.gender || '',
            equipped_title: u.equipped_title || null,
            birthday: u.birthday || '',
          })
          if (u.username_changed_at) {
            const days = (Date.now() - new Date(u.username_changed_at).getTime()) / (1000 * 60 * 60 * 24)
            if (days < 30) setUsernameChangeDaysLeft(Math.ceil(30 - days))
          }
          fetch(`${API}/api/matches?user_id=${u.id}`)
            .then(r => r.json())
            .then(d => {
              if (d.success && Array.isArray(d.data)) setMatches(d.data)
              else setMatches([])
            })
            .catch(() => setMatches([]))
          if (PLAN_CAN_SEE_LIKERS.includes(u.plan)) {
            fetch(`${API}/api/profile-likes/received?user_id=${u.id}&plan=${u.plan}`)
              .then(r => r.json())
              .then(d => { if (d.success && Array.isArray(d.data)) setLikers(d.data) })
              .catch(() => {})
          }
        }
        setLoading(false)
      })
  }, [user])

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !profile) return
    if (!PLAN_CAN_UPLOAD.includes(profile.plan)) {
      alert('プロフィール写真はライト以上のプランで利用できます')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('user_id', profile.id)
      const res = await fetch(`${API}/api/users/avatar`, { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) { setAvatarUrl(data.avatar_url); alert('写真を更新しました！') }
      else alert(data.error || 'アップロードに失敗しました')
    } catch { alert('通信エラー') }
    finally { setUploading(false) }
  }

  const getCurrentTitle = () => {
    if (!form.job_class_id || !form.job_rank) return null
    const job = jobClasses.find(j => j.id === form.job_class_id)
    if (!job) return null
    if (job.category === 'night_wom') return NIGHT_WOM_MAP[form.job_rank] || null
    return `${job.rp_prefix}${RANK_MAP[form.job_rank] || ''}`
  }

  // ★ Saveボタン押したら新規ユーザーのみモーダル表示
  const handleSave = async () => {
    if (!form.username) return alert('冒険者名を入力してください')
    if (!profile?.birthday) {
      if (!form.birthday) return alert('生年月日を入力してください')
      const age = (Date.now() - new Date(form.birthday).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
      if (age < 18) return alert('18歳未満の方はご利用いただけません')
      // 新規ユーザーは規約モーダル表示
      setShowTermsModal(true)
      return
    }
    // 既存ユーザーはそのまま保存
    await doSave()
  }

  const doSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          clerk_id: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          birthday: profile?.birthday || form.birthday,
        }),
      })
      const data = await res.json()
      if (data.success) { setSaved(true); setTimeout(() => navigate('/guilds'), 1500) }
      else alert(data.error || '保存に失敗しました')
    } catch { alert('通信エラー') }
    finally { setSaving(false) }
  }

  const getPartner = (match) => {
    if (!profile) return null
    return match.user_a_id === profile.id ? match.user2 : match.user1
  }

  const currentTitle = getCurrentTitle()
  const titles = profile?.titles || []
  const badges = profile?.badges || []
  const canUpload = PLAN_CAN_UPLOAD.includes(profile?.plan)
  const canSeeLikers = PLAN_CAN_SEE_LIKERS.includes(profile?.plan)
  const genderLocked = !!profile?.gender
  const planIcon = getPlanIcon(profile?.plan)
  const isPremium = profile?.plan === 'premium'

  const s = {
    page: { minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'sans-serif', padding: '2rem' },
    card: { maxWidth: '640px', margin: '0 auto', background: '#0f0f1a', border: `1px solid ${getPlanBorderColor(profile?.plan)}`, borderRadius: '16px', padding: '2rem', boxShadow: getPlanGlow(profile?.plan) || 'none' },
    label: { display: 'block', fontSize: '0.75rem', letterSpacing: '2px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' },
    input: { width: '100%', background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    textarea: { width: '100%', background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '14px', outline: 'none', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' },
    field: { marginBottom: '1.5rem' },
    divider: { height: '1px', background: '#1e1e2e', margin: '1.5rem 0' },
    classGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' },
    classCard: (selected) => ({ cursor: 'pointer', border: `1px solid ${selected ? '#B4965A' : '#2a2a3e'}`, borderRadius: '10px', padding: '12px 8px', textAlign: 'center', background: selected ? '#1a160a' : '#1a1a2e', transition: 'all .2s' }),
    rankGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' },
    rankBtn: (selected) => ({ cursor: 'pointer', border: `1px solid ${selected ? '#B4965A' : '#2a2a3e'}`, borderRadius: '8px', padding: '10px 4px', textAlign: 'center', background: selected ? '#1a160a' : '#1a1a2e', transition: 'all .2s', position: 'relative' }),
    genderRow: { display: 'flex', gap: '10px' },
    genderBtn: (selected, locked) => ({ flex: 1, cursor: locked ? 'default' : 'pointer', border: `1px solid ${selected ? '#B4965A' : '#2a2a3e'}`, borderRadius: '8px', padding: '10px', textAlign: 'center', background: selected ? '#1a160a' : '#1a1a2e', color: selected ? '#B4965A' : locked ? '#444' : 'white', fontSize: '13px', transition: 'all .2s', opacity: locked && !selected ? 0.4 : 1 }),
    saveBtn: { width: '100%', padding: '14px', border: '1px solid #B4965A', borderRadius: '10px', background: 'transparent', color: '#B4965A', fontSize: '15px', letterSpacing: '2px', cursor: 'pointer', marginTop: '0.5rem', transition: 'all .2s' },
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>読み込み中...</div>
  )

  return (
    <div style={s.page}>

      {/* ★ 利用規約モーダル */}
      {showTermsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: '#0f0f1a', border: '1px solid #B4965A', borderRadius: '16px', padding: '2rem', maxWidth: '480px', width: '100%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#B4965A', letterSpacing: '2px', textAlign: 'center' }}>⚔️ 利用規約への同意</h2>
            <p style={{ fontSize: '13px', color: '#888', textAlign: 'center' }}>Meets Summitをご利用いただく前に、利用規約をご確認ください。</p>

            <div style={{ background: '#1a1a2e', borderRadius: '10px', padding: '1rem', overflowY: 'auto', maxHeight: '40vh', fontSize: '12px', color: '#ccc', lineHeight: 1.8 }}>
              <p style={{ fontWeight: 600, color: '#B4965A', marginBottom: '8px' }}>主な利用条件</p>
              <p>・本サービスは18歳以上の方のみご利用いただけます。</p>
              <p>・虚偽の情報登録、他ユーザーへの嫌がらせ、わいせつ・暴力的コンテンツの投稿は禁止です。</p>
              <p>・有料プランはStripeを通じて決済されます。キャンセルはいつでも可能ですが当月分の返金は行いません。</p>
              <p>・ユーザー間のトラブルについて当社は責任を負いません。</p>
              <p>・規約違反の場合、事前通知なくアカウントを停止する場合があります。</p>
              <p style={{ marginTop: '12px' }}>
                詳細は
                <span onClick={() => { setShowTermsModal(false); navigate('/terms') }} style={{ color: '#667eea', cursor: 'pointer', textDecoration: 'underline', margin: '0 4px' }}>
                  利用規約全文
                </span>
                をご確認ください。
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowTermsModal(false)}
                style={{ flex: 1, padding: '12px', border: '1px solid #333', borderRadius: '10px', background: 'transparent', color: '#888', fontSize: '14px', cursor: 'pointer' }}>
                キャンセル
              </button>
              <button
                onClick={async () => { setShowTermsModal(false); await doSave() }}
                style={{ flex: 2, padding: '12px', border: '1px solid #B4965A', borderRadius: '10px', background: '#B4965A', color: '#0a0a0f', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                同意して登録する
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
          {[
            { key: 'profile', label: '⚙️ プロフィール' },
            { key: 'matches', label: `💞 マッチ${matches.length > 0 ? ` (${matches.length})` : ''}` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
              border: `1px solid ${tab === t.key ? '#667eea' : '#2a2a3e'}`,
              background: tab === t.key ? '#667eea22' : 'transparent',
              color: tab === t.key ? '#667eea' : '#666', fontSize: '14px', transition: 'all .2s',
            }}>{t.label}</button>
          ))}
        </div>

        {tab === 'matches' && (
          <div style={s.card}>
            <div style={{ fontSize: '12px', color: '#888', letterSpacing: '2px', marginBottom: '16px' }}>💞 マッチした冒険者</div>
            {matches.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#555', padding: '3rem 0' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>💔</div>
                <div style={{ fontSize: '14px' }}>まだマッチしていません</div>
                <div style={{ fontSize: '12px', color: '#444', marginTop: '6px' }}>他の冒険者にいいねを送ってみよう！</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {matches.map(match => {
                  const partner = getPartner(match)
                  if (!partner) return null
                  const jobIcon = partner.job_classes?.icon || '⚔️'
                  const rankLabel = partner.job_classes?.rp_prefix ? `${partner.job_classes.rp_prefix}${RANK_MAP[partner.job_rank] || ''}` : '冒険者'
                  const partnerPlanIcon = getPlanIcon(partner.plan)
                  return (
                    <div key={match.id} onClick={() => navigate(`/dm/${match.id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', borderRadius: '12px', cursor: 'pointer', background: '#1a1a2e', border: `1px solid ${getPlanBorderColor(partner.plan)}`, transition: 'all .2s', boxShadow: getPlanGlow(partner.plan) || 'none' }}
                      onMouseOver={e => e.currentTarget.style.borderColor = '#667eea'}
                      onMouseOut={e => e.currentTarget.style.borderColor = getPlanBorderColor(partner.plan)}>
                      <Avatar seed={partner.username || 'user'} avatarUrl={partner.avatar_url} size={48} plan={partner.plan} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ fontWeight: 600, fontSize: '15px' }}>{partner.username}</div>
                          {partnerPlanIcon && <span style={{ fontSize: '14px' }}>{partnerPlanIcon}</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: '#B4965A', marginTop: '2px' }}>{jobIcon} {rankLabel}</div>
                        {partner.equipped_title && <div style={{ fontSize: '11px', color: '#ff9900', marginTop: '2px' }}>🏆 {partner.equipped_title}</div>}
                      </div>
                      <div style={{ fontSize: '12px', color: '#555' }}>DM →</div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div style={s.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1 style={{ fontSize: '1.4rem', fontWeight: 600, letterSpacing: '2px' }}>Edit Profile</h1>
                  {planIcon && <span style={{ fontSize: '1.4rem' }}>{planIcon}</span>}
                </div>
                <p style={{ color: '#666', fontSize: '12px', letterSpacing: '3px' }}>冒険者の証明</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative', cursor: canUpload ? 'pointer' : 'default' }}
                onClick={() => canUpload && fileInputRef.current?.click()}>
                <Avatar seed={form.username || 'user'} avatarUrl={avatarUrl} size={80} plan={profile?.plan} />
                {canUpload && (
                  <div style={{ position: 'absolute', bottom: 0, right: 0, background: '#667eea', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>📷</div>
                )}
              </div>
              <div>
                {canUpload ? (
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    style={{ background: 'none', border: '1px solid #667eea', borderRadius: '8px', color: '#667eea', padding: '6px 14px', cursor: 'pointer', fontSize: '13px' }}>
                    {uploading ? 'アップロード中...' : '📷 写真を変更'}
                  </button>
                ) : (
                  <div style={{ fontSize: '12px', color: '#555' }}>
                    📷 写真アップロードは<br />
                    <span onClick={() => navigate('/plan')} style={{ color: '#667eea', cursor: 'pointer', textDecoration: 'underline' }}>ライト以上のプラン</span>で利用可能
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
            </div>

            {currentTitle && (
              <div style={{ background: '#1a160a', border: '1px solid #B4965A33', borderRadius: '10px', padding: '12px 16px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: '#888' }}>職業称号</span>
                <span style={{ fontSize: '16px', fontWeight: 600, color: '#B4965A' }}>{currentTitle}</span>
                {form.equipped_title && (<><span style={{ fontSize: '12px', color: '#666' }}>｜ 装備中</span><span style={{ fontSize: '14px', fontWeight: 600, color: '#ff9900' }}>🏆 {form.equipped_title}</span></>)}
              </div>
            )}

            <div style={s.field}>
              <label style={s.label}>冒険者名 / Username</label>
              <input style={{ ...s.input, borderColor: usernameChangeDaysLeft ? '#666' : '#333' }}
                placeholder="あなたの名前を入れよ" value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                disabled={!!usernameChangeDaysLeft} />
              {usernameChangeDaysLeft && <div style={{ fontSize: '11px', color: '#cc3333', marginTop: '6px' }}>🔒 名前変更はあと{usernameChangeDaysLeft}日後に可能です</div>}
            </div>

            <div style={s.field}>
              <label style={s.label}>自己紹介 / Bio</label>
              <textarea style={s.textarea} placeholder="汝の使命を語れ..." value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            </div>

            <div style={s.divider} />

            <div style={s.field}>
              <label style={s.label}>職業クラス / Job Class</label>
              <div style={s.classGrid}>
                {jobClasses.map(job => (
                  <div key={job.id} style={s.classCard(form.job_class_id === job.id)} onClick={() => setForm(f => ({ ...f, job_class_id: job.id }))}>
                    <div style={{ fontSize: '1.8rem' }}>{job.icon}</div>
                    <div style={{ fontSize: '11px', fontWeight: 500, marginTop: '4px', color: form.job_class_id === job.id ? '#B4965A' : 'white' }}>{job.name}</div>
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{job.rp_prefix}皇〜{job.rp_prefix}の人</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>ランク / Rank</label>
              <div style={s.rankGrid}>
                {RANKS.map(r => (
                  <div key={r.value}
                    style={s.rankBtn(form.job_rank === r.value)}
                    onClick={() => setForm(f => ({ ...f, job_rank: r.value }))}
                    onMouseEnter={() => setHoveredRank(r.value)}
                    onMouseLeave={() => setHoveredRank(null)}
                    onTouchStart={() => setHoveredRank(r.value)}
                    onTouchEnd={() => setTimeout(() => setHoveredRank(null), 1500)}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: form.job_rank === r.value ? '#B4965A' : 'white' }}>{r.label}</div>
                    {hoveredRank === r.value && (
                      <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: '#0f0f1a', border: '1px solid #B4965A', borderRadius: '8px', padding: '6px 10px', fontSize: '11px', color: '#B4965A', whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                        {r.desc}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={s.divider} />

            <div style={s.field}>
              <label style={s.label}>生年月日 / Birthday</label>
              <input type="date"
                style={{ ...s.input, colorScheme: 'dark', opacity: profile?.birthday ? 0.5 : 1 }}
                value={form.birthday}
                max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                onChange={e => { if (profile?.birthday) return; setForm(f => ({ ...f, birthday: e.target.value })) }}
                disabled={!!profile?.birthday} />
              {profile?.birthday
                ? <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>🔒 生年月日は変更できません</div>
                : <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>※ 18歳未満は登録できません。登録後は変更不可です。</div>
              }
            </div>

            <div style={s.field}>
              <label style={s.label}>性別 / Gender</label>
              <div style={s.genderRow}>
                {GENDERS.map(g => (
                  <div key={g.value}
                    style={s.genderBtn(form.gender === g.value, genderLocked)}
                    onClick={() => { if (!genderLocked) setForm(f => ({ ...f, gender: g.value })) }}>
                    {g.label}
                  </div>
                ))}
              </div>
              {genderLocked
                ? <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>🔒 性別は変更できません</div>
                : <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>※ 登録後は変更不可です。</div>
              }
            </div>

            {canSeeLikers && (
              <>
                <div style={s.divider} />
                <div style={s.field}>
                  <label style={s.label}>❤️ あなたへのいいね {likers.length > 0 ? `(${likers.length})` : ''}</label>
                  {likers.length === 0 ? (
                    <div style={{ color: '#555', fontSize: '13px' }}>まだいいねがありません</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {likers.map((like, i) => {
                        const u = like.users
                        if (!u) return null
                        const rankLabel = u.job_classes?.rp_prefix ? `${u.job_classes.rp_prefix}${RANK_MAP[u.job_rank] || ''}` : '冒険者'
                        const likerPlanIcon = getPlanIcon(u.plan)
                        return (
                          <div key={i} onClick={() => navigate(`/users/${u.id}`)}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', background: '#1a1a2e', border: `1px solid ${getPlanBorderColor(u.plan)}`, cursor: 'pointer', transition: 'all .2s', boxShadow: getPlanGlow(u.plan) || 'none' }}
                            onMouseOver={e => e.currentTarget.style.borderColor = '#ff4444'}
                            onMouseOut={e => e.currentTarget.style.borderColor = getPlanBorderColor(u.plan)}>
                            <Avatar seed={u.username || 'user'} avatarUrl={u.avatar_url} size={36} plan={u.plan} />
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ fontWeight: 600, fontSize: '14px' }}>{u.username}</div>
                                {likerPlanIcon && <span style={{ fontSize: '12px' }}>{likerPlanIcon}</span>}
                              </div>
                              <div style={{ fontSize: '11px', color: '#B4965A' }}>{u.job_classes?.icon} {rankLabel}</div>
                            </div>
                            <div style={{ fontSize: '14px' }}>❤️</div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {!canSeeLikers && (
              <>
                <div style={s.divider} />
                <div style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '10px', padding: '12px 16px', fontSize: '12px', color: '#555', textAlign: 'center' }}>
                  ❤️ いいねした人を見るには
                  <span onClick={() => navigate('/plan')} style={{ color: '#667eea', cursor: 'pointer', textDecoration: 'underline', marginLeft: '4px' }}>スタンダード以上のプラン</span>が必要です
                </div>
              </>
            )}

            {badges.length > 0 && (
              <>
                <div style={s.divider} />
                <div style={s.field}>
                  <label style={s.label}>🎖️ スキル証明バッジ / Badges</label>
                  <p style={{ fontSize: '11px', color: '#666', marginBottom: '10px' }}>バッジにカーソルを当てると説明が表示されます</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {badges.map((b, i) => (
                      <div key={i} onMouseEnter={() => setHoveredBadge(i)} onMouseLeave={() => setHoveredBadge(null)}
                        style={{
                          position: 'relative',
                          background: (RARITY_COLOR[b.rarity] || '#4CAF50') + '22',
                          border: `1px solid ${RARITY_COLOR[b.rarity] || '#4CAF50'}`,
                          borderRadius: '10px', padding: '8px 14px',
                          display: 'flex', alignItems: 'center', gap: '6px', cursor: 'default',
                          animation: isPremium ? 'premiumGlow 2s ease-in-out infinite' : 'none',
                          boxShadow: isPremium ? `0 0 6px ${RARITY_COLOR[b.rarity] || '#4CAF50'}88` : 'none',
                        }}>
                        <span style={{ fontSize: '20px' }}>{b.icon}</span>
                        <span style={{ fontSize: '10px', color: '#666' }}>Rarity {b.rarity}</span>
                        {hoveredBadge === i && (
                          <div style={{ position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)', background: '#0f0f1a', border: `1px solid ${RARITY_COLOR[b.rarity] || '#4CAF50'}`, borderRadius: '8px', padding: '6px 12px', fontSize: '11px', color: 'white', whiteSpace: 'nowrap', zIndex: 10, pointerEvents: 'none' }}>
                            {b.label}の証明<br /><span style={{ color: '#888' }}>{BADGE_DESC[b.icon] || 'スキル証明バッジ'}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {titles.length > 0 && (
              <>
                <div style={s.divider} />
                <div style={s.field}>
                  <label style={s.label}>🏆 獲得称号 / Titles</label>
                  <p style={{ fontSize: '11px', color: '#666', marginBottom: '10px' }}>称号をタップして装備できます</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <div onClick={() => setForm(f => ({ ...f, equipped_title: null }))}
                      style={{ background: !form.equipped_title ? '#1a1a2e' : 'transparent', border: `1px solid ${!form.equipped_title ? '#888' : '#333'}`, borderRadius: '99px', padding: '4px 12px', cursor: 'pointer' }}>
                      <span style={{ fontSize: '12px', color: '#888' }}>なし</span>
                    </div>
                    {titles.map((t, i) => {
                      const isEquipped = form.equipped_title === t.value
                      return (
                        <div key={i} onClick={() => setForm(f => ({ ...f, equipped_title: isEquipped ? null : t.value }))}
                          style={{
                            background: isEquipped ? (RARITY_COLOR[t.rarity] || '#4CAF50') + '33' : (RARITY_COLOR[t.rarity] || '#4CAF50') + '11',
                            border: `1px solid ${isEquipped ? (RARITY_COLOR[t.rarity] || '#4CAF50') : (RARITY_COLOR[t.rarity] || '#4CAF50') + '55'}`,
                            borderRadius: '99px', padding: '4px 12px',
                            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', transition: 'all .2s',
                            animation: isPremium ? 'premiumGlow 2s ease-in-out infinite' : 'none',
                            boxShadow: isPremium ? `0 0 6px ${RARITY_COLOR[t.rarity] || '#4CAF50'}88` : 'none',
                          }}>
                          {isEquipped && <span style={{ fontSize: '10px' }}>✅</span>}
                          <span style={{ fontSize: '12px', fontWeight: isEquipped ? 600 : 400, color: RARITY_COLOR[t.rarity] || '#4CAF50' }}>{t.value}</span>
                          <span style={{ fontSize: '10px', color: RARITY_COLOR[t.rarity] || '#4CAF50', opacity: 0.8 }}>{t.rarity}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            <button style={s.saveBtn} onClick={handleSave} disabled={saving}
              onMouseOver={e => { e.currentTarget.style.background = '#B4965A'; e.currentTarget.style.color = '#0a0a0f' }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#B4965A' }}>
              {saved ? '✅ 保存しました！' : saving ? '保存中...' : 'Save — 登録する'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}