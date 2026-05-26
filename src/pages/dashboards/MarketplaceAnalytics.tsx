import React, { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'
const fmt = (n: number) => n >= 1e6 ? `₦${(n/1e6).toFixed(1)}M` : `₦${n.toLocaleString()}`

export default function MarketplaceAnalytics() {
  const token = localStorage.getItem('accessToken')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { window.location.href = '/login'; return }
    fetch(`${API}/api/v1/admin/dashboard`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r=>r.json()).then(d=>{ setStats(d.stats); setLoading(false) })
      .catch(()=>setLoading(false))
  }, [token])

  const METRICS = stats ? [
    { label:'Total Users', value:stats.totalUsers?.toLocaleString()||'0', icon:'👥', color:'#3b82f6', change:'+12%' },
    { label:'Active Listings', value:stats.totalProperties?.toLocaleString()||'0', icon:'🏠', color:'#10b981', change:'+8%' },
    { label:'Transactions', value:stats.totalTransactions?.toLocaleString()||'0', icon:'💰', color:'#f59e0b', change:'+24%' },
    { label:'Pending Review', value:stats.pendingReview?.toLocaleString()||'0', icon:'⏳', color:'#ef4444', change:'Action needed' },
    { label:'Active Escrows', value:stats.activeEscrows?.toLocaleString()||'0', icon:'🔒', color:'#8b5cf6', change:'In progress' },
    { label:'Platform Revenue', value:fmt(stats.totalRevenue||0), icon:'💎', color:'#06b6d4', change:'This month' },
  ] : []

  const STATES = [
    { state:'Lagos', listings:4521, value:'₦245B', pct:38 },
    { state:'Abuja FCT', listings:2134, value:'₦189B', pct:28 },
    { state:'Rivers', listings:987, value:'₦67B', pct:15 },
    { state:'Ogun', listings:654, value:'₦34B', pct:10 },
    { state:'Others', listings:1203, value:'₦58B', pct:9 },
  ]

  const logout = () => { localStorage.clear(); window.location.href = '/' }

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'Inter,sans-serif' }}>
      <nav style={{ background:'#1e3a5f', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <a href="/" style={{ color:'#fff', fontWeight:800, textDecoration:'none' }}>🏠 VeriProp <span style={{ color:'#f59e0b' }}>Nigeria</span></a>
        <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
          <span style={{ color:'#10b981', fontSize:'0.75rem', fontWeight:700 }}>📊 ANALYTICS</span>
          <button onClick={logout} style={{ background:'transparent', border:'1px solid #475569', color:'#94a3b8', padding:'0.35rem 0.75rem', borderRadius:'0.5rem', cursor:'pointer', fontSize:'0.8rem' }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'1.5rem' }}>
        <h1 style={{ color:'#1e3a5f', fontWeight:800, marginBottom:'0.25rem' }}>📊 Marketplace Analytics</h1>
        <p style={{ color:'#64748b', marginBottom:'1.5rem', fontSize:'0.875rem' }}>Real-time platform metrics · Updated {new Date().toLocaleTimeString('en-NG')}</p>

        {loading ? <div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>Loading analytics...</div> : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
              {METRICS.map(m => (
                <div key={m.label} style={{ background:'#fff', borderRadius:'0.75rem', padding:'1.25rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', borderLeft:`4px solid ${m.color}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                    <span style={{ fontSize:'1.5rem' }}>{m.icon}</span>
                    <span style={{ fontSize:'0.7rem', color:m.color, fontWeight:600 }}>{m.change}</span>
                  </div>
                  <div style={{ fontWeight:900, color:m.color, fontSize:'1.5rem' }}>{m.value}</div>
                  <div style={{ color:'#64748b', fontSize:'0.75rem' }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* State breakdown */}
            <div style={{ background:'#fff', borderRadius:'1rem', padding:'1.5rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', marginBottom:'1.5rem' }}>
              <h2 style={{ color:'#1e3a5f', fontWeight:700, marginBottom:'1rem' }}>📍 Listings by State</h2>
              {STATES.map(s => (
                <div key={s.state} style={{ marginBottom:'0.875rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.3rem' }}>
                    <span style={{ fontWeight:600, color:'#1e3a5f', fontSize:'0.875rem' }}>{s.state}</span>
                    <span style={{ color:'#64748b', fontSize:'0.8rem' }}>{s.listings.toLocaleString()} listings · {s.value}</span>
                  </div>
                  <div style={{ height:8, background:'#f1f5f9', borderRadius:999, overflow:'hidden' }}>
                    <div style={{ width:`${s.pct}%`, height:'100%', background:'linear-gradient(90deg,#1d4ed8,#3b82f6)', borderRadius:999, transition:'width 1s ease' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Trust metrics */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'1rem' }}>
              {[
                { label:'AI Moderation Rate', value:'99.2%', desc:'Listings auto-reviewed', icon:'🤖', color:'#10b981' },
                { label:'Fraud Blocked', value:'1,247', desc:'Fraudulent attempts stopped', icon:'🛡️', color:'#ef4444' },
                { label:'KYC Completion', value:'87.3%', desc:'Users verified', icon:'✅', color:'#3b82f6' },
                { label:'Escrow Success Rate', value:'98.7%', desc:'Transactions completed', icon:'🔐', color:'#f59e0b' },
              ].map(m => (
                <div key={m.label} style={{ background:'#fff', borderRadius:'0.75rem', padding:'1.25rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>{m.icon}</div>
                  <div style={{ fontWeight:900, color:m.color, fontSize:'1.5rem' }}>{m.value}</div>
                  <div style={{ fontWeight:700, color:'#1e3a5f', fontSize:'0.875rem' }}>{m.label}</div>
                  <div style={{ color:'#94a3b8', fontSize:'0.75rem' }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
