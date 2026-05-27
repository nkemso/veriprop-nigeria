import React, { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'
const fmt = (n: number) => n >= 1e9 ? `₦${(n/1e9).toFixed(2)}B` : n >= 1e6 ? `₦${(n/1e6).toFixed(2)}M` : `₦${n?.toLocaleString() || 0}`

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'properties' | 'transactions' | 'favorites'>('properties')
  const token = localStorage.getItem('accessToken')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!token) { window.location.href = '/login'; return }
    fetch(`${API}/api/v1/portfolio`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setPortfolio(d.portfolio); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const stats = portfolio?.stats || {}
  const properties = portfolio?.properties || []
  const transactions = portfolio?.transactions || []
  const favorites = portfolio?.favorites || []

  const logout = () => { localStorage.clear(); window.location.href = '/' }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
        <p style={{ color: '#64748b' }}>Loading your portfolio...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter,sans-serif' }}>
      {/* Nav */}
      <nav style={{ background: '#1e3a5f', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/" style={{ color: '#fff', fontWeight: 800, textDecoration: 'none' }}>🏠 VeriProp <span style={{ color: '#f59e0b' }}>Nigeria</span></a>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <a href="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.875rem' }}>Dashboard</a>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid #475569', color: '#94a3b8', padding: '0.35rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#1d4ed8)', borderRadius: '1rem', padding: '1.5rem', color: '#fff', marginBottom: '1.5rem' }}>
          <h1 style={{ fontWeight: 900, margin: '0 0 0.25rem', fontSize: '1.5rem' }}>
            📊 My Portfolio
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '0.875rem' }}>
            {user.firstName} {user.lastName} · {user.role} · {user.isVerified ? '✅ Verified' : '⚠️ Unverified'}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { icon: '🏠', label: 'Properties', value: stats.totalProperties || properties.length || 0, color: '#3b82f6' },
            { icon: '✅', label: 'Active', value: stats.activeListings || 0, color: '#10b981' },
            { icon: '💰', label: 'Portfolio Value', value: fmt(stats.totalPortfolioValue || 0), color: '#f59e0b' },
            { icon: '👁️', label: 'Total Views', value: (stats.totalViews || 0).toLocaleString(), color: '#8b5cf6' },
            { icon: '💼', label: 'Transactions', value: transactions.length || 0, color: '#ef4444' },
            { icon: '❤️', label: 'Saved', value: favorites.length || 0, color: '#f43f5e' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{s.icon}</div>
              <div style={{ fontWeight: 900, color: s.color, fontSize: '1.35rem' }}>{s.value}</div>
              <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { href: '/list-property', icon: '➕', label: 'List Property', color: '#1d4ed8' },
            { href: '/properties', icon: '🔍', label: 'Browse Market', color: '#10b981' },
            { href: '/boost', icon: '🚀', label: 'Boost Listing', color: '#f59e0b' },
            { href: '/verify', icon: '🛡️', label: 'Get Verified', color: '#8b5cf6' },
            { href: '/ai/advisor', icon: '🤖', label: 'AI Advisor', color: '#ef4444' },
          ].map(a => (
            <a key={a.href} href={a.href}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', color: '#1e3a5f', padding: '0.625rem 1rem', borderRadius: '0.625rem', textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)' }}>
              <span style={{ fontSize: '1.1rem' }}>{a.icon}</span> {a.label}
            </a>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: '#fff', padding: '0.5rem', borderRadius: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {[
            { id: 'properties', label: `🏠 Properties (${properties.length})` },
            { id: 'transactions', label: `💰 Transactions (${transactions.length})` },
            { id: 'favorites', label: `❤️ Saved (${favorites.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              style={{ flex: 1, padding: '0.625rem', border: 'none', background: tab === t.id ? '#1e3a5f' : 'transparent', color: tab === t.id ? '#fff' : '#64748b', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Properties tab */}
        {tab === 'properties' && (
          <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {properties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🏠</div>
                <h3 style={{ color: '#1e3a5f', fontWeight: 700, margin: '0 0 0.5rem' }}>No Properties Yet</h3>
                <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem' }}>List your first property to start building your portfolio</p>
                <a href="/list-property" style={{ background: '#1d4ed8', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 700, textDecoration: 'none', fontSize: '0.875rem' }}>
                  + List Your First Property →
                </a>
              </div>
            ) : properties.map((p: any) => (
              <div key={p.id} style={{ display: 'flex', gap: '1rem', padding: '0.875rem 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '0.625rem', background: '#e2e8f0', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  {p.images?.[0] ? <img src={p.images[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏠'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#1e3a5f', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>📍 {p.lga}, {p.state} · {fmt(p.price)}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.375rem' }}>
                    <span style={{ background: p.status === 'active' ? '#dcfce7' : '#fef9c3', color: p.status === 'active' ? '#166534' : '#92400e', padding: '0.1rem 0.5rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'capitalize' }}>
                      {p.status}
                    </span>
                    {p._count?.views > 0 && <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>👁 {p._count.views} views</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <a href={`/properties/${p.id}`} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '0.4rem 0.75rem', borderRadius: '0.375rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.75rem' }}>View</a>
                  <a href={`/boost?propertyId=${p.id}`} style={{ background: '#fef9c3', color: '#92400e', padding: '0.4rem 0.75rem', borderRadius: '0.375rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.75rem' }}>🚀 Boost</a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Transactions tab */}
        {tab === 'transactions' && (
          <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {transactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>💰</div>
                <h3 style={{ color: '#1e3a5f', fontWeight: 700, margin: '0 0 0.5rem' }}>No Transactions Yet</h3>
                <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem' }}>Browse properties and make your first secure transaction</p>
                <a href="/properties" style={{ background: '#1d4ed8', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 700, textDecoration: 'none', fontSize: '0.875rem' }}>
                  Browse Properties →
                </a>
              </div>
            ) : transactions.map((t: any) => (
              <div key={t.id} style={{ display: 'flex', gap: '1rem', padding: '0.875rem 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                  {t.type === 'sale' ? '🏠' : t.type === 'rent' ? '🔑' : '💰'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.property?.title || 'Property Transaction'}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{fmt(t.amount)} · {t.type}</div>
                </div>
                <span style={{ background: t.status === 'completed' ? '#dcfce7' : t.status === 'initiated' ? '#dbeafe' : '#fef9c3', color: t.status === 'completed' ? '#166534' : t.status === 'initiated' ? '#1d4ed8' : '#92400e', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize', flexShrink: 0 }}>
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Favorites tab */}
        {tab === 'favorites' && (
          <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            {favorites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>❤️</div>
                <h3 style={{ color: '#1e3a5f', fontWeight: 700, margin: '0 0 0.5rem' }}>No Saved Properties</h3>
                <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem' }}>Save properties you like by tapping the heart icon</p>
                <a href="/properties" style={{ background: '#1d4ed8', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 700, textDecoration: 'none', fontSize: '0.875rem' }}>
                  Browse Properties →
                </a>
              </div>
            ) : favorites.map((f: any) => (
              <div key={f.id} style={{ display: 'flex', gap: '1rem', padding: '0.875rem 0', borderBottom: '1px solid #f1f5f9', alignItems: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '0.625rem', background: '#e2e8f0', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  {f.property?.images?.[0] ? <img src={f.property.images[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏠'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#1e3a5f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.property?.title}</div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>📍 {f.property?.lga}, {f.property?.state} · {fmt(f.property?.price)}</div>
                </div>
                <a href={`/properties/${f.property?.id}`} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '0.4rem 0.875rem', borderRadius: '0.375rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.75rem', flexShrink: 0 }}>
                  View →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
