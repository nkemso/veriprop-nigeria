import React, { useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'

const ROLES = [
  { value:'buyer', label:'Property Seeker — Buy or Rent' },
  { value:'seller', label:'Property Owner — Sell your property' },
  { value:'agent', label:'Estate Agent — List & manage properties' },
  { value:'landlord', label:'Landlord — Rent out your property' },
  { value:'developer', label:'Developer — Build & sell developments' },
]

export default function Register() {
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', phone:'', password:'', role:'buyer' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        localStorage.setItem('accessToken', data.tokens.accessToken)
        localStorage.setItem('user', JSON.stringify(data.user))
        setSuccess(true)
        setTimeout(() => window.location.href = '/verify', 2000)
      } else {
        setError(data.errors?.[0]?.msg || data.message || 'Registration failed')
      }
    } catch {
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  if (success) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0fdf4', fontFamily:'Inter,sans-serif' }}>
      <div style={{ textAlign:'center', padding:'2rem' }}>
        <div style={{ fontSize:'4rem' }}>🎉</div>
        <h2 style={{ color:'#166534', fontWeight:800 }}>Account Created!</h2>
        <p style={{ color:'#64748b' }}>Redirecting to verify your identity...</p>
      </div>
    </div>
  )

  const inp = { width:'100%', padding:'0.875rem 1rem', border:'2px solid #e2e8f0', borderRadius:'0.5rem', fontSize:'0.95rem', outline:'none', boxSizing:'border-box' as const }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#1e3a5f,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', fontFamily:'Inter,sans-serif' }}>
      <div style={{ background:'#fff', borderRadius:'1.5rem', padding:'2.5rem', width:'100%', maxWidth:460, boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ fontSize:'2.5rem' }}>🏠</div>
          <h1 style={{ color:'#1e3a5f', fontSize:'1.5rem', fontWeight:800, margin:'0.5rem 0 0.25rem' }}>Create Account</h1>
          <p style={{ color:'#64748b', fontSize:'0.875rem' }}>Join Nigeria&apos;s most trusted property marketplace</p>
        </div>
        {error && <div style={{ background:'#fee2e2', color:'#991b1b', padding:'0.75rem', borderRadius:'0.5rem', marginBottom:'1rem', fontSize:'0.875rem' }}>❌ {error}</div>}
        <form onSubmit={handleRegister}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'0.75rem' }}>
            <div>
              <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.8rem' }}>First Name</label>
              <input value={form.firstName} onChange={set('firstName')} required placeholder="Chidi" style={inp} />
            </div>
            <div>
              <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.8rem' }}>Last Name</label>
              <input value={form.lastName} onChange={set('lastName')} required placeholder="Okonkwo" style={inp} />
            </div>
          </div>
          <div style={{ marginBottom:'0.75rem' }}>
            <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.8rem' }}>Email</label>
            <input type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" style={inp} />
          </div>
          <div style={{ marginBottom:'0.75rem' }}>
            <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.8rem' }}>Phone (Nigerian)</label>
            <input value={form.phone} onChange={set('phone')} required placeholder="08012345678" style={inp} />
          </div>
          <div style={{ marginBottom:'0.75rem' }}>
            <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.8rem' }}>Role</label>
            <select value={form.role} onChange={set('role')} style={{ ...inp, background:'#fff' }}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:'1.5rem' }}>
            <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.8rem' }}>Password</label>
            <input type="password" value={form.password} onChange={set('password')} required placeholder="Min 8 chars, upper+lower+number" style={inp} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width:'100%', padding:'0.875rem', background: loading ? '#94a3b8' : '#1d4ed8', color:'#fff', border:'none', borderRadius:'0.75rem', fontWeight:800, fontSize:'1rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>
        <div style={{ textAlign:'center', margin:'1.25rem 0 0.75rem', color:'#94a3b8', fontSize:'0.8rem' }}>— or —</div>

        <a href="https://t.me/VeriPropNigeriaBot?start=register"
          style={{ display:'block', width:'100%', padding:'0.75rem', background:'#0088cc', color:'#fff', border:'none', borderRadius:'0.75rem', fontWeight:700, fontSize:'0.9rem', textDecoration:'none', textAlign:'center', boxSizing:'border-box' }}>
          ✈️ Register via Telegram
        </a>

        <div style={{ textAlign:'center', marginTop:'1.25rem', fontSize:'0.875rem', color:'#64748b' }}>
          Already have an account?{' '}
          <a href="/login" style={{ color:'#1d4ed8', fontWeight:700, textDecoration:'none' }}>Sign In →</a>
        </div>
        <div style={{ textAlign:'center', marginTop:'0.75rem' }}>
          <a href="/" style={{ color:'#94a3b8', fontSize:'0.8rem', textDecoration:'none' }}>← Back to Home</a>
        </div>
      </div>
    </div>
  )
}
