import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

function Navbar() {
    const location = useLocation()
    const navigate = useNavigate()
    const [user, setUser] = useState(null)

    const fetchUser = () => {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
            setUser(JSON.parse(storedUser))
        } else {
            setUser(null)
        }
    }

    useEffect(() => {
        fetchUser()
        
        // Listen to custom authChange event
        window.addEventListener('authChange', fetchUser)
        return () => {
            window.removeEventListener('authChange', fetchUser)
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
        navigate('/')
    }

    const linkStyle = (path) => ({
        color: location.pathname === path ? '#4f46e5' : '#475569',
        textDecoration: 'none',
        fontWeight: location.pathname === path ? '700' : '500',
        fontSize: '11px',
        padding: '8px 16px',
        borderRadius: '50px',
        backgroundColor: location.pathname === path ? 'rgba(255, 255, 255, 0.55)' : 'transparent',
        border: location.pathname === path ? '1px solid rgba(255, 255, 255, 0.65)' : '1px solid transparent',
        transition: 'all 0.2s',
        textTransform: 'uppercase',
        letterSpacing: '0.08em'
    })

    const getRoleEmoji = (userProfile) => {
        if (userProfile.role === 'admin') return '👑'
        if (userProfile.role === 'staff') {
            switch(userProfile.department) {
                case 'billing': return '💸'
                case 'sales': return '📈'
                case 'account_support': return '🔐'
                case 'security': return '🚨'
                case 'cards': return '💳'
                case 'general_support': return '💼'
                default: return '💼'
            }
        }
        return '👤'
    }

    const getRoleLabel = (userProfile) => {
        if (userProfile.role === 'admin') return 'Super Agent (Admin)'
        if (userProfile.role === 'staff') return `${userProfile.department.replace('_', ' ')} Agent`
        return 'Customer'
    }

    return (
        <nav className="glass-card" style={{
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderRadius: '0',
            padding: '0 24px',
            height: '65px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 10,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>🏦</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#1e293b', fontWeight: '800', fontSize: '15px', letterSpacing: '0.5px', lineHeight: '1.2' }}>
                        NexaBank
                    </span>
                    <span style={{ color: '#64748b', fontSize: '10px', fontWeight: '600', letterSpacing: '0.02em' }}>
                        Securing Trust, Guarding Loyalty
                    </span>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {user && user.role === 'admin' && (
                    <Link to="/" style={linkStyle('/')}>Classifier</Link>
                )}
                {user && (
                    <Link to="/dashboard" style={linkStyle('/dashboard')}>Dashboard</Link>
                )}

                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: '12px' }}>
                        <div className="glass-card" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 12px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.65)'
                        }}>
                            <span style={{ fontSize: '14px' }}>
                                {getRoleEmoji(user)}
                            </span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <span style={{ color: '#1e293b', fontSize: '12px', fontWeight: '600' }}>
                                    {user.full_name}
                                </span>
                                <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'capitalize', fontWeight: '500' }}>
                                    {getRoleLabel(user)}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="glass-button-secondary"
                            style={{
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                padding: '6px 14px',
                                fontSize: '11px',
                                fontWeight: '700',
                            }}
                        >
                            Log Out
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '12px', alignItems: 'center' }}>
                        <Link to="/login" style={linkStyle('/login')}>Customer Login</Link>
                        <Link to="/employee/login" style={linkStyle('/employee/login')}>Employee Portal</Link>
                        <Link to="/register" className="glass-button" style={{
                            fontSize: '11px',
                            padding: '8px 18px',
                            textDecoration: 'none',
                            marginLeft: '8px'
                        }}>Register</Link>
                    </div>
                )}
            </div>
        </nav>
    )
}

export default Navbar