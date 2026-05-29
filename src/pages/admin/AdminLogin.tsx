import React, { useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'
const ADMIN_ROLES = ['super_admin', 'admin', 'compliance_officer']

export default function AdminLogin() {
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
        // Save tokens first
        localStorage.setItem('accessToken', data.tokens.accessToken)
        localStorage.setItem('refreshToken', data.tokens.refreshToken)

        // Fetch fresh user profile from /me to get latest role
        try {
          const meRes = await fetch(\`\${API}/api/v1/users/me\`, {
            headers: { Authorization: \`Bearer \${data.tokens.accessToken}\` }
          })
          const meData = await meRes.json()
          if (meData.success && meData.user) {
            const freshUser = meData.user
            localStorage.setItem('user', JSON.stringify(freshUser))

            if (!ADMIN_ROLES.includes(freshUser.role)) {
              setError(\`Access denied. Your role is "\${freshUser.role}". Admin credentials required.\`)
              localStorage.clear()
              setLoading(false)
              return
            }

            window.location.href = '/admin/dashboard'
            return
          }
        } catch (e) {
          // Fallback to login response data
        }

        // Fallback: use login response
        if (!ADMIN_ROLES.includes(data.user.role)) {
          setError('Access denied. Admin credentials required.')
          localStorage.clear()
          setLoading(false)
          return
        }
        localStorage.setItem('user', JSON.stringify(data.user))
        window.location.href = '/admin/dashboard'
      } else {
        setError(data.message || 'Invalid credentials')
      }
    } catch {
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    background: '#0d1117', border: '1px solid #30363d',
    borderRadius: '0.5rem', color: '#f0f6fc',
    fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif', padding: '1rem' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 20% 50%, rgba(29,78,216,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(239,68,68,0.1) 0%, transparent 50%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🛡️</div>
          <h1 style={{ color: '#f0f6fc', fontWeight: 900, fontSize: '1.5rem', margin: '0 0 0.25rem' }}>VeriProp Admin</h1>
          <p style={{ color: '#8b949e', fontSize: '0.875rem', margin: 0 }}>Secure Administrative Portal</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.3rem 0.875rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, marginTop: '0.75rem', letterSpacing: '0.05em' }}>
            🔒 RESTRICTED ACCESS
          </div>
        </div>

        <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '1rem', padding: '2rem' }}>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              ⛔ {error}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#8b949e', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@veripronigeria.com" style={inp} />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#8b949e', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••••••" style={inp} />
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '0.875rem', background: loading ? '#21262d' : '#1d4ed8', color: loading ? '#8b949e' : '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 800, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Authenticating...' : '🔐 Access Admin Portal'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#0d1117', borderRadius: '0.5rem', border: '1px solid #21262d' }}>
            <p style={{ color: '#6e7681', fontSize: '0.75rem', margin: 0, textAlign: 'center', lineHeight: 1.6 }}>
              This portal is restricted to authorized VeriProp staff.<br />
              Unauthorized access is logged and reported to the EFCC.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Super Admin', 'Admin', 'Compliance Officer'].map(r => (
            <span key={r} style={{ background: 'rgba(255,255,255,0.05)', color: '#6e7681', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem' }}>{r}</span>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <a href="/" style={{ color: '#6e7681', fontSize: '0.8rem', textDecoration: 'none' }}>← Back to Public Site</a>
        </div>
      </div>
    </div>
  )
}
