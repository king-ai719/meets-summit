import { useState, useEffect } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

const API = 'https://meets-summit-api.tk-xx719.workers.dev'

const RANKS = [
  { value: 'hito', label: '〇の人' },
  { value: 'shi', label: '〇士' },
  { value: 'shou', label: '〇将' },
  { value: 'ou', label: '〇王' },
  { value: 'kou', label: '〇皇' },
]
const GENDERS = [
  { value: 'male', label: '男性' },
  { value: 'female', label: '女性' },
  { value: 'other', label: 'その他' },
  { value: 'secret', label: '秘密' },
]

const RARITY_COLOR = {
  S: '#ff4444',
  A: '#ff9900',
  B: '#667eea',
  C: '#4CAF50',
}

const RANK_MAP = {
  hito: 'の人', shi: '士', shou: '将', ou: '王', kou: '皇'
}

const NIGHT_WOM_MAP = {
  hito: '夜の人', shi: '夜士女', shou: '夜将姫', ou: '夜王妃', kou: '夜皇姫'
}

const BADGE_DESC = {
  '🗡️': '基礎知識を証明するバッジ',
  '⚔️': '専門知識を証明するバッジ',
  '💀': 'マスターレベルを証明するバッジ',
}

export default function ProfilePage() {
  const { user } = useUser()
  const navigate = useNavigate()

  const [jobClasses, setJobClasses] = useState([])
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({
    username: '',
    bio: '',
    job_class_id: null,
    job_rank: null,
    gender: '',
    equipped_title: null,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hoveredBadge, setHoveredBadge] = useState(null)
  const [usernameChangeDaysLeft, setUsernameChangeDaysLeft] = useState(null)

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
          setForm({
            username: u.username || '',
            bio: u.bio || '',
            job_class_id: u.job_class_id || null,
            job_rank: u.job_rank || null,
            gender: u.gender || '',
            equipped_title: u.equipped_title || null,
          })
          // 名前変更可能日数計算
          if (u.username_changed_at) {
            const days = (Date.now() - new Date(u.username_changed_at).getTime()) / (1000 * 60 * 60 * 24)
            if (days < 30) setUsernameChangeDaysLeft(Math.ceil(30 - days))
          }
        }
        setLoading(false)
      })
  }, [user])

  const getCurrentTitle = () => {
    if (!form.job_class_id || !form.job_rank) return null
    const job = jobClasses.find(j => j.id === form.job_class_id)
    if (!job) return null
    if (job.category === 'night_wom') return NIGHT_WOM_MAP[form.job_rank] || null
    return `${job.rp_prefix}${RANK_MAP[form.job_rank] || ''}`
  }

  const handleSave = async () => {
    if (!form.username) return alert('冒険者名を入力してください')
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, clerk_id: user.id, email: user.primaryEmailAddress?.emailAddress }),
      })
      const data = await res.json()
      if (data.success) {
        setSaved(true)
        setTimeout(() => navigate('/guilds'), 1500)
      } else {
        alert(data.error || '保存に失敗しました')
      }
    } catch { alert('通信エラー') }
    finally { setSaving(false) }
  }

  const currentTitle = getCurrentTitle()
  const titles = profile?.titles || []
  const badges = profile?.badges || []

  const s = {
    page: { minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'sans-serif', padding: '2rem' },
    card: { maxWidth: '640px', margin: '0 auto', background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '16px', padding: '2rem' },
    label: { display: 'block', fontSize: '0.75rem', letterSpacing: '2px', color: '#888', marginBottom: '8px', textTransform: 'uppercase' },
    input: { width: '100%', background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    textarea: { width: '100%', background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px', padding: '10px 14px', color: 'white', fontSize: '14px', outline: 'none', minHeight: '80px', resize: 'vertical', boxSizing: 'border-box' },
    field: { marginBottom: '1.5rem' },
    divider: { height: '1px', background: '#1e1e2e', margin: '1.5rem 0' },
    classGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' },
    classCard: (selected) => ({ cursor: 'pointer', border: `1px solid ${selected ? '#B4965A' : '#2a2a3e'}`, borderRadius: '10px', padding: '12px 8px', textAlign: 'center', background: selected ? '#1a160a' : '#1a1a2e', transition: 'all .2s' }),
    rankGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' },
    rankBtn: (selected) => ({ cursor: 'pointer', border: `1px solid ${selected ? '#B4965A' : '#2a2a3e'}`, borderRadius: '8px', padding: '10px 4px', textAlign: 'center', background: selected ? '#1a160a' : '#1a1a2e', transition: 'all .2s' }),
    genderRow: { display: 'flex', gap: '10px' },
    genderBtn: (selected) => ({ flex: 1, cursor: 'pointer', border: `1px solid ${selected ? '#B4965A' : '#2a2a3e'}`, borderRadius: '8px', padding: '10px', textAlign: 'center', background: selected ? '#1a160a' : '#1a1a2e', color: selected ? '#B4965A' : 'white', fontSize: '13px', transition: 'all .2s' }),
    saveBtn: { width: '100%', padding: '14px', border: '1px solid #B4965A', borderRadius: '10px', background: 'transparent', color: '#B4965A', fontSize: '15px', letterSpacing: '2px', cursor: 'pointer', marginTop: '0.5rem', transition: 'all .2s' },
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
      読み込み中...
    </div>
  )

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 600, letterSpacing: '2px' }}>Edit Profile</h1>
            <p style={{ color: '#666', fontSize: '12px', letterSpacing: '3px' }}>冒険者の証明</p>
          </div>
        </div>

        {/* 現在の称号プレビュー */}
        {currentTitle && (
          <div style={{ background: '#1a160a', border: '1px solid #B4965A33', borderRadius: '10px', padding: '12px 16px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: '#888' }}>職業称号</span>
            <span style={{ fontSize: '16px', fontWeight: 600, color: '#B4965A' }}>{currentTitle}</span>
            {form.equipped_title && (
              <>
                <span style={{ fontSize: '12px', color: '#666' }}>｜ 装備中</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#ff9900' }}>🏆 {form.equipped_title}</span>
              </>
            )}
          </div>
        )}

        <div style={s.field}>
          <label style={s.label}>冒険者名 / Username</label>
          <input
            style={{ ...s.input, borderColor: usernameChangeDaysLeft ? '#666' : '#333' }}
            placeholder="あなたの名前を入れよ"
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            disabled={!!usernameChangeDaysLeft}
          />
          {usernameChangeDaysLeft && (
            <div style={{ fontSize: '11px', color: '#cc3333', marginTop: '6px' }}>
              🔒 名前変更はあと{usernameChangeDaysLeft}日後に可能です
            </div>
          )}
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
              <div key={r.value} style={s.rankBtn(form.job_rank === r.value)} onClick={() => setForm(f => ({ ...f, job_rank: r.value }))}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: form.job_rank === r.value ? '#B4965A' : 'white' }}>{r.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.divider} />

        <div style={s.field}>
          <label style={s.label}>性別 / Gender</label>
          <div style={s.genderRow}>
            {GENDERS.map(g => (
              <div key={g.value} style={s.genderBtn(form.gender === g.value)} onClick={() => setForm(f => ({ ...f, gender: g.value }))}>
                {g.label}
              </div>
            ))}
          </div>
        </div>

        {/* 証明バッジ一覧（ホバーで説明表示） */}
        {badges.length > 0 && (
          <>
            <div style={s.divider} />
            <div style={s.field}>
              <label style={s.label}>🎖️ スキル証明バッジ / Badges</label>
              <p style={{ fontSize: '11px', color: '#666', marginBottom: '10px' }}>バッジにカーソルを当てると説明が表示されます</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {badges.map((b, i) => (
                  <div key={i}
                    onMouseEnter={() => setHoveredBadge(i)}
                    onMouseLeave={() => setHoveredBadge(null)}
                    style={{
                      position: 'relative',
                      background: (RARITY_COLOR[b.rarity] || '#4CAF50') + '22',
                      border: `1px solid ${RARITY_COLOR[b.rarity] || '#4CAF50'}`,
                      borderRadius: '10px',
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'default',
                    }}>
                    <span style={{ fontSize: '20px' }}>{b.icon}</span>
                    <span style={{ fontSize: '10px', color: '#666' }}>Rarity {b.rarity}</span>
                    {/* ホバーで説明表示 */}
                    {hoveredBadge === i && (
                      <div style={{
                        position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                        background: '#0f0f1a', border: `1px solid ${RARITY_COLOR[b.rarity] || '#4CAF50'}`,
                        borderRadius: '8px', padding: '6px 12px',
                        fontSize: '11px', color: 'white', whiteSpace: 'nowrap', zIndex: 10,
                        pointerEvents: 'none',
                      }}>
                        {b.label}の証明<br />
                        <span style={{ color: '#888' }}>{BADGE_DESC[b.icon] || 'スキル証明バッジ'}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 獲得称号一覧 + 装備選択 */}
        {titles.length > 0 && (
          <>
            <div style={s.divider} />
            <div style={s.field}>
              <label style={s.label}>🏆 獲得称号 / Titles</label>
              <p style={{ fontSize: '11px', color: '#666', marginBottom: '10px' }}>称号をタップして装備できます</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {/* 装備なし選択肢 */}
                <div
                  onClick={() => setForm(f => ({ ...f, equipped_title: null }))}
                  style={{
                    background: !form.equipped_title ? '#1a1a2e' : 'transparent',
                    border: `1px solid ${!form.equipped_title ? '#888' : '#333'}`,
                    borderRadius: '99px', padding: '4px 12px', cursor: 'pointer',
                  }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>なし</span>
                </div>
                {titles.map((t, i) => {
                  const isEquipped = form.equipped_title === t.value
                  return (
                    <div key={i}
                      onClick={() => setForm(f => ({ ...f, equipped_title: isEquipped ? null : t.value }))}
                      style={{
                        background: isEquipped ? (RARITY_COLOR[t.rarity] || '#4CAF50') + '33' : (RARITY_COLOR[t.rarity] || '#4CAF50') + '11',
                        border: `1px solid ${isEquipped ? (RARITY_COLOR[t.rarity] || '#4CAF50') : (RARITY_COLOR[t.rarity] || '#4CAF50') + '55'}`,
                        borderRadius: '99px', padding: '4px 12px',
                        display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                        transition: 'all .2s',
                      }}>
                      {isEquipped && <span style={{ fontSize: '10px' }}>✅</span>}
                      <span style={{ fontSize: '12px', fontWeight: isEquipped ? 600 : 400, color: RARITY_COLOR[t.rarity] || '#4CAF50' }}>
                        {t.value}
                      </span>
                      <span style={{ fontSize: '10px', color: RARITY_COLOR[t.rarity] || '#4CAF50', opacity: 0.8 }}>
                        {t.rarity}
                      </span>
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
    </div>
  )
}