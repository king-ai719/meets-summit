import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

const API = 'https://meets-summit-api.tk-xx719.workers.dev'

const PLAN_COLORS = {
  free: '#888',
  light: '#4CAF50',
  standard: '#667eea',
  premium: '#ff9900',
}

const PLAN_ICONS = {
  free: '⚔️',
  light: '⭐',
  standard: '💎',
  premium: '👑',
}

export default function PlanPage() {
  const navigate = useNavigate()
  const { user } = useUser()
  const [plans, setPlans] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/stripe/plans`)
      .then(res => res.json())
      .then(data => { if (data.success) setPlans(data.plans) })
  }, [])

  useEffect(() => {
    if (!user) return
    fetch(`${API}/api/users?clerk_id=${user.id}`)
      .then(res => res.json())
      .then(data => { if (data.data?.[0]) setProfile(data.data[0]) })
  }, [user])

  const handleSubscribe = async (plan) => {
    if (!profile) return alert('先にプロフィールを設定してください')
    if (plan.id === 'free') return
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/stripe/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price_id: plan.price_id,
          user_id: profile.id,
          success_url: `${window.location.origin}/profile?plan=success`,
          cancel_url: `${window.location.origin}/plan`,
        }),
      })
      const data = await res.json()
      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        alert('エラーが発生しました：' + data.error)
      }
    } catch { alert('通信エラー') }
    finally { setLoading(false) }
  }

  const currentPlan = profile?.plan || 'free'

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'sans-serif', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem' }}>←</button>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 600, letterSpacing: '2px' }}>⚔️ プランを選ぶ</h1>
            <p style={{ color: '#666', fontSize: '12px', letterSpacing: '2px' }}>知識が、出逢いになる。</p>
          </div>
        </div>

        <div style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '12px', padding: '16px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>{PLAN_ICONS[currentPlan]}</span>
          <div>
            <div style={{ fontSize: '12px', color: '#888' }}>現在のプラン</div>
            <div style={{ fontSize: '16px', fontWeight: 600, color: PLAN_COLORS[currentPlan] }}>
              {currentPlan === 'free' ? '無料' : currentPlan === 'light' ? 'ライト' : currentPlan === 'standard' ? 'スタンダード' : 'プレミアム'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
          {plans.map(plan => {
            const isCurrent = plan.id === currentPlan
            const color = PLAN_COLORS[plan.id]
            const isPremium = plan.id === 'premium'
            const isStandard = plan.id === 'standard'
            return (
              <div key={plan.id} style={{
                background: isCurrent ? color + '11' : '#0f0f1a',
                border: `2px solid ${isCurrent ? color : isStandard ? color + '88' : '#2a2a3e'}`,
                borderRadius: '16px', padding: '1.5rem',
                display: 'flex', flexDirection: 'column', gap: '12px',
                position: 'relative',
                boxShadow: isPremium ? `0 0 20px ${color}44` : isStandard ? `0 0 10px ${color}22` : 'none',
              }}>
                {/* おすすめバッジ（standard） */}
                {isStandard && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#667eea', color: 'white', fontSize: '11px', fontWeight: 700, padding: '2px 12px', borderRadius: '99px', whiteSpace: 'nowrap' }}>
                    おすすめ
                  </div>
                )}

                <div style={{ fontSize: '2rem', textAlign: 'center' }}>{PLAN_ICONS[plan.id]}</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{plan.name}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '4px' }}>
                    {plan.price === 0 ? '無料' : `¥${plan.price.toLocaleString()}`}
                    {plan.price > 0 && <span style={{ fontSize: '11px', color: '#888' }}>/月</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#4CAF50' }}>✓</span>
                    <span style={{ color: '#ccc' }}>
                      いいね {plan.likes_per_day === -1 ? '無制限' : `${plan.likes_per_day}回/日`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#4CAF50' }}>✓</span>
                    <span style={{ color: '#ccc' }}>
                      クエスト {plan.quest_per_day === -1 ? '無制限' : `${plan.quest_per_day}回/日`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: plan.can_upload_photo ? '#4CAF50' : '#555' }}>
                      {plan.can_upload_photo ? '✓' : '✗'}
                    </span>
                    <span style={{ color: plan.can_upload_photo ? '#ccc' : '#555' }}>写真アップロード</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: plan.can_see_likers ? '#4CAF50' : '#555' }}>
                      {plan.can_see_likers ? '✓' : '✗'}
                    </span>
                    <span style={{ color: plan.can_see_likers ? '#ccc' : '#555' }}>いいね確認</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#4CAF50' }}>✓</span>
                    <span style={{ color: '#ccc' }}>DMルーム</span>
                  </div>
                  {isPremium && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ color: '#ff9900' }}>✓</span>
                      <span style={{ color: '#ff9900' }}>👑 プロフ装飾</span>
                    </div>
                  )}
                </div>

                {isCurrent ? (
                  <div style={{ textAlign: 'center', fontSize: '12px', color, padding: '8px', border: `1px solid ${color}`, borderRadius: '8px' }}>
                    現在のプラン
                  </div>
                ) : plan.id === 'free' ? (
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#555', padding: '8px' }}>
                    ダウングレード
                  </div>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={loading}
                    style={{
                      padding: '10px', border: `1px solid ${color}`,
                      borderRadius: '8px', background: 'transparent',
                      color, fontSize: '13px', cursor: 'pointer',
                      transition: 'all .2s', fontWeight: 600,
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = '#0a0a0f' }}
                    onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = color }}>
                    {loading ? '処理中...' : 'このプランに変更'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#1a1a2e', borderRadius: '10px', fontSize: '11px', color: '#666', lineHeight: 1.8 }}>
          ※ 決済はStripeを通じて安全に処理されます。<br />
          ※ サブスクリプションはいつでもキャンセルできます。<br />
          ※ テスト環境では実際の決済は発生しません。
        </div>
      </div>
    </div>
  )
}