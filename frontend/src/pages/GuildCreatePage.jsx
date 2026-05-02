import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

const API = 'https://meets-summit-api.tk-xx719.workers.dev'

const GUILD_TYPES = [
  { value: 'love', label: '❤️ 恋愛', desc: '出会いを求める' },
  { value: 'work', label: '💼 仕事', desc: 'ビジネス・副業' },
  { value: 'hobby', label: '🎮 趣味', desc: '同じ趣味の仲間' },
  { value: 'night', label: '🌙 夜職', desc: '夜の世界の仲間' },
]

export default function GuildCreatePage() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [jobClasses, setJobClasses] = useState([])
  const [profile, setProfile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    guild_type: '',
    job_class_id: '',
    icon: '⚔️',
    is_public: true,
  })

  const ICONS = ['⚔️','🏰','🌙','👑','🔥','💎','🌟','🎯','🛡️','🗡️','🏆','💰']

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
        if (data.data && data.data.length > 0) setProfile(data.data[0])
      })
  }, [user])

  const handleSave = async () => {
    if (!form.name) return alert('ギルド名を入力してください')
    if (!form.guild_type) return alert('ギルドタイプを選択してください')
    if (!profile) return alert('先にプロフィールを設定してください')
    setSaving(true)
    try {
      const res = await fetch(`${API}/api/guilds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          owner_id: profile.id,
          job_class_id: form.job_class_id || null,
        }),
      })
      const data = await res.json()
      if (data.success) navigate('/guilds')
      else alert('作成に失敗しました：' + JSON.stringify(data))
    } catch(e) { alert('通信エラー：' + e.message) }
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
    saveBtn: { width: '100%', padding: '14px', border: '1px solid #B4965A', borderRadius: '10px', background: 'transparent', color: '#B4965A', fontSize: '15px', letterSpacing: '2px', cursor: 'pointer', marginTop: '0.5rem', transition: 'all .2s' },
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => navigate('/guilds')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 600, letterSpacing: '2px' }}>Create Guild</h1>
            <p style={{ color: '#666', fontSize: '12px', letterSpacing: '3px' }}>ギルドを創設せよ</p>
          </div>
        </div>

        <div style={s.field}>
          <label style={s.label}>アイコン</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {ICONS.map(icon => (
              <button key={icon} onClick={() => setForm(f => ({ ...f, icon }))}
                style={{ fontSize: '1.5rem', padding: '8px', borderRadius: '8px', border: `1px solid ${form.icon === icon ? '#B4965A' : '#333'}`, background: form.icon === icon ? '#1a160a' : '#1a1a2e', cursor: 'pointer' }}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div style={s.field}>
          <label style={s.label}>ギルド名</label>
          <input style={s.input} placeholder="ギルドの名を刻め" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>

        <div style={s.field}>
          <label style={s.label}>説明</label>
          <textarea style={s.textarea} placeholder="ギルドの使命を語れ..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        <div style={s.divider} />

        <div style={s.field}>
          <label style={s.label}>ギルドタイプ</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {GUILD_TYPES.map(type => (
              <div key={type.value} onClick={() => setForm(f => ({ ...f, guild_type: type.value }))}
                style={{ cursor: 'pointer', border: `1px solid ${form.guild_type === type.value ? '#B4965A' : '#2a2a3e'}`, borderRadius: '10px', padding: '12px', background: form.guild_type === type.value ? '#1a160a' : '#1a1a2e' }}>
                <div style={{ fontSize: '1.2rem' }}>{type.label}</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>{type.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={s.field}>
          <label style={s.label}>職業カテゴリ（任意）</label>
          <select style={{ ...s.input }} value={form.job_class_id} onChange={e => setForm(f => ({ ...f, job_class_id: e.target.value }))}>
            <option value="">全職業OK</option>
            {jobClasses.map(job => (
              <option key={job.id} value={job.id}>{job.icon} {job.name}</option>
            ))}
          </select>
        </div>

        <button style={s.saveBtn} onClick={handleSave} disabled={saving}
          onMouseOver={e => { e.currentTarget.style.background = '#B4965A'; e.currentTarget.style.color = '#0a0a0f' }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#B4965A' }}>
          {saving ? '作成中...' : 'Create — ギルドを創設する'}
        </button>
      </div>
    </div>
  )
}