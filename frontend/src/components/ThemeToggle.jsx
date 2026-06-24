import { useState, useEffect } from 'react'

function ThemeToggle() {
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'light'
    })

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('theme', theme)
    }, [theme])

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
    }

    return (
        <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="glass-card"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                border: '1px solid var(--glass-border)',
                backgroundColor: 'var(--glass-bg)',
                color: 'var(--text-main)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                padding: '0',
                outline: 'none',
                boxShadow: 'var(--glass-shadow)'
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.1) rotate(15deg)'
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.45)'
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
                e.currentTarget.style.borderColor = 'var(--glass-border)'
            }}
        >
            <span style={{ 
                fontSize: '16px', 
                lineHeight: '1',
                display: 'inline-block',
                transition: 'transform 0.5s ease'
            }}>
                {theme === 'light' ? '🌙' : '☀️'}
            </span>
        </button>
    )
}

export default ThemeToggle
