import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Keep Render backend alive
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const keepAlive = () => {
  fetch(`${BACKEND_URL}/`)
    .catch(() => {}) // silent fail
}

// Ping every 10 minutes
keepAlive()
setInterval(keepAlive, 10 * 60 * 1000)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)