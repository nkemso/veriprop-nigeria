import React, { useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'

// ================================================================
// VERIPROP NIGERIA — MONETIZATION & PRICING
// Revenue Streams:
// 1. Escrow Fees (5% per transaction) — CORE
// 2. Premium Listings (₦5k-₦50k/month) — RECURRING
// 3. Property Boosting (₦2k-₦20k) — TRANSACTIONAL
// 4. Agent Subscriptions (₦15k-₦50k/month) — RECURRING
// 5. Advertising (₦10k-₦500k/campaign) — MEDIA
// 6. Featured Developer Pages (₦100k/month) — ENTERPRISE
// 7. Legal Services (₦50k-₦200k per deed) — PROFESSIONAL
// 8. Property Valuation Reports (₦10k each) — DATA
// ================================================================

const PLANS = [
  {
    id: 'free',
    name: 'Basic',
    price: 0,
    period: 'Forever',
    color: '#6e7681',
    icon: '🆓',
    description: 'For individual property seekers',
    features: [
      '✅ Browse verified listings',
      '✅ 1 property listing',
      '✅ Basic NIN verification',
      '✅ Standard chat support',
      '✅ Escrow transactions',
      '❌ Featured placement',
      '❌ Analytics dashboard',
      '❌ Bulk listings',
      '❌ Priority support',
    ],
    cta: 'Get Started Free',
    ctaStyle: { background: '#21262d', color: '#f0f6fc' },
    popular: false,
  },
  {
    id: 'agent',
    name: 'Agent Pro',
    price: 15000,
    period: '/month',
    color: '#1d4ed8',
    icon: '🤝',
    description: 'For active real estate agents',
    features: [
      '✅ Unlimited listings',
      '✅ 2 featured listings/month',
      '✅ Full biometric KYC (Didit)',
      '✅ Agent analytics dashboard',
      '✅ Priority chat placement',
      '✅ VetPro AI advisor access',
      '✅ Lead management tools',
      '✅ WhatsApp integration',
      '✅ Priority support (24hr)',
    ],
    cta: 'Start 14-Day Trial',
    ctaStyle: { background: '#1d4ed8', color: '#fff' },
    popular: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 50000,
    period: '/month',
    color: '#f59e0b',
    icon: '🏢',
    description: 'For real estate agencies & teams',
    features: [
      '✅ Unlimited listings (5 agents)',
      '✅ 10 featured listings/month',
      '✅ Branded agency page',
      '✅ Full analytics suite',
      '✅ Bulk property import',
      '✅ Custom escrow workflows',
      '✅ Developer API access',
      '✅ Compliance reporting',
      '✅ Dedicated account manager',
    ],
    cta: 'Contact Sales',
    ctaStyle: { background: '#f59e0b', color: '#1e3a5f' },
    popular: false,
  },
  {
    id: 'developer',
    name: 'Developer',
    price: 150000,
    period: '/month',
    color: '#10b981',
    icon: '🏗️',
    description: 'For property developers & investors',
    features: [
      '✅ Dedicated developer profile',
      '✅ Unlimited project listings',
      '✅ Off-plan payment management',
      '✅ Investor portal access',
      '✅ Split escrow for installments',
      '✅ ROI analytics & reports',
      '✅ Market intelligence data',
      '✅ Legal deed generation',
      '✅ White-glove onboarding',
    ],
    cta: 'Book Demo',
    ctaStyle: { background: '#10b981', color: '#fff' },
    popular: false,
  },
]

const BOOST_PACKAGES = [
  { id: 'starter', name: 'Starter Boost', price: 2000, duration: '3 days', reach: '500+ views', color: '#6e7681', icon: '🚀', features: ['Top of search results', 'Bold listing badge', 'Email to 500 seekers'] },
  { id: 'popular', name: 'Popular Boost', price: 5000, duration: '7 days', reach: '2,000+ views', color: '#1d4ed8', icon: '⭐', features: ['Homepage featured section', 'Push notification blast', 'Social media mention', 'Email to 2,000 seekers'] },
  { id: 'premium', name: 'Premium Boost', price: 15000, duration: '14 days', reach: '10,000+ views', color: '#f59e0b', icon: '👑', features: ['All Premium Boost features', 'AI-generated property video', 'Instagram + Facebook ads', 'Email to 10,000 seekers', 'VetPro recommended tag'] },
  { id: 'ultra', name: 'Ultra Boost', price: 50000, duration: '30 days', reach: '50,000+ views', color: '#10b981', icon: '💎', features: ['All channels above', 'Dedicated landing page', 'WhatsApp broadcast', 'Agency homepage spotlight', 'Guaranteed 50K impressions'] },
]

const AD_PACKAGES = [
  { id: 'banner', name: 'Banner Ad', price: 10000, duration: '/week', placement: 'All property listing pages', format: '728×90px or 320×50px mobile', color: '#6e7681', icon: '📢' },
  { id: 'sponsored', name: 'Sponsored Listing', price: 25000, duration: '/week', placement: 'Top of search results', format: 'Native property card format', color: '#1d4ed8', icon: '📌' },
  { id: 'interstitial', name: 'Full-Screen Ad', price: 50000, duration: '/week', placement: 'Between property views', format: 'Full screen 1080×1920px', color: '#f59e0b', icon: '📱' },
  { id: 'homepage', name: 'Homepage Hero', price: 150000, duration: '/week', placement: 'Marketplace homepage hero section', format: 'Premium branded content', color: '#10b981', icon: '🎯' },
  { id: 'push', name: 'Push Notification', price: 30000, duration: 'per blast', placement: 'Direct to all app users', format: 'Title + body + CTA', color: '#8b5cf6', icon: '🔔' },
]

const fmt = (n: number) => `₦${n.toLocaleString()}`

type Tab = 'plans' | 'boost' | 'advertise' | 'revenue'

export default function PricingPlans() {
  const [tab, setTab] = useState<Tab>('plans')
  const [selectedBoost, setSelectedBoost] = useState('')
  const [selectedAd, setSelectedAd] = useState('')
  const token = localStorage.getItem('accessToken')

  const initPaystack = (amount: number, description: string, planId: string) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!(window as any).PaystackPop) { alert('Payment loading... please try again in a moment.'); return }
    const handler = (window as any).PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder',
      email: user.email || 'user@veripronigeria.com',
      amount: amount * 100,
      currency: 'NGN',
      ref: `VP-${planId.toUpperCase()}-${Date.now()}`,
      metadata: { planId, description, userId: user.id },
      callback: (res: any) => {
        // Verify on backend
        fetch(`${API}/api/v1/monetization/verify-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ reference: res.reference, planId }),
        }).then(r => r.json()).then(d => {
          if (d.success) { alert(`✅ Payment successful! ${description} activated.`); window.location.reload() }
        })
      },
      onClose: () => {},
    })
    handler.openIframe()
  }

  const TABS: { id: Tab; icon: string; label: string }[] = [
    { id: 'plans', icon: '💼', label: 'Subscription Plans' },
    { id: 'boost', icon: '🚀', label: 'Boost Property' },
    { id: 'advertise', icon: '📢', label: 'Advertise' },
    { id: 'revenue', icon: '💰', label: 'Revenue Streams' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter,sans-serif' }}>
      <nav style={{ background: '#1e3a5f', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/" style={{ color: '#fff', fontWeight: 800, textDecoration: 'none' }}>🏠 VeriProp <span style={{ color: '#f59e0b' }}>Nigeria</span></a>
        <a href="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.875rem' }}>← Dashboard</a>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#1e3a5f', fontWeight: 900, fontSize: 'clamp(1.5rem,3vw,2.25rem)', margin: '0 0 0.5rem' }}>
            Grow Your Property Business
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>
            Subscriptions · Property Boosting · Advertising · Revenue Tools
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: '#fff', padding: '0.5rem', borderRadius: '0.875rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ flex: 1, minWidth: 120, padding: '0.75rem', border: 'none', background: tab === t.id ? '#1e3a5f' : 'transparent', color: tab === t.id ? '#fff' : '#64748b', borderRadius: '0.625rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── SUBSCRIPTION PLANS ── */}
        {tab === 'plans' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1.25rem' }}>
              {PLANS.map(plan => (
                <div key={plan.id} style={{ background: '#fff', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: plan.popular ? `0 8px 32px ${plan.color}30` : '0 2px 12px rgba(0,0,0,0.06)', border: plan.popular ? `2px solid ${plan.color}` : '2px solid transparent', position: 'relative' }}>
                  {plan.popular && <div style={{ background: plan.color, color: '#fff', textAlign: 'center', padding: '0.35rem', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em' }}>⭐ MOST POPULAR</div>}
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{plan.icon}</div>
                    <h3 style={{ color: '#1e3a5f', fontWeight: 800, margin: '0 0 0.25rem' }}>{plan.name}</h3>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0 0 1rem' }}>{plan.description}</p>
                    <div style={{ marginBottom: '1.25rem' }}>
                      <span style={{ color: plan.color, fontWeight: 900, fontSize: '1.75rem' }}>
                        {plan.price === 0 ? 'Free' : fmt(plan.price)}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{plan.period}</span>
                    </div>
                    <div style={{ marginBottom: '1.25rem' }}>
                      {plan.features.map(f => <div key={f} style={{ fontSize: '0.8rem', color: f.startsWith('✅') ? '#374151' : '#94a3b8', padding: '0.25rem 0' }}>{f}</div>)}
                    </div>
                    <button
                      onClick={() => plan.price > 0 ? initPaystack(plan.price, `${plan.name} subscription`, plan.id) : window.location.href = '/register'}
                      style={{ ...plan.ctaStyle, width: '100%', padding: '0.75rem', border: 'none', borderRadius: '0.625rem', fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem' }}>
                      {plan.cta}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Commission notice */}
            <div style={{ background: '#eff6ff', borderRadius: '0.875rem', padding: '1.25rem', marginTop: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: '#1d4ed8', margin: 0, fontSize: '0.875rem' }}>
                💡 <strong>Plus:</strong> VeriProp earns 5% platform fee on every escrow transaction automatically.
                At 100 transactions of ₦5M each = <strong>₦25M in platform revenue/month.</strong>
              </p>
            </div>
          </div>
        )}

        {/* ── PROPERTY BOOSTING ── */}
        {tab === 'boost' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: '#1e3a5f', fontWeight: 800, margin: '0 0 0.5rem' }}>🚀 Boost Your Property</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Get more views, leads, and faster sales with our powerful promotion packages</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              {BOOST_PACKAGES.map(pkg => (
                <div key={pkg.id} onClick={() => setSelectedBoost(pkg.id)}
                  style={{ background: '#fff', borderRadius: '1.25rem', padding: '1.5rem', cursor: 'pointer', border: `2px solid ${selectedBoost === pkg.id ? pkg.color : '#e2e8f0'}`, boxShadow: selectedBoost === pkg.id ? `0 8px 24px ${pkg.color}25` : '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.2s', transform: selectedBoost === pkg.id ? 'scale(1.02)' : 'scale(1)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{pkg.icon}</div>
                  <h3 style={{ color: '#1e3a5f', fontWeight: 800, margin: '0 0 0.25rem', fontSize: '1rem' }}>{pkg.name}</h3>
                  <div style={{ color: pkg.color, fontWeight: 900, fontSize: '1.35rem', marginBottom: '0.25rem' }}>{fmt(pkg.price)}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.875rem', flexWrap: 'wrap' }}>
                    <span style={{ background: `${pkg.color}15`, color: pkg.color, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>⏱ {pkg.duration}</span>
                    <span style={{ background: '#f0fdf4', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>👁 {pkg.reach}</span>
                  </div>
                  {pkg.features.map(f => <div key={f} style={{ fontSize: '0.78rem', color: '#64748b', padding: '0.2rem 0' }}>✓ {f}</div>)}
                </div>
              ))}
            </div>
            {selectedBoost && (
              <div style={{ background: '#fff', borderRadius: '0.875rem', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e3a5f' }}>
                      {BOOST_PACKAGES.find(p => p.id === selectedBoost)?.name} Selected
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.875rem' }}>
                      {fmt(BOOST_PACKAGES.find(p => p.id === selectedBoost)?.price || 0)} · {BOOST_PACKAGES.find(p => p.id === selectedBoost)?.duration}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const pkg = BOOST_PACKAGES.find(p => p.id === selectedBoost)
                      if (pkg) initPaystack(pkg.price, `${pkg.name} property boost`, `boost_${pkg.id}`)
                    }}
                    style={{ background: '#f59e0b', color: '#1e3a5f', padding: '0.75rem 2rem', border: 'none', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem' }}>
                    🚀 Boost Now — Pay with Paystack
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ADVERTISING ── */}
        {tab === 'advertise' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: '#1e3a5f', fontWeight: 800, margin: '0 0 0.5rem' }}>📢 Advertise on VeriProp Nigeria</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Reach thousands of active property buyers, sellers, agents, and investors daily</p>
            </div>

            {/* Audience stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '0.875rem', marginBottom: '1.5rem' }}>
              {[
                { icon: '👥', value: '50K+', label: 'Monthly Users' },
                { icon: '🏠', value: '12K+', label: 'Property Seekers' },
                { icon: '🤝', value: '2K+', label: 'Active Agents' },
                { icon: '💰', value: '₦5M+', label: 'Avg Transaction' },
                { icon: '📱', value: '78%', label: 'Mobile Users' },
                { icon: '🇳🇬', value: '36', label: 'States Covered' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
                  <div style={{ fontWeight: 900, color: '#1e3a5f', fontSize: '1.1rem' }}>{s.value}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Ad packages */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {AD_PACKAGES.map(pkg => (
                <div key={pkg.id} onClick={() => setSelectedAd(pkg.id)}
                  style={{ background: '#fff', borderRadius: '1rem', padding: '1.25rem', cursor: 'pointer', border: `2px solid ${selectedAd === pkg.id ? pkg.color : '#e2e8f0'}`, transition: 'all 0.2s', transform: selectedAd === pkg.id ? 'scale(1.02)' : 'scale(1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{pkg.icon}</div>
                      <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '0.95rem' }}>{pkg.name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: pkg.color, fontWeight: 900, fontSize: '1.1rem' }}>{fmt(pkg.price)}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{pkg.duration}</div>
                    </div>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.5rem' }}>📍 {pkg.placement}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>🎨 {pkg.format}</div>
                </div>
              ))}
            </div>

            {/* Who can advertise */}
            <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '1rem' }}>
              <h3 style={{ color: '#1e3a5f', fontWeight: 700, margin: '0 0 1rem' }}>🎯 Who Can Advertise?</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '0.75rem' }}>
                {[
                  { icon: '🏢', title: 'Property Developers', desc: 'Promote new projects & off-plan sales' },
                  { icon: '🏦', title: 'Banks & Fintechs', desc: 'Mortgage & home loan products' },
                  { icon: '📱', title: 'Content Creators', desc: 'Real estate YouTube/Instagram' },
                  { icon: '⚖️', title: 'Legal Services', desc: 'Property lawyers & conveyancers' },
                  { icon: '🔨', title: 'Contractors', desc: 'Construction & renovation services' },
                  { icon: '🛋️', title: 'Interior Design', desc: 'Furniture & decor brands' },
                  { icon: '🔐', title: 'Security Companies', desc: 'Smart home & surveillance' },
                  { icon: '🌍', title: 'Diaspora Services', desc: 'Remittance & foreign exchange' },
                ].map(a => (
                  <div key={a.title} style={{ background: '#f8fafc', borderRadius: '0.625rem', padding: '0.875rem' }}>
                    <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{a.icon}</div>
                    <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '0.8rem' }}>{a.title}</div>
                    <div style={{ color: '#64748b', fontSize: '0.72rem', marginTop: '0.15rem' }}>{a.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {selectedAd && (
              <div style={{ background: '#fff', borderRadius: '0.875rem', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#1e3a5f' }}>{AD_PACKAGES.find(p => p.id === selectedAd)?.name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.875rem' }}>{fmt(AD_PACKAGES.find(p => p.id === selectedAd)?.price || 0)} {AD_PACKAGES.find(p => p.id === selectedAd)?.duration}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => {
                    const pkg = AD_PACKAGES.find(p => p.id === selectedAd)
                    if (pkg) initPaystack(pkg.price, `${pkg.name} advertising`, `ad_${pkg.id}`)
                  }}
                    style={{ background: '#1d4ed8', color: '#fff', padding: '0.75rem 1.5rem', border: 'none', borderRadius: '0.75rem', fontWeight: 800, cursor: 'pointer', fontSize: '0.875rem' }}>
                    📢 Book This Ad
                  </button>
                  <a href="mailto:ads@veripronigeria.com" style={{ background: '#f8fafc', color: '#1e3a5f', padding: '0.75rem 1.25rem', borderRadius: '0.75rem', fontWeight: 700, textDecoration: 'none', fontSize: '0.875rem', border: '1px solid #e2e8f0' }}>
                    Custom Package →
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── REVENUE STREAMS ── */}
        {tab === 'revenue' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ color: '#1e3a5f', fontWeight: 800, margin: '0 0 0.5rem' }}>💰 VeriProp Revenue Model</h2>
              <p style={{ color: '#64748b' }}>8 diversified income streams for sustainable zero-cost-to-scale growth</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1rem' }}>
              {[
                { icon: '🔐', stream: '1. Escrow Fees', model: '5% per transaction', example: '₦5M deal = ₦250K fee', potential: '₦25M+/month at scale', color: '#1d4ed8', type: 'Core' },
                { icon: '💼', stream: '2. Subscriptions', model: '₦15K-₦150K/month', example: '100 agents × ₦15K = ₦1.5M/mo', potential: '₦5M+/month', color: '#10b981', type: 'Recurring' },
                { icon: '🚀', stream: '3. Property Boosting', model: '₦2K-₦50K per boost', example: '200 boosts × ₦5K = ₦1M/mo', potential: '₦2M+/month', color: '#f59e0b', type: 'Transactional' },
                { icon: '📢', stream: '4. Advertising', model: '₦10K-₦500K/campaign', example: '10 advertisers × ₦50K = ₦500K/wk', potential: '₦2M+/month', color: '#8b5cf6', type: 'Media' },
                { icon: '⚖️', stream: '5. Legal Services', model: '₦50K-₦200K per deed', example: '20 deeds × ₦75K = ₦1.5M/mo', potential: '₦3M+/month', color: '#ef4444', type: 'Professional' },
                { icon: '📊', stream: '6. Valuation Reports', model: '₦10K-₦50K per report', example: '100 reports × ₦15K = ₦1.5M/mo', potential: '₦1.5M+/month', color: '#06b6d4', type: 'Data' },
                { icon: '🏗️', stream: '7. Developer Pages', model: '₦100K-₦500K/month', example: '10 developers × ₦150K = ₦1.5M/mo', potential: '₦2M+/month', color: '#10b981', type: 'Enterprise' },
                { icon: '🤖', stream: '8. AI Advisory API', model: '₦500-₦5K per query', example: '5,000 queries × ₦1K = ₦5M/mo', potential: '₦5M+/month', color: '#1d4ed8', type: 'Technology' },
              ].map(s => (
                <div key={s.stream} style={{ background: '#fff', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${s.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
                    <span style={{ background: `${s.color}15`, color: s.color, padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700 }}>{s.type}</span>
                  </div>
                  <div style={{ fontWeight: 800, color: '#1e3a5f', marginBottom: '0.25rem' }}>{s.stream}</div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.25rem' }}>Model: {s.model}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.5rem' }}>Example: {s.example}</div>
                  <div style={{ color: s.color, fontWeight: 700, fontSize: '0.875rem' }}>🎯 {s.potential}</div>
                </div>
              ))}
            </div>
            {/* Total potential */}
            <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#1d4ed8)', borderRadius: '1rem', padding: '1.5rem', marginTop: '1.5rem', color: '#fff', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💎</div>
              <h3 style={{ fontWeight: 900, fontSize: '1.25rem', margin: '0 0 0.5rem' }}>Combined Revenue Potential</h3>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b', marginBottom: '0.5rem' }}>₦45M+/month</div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', margin: 0 }}>
                At 1% market penetration of Lagos property market alone. Zero marginal cost to scale — all automated.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
