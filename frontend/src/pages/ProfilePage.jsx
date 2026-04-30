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

export default function ProfilePage() {
  const { user } = useUser()
  const navigate = useNavigate()

  const [jobClasses, setJobClasses] = useState([])
  const [form, setForm] = useState({
    username: '',
    bio: '',
    job_class_id: null,
    job_rank: null,
    gender: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}/api/job-classes`)
      .then(res => res.json())
      .then(data => setJobClasses(data.data))
  }, [])

  useEffect(() => {
    if (!user) return
    fetch(`${API}/api/users?clerk_id=${user.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data.length > 0) {
          const u = data.data[0]
          setForm({
            username: u.username || '',
            bio: u.bio || '',
            job_class_id: u.job_class_id || null,
            job_rank: u.job_rank || null,
            gender: u.gender || '',
          })
        }
        setLoading(false)
      })
  }, [user])

  const handleSave = async () => {
    if (!form.username) return alert('冒険者名を入力してください')
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, clerk_id: user.id, email: user.primaryEmailAddress?.emailAddress }),
      })
      if (res.ok) { setSaved(true); setTimeout(() => navigate('/guilds'), 1500) }
      else alert('保存に失敗しました')
    } catch { alert('通信エラー') }
    finally { setSaving(false) }
  }

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

        <div style={s.field}>
          <label style={s.label}>冒険者名 / Username</label>
          <input style={s.input} placeholder="あなたの名前を入れよ" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
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

        <button style={s.saveBtn} onClick={handleSave} disabled={saving}
          onMouseOver={e => { e.currentTarget.style.background = '#B4965A'; e.currentTarget.style.color = '#0a0a0f' }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#B4965A' }}>
          {saved ? '✅ 保存しました！' : saving ? '保存中...' : 'Save — 登録する'}
        </button>
      </div>
    </div>
  )
}