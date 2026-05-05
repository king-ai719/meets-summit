import { useNavigate } from 'react-router-dom'

export default function TermsPage() {
  const navigate = useNavigate()

  const s = {
    page: { minHeight: '100vh', background: '#0a0a0f', color: 'white', fontFamily: 'sans-serif', padding: '2rem' },
    container: { maxWidth: '720px', margin: '0 auto' },
    h1: { fontSize: '1.6rem', fontWeight: 600, letterSpacing: '2px', marginBottom: '0.5rem' },
    h2: { fontSize: '1rem', fontWeight: 600, color: '#B4965A', letterSpacing: '1px', marginTop: '2rem', marginBottom: '0.5rem' },
    p: { fontSize: '13px', color: '#ccc', lineHeight: 1.8, marginBottom: '0.5rem' },
    ul: { fontSize: '13px', color: '#ccc', lineHeight: 1.8, paddingLeft: '1.5rem', marginBottom: '0.5rem' },
    divider: { height: '1px', background: '#1e1e2e', margin: '1.5rem 0' },
    date: { fontSize: '12px', color: '#666', marginBottom: '2rem' },
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        <button onClick={() => window.close()} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.2rem', marginBottom: '1.5rem' }}>← 閉じる</button>

        <h1 style={s.h1}>⚔️ 利用規約</h1>
        <p style={s.date}>制定日：2025年5月1日　最終更新日：2025年5月1日</p>

        <p style={s.p}>
          本利用規約（以下「本規約」）は、株式会社Techno Management Service（以下「当社」）が提供するサービス「Meets Summit」（以下「本サービス」）の利用条件を定めるものです。ユーザーは本規約に同意の上、本サービスをご利用ください。
        </p>

        <div style={s.divider} />

        <h2 style={s.h2}>第1条（適用）</h2>
        <p style={s.p}>本規約は、本サービスの利用に関わるすべてのユーザーと当社との間に適用されます。</p>

        <h2 style={s.h2}>第2条（利用資格）</h2>
        <ul style={s.ul}>
          <li>本サービスは18歳以上の方のみご利用いただけます。</li>
          <li>未成年者の利用は禁止します。</li>
          <li>過去に本サービスの利用を停止・禁止された方は利用できません。</li>
        </ul>

        <h2 style={s.h2}>第3条（アカウント）</h2>
        <p style={s.p}>ユーザーはClerk認証を通じてアカウントを作成します。アカウント情報の管理はユーザー自身の責任において行うものとします。第三者によるアカウントの不正利用について、当社は責任を負いません。</p>

        <h2 style={s.h2}>第4条（禁止事項）</h2>
        <p style={s.p}>ユーザーは以下の行為を行ってはなりません。</p>
        <ul style={s.ul}>
          <li>虚偽の情報を登録する行為</li>
          <li>他のユーザーへの嫌がらせ・誹謗中傷・脅迫</li>
          <li>わいせつ・暴力的・差別的なコンテンツの投稿</li>
          <li>営利目的の勧誘・宣伝行為</li>
          <li>本サービスのシステムへの不正アクセス・改ざん</li>
          <li>他のユーザーの個人情報を無断で収集・公開する行為</li>
          <li>法令または公序良俗に反する行為</li>
          <li>その他当社が不適切と判断する行為</li>
        </ul>

        <h2 style={s.h2}>第5条（料金・決済）</h2>
        <ul style={s.ul}>
          <li>有料プランの料金は各プランページに記載の通りです。</li>
          <li>決済はStripeを通じて処理されます。</li>
          <li>サブスクリプションは毎月自動更新されます。</li>
          <li>キャンセルはいつでも可能ですが、当月分の返金は行いません。</li>
        </ul>

        <h2 style={s.h2}>第6条（コンテンツの権利）</h2>
        <p style={s.p}>ユーザーが投稿したコンテンツの著作権はユーザーに帰属します。ただし、当社はサービス運営・改善のために当該コンテンツを無償で利用できるものとします。</p>

        <h2 style={s.h2}>第7条（アカウント停止・退会）</h2>
        <p style={s.p}>当社は、ユーザーが本規約に違反した場合、事前通知なくアカウントを停止または削除できます。退会を希望するユーザーは所定の手続きにより退会できます。</p>

        <h2 style={s.h2}>第8条（免責事項）</h2>
        <ul style={s.ul}>
          <li>当社は本サービスの完全性・正確性を保証しません。</li>
          <li>ユーザー間のトラブルについて当社は責任を負いません。</li>
          <li>システム障害・メンテナンスによるサービス停止について当社は責任を負いません。</li>
        </ul>

        <h2 style={s.h2}>第9条（プライバシー）</h2>
        <p style={s.p}>
          個人情報の取り扱いについては
          <span onClick={() => window.open('https://meets-summit.pages.dev/policy.html', '_blank')} style={{ color: '#667eea', cursor: 'pointer', textDecoration: 'underline', margin: '0 4px' }}>
  プライバシーポリシー
</span>
          をご確認ください。
        </p>

        <h2 style={s.h2}>第10条（規約の変更）</h2>
        <p style={s.p}>当社は必要に応じて本規約を変更できます。変更後の規約はサービス上に掲載した時点で効力を生じます。</p>

        <h2 style={s.h2}>第11条（準拠法・管轄裁判所）</h2>
        <p style={s.p}>本規約は日本法に準拠し、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>

        <div style={s.divider} />

      </div>
    </div>
  )
}