import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

function EmployeeLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!email.trim() || !password.trim()) return

        setLoading(true)
        setError(null)

        try {
            const res = await axios.post(`${API_URL}/auth/login`, {
                email: email,
                password: password
            })

            // Validate employee/admin roles
            const role = res.data.user.role
            if (role !== 'staff' && role !== 'admin') {
                setError('Access denied: Customers must log in using the Customer Portal.')
                setLoading(false)
                return
            }

            // Save authentication details
            localStorage.setItem('token', res.data.access_token)
            localStorage.setItem('user', JSON.stringify(res.data.user))
            
            // Dispatch a storage event to notify Navbar and other components
            window.dispatchEvent(new Event('authChange'))
            
            // Redirect to dashboard
            navigate('/dashboard')
        } catch (err) {
            console.error(err)
            if (err.response && err.response.data && err.response.data.detail) {
                setError(err.response.data.detail)
            } else {
                setError('Login failed. Please check your credentials or backend connection.')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            maxWidth: '420px',
            margin: '80px auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <span style={{ fontSize: '36px' }}>🔐</span>
                <h2 style={{ color: '#1e293b', fontSize: '22px', fontWeight: '800', margin: '12px 0 6px', letterSpacing: '0.08em' }}>
                    Employee Portal
                </h2>
                <p style={{ color: '#64748b', fontSize: '13px', margin: 0, fontWeight: '500' }}>
                    Sign in with your secure employee ID & password.
                </p>
            </div>

            {/* Login Card */}
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

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', color: '#475569', fontSize: '11px', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Employee Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="agent@nexabank.com"
                        required
                        className="glass-input"
                        style={{
                            width: '100%',
                        }}
                    />
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', color: '#475569', fontSize: '11px', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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

                <button
                    type="submit"
                    disabled={loading}
                    className="glass-button"
                    style={{
                        width: '100%',
                    }}
                >
                    {loading ? 'Authenticating...' : 'Sign In as Employee'}
                </button>
            </form>
        </div>
    )
}

export default EmployeeLogin
