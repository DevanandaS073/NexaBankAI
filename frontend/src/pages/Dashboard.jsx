import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import CategoryBadge from '../components/CategoryBadge'
import ConfidenceBar from '../components/ConfidenceBar'
import StatusBadge from '../components/StatusBadge'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const sampleData = [
    { name: 'Lost/Stolen Card', value: 18, color: '#f87171' }, // soft red
    { name: 'Card Payment', value: 22, color: '#fb923c' },    // soft orange
    { name: 'Transfer', value: 15, color: '#4ade80' },        // soft green
    { name: 'Account Access', value: 12, color: '#818cf8' },   // soft indigo
    { name: 'Balance', value: 10, color: '#facc15' },        // soft yellow
    { name: 'Refund', value: 8, color: '#f472b6' },         // soft pink
    { name: 'Loan', value: 8, color: '#2dd4bf' },           // soft teal
    { name: 'Other', value: 7, color: '#a78bfa' },          // soft purple
]

const modelData = [
    { name: 'Logistic Reg', accuracy: 87.24, f1: 87.23 },
    { name: 'Naive Bayes', accuracy: 83.47, f1: 83.26 },
    { name: 'LinearSVC', accuracy: 87.14, f1: 87.11 },
    { name: 'Random Forest', accuracy: 84.68, f1: 84.67 },
]

const statCards = [
    { label: 'Model Accuracy', value: '87.24%', color: '#16a34a' },
    { label: 'F1 Score', value: '87.23%', color: '#4f46e5' },
    { label: 'Total Categories', value: '77', color: '#ea580c' },
    { label: 'Training Samples', value: '10,003', color: '#db2777' },
]

function Dashboard() {
    const navigate = useNavigate()
    const [user, setUser] = useState(null)
    
    // Sub-view selectors
    const [activeSubView, setActiveSubView] = useState('tickets') // admin: tickets, provision, analytics; others: tickets
    
    // Data list state
    const [tickets, setTickets] = useState([])
    const [loadingTickets, setLoadingTickets] = useState(false)
    const [error, setError] = useState(null)
    
    // Customer submit ticket state
    const [newTicketText, setNewTicketText] = useState('')
    const [submittingTicket, setSubmittingTicket] = useState(false)
    
    // Support Staff tab state
    const [employeeTab, setEmployeeTab] = useState('pending') // pending, claimed, resolved
    
    // Support Agent actions state
    const [actionLoading, setActionLoading] = useState({})
    const [replyText, setReplyText] = useState({})
    const [reassignDept, setReassignDept] = useState({})

    // Super Agent provisioning state
    const [provName, setProvName] = useState('')
    const [provEmail, setProvEmail] = useState('')
    const [provPassword, setProvPassword] = useState('')
    const [provDept, setProvDept] = useState('cards')
    const [provLoading, setProvLoading] = useState(false)
    const [provSuccess, setProvSuccess] = useState(false)
    const [provError, setProvError] = useState(null)

    useEffect(() => {
        const token = localStorage.getItem('token')
        const storedUser = localStorage.getItem('user')
        
        if (!token || !storedUser) {
            navigate('/login')
            return
        }
        
        setUser(JSON.parse(storedUser))
    }, [navigate])

    const fetchTickets = async () => {
        if (!user) return
        setLoadingTickets(true)
        setError(null)
        try {
            const token = localStorage.getItem('token')
            const headers = { Authorization: `Bearer ${token}` }
            
            if (user.role === 'customer') {
                const res = await axios.get(`${API_URL}/tickets/my`, { headers })
                setTickets(res.data)
            } else if (user.role === 'staff') {
                const res = await axios.get(`${API_URL}/tickets/department`, { headers })
                setTickets(res.data)
            } else if (user.role === 'admin') {
                // Fetch ALL system tickets
                const res = await axios.get(`${API_URL}/tickets`, { headers })
                setTickets(res.data)
            }
        } catch (err) {
            console.error(err)
            setError('Failed to fetch tickets. Please check your network connection.')
        } finally {
            setLoadingTickets(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchTickets()
        }
    }, [user])

    const handleCreateTicket = async (e) => {
        e.preventDefault()
        if (!newTicketText.trim()) return
        
        setSubmittingTicket(true)
        setError(null)
        
        try {
            const token = localStorage.getItem('token')
            const res = await axios.post(
                `${API_URL}/tickets`,
                { text: newTicketText },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setTickets(prev => [res.data, ...prev])
            setNewTicketText('')
        } catch (err) {
            console.error(err)
            setError('Could not submit ticket. Please check backend connection.')
        } finally {
            setSubmittingTicket(false)
        }
    }

    const handleClaimTicket = async (ticketId) => {
        setActionLoading(prev => ({ ...prev, [ticketId]: true }))
        try {
            const token = localStorage.getItem('token')
            const res = await axios.post(
                `${API_URL}/tickets/${ticketId}/claim`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setTickets(prev => prev.map(t => t.id === ticketId ? res.data : t))
            setEmployeeTab('claimed')
        } catch (err) {
            console.error(err)
            alert('Failed to claim ticket.')
        } finally {
            setActionLoading(prev => ({ ...prev, [ticketId]: false }))
        }
    }

    const handleRespondTicket = async (ticketId) => {
        const responseText = replyText[ticketId]
        if (!responseText || !responseText.trim()) return

        setActionLoading(prev => ({ ...prev, [ticketId]: true }))
        try {
            const token = localStorage.getItem('token')
            const res = await axios.post(
                `${API_URL}/tickets/${ticketId}/respond`,
                { response: responseText },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setTickets(prev => prev.map(t => t.id === ticketId ? res.data : t))
            setReplyText(prev => ({ ...prev, [ticketId]: '' }))
            setEmployeeTab('resolved')
        } catch (err) {
            console.error(err)
            alert('Failed to send response.')
        } finally {
            setActionLoading(prev => ({ ...prev, [ticketId]: false }))
        }
    }

    const handleReassignTicket = async (ticketId) => {
        const targetDept = reassignDept[ticketId]
        if (!targetDept) return

        setActionLoading(prev => ({ ...prev, [ticketId]: true }))
        try {
            const token = localStorage.getItem('token')
            await axios.post(
                `${API_URL}/tickets/${ticketId}/reassign`,
                { department: targetDept },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setTickets(prev => prev.filter(t => t.id !== ticketId))
            setReassignDept(prev => ({ ...prev, [ticketId]: '' }))
        } catch (err) {
            console.error(err)
            alert('Failed to reassign ticket.')
        } finally {
            setActionLoading(prev => ({ ...prev, [ticketId]: false }))
        }
    }

    const handleProvisionAgent = async (e) => {
        e.preventDefault()
        if (!provName.trim() || !provEmail.trim() || !provPassword.trim()) return

        setProvLoading(true)
        setProvError(null)
        setProvSuccess(false)

        try {
            const token = localStorage.getItem('token')
            await axios.post(
                `${API_URL}/auth/agents`,
                {
                    full_name: provName,
                    email: provEmail,
                    password: provPassword,
                    role: 'staff',
                    department: provDept,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setProvSuccess(true)
            setProvName('')
            setProvEmail('')
            setProvPassword('')
        } catch (err) {
            console.error(err)
            if (err.response && err.response.data && err.response.data.detail) {
                setProvError(err.response.data.detail)
            } else {
                setProvError('Failed to provision agent. Verify credentials and permissions.')
            }
        } finally {
            setProvLoading(false)
        }
    }

    const formatDeptName = (dept) => {
        if (!dept) return 'N/A'
        return dept.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }

    if (!user) {
        return (
            <div style={{ color: 'var(--text-main)', textAlign: 'center', padding: '100px' }}>
                <h3>Loading workspace details...</h3>
            </div>
        )
    }

    // Filter tickets for employee view tabs
    const filteredEmployeeTickets = tickets.filter(t => {
        if (employeeTab === 'pending') return t.status === 'pending'
        if (employeeTab === 'claimed') return t.status === 'claimed' && t.claimed_by_id === user.id
        if (employeeTab === 'resolved') return t.status === 'resolved'
        return true
    })

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid rgba(255, 255, 255, 0.45)', paddingBottom: '16px' }}>
                <div>
                    <h1 style={{ color: 'var(--text-main)', fontSize: '28px', fontWeight: '800', margin: 0 }}>
                        {user.role === 'admin' 
                            ? 'Super Agent Console' 
                            : user.role === 'staff' 
                                ? `${formatDeptName(user.department)} Department Workspace` 
                                : 'Customer Portal'}
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '6px 0 0' }}>
                        {user.role === 'admin'
                            ? 'Administer support agents, review overall system tickets, and audit ML classification metrics.'
                            : user.role === 'staff'
                                ? `Manage tickets routed to the ${formatDeptName(user.department)} team.`
                                : 'Submit help requests. Our AI routes queries to the correct department instantly.'
                        }
                    </p>
                </div>
                
                {/* Admin Sub-View Selector Toggle */}
                {user.role === 'admin' && (
                    <div className="glass-card" style={{ display: 'flex', border: '1px solid rgba(255, 255, 255, 0.45)', borderRadius: '50px', padding: '4px' }}>
                        <button
                            onClick={() => setActiveSubView('tickets')}
                            style={{
                                backgroundColor: activeSubView === 'tickets' ? '#ffffff' : 'transparent',
                                color: activeSubView === 'tickets' ? 'var(--text-main)' : 'var(--text-muted)',
                                border: 'none',
                                padding: '8px 20px',
                                borderRadius: '50px',
                                fontSize: '12px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            🎫 Global Tickets
                        </button>
                        <button
                            onClick={() => setActiveSubView('provision')}
                            style={{
                                backgroundColor: activeSubView === 'provision' ? '#ffffff' : 'transparent',
                                color: activeSubView === 'provision' ? 'var(--text-main)' : 'var(--text-muted)',
                                border: 'none',
                                padding: '8px 20px',
                                borderRadius: '50px',
                                fontSize: '12px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            👤 Create Support Agent
                        </button>
                        <button
                            onClick={() => setActiveSubView('analytics')}
                            style={{
                                backgroundColor: activeSubView === 'analytics' ? '#ffffff' : 'transparent',
                                color: activeSubView === 'analytics' ? 'var(--text-main)' : 'var(--text-muted)',
                                border: 'none',
                                padding: '8px 20px',
                                borderRadius: '50px',
                                fontSize: '12px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            📊 System Analytics
                        </button>
                    </div>
                )}
            </div>

            {/* Error Message banner */}
            {error && (
                <div className="glass-card" style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '12px',
                    padding: '16px',
                    color: '#dc2626',
                    fontSize: '13px',
                    marginBottom: '24px',
                    fontWeight: '500',
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Sub-View: Tickets Queue (Customer / Agent / Admin-Global) */}
            {activeSubView === 'tickets' && (
                <div>
                    {/* CUSTOMER TICKET SUBMISSION AND HISTORY */}
                    {user.role === 'customer' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                            {/* Submit Ticket Form */}
                            <div className="glass-card" style={{
                                padding: '24px',
                            }}>
                                <h3 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '700', margin: '0 0 16px' }}>
                                    Submit Support Request
                                </h3>
                                <form onSubmit={handleCreateTicket}>
                                    <textarea
                                        value={newTicketText}
                                        onChange={e => setNewTicketText(e.target.value)}
                                        placeholder="Explain your problem. The NexaBank classifier routes this automatically to the correct division."
                                        rows={4}
                                        required
                                        className="glass-input"
                                        style={{
                                            width: '100%',
                                            resize: 'vertical',
                                            marginBottom: '16px',
                                        }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            type="submit"
                                            disabled={submittingTicket || !newTicketText.trim()}
                                            className="glass-button"
                                        >
                                            {submittingTicket ? 'Submitting...' : 'Submit Support Request'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Customer Ticket History list */}
                            <div>
                                <h3 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '700', margin: '0 0 16px' }}>
                                    Your Support Tickets
                                </h3>
                                {loadingTickets ? (
                                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading...</div>
                                ) : tickets.length === 0 ? (
                                    <div className="glass-card" style={{
                                        borderStyle: 'dashed',
                                        padding: '40px',
                                        textAlign: 'center',
                                        color: 'var(--text-muted)'
                                    }}>
                                        You have no support history.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {tickets.map(t => (
                                            <div key={t.id} className="glass-card" style={{
                                                padding: '24px',
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                                                    <div>
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>TICKET ID #{t.id}</span>
                                                        <p style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: '500', margin: 0, whiteSpace: 'pre-wrap' }}>
                                                            {t.text}
                                                        </p>
                                                    </div>
                                                    <StatusBadge status={t.status} />
                                                </div>
                                                
                                                <div className="glass-card" style={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    alignItems: 'center',
                                                    gap: '16px',
                                                    backgroundColor: 'rgba(255, 255, 255, 0.35)',
                                                    padding: '12px 16px',
                                                    borderRadius: '12px',
                                                    border: '1px solid rgba(255, 255, 255, 0.5)',
                                                    marginBottom: t.status === 'resolved' ? '16px' : '0'
                                                }}>
                                                    <div>
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Routed Division</span>
                                                        <span style={{ color: '#4f46e5', fontWeight: '700', fontSize: '13px', textTransform: 'capitalize' }}>
                                                            {t.assigned_department.replace('_', ' ')} Team
                                                        </span>
                                                    </div>
                                                </div>

                                                {t.status === 'resolved' && (
                                                    <div className="glass-card" style={{
                                                        backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                                        border: '1px solid rgba(16, 185, 129, 0.35)',
                                                        borderRadius: '12px',
                                                        padding: '16px',
                                                    }}>
                                                        <span style={{ color: '#059669', fontSize: '11px', fontWeight: '700', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                                                            Agent Reply
                                                        </span>
                                                        <p style={{ color: '#065f46', fontSize: '14px', margin: 0, whiteSpace: 'pre-wrap' }}>
                                                            {t.response}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SUPPORT STAFF WORKSPACE */}
                    {user.role === 'staff' && (
                        <div>
                            {/* Stats Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                                <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
                                    <p style={{ color: '#d97706', fontSize: '11px', fontWeight: '700', margin: '0 0 4px', textTransform: 'uppercase' }}>Pending</p>
                                    <p style={{ color: 'var(--text-main)', fontSize: '24px', fontWeight: '800', margin: 0 }}>
                                        {tickets.filter(t => t.status === 'pending').length}
                                    </p>
                                </div>
                                <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
                                    <p style={{ color: '#2563eb', fontSize: '11px', fontWeight: '700', margin: '0 0 4px', textTransform: 'uppercase' }}>My Claimed</p>
                                    <p style={{ color: 'var(--text-main)', fontSize: '24px', fontWeight: '800', margin: 0 }}>
                                        {tickets.filter(t => t.status === 'claimed' && t.claimed_by_id === user.id).length}
                                    </p>
                                </div>
                                <div className="glass-card" style={{ padding: '16px', textAlign: 'center' }}>
                                    <p style={{ color: '#059669', fontSize: '11px', fontWeight: '700', margin: '0 0 4px', textTransform: 'uppercase' }}>Resolved</p>
                                    <p style={{ color: 'var(--text-main)', fontSize: '24px', fontWeight: '800', margin: 0 }}>
                                        {tickets.filter(t => t.status === 'resolved').length}
                                    </p>
                                </div>
                            </div>

                            {/* Tab selector */}
                            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.45)', marginBottom: '20px', gap: '24px' }}>
                                {[
                                    { id: 'pending', label: 'Unassigned Pending Queue' },
                                    { id: 'claimed', label: 'My Claimed Tickets' },
                                    { id: 'resolved', label: 'Resolved Archive' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setEmployeeTab(tab.id)}
                                        style={{
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            borderBottom: employeeTab === tab.id ? '2px solid #4f46e5' : '2px solid transparent',
                                            color: employeeTab === tab.id ? 'var(--text-main)' : 'var(--text-muted)',
                                            padding: '12px 4px',
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Ticket Items */}
                            {loadingTickets ? (
                                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading department queue...</div>
                            ) : filteredEmployeeTickets.length === 0 ? (
                                <div className="glass-card" style={{
                                    borderStyle: 'dashed',
                                    padding: '50px',
                                    textAlign: 'center',
                                    color: 'var(--text-muted)',
                                }}>
                                    No tickets in this workspace tab.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {filteredEmployeeTickets.map(t => (
                                        <div key={t.id} className="glass-card" style={{
                                            padding: '24px',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                                                <div>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                                                        SUBMITTED BY: {t.customer?.full_name || 'Customer'} {t.customer?.account_number ? `(Acct: ${t.customer.account_number})` : ''} • TICKET ID #{t.id}
                                                    </span>
                                                    <p style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: '500', margin: 0, whiteSpace: 'pre-wrap' }}>
                                                        {t.text}
                                                    </p>
                                                </div>
                                                <StatusBadge status={t.status} />
                                            </div>

                                            <div className="glass-card" style={{
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                alignItems: 'center',
                                                gap: '24px',
                                                backgroundColor: 'rgba(255, 255, 255, 0.35)',
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255, 255, 255, 0.5)',
                                                marginBottom: '20px'
                                            }}>
                                                <div>
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginBottom: '2px' }}>Assigned Team</span>
                                                    <span style={{ color: '#4f46e5', fontWeight: '700', fontSize: '13px', textTransform: 'capitalize' }}>
                                                        {t.assigned_department.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Action panels */}
                                            {t.status === 'pending' && (
                                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => handleClaimTicket(t.id)}
                                                        disabled={actionLoading[t.id]}
                                                        className="glass-button"
                                                        style={{ padding: '8px 20px !important' }}
                                                    >
                                                        {actionLoading[t.id] ? 'Claiming...' : 'Claim Ticket'}
                                                    </button>
                                                </div>
                                            )}

                                            {t.status === 'claimed' && (
                                                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.45)', paddingTop: '20px', marginTop: '16px' }}>
                                                    <div style={{ marginBottom: '16px' }}>
                                                        <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '12px', fontWeight: '600', marginBottom: '8px' }}>
                                                            Resolution Reply
                                                        </label>
                                                        <textarea
                                                            value={replyText[t.id] || ''}
                                                            onChange={e => setReplyText(prev => ({ ...prev, [t.id]: e.target.value }))}
                                                            placeholder="Enter reply for resolution..."
                                                            rows={3}
                                                            className="glass-input"
                                                            style={{
                                                                width: '100%',
                                                                resize: 'vertical',
                                                            }}
                                                        />
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <select
                                                                value={reassignDept[t.id] || ''}
                                                                onChange={e => setReassignDept(prev => ({ ...prev, [t.id]: e.target.value }))}
                                                                className="glass-input"
                                                                style={{
                                                                    padding: '8px 12px !important',
                                                                    cursor: 'pointer',
                                                                    width: 'auto',
                                                                    height: 'auto',
                                                                }}
                                                            >
                                                                <option value="">-- Reassign Team --</option>
                                                                <option value="billing">💸 Billing & Refunds</option>
                                                                <option value="sales">📈 Sales & Product Inquiry</option>
                                                                <option value="account_support">🔐 Account Support</option>
                                                                <option value="security">🚨 Security & Fraud</option>
                                                                <option value="cards">💳 Cards & ATM Support</option>
                                                            </select>
                                                            <button
                                                                onClick={() => handleReassignTicket(t.id)}
                                                                disabled={!reassignDept[t.id] || actionLoading[t.id]}
                                                                className="glass-button-secondary"
                                                                style={{
                                                                    padding: '8px 16px !important',
                                                                    fontSize: '11px !important',
                                                                }}
                                                            >
                                                                Reassign
                                                            </button>
                                                        </div>

                                                        <button
                                                            onClick={() => handleRespondTicket(t.id)}
                                                            disabled={!replyText[t.id]?.trim() || actionLoading[t.id]}
                                                            className="glass-button"
                                                            style={{
                                                                padding: '8px 24px !important',
                                                                fontSize: '11px !important',
                                                                border: '1px solid rgba(34, 197, 94, 0.4) !important',
                                                            }}
                                                        >
                                                            {actionLoading[t.id] ? 'Resolving...' : 'Send Reply & Resolve'}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {t.status === 'resolved' && (
                                                <div className="glass-card" style={{
                                                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                                    border: '1px solid rgba(16, 185, 129, 0.35)',
                                                    borderRadius: '12px',
                                                    padding: '16px',
                                                }}>
                                                    <span style={{ color: '#059669', fontSize: '11px', fontWeight: '700', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>
                                                        Agent Response
                                                    </span>
                                                    <p style={{ color: '#065f46', fontSize: '14px', margin: 0, whiteSpace: 'pre-wrap' }}>
                                                        {t.response}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* SUPER AGENT (ADMIN) GLOBAL TICKETS MONITOR */}
                    {user.role === 'admin' && (
                        <div>
                            <h3 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '700', margin: '0 0 16px' }}>
                                Global Tickets Monitor
                            </h3>
                            {loadingTickets ? (
                                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading...</div>
                            ) : tickets.length === 0 ? (
                                <div className="glass-card" style={{
                                    borderStyle: 'dashed',
                                    padding: '40px',
                                    textAlign: 'center',
                                    color: 'var(--text-muted)'
                                }}>
                                    No tickets in the database.
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {tickets.map(t => (
                                        <div key={t.id} className="glass-card" style={{
                                            padding: '20px',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                                                    TICKET #{t.id} • BY: {t.customer?.full_name} ({t.customer?.email})
                                                </span>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <StatusBadge status={t.status} />
                                                    <span className="glass-card" style={{
                                                        fontSize: '10px',
                                                        color: '#4f46e5',
                                                        padding: '3px 8px',
                                                        borderRadius: '50px',
                                                        textTransform: 'uppercase',
                                                        fontWeight: '700',
                                                        letterSpacing: '0.05em'
                                                    }}>{t.assigned_department}</span>
                                                </div>
                                            </div>
                                            <p style={{ color: 'var(--text-main)', fontSize: '14px', margin: '0 0 12px' }}>{t.text}</p>
                                            <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.35)', padding: '8px 12px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.5)' }}>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                                                    AI Intent: <strong style={{ color: '#4f46e5' }}>{t.predicted_category}</strong> ({t.confidence}%)
                                                </span>
                                                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                                                    Claimed By: <strong style={{ color: '#2563eb' }}>{t.claimed_by?.full_name || 'Unassigned'}</strong>
                                                </span>
                                            </div>
                                            {t.status === 'resolved' && (
                                                <div className="glass-card" style={{ marginTop: '12px', backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '10px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
                                                    <span style={{ color: '#059669', fontSize: '10px', fontWeight: '700', display: 'block', textTransform: 'uppercase' }}>REPLY:</span>
                                                    <p style={{ color: '#065f46', fontSize: '13px', margin: 0 }}>{t.response}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Sub-View: Super Agent Provisioning */}
            {activeSubView === 'provision' && user.role === 'admin' && (
                <div style={{ maxWidth: '500px', margin: '20px auto' }}>
                    <form onSubmit={handleProvisionAgent} className="glass-card" style={{
                        padding: '32px',
                    }}>
                        <h3 style={{ color: 'var(--text-main)', fontSize: '18px', fontWeight: '700', margin: '0 0 8px', textAlign: 'center' }}>
                            Provision Support Agent
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center', marginBottom: '24px' }}>
                            Securely register a new employee and allocate them to a support department.
                        </p>

                        {provSuccess && (
                            <div className="glass-card" style={{
                                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                                border: '1px solid rgba(16, 185, 129, 0.35)',
                                color: '#059669',
                                padding: '12px',
                                borderRadius: '12px',
                                fontSize: '13px',
                                marginBottom: '20px',
                                fontWeight: '500',
                            }}>
                                Success! Support agent created successfully.
                            </div>
                        )}

                        {provError && (
                            <div className="glass-card" style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                color: '#dc2626',
                                padding: '12px',
                                borderRadius: '12px',
                                fontSize: '13px',
                                marginBottom: '20px',
                                fontWeight: '500',
                            }}>
                                ⚠️ {provError}
                            </div>
                        )}

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={provName}
                                onChange={e => setProvName(e.target.value)}
                                placeholder="Agent Full Name"
                                required
                                className="glass-input"
                                style={{ width: '100%', height: 'auto' }}
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={provEmail}
                                onChange={e => setProvEmail(e.target.value)}
                                placeholder="agent@nexabank.com"
                                required
                                className="glass-input"
                                style={{ width: '100%', height: 'auto' }}
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Secure Password
                            </label>
                            <input
                                type="password"
                                value={provPassword}
                                onChange={e => setProvPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="glass-input"
                                style={{ width: '100%', height: 'auto' }}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Department
                            </label>
                            <select
                                value={provDept}
                                onChange={e => setProvDept(e.target.value)}
                                className="glass-input"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    cursor: 'pointer',
                                }}
                            >
                                <option value="billing">💸 Billing & Refunds</option>
                                <option value="sales">📈 Sales & Product Inquiry</option>
                                <option value="account_support">🔐 Account Support</option>
                                <option value="security">🚨 Security & Fraud</option>
                                <option value="cards">💳 Cards & ATM Support</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={provLoading}
                            className="glass-button"
                            style={{ width: '100%' }}
                        >
                            {provLoading ? 'Creating Agent...' : 'Provision Agent'}
                        </button>
                    </form>
                </div>
            )}

            {/* Sub-View: Super Agent Analytics */}
            {activeSubView === 'analytics' && user.role === 'admin' && (
                <div>
                    {/* Stat cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                        {statCards.map(card => (
                            <div key={card.label} className="glass-card" style={{
                                padding: '20px',
                            }}>
                                <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>
                                    {card.label}
                                </p>
                                <p style={{ color: card.color, fontSize: '28px', fontWeight: '800', margin: 0 }}>
                                    {card.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Charts row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                        {/* Pie chart */}
                        <div className="glass-card" style={{
                            padding: '24px',
                        }}>
                            <h3 style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: '700', margin: '0 0 20px' }}>
                                Category Distribution
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie data={sampleData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                                        {sampleData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', border: '1px solid rgba(255, 255, 255, 0.65)', borderRadius: '12px', color: '#334155', backdropFilter: 'blur(8px)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px', justifyContent: 'center' }}>
                                {sampleData.map(d => (
                                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: d.color }} />
                                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '500' }}>{d.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bar chart */}
                        <div className="glass-card" style={{
                            padding: '24px',
                        }}>
                            <h3 style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: '700', margin: '0 0 20px' }}>
                                Model Comparison
                            </h3>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={modelData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                    <YAxis domain={[75, 92]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', border: '1px solid rgba(255, 255, 255, 0.65)', borderRadius: '12px', color: '#334155', backdropFilter: 'blur(8px)' }}
                                    />
                                    <Bar dataKey="accuracy" fill="#818cf8" name="Accuracy %" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="f1" fill="#4ade80" name="F1 Score %" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Dataset info */}
                    <div className="glass-card" style={{
                        padding: '24px',
                    }}>
                        <h3 style={{ color: 'var(--text-main)', fontSize: '15px', fontWeight: '700', margin: '0 0 16px' }}>
                            Dataset Information
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            {[
                                { label: 'Dataset', value: 'BANKING77' },
                                { label: 'Source', value: 'HuggingFace' },
                                { label: 'Train Samples', value: '10,003' },
                                { label: 'Test Samples', value: '3,080' },
                                { label: 'Categories', value: '77 intents' },
                                { label: 'Best Model', value: 'Logistic Regression' },
                            ].map(item => (
                                <div key={item.label}>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '11px', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>{item.label}</p>
                                    <p style={{ color: 'var(--text-main)', fontSize: '14px', fontWeight: '700', margin: 0 }}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Dashboard