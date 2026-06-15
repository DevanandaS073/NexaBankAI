import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import EmployeeLogin from './pages/EmployeeLogin'

function App() {
  return (
    <BrowserRouter>
      <div style={{ 
        position: 'relative',
        minHeight: '100vh',
        fontFamily: 'Inter, system-ui, sans-serif',
        background: 'linear-gradient(135deg, #D6E4F0 0%, #E8EEF5 100%)',
        overflow: 'hidden',
        zIndex: 0
      }}>
        {/* Blurred 3D blobs/spheres in white and light grey */}
        <div className="animate-float-1" style={{ position: 'absolute', top: '10%', left: '15%', width: '320px', height: '320px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.65)', filter: 'blur(80px)', zIndex: -1, pointerEvents: 'none' }} />
        <div className="animate-float-2" style={{ position: 'absolute', top: '50%', right: '10%', width: '420px', height: '420px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.5)', filter: 'blur(80px)', zIndex: -1, pointerEvents: 'none' }} />
        <div className="animate-float-3" style={{ position: 'absolute', bottom: '5%', left: '25%', width: '360px', height: '360px', borderRadius: '50%', background: 'rgba(224, 233, 242, 0.75)', filter: 'blur(80px)', zIndex: -1, pointerEvents: 'none' }} />

        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/employee/login" element={<EmployeeLogin />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App