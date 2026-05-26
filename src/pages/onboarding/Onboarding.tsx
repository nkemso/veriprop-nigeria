import React, { useState, useEffect } from 'react'

const SCREENS = [
  {
    id: 1,
    bg: 'linear-gradient(160deg, #0f0c29, #302b63, #24243e)',
    tag: '🏙️ LUXURY PENTHOUSE',
    headline: 'Own Lagos\u2019 Most Exclusive\nSky Residences',
    sub: 'Verified titles. Zero fraud. Every naira protected.',
    badge: '📍 Victoria Island, Lagos',
    stat1: { value: '₦2.4B+', label: 'Secured in Escrow' },
    stat2: { value: '12,000+', label: 'Verified Properties' },
    cta: 'Explore Penthouses →',
    img: '🏙️',
    accent: '#f59e0b',
  },
  {
    id: 2,
    bg: 'linear-gradient(160deg, #1a1a2e, #16213e, #0f3460)',
    tag: '🏡 ABUJA ESTATE',
    headline: 'Secure Your Family\u2019s\nForever Home',
    sub: 'Multi-Sig escrow ensures your funds are untouchable until you\u2019re satisfied.',
    badge: '📍 Maitama, Abuja FCT',
    stat1: { value: '3-Tier', label: 'Identity Verification' },
    stat2: { value: '2-of-3', label: 'Multi-Sig Release' },
    cta: 'Browse Estates →',
    img: '🏡',
    accent: '#10b981',
  },
  {
    id: 3,
    bg: 'linear-gradient(160deg, #1e3c72, #2a5298, #1e3c72)',
    tag: '🏢 COMMERCIAL SPACE',
    headline: 'Grow Your Business\nin Prime Locations',
    sub: 'AI-verified listings. Transparent pricing. Institutional-grade transactions.',
    badge: '📍 Lekki, Lagos Island',
    stat1: { value: '5%', label: 'Platform Fee Only' },
    stat2: { value: '24hrs', label: 'Fund Release' },
    cta: 'View Commercial →',
    img: '🏢',
    accent: '#3b82f6',
  },
  {
    id: 4,
    bg: 'linear-gradient(160deg, #0d1b2a, #1b4332, #0d1b2a)',
    tag: '🇳🇬 JOIN VERIPROP',
    headline: 'Nigeria\u2019s Most Trusted\nProperty Marketplace',
    sub: 'Choose your role and start your verified journey today.',
    badge: '✅ Free to join · Verified & Secure',
    stat1: { value: '0%', label: 'Fraud Rate' },
    stat2: { value: '100%', label: 'Escrow Protected' },
    cta: null,
    img: '🏠',
    accent: '#f59e0b',
  },
]

const ROLES = [
  { value: 'buyer', icon: '🏠', label: 'Buyer', desc: 'Find & buy properties' },
  { value: 'seller', icon: '🔑', label: 'Seller', desc: 'List & sell properties' },
  { value: 'agent', icon: '🤝', label: 'Agent', desc: 'Represent clients' },
  { value: 'landlord', icon: '🏗️', label: 'Landlord', desc: 'Rent out properties' },
  { value: 'developer', icon: '🏙️', label: 'Developer', desc: 'Large-scale projects' },
  { value: 'investor', icon: '💰', label: 'Investor', desc: 'Portfolio investment' },
]

export default function Onboarding() {
  const [screen, setScreen] = useState(0)
  const [selectedRole, setSelectedRole] = useState('')
  const [auto, setAuto] = useState(true)

  // Auto-advance screens 0-2
  useEffect(() => {
    if (!auto || screen >= 3) return
    const t = setTimeout(() => setScreen(s => s + 1), 3500)
    return () => clearTimeout(t)
  }, [screen, auto])

  const skip = () => { setAuto(false); setScreen(3) }
  const s = SCREENS[screen]

  return (
    <div style={{ minHeight: '100vh', background: s.bg, fontFamily: 'Inter,sans-serif', transition: 'background 0.8s ease', position: 'relative', overflow: 'hidden' }}>
      {/* Skip button */}
      {screen < 3 && (
        <button onClick={skip} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '0.4rem 1rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.8rem', zIndex: 10 }}>
          Skip →
        </button>
      )}

      {/* Progress dots */}
      <div style={{ position: 'absolute', top: '1.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
        {SCREENS.map((_, i) => (
          <div key={i} onClick={() => { setAuto(false); setScreen(i) }}
            style={{ width: i === screen ? 24 : 8, height: 8, borderRadius: 999, background: i === screen ? s.accent : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.3s' }} />
        ))}
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '4rem 1.5rem 2rem', textAlign: 'center' }}>

        {/* Tag */}
        <div style={{ background: 'rgba(255,255,255,0.1)', border: `1px solid ${s.accent}40`, color: s.accent, padding: '0.35rem 1rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2rem' }}>
          {s.tag}
        </div>

        {/* Hero emoji */}
        <div style={{ fontSize: '5rem', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.2))' }}>{s.img}</div>

        {/* Headline */}
        <h1 style={{ color: '#fff', fontSize: 'clamp(1.75rem, 5vw, 3rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: '1rem', maxWidth: 600, whiteSpace: 'pre-line' }}>
          {s.headline}
        </h1>

        {/* Sub */}
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', maxWidth: 480, lineHeight: 1.7, marginBottom: '2rem' }}>{s.sub}</p>

        {/* Badge */}
        <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', padding: '0.5rem 1.25rem', borderRadius: '0.75rem', fontSize: '0.85rem', marginBottom: '2rem' }}>
          {s.badge}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[s.stat1, s.stat2].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ color: s.accent, fontWeight: 900, fontSize: '1.5rem' }}>{stat.value}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Screen 4: Role Selection */}
        {screen === 3 ? (
          <div style={{ width: '100%', maxWidth: 520 }}>
            <h2 style={{ color: '#fff', fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem' }}>I am joining as a...</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {ROLES.map(r => (
                <button key={r.value} onClick={() => setSelectedRole(r.value)}
                  style={{ background: selectedRole === r.value ? s.accent : 'rgba(255,255,255,0.08)', border: `2px solid ${selectedRole === r.value ? s.accent : 'rgba(255,255,255,0.15)'}`, borderRadius: '0.75rem', padding: '0.875rem 0.5rem', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{r.icon}</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>{r.label}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem', marginTop: '0.15rem' }}>{r.desc}</div>
                </button>
              ))}
            </div>
            <a href={selectedRole ? `/register?role=${selectedRole}` : '/register'}
              style={{ display: 'block', background: s.accent, color: '#1e3a5f', padding: '1rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '1.05rem', textDecoration: 'none', marginBottom: '0.75rem', textAlign: 'center' }}>
              {selectedRole ? `Continue as ${ROLES.find(r=>r.value===selectedRole)?.label} →` : 'Create Free Account →'}
            </a>
            <a href="/login" style={{ display: 'block', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.875rem', textAlign: 'center' }}>
              Already have an account? <span style={{ color: '#fff', fontWeight: 700 }}>Sign In</span>
            </a>
          </div>
        ) : (
          <button onClick={() => { setAuto(false); setScreen(s => Math.min(3, s + 1)) }}
            style={{ background: s.accent, color: '#1e3a5f', padding: '0.875rem 2.5rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '1rem', border: 'none', cursor: 'pointer' }}>
            {s.cta}
          </button>
        )}

        {/* Trust badges */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {['🛡️ Zero-Trust Security', '🔒 Escrow Protected', '🤖 AI Verified', '⚖️ NDPR Compliant'].map(b => (
            <span key={b} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>{b}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
