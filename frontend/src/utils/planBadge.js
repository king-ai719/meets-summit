export function getPlanIcon(plan) {
  if (plan === 'premium') return '👑'
  if (plan === 'standard') return '💎'
  if (plan === 'light') return '⭐'
  return null
}

export function getPlanGlow(plan) {
  if (plan === 'premium') return '0 0 8px #ff9900, 0 0 16px #ff990055'
  return null
}

export function getPlanBorderColor(plan) {
  if (plan === 'premium') return '#ff9900'
  if (plan === 'standard') return '#667eea'
  if (plan === 'light') return '#888'
  return '#2a2a3e'
}

// バッジ・称号のグローアニメ用インラインスタイル
export function getPremiumBadgeStyle(plan, baseStyle = {}) {
  if (plan !== 'premium') return baseStyle
  return {
    ...baseStyle,
    animation: 'premiumGlow 2s ease-in-out infinite',
  }
}