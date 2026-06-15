import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function Register() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [accountNumber, setAccountNumber] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!fullName.trim() || !email.trim() || !password.trim()) return

        setLoading(true)
        setError(null)

        const payload = {
            full_name: fullName,
            email: email,
            password: password,
            role: 'customer',
            account_number: accountNumber.trim() ? accountNumber : null,
            department: null,
        }

        try {
            await axios.post(`${API_URL}/auth/register`, payload)
            // Redirect to login on success
            navigate('/login')
        } catch (err) {
            console.error(err)
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail)
            } else {
                setError('Registration failed. Make sure your email is unique and details are correct.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            maxWidth: '440px',
            margin: '60px auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span style={{ fontSize: '36px' }}>📝</span>
                <h2 style={{ color: '#1e293b', fontSize: '22px', fontWeight: '800', margin: '12px 0 6px', letterSpacing: '0.08em' }}>
                    Create Account
                </h2>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0, fontWeight: '500' }}>
                    Join NexaBank Support routing platform.
                </p>
            </div>

            {/* Registration Card */}
            <form onSubmit={handleSubmit} className="glass-card" style={{
                padding: '32px',
                boxShadow: '0 8px 32px rgba(148, 163, 184, 0.15)',
            }}>
                {error && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#ef4444',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        marginBottom: '20px',
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Common Fields */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', color: '#475569', fontSize: '11px', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Full Name
                    </label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="glass-input"
                        style={{
                            width: '100%',
                        }}
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', color: '#475569', fontSize: '11px', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="john.doe@example.com"
                        required
                        className="glass-input"
                        style={{
                            width: '100%',
                        }}
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', color: '#475569', fontSize: '11px', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="glass-input"
                        style={{
                            width: '100%',
                        }}
                    />
                </div>

                {/* Account Number */}
                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', color: '#475569', fontSize: '11px', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Account Number <span style={{ color: '#94a3b8' }}>(Optional)</span>
                    </label>
                    <input
                        type="text"
                        value={accountNumber}
                        onChange={e => setAccountNumber(e.target.value)}
                        placeholder="e.g. 1234567890"
                        className="glass-input"
                        style={{
                            width: '100%',
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="glass-button"
                    style={{
                        width: '100%',
                        marginBottom: '16px',
                    }}
                >
                    {loading ? 'Registering...' : 'Register'}
                </button>

                <p style={{ color: '#475569', fontSize: '13px', margin: 0, textAlign: 'center', fontWeight: '500' }}>
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: '700', borderBottom: '1.5px solid rgba(79, 70, 229, 0.3)' }}>
                        Login
                    </Link>
                </p>
            </form>
        </div>
    )
}

export default Register
