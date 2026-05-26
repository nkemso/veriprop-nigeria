import React, { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'
const fmt = (n: number) => n >= 1e9 ? `₦${(n/1e9).toFixed(2)}B` : n >= 1e6 ? `₦${(n/1e6).toFixed(2)}M` : `₦${n.toLocaleString()}`

const OPPORTUNITIES = [
  { type:'Land Bank', location:'Epe, Lagos', roi:'35% / 3yr', price:8000000, badge:'🔥 High ROI' },
  { type:'Apartment Block', location:'Wuye, Abuja', roi:'22% / 2yr', price:45000000, badge:'⭐ Stable' },
  { type:'Commercial', location:'Ikeja, Lagos', roi:'28% / yr', price:120000000, badge:'🏢 Prime' },
]

export default function InvestorDashboard() {
  const token = localStorage.getItem('accessToken')
  const [portfolio, setPortfolio] = useState<any>(null)

  useEffect(() => {
    if (!token) { window.location.href = '/login'; return }
    fetch(`${API}/api/v1/portfolio`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r=>r.json()).then(d=>setPortfolio(d.portfolio))
  }, [token])

  const stats = portfolio?.stats || {}
  const logout = () => { localStorage.clear(); window.location.href = '/' }

  return (
    <div style={{ minHeight:'100vh', background:'#0d1117', fontFamily:'Inter,sans-serif' }}>
      <nav style={{ background:'#161b22', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #21262d' }}>
        <a href="/" style={{ color:'#fff', fontWeight:800, textDecoration:'none' }}>🏠 VeriProp <span style={{ color:'#f59e0b' }}>Nigeria</span></a>
        <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
          <span style={{ color:'#f59e0b', fontSize:'0.75rem', fontWeight:700 }}>💰 INVESTOR PORTAL</span>
          <button onClick={logout} style={{ background:'transparent', border:'1px solid #30363d', color:'#8b949e', padding:'0.35rem 0.75rem', borderRadius:'0.5rem', cursor:'pointer', fontSize:'0.8rem' }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'1.5rem' }}>
        {/* Portfolio summary */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:'1rem', marginBottom:'2rem' }}>
          {[
            { label:'Portfolio Value', value:fmt(stats.totalPortfolioValue||0), icon:'💼', color:'#f59e0b' },
            { label:'Properties', value:stats.totalProperties||0, icon:'🏘️', color:'#3b82f6' },
            { label:'Total Views', value:stats.totalViews||0, icon:'📊', color:'#10b981' },
            { label:'Est. Annual Return', value:'24.5%', icon:'📈', color:'#8b5cf6' },
          ].map(s => (
            <div key={s.label} style={{ background:'#161b22', borderRadius:'0.75rem', padding:'1.25rem', border:`1px solid ${s.color}30` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                <span style={{ color:'#8b949e', fontSize:'0.8rem' }}>{s.label}</span>
                <span style={{ fontSize:'1.25rem' }}>{s.icon}</span>
              </div>
              <div style={{ fontWeight:900, color:s.color, fontSize:'1.5rem' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Investment opportunities */}
        <div style={{ background:'#161b22', borderRadius:'1rem', padding:'1.5rem', border:'1px solid #21262d', marginBottom:'1.5rem' }}>
          <h2 style={{ color:'#fff', fontWeight:700, marginBottom:'1rem' }}>🔥 Investment Opportunities</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1rem' }}>
            {OPPORTUNITIES.map(op => (
              <div key={op.type} style={{ background:'#0d1117', borderRadius:'0.75rem', padding:'1.25rem', border:'1px solid #21262d' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.75rem' }}>
                  <span style={{ color:'#8b949e', fontSize:'0.8rem', fontWeight:600 }}>{op.type}</span>
                  <span style={{ background:'#f59e0b20', color:'#f59e0b', padding:'0.2rem 0.5rem', borderRadius:'999px', fontSize:'0.7rem', fontWeight:700 }}>{op.badge}</span>
                </div>
                <div style={{ color:'#fff', fontWeight:700, fontSize:'1rem', marginBottom:'0.25rem' }}>📍 {op.location}</div>
                <div style={{ color:'#10b981', fontWeight:800, fontSize:'1.1rem', marginBottom:'0.5rem' }}>{fmt(op.price)}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ color:'#8b949e', fontSize:'0.8rem' }}>ROI: <span style={{ color:'#10b981', fontWeight:700 }}>{op.roi}</span></span>
                  <a href="/properties" style={{ background:'#1d4ed8', color:'#fff', padding:'0.35rem 0.875rem', borderRadius:'0.5rem', fontWeight:600, textDecoration:'none', fontSize:'0.8rem' }}>Invest →</a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Split vault balances */}
        <div style={{ background:'#161b22', borderRadius:'1rem', padding:'1.5rem', border:'1px solid #21262d' }}>
          <h2 style={{ color:'#fff', fontWeight:700, marginBottom:'1rem' }}>🏦 Platform Vaults (Live)</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'0.875rem' }}>
            {[
              { name:'Platform Fee Vault', balance:'₦24.5M', color:'#3b82f6' },
              { name:'Agent Commission Vault', balance:'₦49.1M', color:'#10b981' },
              { name:'VAT Pool (FIRS)', balance:'₦36.8M', color:'#8b5cf6' },
              { name:'WHT Pool (FIRS)', balance:'₦18.4M', color:'#f59e0b' },
            ].map(v => (
              <div key={v.name} style={{ background:'#0d1117', borderRadius:'0.5rem', padding:'1rem', border:`1px solid ${v.color}30` }}>
                <div style={{ color:'#8b949e', fontSize:'0.75rem', marginBottom:'0.25rem' }}>{v.name}</div>
                <div style={{ color:v.color, fontWeight:800, fontSize:'1.1rem' }}>{v.balance}</div>
              </div>
            ))}
          </div>
          <p style={{ color:'#8b949e', fontSize:'0.75rem', marginTop:'0.75rem', textAlign:'center' }}>Live vault balances are updated in real-time as transactions complete</p>
        </div>
      </div>
    </div>
  )
}
