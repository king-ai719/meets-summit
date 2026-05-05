import { useNavigate } from 'react-router-dom'

export default function TokushohoPage() {
  const navigate = useNavigate()

  const s = {
    page: { minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'sans-serif', padding: '2rem' },
    container: { maxWidth: '720px', margin: '0 auto' },
    h1: { fontSize: '1.6rem', fontWeight: 600, letterSpacing: '2px', marginBottom: '0.5rem' },
    h2: { fontSize: '1rem', fontWeight: 600, color: '#B4965A', letterSpacing: '1px', marginTop: '2rem', marginBottom: '0.5rem' },
    p: { fontSize: '13px', color: '#ccc', lineHeight: 1.8, marginBottom: '0.5rem' },
    divider: { height: '1px', background: '#1e1e2e', margin: '1.5rem 0' },
    date: { fontSize: '12px', color: '#666', marginBottom: '2rem' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
    td: { padding: '12px 16px', borderBottom: '1px solid #1e1e2e', color: '#ccc', verticalAlign: 'top' },
    th: { padding: '12px 16px', borderBottom: '1px solid #2a2a3e', color: '#888', textAlign: 'left', width: '35%' },
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        <button onClick={() => window.close()} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem', marginBottom: '1.5rem' }}>← 閉じる</button>

        <h1 style={s.h1}>📋 特定商取引法に基づく表記</h1>
        <p style={s.date}>最終更新日：2025年5月1日</p>

        <div style={{ background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={s.table}>
            <tbody>
              <tr>
                <td style={{ ...s.td, ...s.th }}>販売業者</td>
                <td style={s.td}>株式会社Techno Management Service</td>
              </tr>
              <tr>
                <td style={{ ...s.td, ...s.th }}>代表者</td>
                <td style={s.td}>King</td>
              </tr>
              <tr>
                <td style={{ ...s.td, ...s.th }}>所在地</td>
                <td style={s.td}>東京都北区赤羽1-41-5 ADAMS303</td>
              </tr>
              <tr>
                <td style={{ ...s.td, ...s.th }}>連絡先</td>
                <td style={s.td}>info@tms-92.com</td>
              </tr>
              <tr>
                <td style={{ ...s.td, ...s.th }}>サービス名</td>
                <td style={s.td}>Meets Summit（ミーツサミット）</td>
              </tr>
              <tr>
                <td style={{ ...s.td, ...s.th }}>販売価格</td>
                <td style={s.td}>
                  ライトプラン：¥980/月<br />
                  スタンダードプラン：¥1,980/月<br />
                  プレミアムプラン：¥3,980/月<br />
                  ※ 無料プランあり
                </td>
              </tr>
              <tr>
                <td style={{ ...s.td, ...s.th }}>支払方法</td>
                <td style={s.td}>クレジットカード・Google Pay・Apple Pay（Stripe決済）</td>
              </tr>
              <tr>
                <td style={{ ...s.td, ...s.th }}>支払時期</td>
                <td style={s.td}>お申込み時に即時決済。以降毎月自動更新。</td>
              </tr>
              <tr>
                <td style={{ ...s.td, ...s.th }}>サービス提供時期</td>
                <td style={s.td}>決済完了後、即時利用可能</td>
              </tr>
              <tr>
                <td style={{ ...s.td, ...s.th }}>キャンセル・返金</td>
                <td style={s.td}>いつでもキャンセル可能です。ただし、当月分の料金の返金は行いません。次回更新日以降の請求は発生しません。</td>
              </tr>
              <tr>
                <td style={{ ...s.td, ...s.th }}>動作環境</td>
                <td style={s.td}>インターネット接続環境、対応ブラウザ（Chrome・Safari・Firefox等）</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ ...s.divider }} />
        <p style={{ fontSize: '12px', color: '#555', textAlign: 'center' }}>
          © 2025 株式会社Techno Management Service
        </p>
      </div>
    </div>
  )
}