import React, { useState, useCallback } from 'react'
import SecureEntry from './SecureEntry'
import AIJourneyWalkthrough from './AIJourneyWalkthrough'

// SCREEN_69 — Unified WoW Onboarding orchestrator
// Combines: SecureEntry → AI Walkthrough → Property Teasers → Role Hub

const TEASERS = [
  {
    bg: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)',
    tag: '🏙️ LUXURY PENTHOUSE',
    headline: 'Own Lagos\u2019 Most Exclusive\nSky Residences',
    sub: 'Verified titles. Zero fraud. Every naira protected.',
    badge: '📍 Victoria Island, Lagos',
    stats: [{ v: '₦2.4B+', l: 'Secured in Escrow' }, { v: '12,000+', l: 'Verified Properties' }],
    accent: '#f59e0b',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
    ],
  },
  {
    bg: 'linear-gradient(160deg,#1a1a2e,#16213e,#0f3460)',
    tag: '🏡 ABUJA ESTATE',
    headline: 'Secure Your Family\u2019s\nForever Home',
    sub: 'Multi-Sig escrow ensures your funds are untouchable until you\u2019re satisfied.',
    badge: '📍 Maitama, Abuja FCT',
    stats: [{ v: '2-Step', l: 'KYC Verification' }, { v: '2-of-3', l: 'Multi-Sig Release' }],
    accent: '#10b981',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80',
    ],
  },
  {
    bg: 'linear-gradient(160deg,#1e3c72,#2a5298,#1e3c72)',
    tag: '🏢 COMMERCIAL SPACE',
    headline: 'Grow Your Business\nin Prime Locations',
    sub: 'AI-verified listings. Transparent pricing. Institutional-grade transactions.',
    badge: '📍 Lekki, Lagos Island',
    stats: [{ v: '2.5%', l: 'Platform Fee' }, { v: '24hrs', l: 'Fund Release' }],
    accent: '#3b82f6',
    images: [
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80',
    ],
  },
]

const ROLES = [
  { v: 'buyer', icon: '🏠', label: 'Buyer', desc: 'Find & buy/rent' },
  { v: 'seller', icon: '🔑', label: 'Seller', desc: 'List & sell' },
  { v: 'agent', icon: '🤝', label: 'Agent', desc: 'Represent clients' },
  { v: 'landlord', icon: '🏗️', label: 'Landlord', desc: 'Rent out property' },
  { v: 'developer', icon: '🏙️', label: 'Developer', desc: 'Large projects' },
  { v: 'investor', icon: '💰', label: 'Investor', desc: 'Build portfolio' },
]

function ImageCarousel({ images, accent }: { images: string[]; accent: string }) {
  const [cur, setCur] = React.useState(0)
  const [fade, setFade] = React.useState(false)
  React.useEffect(() => {
    const t = setInterval(() => {
      setFade(true)
      setTimeout(() => { setCur(c => (c + 1) % images.length); setFade(false) }, 800)
    }, 4000)
    return () => clearInterval(t)
  }, [images.length])
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '1rem', overflow: 'hidden' }}>
      <img src={images[cur]} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: fade ? 0 : 1, transition: 'opacity 0.8s', transform: 'scale(1.02)' }}
        onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${cur}/800/600` }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)' }} />
      <div style={{ position: 'absolute', bottom: '0.75rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.375rem' }}>
        {images.map((_, i) => <div key={i} onClick={() => setCur(i)} style={{ width: i === cur ? 20 : 6, height: 6, borderRadius: 999, background: i === cur ? accent : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.3s' }} />)}
      </div>
    </div>
  )
}

type Phase = 'entry' | 'ai' | 'teasers' | 'roles'

export default function UnifiedOnboarding() {
  const [phase, setPhase] = useState<Phase>('entry')
  const [teaserIdx, setTeaserIdx] = useState(0)
  const [selectedRole, setSelectedRole] = useState('')
  const [autoTimer, setAutoTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [progress, setProgress] = useState(0)
  const TEASER_DURATION = 8000

  const goToTeasers = useCallback(() => setPhase('teasers'), [])
  const goToRoles = useCallback(() => setPhase('roles'), [])

  // Auto-advance teasers
  React.useEffect(() => {
    if (phase !== 'teasers') return
    setProgress(0)
    const step = 100 / (TEASER_DURATION / 60)
    const pTimer = setInterval(() => setProgress(p => Math.min(100, p + step)), 60)
    const t = setTimeout(() => {
      if (teaserIdx < TEASERS.length - 1) { setTeaserIdx(i => i + 1) }
      else { setPhase('roles') }
    }, TEASER_DURATION)
    setAutoTimer(t)
    return () => { clearTimeout(t); clearInterval(pTimer) }
  }, [phase, teaserIdx])

  const skipToRoles = () => {
    if (autoTimer) clearTimeout(autoTimer)
    setPhase('roles')
  }

  const goTeaser = (i: number) => {
    if (autoTimer) clearTimeout(autoTimer)
    setTeaserIdx(i)
    setProgress(0)
  }

  // ── SECURE ENTRY ──
  if (phase === 'entry') return <SecureEntry onComplete={() => setPhase('ai')} />

  // ── AI WALKTHROUGH ──
  if (phase === 'ai') return <AIJourneyWalkthrough onComplete={goToTeasers} />

  const s = TEASERS[teaserIdx]

  // ── PROPERTY TEASERS ──
  if (phase === 'teasers') return (
    <div style={{ minHeight: '100vh', background: s.bg, fontFamily: 'Inter,sans-serif', transition: 'background 1s ease', display: 'flex', flexDirection: 'column' }}>
      {/* Progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.1)' }}>
        <div style={{ height: '100%', background: s.accent, width: `${progress}%`, transition: 'width 0.06s linear', borderRadius: '0 999px 999px 0' }} />
      </div>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🏠</span>
          <span style={{ color: '#fff', fontWeight: 800 }}>VeriProp <span style={{ color: s.accent }}>Nigeria</span></span>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          {TEASERS.map((_, i) => <div key={i} onClick={() => goTeaser(i)} style={{ width: i === teaserIdx ? 24 : 8, height: 8, borderRadius: 999, background: i === teaserIdx ? s.accent : 'rgba(255,255,255,0.25)', cursor: 'pointer', transition: 'all 0.3s' }} />)}
        </div>
        <button onClick={skipToRoles} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.35rem 0.875rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
          Skip →
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem 1.5rem 2rem' }}>
        <div style={{ width: '100%', maxWidth: 860, display: 'grid', gridTemplateColumns: window.innerWidth > 680 ? '1fr 1fr' : '1fr', gap: '1.5rem', alignItems: 'center' }}>
          {/* Image */}
          <div style={{ height: 360, position: 'relative' }}>
            <ImageCarousel images={s.images} accent={s.accent} />
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', color: s.accent, padding: '0.3rem 0.875rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>
              {s.tag}
            </div>
          </div>

          {/* Text */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)', padding: '0.3rem 0.875rem', borderRadius: '999px', fontSize: '0.75rem', marginBottom: '1rem' }}>
              {s.badge}
            </div>
            <h1 style={{ color: '#fff', fontSize: 'clamp(1.5rem,3.5vw,2.5rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: '0.875rem', whiteSpace: 'pre-line' }}>{s.headline}</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: '1.5rem', fontSize: '0.95rem' }}>{s.sub}</p>
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
              {s.stats.map(st => (
                <div key={st.l}>
                  <div style={{ color: s.accent, fontWeight: 900, fontSize: '1.5rem' }}>{st.v}</div>
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{st.l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button onClick={() => teaserIdx < TEASERS.length - 1 ? goTeaser(teaserIdx + 1) : setPhase('roles')}
                style={{ background: s.accent, color: '#1e3a5f', padding: '0.875rem 1.75rem', borderRadius: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '0.95rem' }}>
                {teaserIdx < TEASERS.length - 1 ? 'Next →' : 'Get Started →'}
              </button>
              <button onClick={skipToRoles}
                style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '0.875rem 1.25rem', borderRadius: '0.75rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '0.95rem' }}>
                Skip Intro
              </button>
            </div>
            <div style={{ marginTop: '0.875rem', color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem' }}>
              Auto-advancing in {Math.max(0, Math.ceil((TEASER_DURATION * (1 - progress / 100)) / 1000))}s
            </div>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', padding: '1rem', flexWrap: 'wrap' }}>
        {['🛡️ Zero-Trust', '🔐 Escrow Protected', '🤖 AI Verified', '⚖️ NDPR Compliant'].map(b => (
          <span key={b} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>{b}</span>
        ))}
      </div>
    </div>
  )

  // ── ROLE HUB ── SCREEN_138
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0d1b2a,#1b4332,#0d1b2a)', fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      {/* Image strip */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', height: 80, width: '100%', maxWidth: 560, overflow: 'hidden', borderRadius: '0.875rem', opacity: 0.5 }}>
        {TEASERS.flatMap(t => t.images.slice(0, 2)).slice(0, 6).map((img, i) => (
          <div key={i} style={{ flex: 1, flexShrink: 0, borderRadius: '0.375rem', overflow: 'hidden' }}>
            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${i + 20}/200/80` }} />
          </div>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginBottom: '2rem', maxWidth: 520 }}>
        <div style={{ display: 'inline-flex', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', padding: '0.3rem 0.875rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '1rem' }}>
          🇳🇬 JOIN VERIPROP NIGERIA
        </div>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(1.75rem,4vw,2.75rem)', lineHeight: 1.15, marginBottom: '0.75rem' }}>
          Nigeria&apos;s Most Trusted<br />Property Marketplace
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          Choose your role and start your secure, AI-verified property journey today.
        </p>
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '1rem' }}>
          {[{ v: '0%', l: 'Fraud Rate' }, { v: '100%', l: 'Escrow Protected' }].map(s => (
            <div key={s.l}>
              <div style={{ color: '#f59e0b', fontWeight: 900, fontSize: '1.4rem' }}>{s.v}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Role grid */}
      <div style={{ width: '100%', maxWidth: 520, marginBottom: '1.5rem' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600 }}>I am joining as a...</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
          {ROLES.map(r => (
            <button key={r.v} onClick={() => setSelectedRole(r.v)}
              style={{ background: selectedRole === r.v ? '#f59e0b' : 'rgba(255,255,255,0.07)', border: `2px solid ${selectedRole === r.v ? '#f59e0b' : 'rgba(255,255,255,0.12)'}`, borderRadius: '0.875rem', padding: '1rem 0.5rem', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', transform: selectedRole === r.v ? 'scale(1.04)' : 'scale(1)' }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.3rem' }}>{r.icon}</div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.82rem' }}>{r.label}</div>
              <div style={{ color: selectedRole === r.v ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)', fontSize: '0.65rem', marginTop: '0.15rem' }}>{r.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 520 }}>
        <a href={selectedRole ? `/register?role=${selectedRole}` : '/register'}
          onClick={() => localStorage.setItem('vp_onboarding_seen', '1')}
          style={{ display: 'block', textAlign: 'center', background: '#f59e0b', color: '#1e3a5f', padding: '1rem', borderRadius: '0.875rem', fontWeight: 800, fontSize: '1.05rem', textDecoration: 'none', marginBottom: '0.75rem', boxShadow: '0 8px 24px rgba(245,158,11,0.35)' }}>
          {selectedRole ? `Continue as ${ROLES.find(r => r.v === selectedRole)?.label} →` : 'Create Free Account →'}
        </a>
        <div style={{ textAlign: 'center', display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
          <a href="/login" onClick={() => localStorage.setItem('vp_onboarding_seen', '1')}
            style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: '0.85rem' }}>
            Already have an account? <span style={{ color: '#fff', fontWeight: 700 }}>Sign In</span>
          </a>
          <a href="/?skip=1" onClick={() => localStorage.setItem('vp_onboarding_seen', '1')}
            style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontSize: '0.85rem' }}>
            Browse →
          </a>
        </div>
      </div>
    </div>
  )
}
