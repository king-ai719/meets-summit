import { useNavigate } from 'react-router-dom'
import { useUser, useClerk } from '@clerk/clerk-react'
import { useState, useEffect } from 'react'

const API = 'https://meets-summit-api.tk-xx719.workers.dev'

export default function WithdrawPage() {
  const navigate = useNavigate()
  const { user } = useUser()
  const { signOut } = useClerk()
  const [profile, setProfile] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  useEffect(() => {
    if (!user) return
    fetch(`${API}/api/users?clerk_id=${user.id}`)
      .then(r => r.json())
      .then(d => { if (d.data?.[0]) setProfile(d.data[0]) })
  }, [user])

  const handleWithdraw = async () => {
    if (!confirmed) return alert('チェックボックスにチェックを入れてください')
    if (!profile) return alert('プロフィールが見つかりません')
    if (!window.confirm('本当に退会しますか？この操作は取り消せません。')) return
    setWithdrawing(true)
    try {
      const res = await fetch(`${API}/api/users/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: profile.id, clerk_id: user.id }),
      })
      const data = await res.json()
      if (!data.success) {
        alert('退会に失敗しました: ' + (data.error || '不明なエラー'))
        return
      }
      await signOut()
      alert('退会が完了しました。ご利用ありがとうございました。')
      navigate('/')
    } catch (e) {
      alert('通信エラーが発生しました')
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'sans-serif', padding: '2rem' }}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem', marginBottom: '1.5rem' }}>←</button>

        <h1 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.5rem' }}>退会</h1>
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '2rem' }}>退会するとすべてのデータが削除されます。</p>

        <div style={{ background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '13px', color: '#cc3333', fontWeight: 600, marginBottom: '12px' }}>⚠️ 退会前にご確認ください</p>
          <ul style={{ fontSize: '13px', color: '#ccc', lineHeight: 2, paddingLeft: '1.5rem' }}>
            <li>プロフィール・マッチング情報がすべて削除されます</li>
            <li>獲得したバッジ・称号が消滅します</li>
            <li>マッチング相手とのDMが削除されます</li>
            <li>有料プランは退会と同時に解約されます</li>
            <li>この操作は取り消せません</li>
          </ul>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', cursor: 'pointer' }}
          onClick={() => setConfirmed(!confirmed)}>
          <div style={{ width: '20px', height: '20px', border: `2px solid ${confirmed ? '#cc3333' : '#444'}`, borderRadius: '4px', background: confirmed ? '#cc3333' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {confirmed && <span style={{ fontSize: '14px' }}>✓</span>}
          </div>
          <span style={{ fontSize: '13px', color: '#888' }}>上記の内容を確認し、退会に同意します</span>
        </div>

        <button onClick={handleWithdraw} disabled={withdrawing || !confirmed}
          style={{ width: '100%', padding: '14px', border: `1px solid ${confirmed ? '#cc3333' : '#333'}`, borderRadius: '10px', background: 'transparent', color: confirmed ? '#cc3333' : '#444', fontSize: '15px', cursor: confirmed ? 'pointer' : 'not-allowed', transition: 'all .2s' }}>
          {withdrawing ? '退会処理中...' : '退会する'}
        </button>
      </div>
    </div>
  )
}