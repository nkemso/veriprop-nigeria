import React, { useState, useEffect } from 'react'
import { formatPrice } from '../../lib/property-search'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('accessToken')

  useEffect(() => {
    if (!token) { window.location.href = '/login'; return }
    const headers = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch(`${API}/api/v1/users/me`, { headers }).then(r=>r.json()),
      fetch(`${API}/api/v1/portfolio`, { headers }).then(r=>r.json()),
    ]).then(([u, p]) => { setUser(u.user); setPortfolio(p.portfolio); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const logout = () => { localStorage.clear(); window.location.href = '/' }

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif' }}><p>Loading...</p></div>

  // Redirect admins to admin dashboard
  const adminRoles = ['super_admin', 'admin', 'compliance_officer']
  if (user && adminRoles.includes(user.role)) {
    return (
      <div style={{ minHeight:'100vh', background:'#0d1117', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif', flexDirection:'column', gap:'1rem', color:'#f0f6fc', padding:'2rem' }}>
        <div style={{ fontSize:'3rem' }}>🛡️</div>
        <h2 style={{ color:'#60a5fa', fontWeight:800, margin:0 }}>Admin Account Detected</h2>
        <p style={{ color:'#8b949e', margin:0 }}>Logged in as <strong style={{ color:'#f59e0b', textTransform:'capitalize' }}>{user.role?.replace('_', ' ')}</strong></p>
        <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', justifyContent:'center', marginTop:'0.5rem' }}>
          <a href="/admin/dashboard" style={{ background:'#1d4ed8', color:'#fff', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:700, textDecoration:'none', fontSize:'1rem' }}>🛡️ Go to Admin Dashboard →</a>
          <a href="/properties" style={{ background:'#21262d', color:'#8b949e', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:700, textDecoration:'none', border:'1px solid #30363d' }}>🏠 Browse Properties</a>
        </div>
      </div>
    )
  }

  const stats = portfolio?.stats || {}

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'Inter,sans-serif' }}>
      <nav style={{ background:'#1e3a5f', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <a href="/" style={{ color:'#fff', fontWeight:800, fontSize:'1.1rem', textDecoration:'none' }}>🏠 VeriProp <span style={{ color:'#f59e0b' }}>Naija</span></a>
        <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
          <a href="/list-property" style={{ color:'#94a3b8', fontSize:'0.875rem', textDecoration:'none' }}>+ List</a>
          <button onClick={logout} style={{ background:'transparent', border:'1px solid #475569', color:'#94a3b8', padding:'0.4rem 0.875rem', borderRadius:'0.5rem', cursor:'pointer', fontSize:'0.875rem' }}>Logout</button>
        </div>
      </nav>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'1.5rem' }}>
        <div style={{ background:'linear-gradient(135deg,#1e3a5f,#1d4ed8)', borderRadius:'1rem', padding:'1.5rem', color:'#fff', marginBottom:'1.5rem' }}>
          <h1 style={{ margin:'0 0 0.25rem', fontSize:'1.5rem', fontWeight:800 }}>Welcome, {user?.firstName}! 👋</h1>
          <p style={{ margin:0, color:'#94a3b8', fontSize:'0.875rem' }}>{user?.email} · {user?.role} · {user?.isVerified ? '✅ Verified' : '⚠️ Unverified'}</p>
          {!user?.isVerified && <a href="/verify" style={{ display:'inline-block', marginTop:'0.75rem', background:'#f59e0b', color:'#1e3a5f', padding:'0.4rem 1rem', borderRadius:'0.5rem', fontWeight:700, textDecoration:'none', fontSize:'0.875rem' }}>Complete Verification →</a>}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
          {[
            { icon:'🏠', label:'Properties', value:stats.totalProperties||0, color:'#3b82f6' },
            { icon:'✅', label:'Active', value:stats.activeListings||0, color:'#10b981' },
            { icon:'💰', label:'Value', value:formatPrice(stats.totalPortfolioValue||0), color:'#f59e0b' },
            { icon:'👁️', label:'Views', value:stats.totalViews||0, color:'#8b5cf6' },
          ].map(s=>(
            <div key={s.label} style={{ background:'#fff', borderRadius:'0.75rem', padding:'1.25rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', borderLeft:`4px solid ${s.color}` }}>
              <div style={{ fontSize:'1.5rem' }}>{s.icon}</div>
              <div style={{ fontWeight:800, color:s.color, fontSize:'1.25rem' }}>{s.value}</div>
              <div style={{ color:'#64748b', fontSize:'0.8rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:'0.75rem', marginBottom:'1.5rem' }}>
          {[
            { href:'/list-property', icon:'➕', label:'List Property' },
            { href:'/properties', icon:'🔍', label:'Browse' },
            { href:'/verify', icon:'🛡️', label:'Get Verified' },
            { href:'/portfolio', icon:'📊', label:'Portfolio' },
          ].map(a=>(
            <a key={a.href} href={a.href} style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'1rem', background:'#fff', borderRadius:'0.75rem', textDecoration:'none', gap:'0.5rem', border:'1px solid #e2e8f0', boxShadow:'0 2px 4px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize:'1.5rem' }}>{a.icon}</span>
              <span style={{ color:'#1e3a5f', fontWeight:600, fontSize:'0.8rem', textAlign:'center' }}>{a.label}</span>
            </a>
          ))}
        </div>
        <div style={{ background:'#fff', borderRadius:'1rem', padding:'1.5rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
            <h2 style={{ color:'#1e3a5f', margin:0, fontWeight:700 }}>My Properties</h2>
            <a href="/list-property" style={{ color:'#1d4ed8', fontWeight:600, textDecoration:'none', fontSize:'0.875rem' }}>+ Add New</a>
          </div>
          {(portfolio?.properties||[]).length===0 ? (
            <div style={{ textAlign:'center', padding:'2rem', color:'#94a3b8' }}>
              <div style={{ fontSize:'2rem' }}>🏠</div>
              <p>No properties listed yet</p>
              <a href="/list-property" style={{ color:'#1d4ed8', fontWeight:700 }}>List your first property →</a>
            </div>
          ) : portfolio.properties.map((p:any)=>(
            <div key={p.id} style={{ display:'flex', gap:'1rem', padding:'0.75rem 0', borderBottom:'1px solid #f1f5f9', alignItems:'center' }}>
              <div style={{ width:60, height:60, borderRadius:'0.5rem', background:'#e2e8f0', flexShrink:0, overflow:'hidden' }}>
                {p.images?.[0] && <img src={p.images[0].url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, color:'#1e3a5f', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</div>
                <div style={{ color:'#64748b', fontSize:'0.8rem' }}>{formatPrice(p.price)} · {p.status}</div>
              </div>
              <a href={`/properties/${p.id}`} style={{ color:'#1d4ed8', fontSize:'0.8rem', textDecoration:'none', fontWeight:600 }}>View</a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
