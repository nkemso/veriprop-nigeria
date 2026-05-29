import React, { useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.success) {
        localStorage.setItem('accessToken', data.tokens.accessToken)
        localStorage.setItem('refreshToken', data.tokens.refreshToken)

        // Fetch fresh user profile to get latest role
        let freshUser = data.user
        try {
          const meRes = await fetch(API + '/api/v1/users/me', {
            headers: { Authorization: 'Bearer ' + data.tokens.accessToken }
          })
          const meData = await meRes.json()
          if (meData.success && meData.user) freshUser = meData.user
        } catch {}

        localStorage.setItem('user', JSON.stringify(freshUser))

        // Auto-redirect based on role
        const adminRoles = ['super_admin', 'admin', 'compliance_officer']
        if (adminRoles.includes(freshUser.role)) {
          window.location.href = '/admin/dashboard'
        } else {
          window.location.href = '/dashboard'
        }
      } else {
        setError(data.message || 'Login failed')
      }
    } catch {
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1e3a5f,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', fontFamily:'Inter,sans-serif' }}>
      <div style={{ background:'#fff', borderRadius:'1.5rem', padding:'2.5rem', width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontSize:'2.5rem' }}>🏠</div>
          <h1 style={{ color:'#1e3a5f', fontSize:'1.5rem', fontWeight:800, margin:'0.5rem 0 0.25rem' }}>VeriProp Nigeria</h1>
          <p style={{ color:'#64748b', fontSize:'0.875rem' }}>Sign in to your account</p>
        </div>
        {error && <div style={{ background:'#fee2e2', color:'#991b1b', padding:'0.75rem 1rem', borderRadius:'0.5rem', marginBottom:'1rem', fontSize:'0.875rem' }}>❌ {error}</div>}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom:'1rem' }}>
            <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.5rem', fontSize:'0.875rem' }}>Email Address</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com"
              style={{ width:'100%', padding:'0.875rem 1rem', border:'2px solid #e2e8f0', borderRadius:'0.5rem', fontSize:'1rem', outline:'none', boxSizing:'border-box' }} />
          </div>
          <div style={{ marginBottom:'1.5rem' }}>
            <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.5rem', fontSize:'0.875rem' }}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"
              style={{ width:'100%', padding:'0.875rem 1rem', border:'2px solid #e2e8f0', borderRadius:'0.5rem', fontSize:'1rem', outline:'none', boxSizing:'border-box' }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width:'100%', padding:'0.875rem', background: loading ? '#94a3b8' : '#1d4ed8', color:'#fff', border:'none', borderRadius:'0.75rem', fontWeight:800, fontSize:'1rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>
        <div style={{ textAlign:'center', marginTop:'1.5rem', fontSize:'0.875rem', color:'#64748b' }}>
          Don&apos;t have an account?{' '}
          <a href="/register" style={{ color:'#1d4ed8', fontWeight:700, textDecoration:'none' }}>Register →</a>
        </div>
        <div style={{ textAlign:'center', marginTop:'0.75rem' }}>
          <a href="/" style={{ color:'#94a3b8', fontSize:'0.8rem', textDecoration:'none' }}>← Back to Home</a>
        </div>
      </div>
    </div>
  )
}
