const categoryConfig = {
    lost_or_stolen_card: { emoji: '🚨', color: '#c22d2d', bg: 'rgba(239, 68, 68, 0.08)' },
    card_payment: { emoji: '💳', color: '#c2410c', bg: 'rgba(249, 115, 22, 0.08)' },
    balance_not_updated: { emoji: '📊', color: '#854d0e', bg: 'rgba(234, 179, 8, 0.08)' },
    transfer: { emoji: '💸', color: '#15803d', bg: 'rgba(34, 197, 94, 0.08)' },
    account_access: { emoji: '🔐', color: '#4338ca', bg: 'rgba(99, 102, 241, 0.08)' },
    beneficiary: { emoji: '👤', color: '#6b21a8', bg: 'rgba(139, 92, 246, 0.08)' },
    transaction: { emoji: '📋', color: '#0369a1', bg: 'rgba(6, 182, 212, 0.08)' },
    refund: { emoji: '↩️', color: '#be185d', bg: 'rgba(236, 72, 153, 0.08)' },
    loan: { emoji: '🏦', color: '#0f766e', bg: 'rgba(20, 184, 166, 0.08)' },
    exchange_rate: { emoji: '💱', color: '#b45309', bg: 'rgba(245, 158, 11, 0.08)' },
}

const defaultConfig = { emoji: '🎫', color: '#4338ca', bg: 'rgba(99, 102, 241, 0.08)' }

function CategoryBadge({ category }) {
    const config = categoryConfig[category] || defaultConfig

    // format label
    const label = category
        ? category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        : 'Unknown'

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: config.bg,
            border: `1px solid rgba(255, 255, 255, 0.65)`,
            borderRadius: '20px',
            padding: '6px 14px',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 2px 8px rgba(148, 163, 184, 0.05)'
        }}>
            <span style={{ fontSize: '16px' }}>{config.emoji}</span>
            <span style={{
                color: config.color,
                fontWeight: '700',
                fontSize: '11px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
            }}>
                {label}
            </span>
        </div>
    )
}

export default CategoryBadge