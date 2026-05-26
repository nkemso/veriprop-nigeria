import React, { useState } from 'react'
// SCREEN_101 — Market Intelligence Hub

const INSIGHTS = [
  { area: 'Lekki Phase 1', type: 'Apartment', avg: '₦4.2M/yr', growth: '+18%', demand: 'High', score: 92 },
  { area: 'Maitama, Abuja', type: 'Duplex', avg: '₦85M', growth: '+24%', demand: 'Very High', score: 96 },
  { area: 'GRA Enugu', type: 'Commercial', avg: '₦12M', growth: '+11%', demand: 'Medium', score: 74 },
  { area: 'Wuye, Abuja', type: 'Land', avg: '₦25M', growth: '+31%', demand: 'High', score: 88 },
  { area: 'Victoria Island', type: 'Office', avg: '₦18M/yr', growth: '+9%', demand: 'High', score: 85 },
]

const STATE_DATA = [
  { state: 'Lagos', pct: 42, value: '₦2.1T', color: '#3b82f6' },
  { state: 'FCT Abuja', pct: 28, value: '₦1.4T', color: '#10b981' },
  { state: 'Rivers', pct: 12, value: '₦604B', color: '#f59e0b' },
  { state: 'Ogun', pct: 9, value: '₦452B', color: '#8b5cf6' },
  { state: 'Others', pct: 9, value: '₦452B', color: '#6e7681' },
]

export default function MarketIntelligenceHub() {
  const [tab, setTab] = useState<'overview' | 'hotspots' | 'trends'>('overview')
  const token = localStorage.getItem('accessToken')
  if (!token) { window.location.href = '/login'; return null }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', fontFamily: 'Inter,sans-serif', color: '#f0f6fc' }}>
      <nav style={{ background: '#161b22', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #21262d' }}>
        <a href="/" style={{ color: '#fff', fontWeight: 800, textDecoration: 'none' }}>🏠 VeriProp <span style={{ color: '#f59e0b' }}>Nigeria</span></a>
        <span style={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: 700 }}>🤖 VETPRO AI — MARKET INTELLIGENCE</span>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg,#1d4ed820,#3b82f620)', border: '1px solid #3b82f630', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', flexShrink: 0 }}>📊</div>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: '1.35rem', margin: '0 0 0.25rem' }}>Market Intelligence Hub</h1>
            <p style={{ color: '#8b949e', margin: 0, fontSize: '0.875rem' }}>AI-powered real-time analysis of Nigeria&apos;s property market. Updated every 6 hours.</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {(['overview', 'hotspots', 'trends'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '0.5rem 1.25rem', border: 'none', background: tab === t ? '#1d4ed8' : '#161b22', color: tab === t ? '#fff' : '#8b949e', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', textTransform: 'capitalize' }}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div>
            {/* Market metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {[
                { icon: '💹', label: 'Market Size', value: '₦5.02T', change: '+14.2%', color: '#10b981' },
                { icon: '🏠', label: 'Active Listings', value: '9,498', change: '+8.1%', color: '#3b82f6' },
                { icon: '📈', label: 'Avg Price Growth', value: '18.5%', change: 'YoY', color: '#f59e0b' },
                { icon: '🔥', label: 'Hottest Market', value: 'Abuja', change: '+31% land', color: '#ef4444' },
                { icon: '⏱️', label: 'Avg Days on Market', value: '23 days', change: '-4 days', color: '#8b5cf6' },
                { icon: '🤖', label: 'AI Confidence', value: '94.7%', change: 'Accuracy', color: '#06b6d4' },
              ].map(m => (
                <div key={m.label} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0.75rem', padding: '1.25rem', borderLeft: `4px solid ${m.color}` }}>
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{m.icon}</div>
                  <div style={{ fontWeight: 900, color: m.color, fontSize: '1.4rem' }}>{m.value}</div>
                  <div style={{ color: '#f0f6fc', fontWeight: 600, fontSize: '0.8rem' }}>{m.label}</div>
                  <div style={{ color: '#6e7681', fontSize: '0.7rem' }}>{m.change}</div>
                </div>
              ))}
            </div>

            {/* State breakdown */}
            <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0.875rem', padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 700, margin: '0 0 1rem' }}>Market Distribution by State</h3>
              {STATE_DATA.map(s => (
                <div key={s.state} style={{ marginBottom: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 600 }}>{s.state}</span>
                    <span style={{ color: '#6e7681' }}>{s.value} ({s.pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: '#0d1117', borderRadius: 999 }}>
                    <div style={{ width: `${s.pct}%`, height: '100%', background: s.color, borderRadius: 999, transition: 'width 1s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'hotspots' && (
          <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0.875rem', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #21262d' }}>
              <h3 style={{ margin: 0, fontWeight: 700 }}>🔥 AI-Identified Investment Hotspots</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#0d1117' }}>
                  {['Area', 'Type', 'Avg Price', 'Growth', 'Demand', 'AI Score'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#6e7681', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {INSIGHTS.map(r => (
                  <tr key={r.area} style={{ borderTop: '1px solid #21262d' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{r.area}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#8b949e' }}>{r.type}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#f59e0b', fontWeight: 700 }}>{r.avg}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#10b981', fontWeight: 700 }}>{r.growth}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ background: r.demand === 'Very High' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: r.demand === 'Very High' ? '#ef4444' : '#f59e0b', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>{r.demand}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: 6, background: '#21262d', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ width: `${r.score}%`, height: '100%', background: r.score >= 90 ? '#10b981' : r.score >= 80 ? '#f59e0b' : '#6e7681' }} />
                        </div>
                        <span style={{ fontWeight: 700, color: '#f0f6fc', fontSize: '0.8rem', minWidth: 28 }}>{r.score}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'trends' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
            {[
              { title: '🏡 Residential Trend', insight: 'Demand for 3-bedroom apartments in Lekki and Ajah corridors is up 23% YoY driven by young professionals.', signal: 'BUY', color: '#10b981' },
              { title: '🏢 Commercial Trend', insight: 'Grade-A office space in VI and Ikoyi showing strong absorption. Vacancy rates at 12-year low.', signal: 'HOLD', color: '#f59e0b' },
              { title: '🌱 Land Trend', insight: 'Epe, Ibeju-Lekki corridors seeing 35-45% annual appreciation driven by Dangote Refinery effect.', signal: 'BUY', color: '#10b981' },
              { title: '🏘️ Rental Trend', insight: 'Short-let market growing 41% in Lagos. Tourism and diaspora demand driving premium yields.', signal: 'INVEST', color: '#3b82f6' },
            ].map(t => (
              <div key={t.title} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0.875rem', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontWeight: 700 }}>{t.title}</h4>
                  <span style={{ background: `${t.color}20`, color: t.color, padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>{t.signal}</span>
                </div>
                <p style={{ color: '#8b949e', fontSize: '0.8rem', lineHeight: 1.6, margin: 0 }}>{t.insight}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
