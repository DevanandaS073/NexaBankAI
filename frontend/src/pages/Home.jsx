import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import CategoryBadge from '../components/CategoryBadge'
import ConfidenceBar from '../components/ConfidenceBar'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function Home() {
    const [ticket, setTicket] = useState('')
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [history, setHistory] = useState([])
    const [user, setUser] = useState(null)
    const [showHelp, setShowHelp] = useState(false)

    useEffect(() => {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        }
    }, [])

    const classify = async () => {
        if (!ticket.trim()) return
        setLoading(true)
        setError(null)
        setResult(null)

        try {
            const token = localStorage.getItem('token')
            if (!token) {
                setError('You must be logged in to access the classification model.')
                setLoading(false)
                return
            }

            const res = await axios.post(
                `${API_URL}/predict`,
                { text: ticket },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setResult(res.data)
            setHistory(prev => [
                { text: ticket, ...res.data, id: Date.now() },
                ...prev.slice(0, 9)
            ])
        } catch (err) {
            console.error(err)
            if (err.response && err.response.status === 401) {
                setError('Your session has expired. Please log in again.')
            } else {
                setError('Could not connect to the API. Make sure the backend is running.')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleKey = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) classify()
    }

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px' }}>
            {/* Hero Section */}
            <div style={{
                textAlign: 'center',
                marginBottom: '60px',
                animation: 'fadeIn 0.8s ease'
            }}>
                <h1 style={{
                    color: 'white',
                    fontSize: '48px',
                    fontWeight: '800',
                    margin: '0 0 24px',
                    lineHeight: '1.2',
                    letterSpacing: '-0.02em',
                    background: 'linear-gradient(to right, #ffffff, #a5b4fc)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Welcome to NexaBank AI Assistant
                </h1>
                <p style={{
                    color: 'var(--text-main)',
                    fontSize: '16px',
                    maxWidth: '650px',
                    margin: '0 auto',
                    lineHeight: '1.6',
                    fontWeight: '500'
                }}>
                    {!user ? (
                        <span>
                            Please <Link to="/login" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: '700', borderBottom: '2.5px solid rgba(79, 70, 229, 0.4)' }}>login to your account</Link> to issue your problem.
                        </span>
                    ) : (
                        <span>
                            You are signed in. Go to your <Link to="/dashboard" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: '700', borderBottom: '2.5px solid rgba(79, 70, 229, 0.4)' }}>Dashboard</Link> to manage your tickets.
                        </span>
                    )}
                </p>
            </div>

            {/* Department Feature Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '60px'
            }}>
                {[
                    { emoji: '💸', name: 'Billing', desc: 'Fee refunds, charges, disputes' },
                    { emoji: '📈', name: 'Sales', desc: 'Product info, currencies, support' },
                    { emoji: '🔐', name: 'Account Support', desc: 'ID checks, passcode resets, blocks' },
                    { emoji: '🚨', name: 'Security & Fraud', desc: 'Stolen cards, unrecognized charges' },
                    { emoji: '💳', name: 'Cards & ATMs', desc: 'Pin resets, virtual cards, ATMs' }
                ].map(dept => (
                    <div key={dept.name} className="glass-card" style={{
                        padding: '20px',
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        border: '1px solid var(--glass-border)'
                    }}>
                        <span style={{ fontSize: '28px', display: 'block', marginBottom: '10px' }}>{dept.emoji}</span>
                        <h3 style={{ color: 'var(--text-main)', fontSize: '13px', fontWeight: '700', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{dept.name}</h3>
                        <p style={{ color: 'var(--text-subtle)', fontSize: '12px', margin: 0, lineHeight: '1.4' }}>{dept.desc}</p>
                    </div>
                ))}
            </div>

            {/* Interactive Sandbox - Only visible to Admin (Super Agent) */}
            {user && user.role === 'admin' && (
                <div className="glass-card" style={{
                    padding: '32px',
                    boxShadow: '0 12px 40px rgba(148, 163, 184, 0.12)',
                    marginTop: '40px'
                }}>
                    <h2 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '800', margin: '0 0 8px', letterSpacing: '0.05em' }}>
                        Model Testing Sandbox
                    </h2>
                    <p style={{ color: 'var(--text-subtle)', fontSize: '13px', margin: '0 0 24px' }}>
                        Try the prediction engine. Write a message below to classify it.
                    </p>

                    <div>
                        <label style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Support request text <span style={{ color: '#94a3b8' }}>(Ctrl+Enter to classify)</span>
                        </label>
                        <textarea
                            value={ticket}
                            onChange={e => setTicket(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="e.g. I was charged twice for my subscription last month and I can't log into my account..."
                            rows={4}
                            className="glass-input"
                            style={{
                                width: '100%',
                                resize: 'vertical',
                                marginBottom: '16px'
                            }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <span style={{ color: 'var(--text-subtle)', fontSize: '12px' }}>
                                {ticket.length} characters
                            </span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => { setTicket(''); setResult(null); setError(null) }}
                                    className="glass-button-secondary"
                                    style={{
                                        padding: '8px 20px',
                                        fontSize: '12px',
                                    }}
                                >
                                    Clear
                                </button>
                                <button
                                    onClick={classify}
                                    disabled={loading || !ticket.trim()}
                                    className="glass-button"
                                    style={{
                                        padding: '8px 24px',
                                        fontSize: '12px',
                                    }}
                                >
                                    {loading ? 'Classifying...' : 'Classify Ticket →'}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                borderRadius: '10px',
                                padding: '16px',
                                color: '#ef4444',
                                fontSize: '13px',
                                marginBottom: '24px',
                            }}>
                                ⚠️ {error}
                            </div>
                        )}

                        {/* Result */}
                        {result && (
                            <div className="glass-card" style={{
                                padding: '24px',
                                marginBottom: '24px',
                                border: '1px solid var(--glass-border)'
                            }}>
                                <p style={{ color: 'var(--text-subtle)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', margin: '0 0 16px', letterSpacing: '0.05em' }}>
                                    Predicted Category
                                </p>
                                <div style={{ marginBottom: '20px' }}>
                                    <CategoryBadge category={result.category} />
                                </div>
                                <ConfidenceBar confidence={result.confidence} />
                            </div>
                        )}

                        {/* History */}
                        {history.length > 0 && (
                            <div style={{
                                borderTop: '1px solid var(--glass-border)',
                                paddingTop: '24px',
                                marginTop: '24px'
                            }}>
                                <h3 style={{ color: 'var(--text-main)', fontSize: '13px', fontWeight: '700', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Recent Predictions
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {history.map(item => (
                                        <div key={item.id} className="glass-card" style={{
                                            borderRadius: '8px',
                                            padding: '10px 16px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '16px',
                                            border: '1px solid var(--glass-border)'
                                        }}>
                                            <span style={{
                                                color: 'var(--text-main)',
                                                fontSize: '13px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                flex: 1,
                                            }}>
                                                {item.text}
                                            </span>
                                            <CategoryBadge category={item.category} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Further Assistance Section */}
            <div style={{
                textAlign: 'center',
                marginTop: '48px',
                borderTop: '1px solid var(--glass-border)',
                paddingTop: '32px'
            }}>
                <button
                    onClick={() => setShowHelp(prev => !prev)}
                    className="glass-button-secondary"
                    style={{
                        padding: '10px 24px',
                        fontSize: '13px',
                        fontWeight: '700',
                    }}
                >
                    💬 Need Further Assistance?
                </button>

                {showHelp && (
                    <div className="glass-card" style={{
                        maxWidth: '480px',
                        margin: '24px auto 0',
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        textAlign: 'left',
                        animation: 'fadeIn 0.3s ease',
                        border: '1px solid var(--glass-border)'
                    }}>
                        <h4 style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: '700', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            NexaBank Customer Help Desk
                        </h4>
                        <p style={{ color: 'var(--text-subtle)', fontSize: '13px', margin: 0, lineHeight: '1.4' }}>
                            If you require direct support, please contact our support team.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '18px' }}>✉️</span>
                                <div>
                                    <span style={{ display: 'block', color: 'var(--text-subtle)', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Support</span>
                                    <a href="mailto:nexabank@gmail.com" style={{ color: '#4f46e5', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                                        nexabank@gmail.com
                                    </a>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '18px' }}>📞</span>
                                <div>
                                    <span style={{ display: 'block', color: 'var(--text-subtle)', fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer Care Number</span>
                                    <a href="tel:5674239832" style={{ color: '#4f46e5', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
                                        5674239832
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Home