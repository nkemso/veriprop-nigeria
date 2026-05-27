import React, { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'
const fmt = (n: number) => `₦${n.toLocaleString()}`

const BOOSTS = [
  { id: 'starter', name: 'Starter', price: 2000, days: 3, badge: '🚀', color: '#6e7681', views: '500+', features: ['Top search results', 'Bold badge', '500 email leads'] },
  { id: 'popular', name: 'Popular', price: 5000, days: 7, badge: '⭐', color: '#1d4ed8', views: '2,000+', features: ['Homepage featured', 'Push notification', 'Social mention', '2K email leads'] },
  { id: 'premium', name: 'Premium', price: 15000, days: 14, badge: '👑', color: '#f59e0b', views: '10,000+', features: ['All channels', 'AI property video', 'Instagram + Facebook', '10K email leads', 'VetPro recommended'] },
  { id: 'ultra', name: 'Ultra', price: 50000, days: 30, badge: '💎', color: '#10b981', views: '50,000+', features: ['All premium features', 'Dedicated page', 'WhatsApp broadcast', 'Homepage spotlight', '50K impressions guaranteed'] },
]

export default function BoostProperty() {
  const [myProperties, setMyProperties] = useState<any[]>([])
  const [selectedProp, setSelectedProp] = useState('')
  const [selectedBoost, setSelectedBoost] = useState('')
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('accessToken')
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    if (!token) { window.location.href = '/login'; return }
    fetch(`${API}/api/v1/portfolio`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setMyProperties(d.portfolio?.properties || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  const handleBoost = () => {
    if (!selectedProp || !selectedBoost) return
    const boost = BOOSTS.find(b => b.id === selectedBoost)
    if (!boost) return
    if (!(window as any).PaystackPop) { alert('Payment loading...'); return }
    const handler = (window as any).PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
      email: user.email,
      amount: boost.price * 100,
      currency: 'NGN',
      ref: `VP-BOOST-${Date.now()}`,
      metadata: { propertyId: selectedProp, boostId: selectedBoost, days: boost.days },
      callback: (res: any) => {
        fetch(`${API}/api/v1/monetization/boost-property`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ propertyId: selectedProp, boostId: selectedBoost, reference: res.reference }),
        }).then(r => r.json()).then(d => {
          if (d.success) alert(`✅ Property boosted for ${boost.days} days! Expect ${boost.views} additional views.`)
        })
      },
      onClose: () => {},
    })
    handler.openIframe()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter,sans-serif' }}>
      <nav style={{ background: '#1e3a5f', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/" style={{ color: '#fff', fontWeight: 800, textDecoration: 'none' }}>🏠 VeriProp <span style={{ color: '#f59e0b' }}>Nigeria</span></a>
        <a href="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.875rem' }}>← Dashboard</a>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem' }}>🚀</div>
          <h1 style={{ color: '#1e3a5f', fontWeight: 900, margin: '0.5rem 0 0.25rem' }}>Boost Your Property</h1>
          <p style={{ color: '#64748b' }}>Get more views and leads faster</p>
        </div>

        {/* Step 1: Select property */}
        <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ color: '#1e3a5f', fontWeight: 700, margin: '0 0 1rem' }}>Step 1: Select Property to Boost</h3>
          {loading ? <p style={{ color: '#94a3b8' }}>Loading your properties...</p>
            : myProperties.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#64748b' }}>
                <p>No properties found. <a href="/list-property" style={{ color: '#1d4ed8', fontWeight: 700 }}>List a property first →</a></p>
              </div>
            ) : myProperties.map(p => (
              <div key={p.id} onClick={() => setSelectedProp(p.id)}
                style={{ display: 'flex', gap: '0.875rem', padding: '0.75rem', borderRadius: '0.625rem', cursor: 'pointer', border: `2px solid ${selectedProp === p.id ? '#1d4ed8' : '#e2e8f0'}`, marginBottom: '0.5rem', background: selectedProp === p.id ? '#eff6ff' : '#f8fafc', transition: 'all 0.2s' }}>
                <div style={{ width: 56, height: 56, borderRadius: '0.5rem', background: '#e2e8f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', overflow: 'hidden' }}>
                  {p.images?.[0] ? <img src={p.images[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🏠'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#1e3a5f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{fmt(p.price)} · {p.lga}, {p.state}</div>
                  <div style={{ color: p.isFeatured ? '#10b981' : '#94a3b8', fontSize: '0.75rem' }}>{p.isFeatured ? '✅ Currently Featured' : '⚪ Not Featured'}</div>
                </div>
                {selectedProp === p.id && <div style={{ color: '#1d4ed8', fontWeight: 800, fontSize: '1.25rem' }}>✓</div>}
              </div>
            ))
          }
        </div>

        {/* Step 2: Select boost */}
        {selectedProp && (
          <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ color: '#1e3a5f', fontWeight: 700, margin: '0 0 1rem' }}>Step 2: Choose Boost Package</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))', gap: '0.875rem' }}>
              {BOOSTS.map(b => (
                <div key={b.id} onClick={() => setSelectedBoost(b.id)}
                  style={{ border: `2px solid ${selectedBoost === b.id ? b.color : '#e2e8f0'}`, borderRadius: '0.875rem', padding: '1rem', cursor: 'pointer', background: selectedBoost === b.id ? `${b.color}08` : '#fff', transition: 'all 0.2s', transform: selectedBoost === b.id ? 'scale(1.02)' : 'scale(1)' }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{b.badge}</div>
                  <div style={{ fontWeight: 800, color: '#1e3a5f', fontSize: '0.9rem' }}>{b.name}</div>
                  <div style={{ color: b.color, fontWeight: 900, fontSize: '1.1rem' }}>{fmt(b.price)}</div>
                  <div style={{ display: 'flex', gap: '0.375rem', margin: '0.375rem 0', flexWrap: 'wrap' }}>
                    <span style={{ background: `${b.color}15`, color: b.color, padding: '0.15rem 0.4rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700 }}>{b.days}d</span>
                    <span style={{ background: '#f0fdf4', color: '#10b981', padding: '0.15rem 0.4rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700 }}>{b.views}</span>
                  </div>
                  {b.features.slice(0, 2).map(f => <div key={f} style={{ color: '#64748b', fontSize: '0.7rem' }}>✓ {f}</div>)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Pay */}
        {selectedProp && selectedBoost && (
          <div style={{ background: '#1e3a5f', borderRadius: '1rem', padding: '1.5rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                {BOOSTS.find(b => b.id === selectedBoost)?.badge} {BOOSTS.find(b => b.id === selectedBoost)?.name} Boost
              </div>
              <div style={{ color: '#f59e0b', fontWeight: 900, fontSize: '1.35rem' }}>
                {fmt(BOOSTS.find(b => b.id === selectedBoost)?.price || 0)}
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                {BOOSTS.find(b => b.id === selectedBoost)?.days} days · {BOOSTS.find(b => b.id === selectedBoost)?.views} views
              </div>
            </div>
            <button onClick={handleBoost}
              style={{ background: '#f59e0b', color: '#1e3a5f', padding: '0.875rem 2rem', border: 'none', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer', fontSize: '1rem' }}>
              🚀 Boost Now — Pay Securely
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
