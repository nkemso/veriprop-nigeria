import React, { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'
const fmt = (n: number) => n >= 1e9 ? `₦${(n/1e9).toFixed(1)}B` : n >= 1e6 ? `₦${(n/1e6).toFixed(1)}M` : `₦${n.toLocaleString()}`

export default function AgentDashboard() {
  const token = localStorage.getItem('accessToken')
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState({ listings:0, views:0, leads:0, commission:0, pending:0, completed:0 })
  const [listings, setListings] = useState<any[]>([])

  useEffect(() => {
    if (!token) { window.location.href = '/login'; return }
    const h = { Authorization: `Bearer ${token}` }
    fetch(`${API}/api/v1/users/me`, { headers:h }).then(r=>r.json()).then(d=>setUser(d.user))
    fetch(`${API}/api/v1/portfolio`, { headers:h }).then(r=>r.json()).then(d=>{
      const s = d.portfolio?.stats || {}
      setStats({ listings: s.totalProperties||0, views: s.totalViews||0, leads:0, commission: s.totalPortfolioValue ? +(s.totalPortfolioValue*0.1).toFixed(0):0, pending:0, completed: s.activeListings||0 })
      setListings(d.portfolio?.properties||[])
    })
  }, [token])

  const logout = () => { localStorage.clear(); window.location.href = '/' }

  const STATS = [
    { icon:'🏠', label:'Active Listings', value:stats.listings, color:'#3b82f6' },
    { icon:'👁️', label:'Total Views', value:stats.views, color:'#10b981' },
    { icon:'💰', label:'Est. Commission', value:fmt(stats.commission), color:'#f59e0b' },
    { icon:'✅', label:'Completed Deals', value:stats.completed, color:'#8b5cf6' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'Inter,sans-serif' }}>
      <nav style={{ background:'#1e3a5f', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <a href="/" style={{ color:'#fff', fontWeight:800, textDecoration:'none' }}>🏠 VeriProp <span style={{ color:'#f59e0b' }}>Nigeria</span></a>
        <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
          <span style={{ color:'#10b981', fontSize:'0.75rem', fontWeight:700 }}>🤝 AGENT PORTAL</span>
          <button onClick={logout} style={{ background:'transparent', border:'1px solid #475569', color:'#94a3b8', padding:'0.35rem 0.75rem', borderRadius:'0.5rem', cursor:'pointer', fontSize:'0.8rem' }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'1.5rem' }}>
        {/* Welcome */}
        <div style={{ background:'linear-gradient(135deg,#1e3a5f,#1d4ed8)', borderRadius:'1rem', padding:'1.5rem', color:'#fff', marginBottom:'1.5rem' }}>
          <h1 style={{ margin:'0 0 0.25rem', fontWeight:800 }}>Agent Dashboard 🤝</h1>
          <p style={{ margin:'0 0 0.75rem', color:'rgba(255,255,255,0.7)', fontSize:'0.875rem' }}>{user?.firstName} {user?.lastName} · {user?.isVerified ? '✅ Verified Agent':'⚠️ Complete verification to list'}</p>
          {!user?.isVerified && <a href="/verify" style={{ background:'#f59e0b', color:'#1e3a5f', padding:'0.4rem 1rem', borderRadius:'0.5rem', fontWeight:700, textDecoration:'none', fontSize:'0.8rem' }}>Complete KYC →</a>}
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ background:'#fff', borderRadius:'0.75rem', padding:'1.25rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', borderLeft:`4px solid ${s.color}` }}>
              <div style={{ fontSize:'1.5rem' }}>{s.icon}</div>
              <div style={{ fontWeight:900, color:s.color, fontSize:'1.5rem', margin:'0.25rem 0' }}>{s.value}</div>
              <div style={{ color:'#64748b', fontSize:'0.8rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'0.75rem', marginBottom:'1.5rem' }}>
          {[
            { href:'/list-property', icon:'➕', label:'New Listing', color:'#1d4ed8' },
            { href:'/properties', icon:'🔍', label:'Browse Market', color:'#10b981' },
            { href:'/verify', icon:'🛡️', label:'Verification', color:'#8b5cf6' },
            { href:'/legal/escrow', icon:'🔐', label:'Escrow Policy', color:'#f59e0b' },
          ].map(a => (
            <a key={a.href} href={a.href}
              style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'1rem', background:'#fff', borderRadius:'0.75rem', textDecoration:'none', border:'1px solid #e2e8f0', boxShadow:'0 2px 4px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize:'1.25rem' }}>{a.icon}</span>
              <span style={{ color:'#1e3a5f', fontWeight:700, fontSize:'0.85rem' }}>{a.label}</span>
            </a>
          ))}
        </div>

        {/* Listings */}
        <div style={{ background:'#fff', borderRadius:'1rem', padding:'1.5rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1rem' }}>
            <h2 style={{ color:'#1e3a5f', fontWeight:700, margin:0 }}>My Listings</h2>
            <a href="/list-property" style={{ color:'#1d4ed8', fontWeight:600, textDecoration:'none', fontSize:'0.875rem' }}>+ New</a>
          </div>
          {listings.length === 0 ? (
            <div style={{ textAlign:'center', padding:'2rem', color:'#94a3b8' }}>
              <div style={{ fontSize:'2.5rem' }}>🏠</div>
              <p>No listings yet. Start by adding your first property.</p>
              <a href="/list-property" style={{ color:'#1d4ed8', fontWeight:700, textDecoration:'none' }}>+ Add Listing</a>
            </div>
          ) : listings.map((p:any) => (
            <div key={p.id} style={{ display:'flex', gap:'1rem', padding:'0.875rem 0', borderBottom:'1px solid #f1f5f9', alignItems:'center' }}>
              <div style={{ width:56, height:56, borderRadius:'0.5rem', background:'#e2e8f0', overflow:'hidden', flexShrink:0 }}>
                {p.images?.[0] && <img src={p.images[0].url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, color:'#1e3a5f', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</div>
                <div style={{ color:'#64748b', fontSize:'0.8rem' }}>₦{p.price?.toLocaleString()} · {p._count?.views||0} views</div>
              </div>
              <span style={{ background: p.status==='active' ? '#dcfce7':'#fef9c3', color: p.status==='active' ? '#166534':'#92400e', padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.7rem', fontWeight:700 }}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
