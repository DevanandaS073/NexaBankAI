function ConfidenceBar({ confidence }) {
    const getColor = (val) => {
        if (val >= 60) return '#16a34a'
        if (val >= 35) return '#ea580c'
        return '#dc2626'
    }

    const color = getColor(confidence)

    return (
        <div style={{ width: '100%' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '6px',
            }}>
                <span style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Confidence</span>
                <span style={{ color: color, fontWeight: '700', fontSize: '12px' }}>
                    {confidence}%
                </span>
            </div>
            <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                borderRadius: '99px',
                overflow: 'hidden',
                boxSizing: 'border-box'
            }}>
                <div style={{
                    width: `${confidence}%`,
                    height: '100%',
                    backgroundColor: color,
                    borderRadius: '99px',
                    transition: 'width 0.8s ease',
                }} />
            </div>
            <p style={{ color: '#475569', fontSize: '11px', marginTop: '6px', fontWeight: '500' }}>
                {confidence >= 60
                    ? 'High confidence prediction'
                    : confidence >= 35
                        ? 'Moderate confidence — review recommended'
                        : 'Low confidence — manual review advised'}
            </p>
        </div>
    )
}

export default ConfidenceBar