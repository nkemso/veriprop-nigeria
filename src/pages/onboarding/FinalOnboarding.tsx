import React, { useState, useEffect, useRef, useCallback } from 'react'

// ================================================================
// VERIPROP NIGERIA — FINAL PRODUCTION ONBOARDING
// SCREEN_162 + SCREEN_8 + SCREEN_152
// Sequence: Premium Teasers → VetPro AI Welcome → Role Hub
// ================================================================

const PROPERTY_TEASERS = [
  {
    id: 1,
    tag: '🏙️ LUXURY PENTHOUSE',
    headline: 'Own Lagos\u2019 Most\nExclusive Sky Residences',
    sub: 'Verified titles. Multi-sig escrow. Every naira protected.',
    badge: '📍 Victoria Island, Lagos',
    stats: [{ v: '₦2.4B+', l: 'In Escrow' }, { v: '12,000+', l: 'Verified' }],
    accent: '#f59e0b',
    bg: 'linear-gradient(160deg,#0f0c29,#302b63,#24243e)',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    ],
  },
  {
    id: 2,
    tag: '🏡 ABUJA ESTATE',
    headline: 'Your Family\u2019s Forever\nHome — Secured',
    sub: '2-of-3 multi-signature escrow. Funds only release when you approve.',
    badge: '📍 Maitama, Abuja FCT',
    stats: [{ v: '3-Tier', l: 'KYC Guard' }, { v: '2-of-3', l: 'Multi-Sig' }],
    accent: '#10b981',
    bg: 'linear-gradient(160deg,#1a1a2e,#16213e,#0f3460)',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
    ],
  },
  {
    id: 3,
    tag: '🏢 COMMERCIAL SPACE',
    headline: 'Prime Locations for\nYour Growing Business',
    sub: 'AI-verified listings. Transparent pricing. Institutional-grade security.',
    badge: '📍 Lekki, Lagos Island',
    stats: [{ v: '5%', l: 'Platform Fee' }, { v: '<2s', l: 'KYC Speed' }],
    accent: '#3b82f6',
    bg: 'linear-gradient(160deg,#1e3c72,#2a5298,#1e3c72)',
    images: [
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80',
    ],
  },
]

const VETPRO_DIALOGUE = [
  {
    icon: '🤖',
    title: 'Hello, I\'m VetPro.',
    lines: [
      "I'm the AI intelligence behind VeriProp Nigeria.",
      "Every property listing you see — I've already verified it.",
      "Every transaction — I guard it with multi-signature security.",
      "Every chat — I ensure no personal contact slips through.",
    ],
    accent: '#3b82f6',
  },
  {
    icon: '🛡️',
    title: 'I Protect Every Naira.',
    lines: [
      "Your money goes into secure escrow — not the seller's pocket.",
      "Funds only move when you AND the seller both approve.",
      "Plus, our Legal team provides a third signature for disputes.",
      "We auto-split: platform fee, agent commission, tax — all instant.",
    ],
    accent: '#10b981',
  },
  {
    icon: '🔍',
    title: 'I Verify Every Identity.',
    lines: [
      "Tier 1: NIN verification — your bank confirms you.",
      "Tier 2: Government ID — NIN, Passport, or Driver's License.",
      "Tier 3: Selfie Liveness — powered by Didit AI (sub-2 seconds).",
      "No anonymous users. No fake listings. Period.",
    ],
    accent: '#f59e0b',
  },
  {
    icon: '💬',
    title: 'I Monitor All Communications.',
    lines: [
      "All conversations stay on VeriProp — closed loop policy.",
      "I automatically redact phone numbers and external links.",
      "Fraud patterns trigger instant alerts to our compliance team.",
      "Your privacy. Your security. My responsibility.",
    ],
    accent: '#8b5cf6',
  },
]

const ROLES = [
  { v: 'buyer', icon: '🏠', label: 'Buyer', desc: 'Find & buy/rent property' },
  { v: 'seller', icon: '🔑', label: 'Seller', desc: 'List & sell property' },
  { v: 'agent', icon: '🤝', label: 'Agent', desc: 'Represent clients' },
  { v: 'landlord', icon: '🏗️', label: 'Landlord', desc: 'Rent out property' },
  { v: 'developer', icon: '🏙️', label: 'Developer', desc: 'Large-scale projects' },
  { v: 'investor', icon: '💰', label: 'Investor', desc: 'Build portfolio' },
  { v: 'lawyer', icon: '⚖️', label: 'Legal Pro', desc: 'Property law & deeds' },
  { v: 'surveyor', icon: '📐', label: 'Surveyor', desc: 'Property valuation' },
]

// Image carousel
function ImageCarousel({ images, accent }: { images: string[]; accent: string }) {
  const [cur, setCur] = React.useState(0)
  const [fade, setFade] = React.useState(false)
  React.useEffect(() => {
    const t = setInterval(() => {
      setFade(true)
      setTimeout(() => { setCur(c => (c + 1) % images.length); setFade(false) }, 700)
    }, 4000)
    return () => clearInterval(t)
  }, [images.length])
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '1rem', overflow: 'hidden' }}>
      <img src={images[cur]} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: fade ? 0 : 1, transition: 'opacity 0.7s ease', transform: 'scale(1.02)' }}
        onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${cur}/800/600` }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,0.5) 0%,transparent 60%)' }} />
      <div style={{ position: 'absolute', bottom: '0.75rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.375rem' }}>
        {images.map((_, i) => <div key={i} onClick={() => setCur(i)} style={{ width: i === cur ? 20 : 6, height: 6, borderRadius: 999, background: i === cur ? accent : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.3s' }} />)}
      </div>
    </div>
  )
}

// Typewriter component
function Typewriter({ text, speed = 22, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [shown, setShown] = React.useState('')
  React.useEffect(() => {
    setShown('')
    let i = 0
    const t = setInterval(() => {
      setShown(text.slice(0, i + 1))
      i++
      if (i >= text.length) { clearInterval(t); onDone?.() }
    }, speed)
    return () => clearInterval(t)
  }, [text, speed])
  return <span>{shown}{shown.length < text.length && <span style={{ opacity: 0.7 }}>▍</span>}</span>
}

type Phase = 'teasers' | 'vetpro' | 'roles'

export default function FinalOnboarding() {
  const [phase, setPhase] = useState<Phase>('teasers')
  const [teaserIdx, setTeaserIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [dialogueIdx, setDialogueIdx] = useState(0)
  const [lineIdx, setLineIdx] = useState(0)
  const [lineDone, setLineDone] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const autoRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const TEASER_DURATION = 8000

  // Auto-advance teasers
  useEffect(() => {
    if (phase !== 'teasers') return
    setProgress(0)
    const step = 100 / (TEASER_DURATION / 60)
    const p = setInterval(() => setProgress(v => Math.min(100, v + step)), 60)
    const t = setTimeout(() => {
      if (teaserIdx < PROPERTY_TEASERS.length - 1) { setTeaserIdx(i => i + 1) }
      else setPhase('vetpro')
    }, TEASER_DURATION)
    autoRef.current = t
    return () => { clearTimeout(t); clearInterval(p) }
  }, [phase, teaserIdx])

  const skipTeasers = () => {
    if (autoRef.current) clearTimeout(autoRef.current)
    setPhase('vetpro')
  }

  const goTeaser = (i: number) => {
    if (autoRef.current) clearTimeout(autoRef.current)
    setTeaserIdx(i); setProgress(0)
  }

  // Advance dialogue lines
  useEffect(() => {
    if (phase !== 'vetpro' || !lineDone) return
    const d = VETPRO_DIALOGUE[dialogueIdx]
    if (lineIdx < d.lines.length - 1) {
      setTimeout(() => { setLineIdx(l => l + 1); setLineDone(false) }, 800)
    }
  }, [lineDone, phase, dialogueIdx, lineIdx])

  const nextDialogue = () => {
    if (dialogueIdx < VETPRO_DIALOGUE.length - 1) {
      setDialogueIdx(d => d + 1); setLineIdx(0); setLineDone(false)
    } else {
      setPhase('roles')
    }
  }

  const s = PROPERTY_TEASERS[teaserIdx]
  const d = VETPRO_DIALOGUE[dialogueIdx]

  // ── PHASE 1: PROPERTY TEASERS ──────────────────────────────────
  if (phase === 'teasers') return (
    <div style={{ minHeight: '100vh', background: s.bg, fontFamily: 'Inter,sans-serif', transition: 'background 1.2s ease', display: 'flex', flexDirection: 'column' }}>
      {/* Progress bar */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.1)' }}>
        <div style={{ height: '100%', background: s.accent, width: `${progress}%`, transition: 'width 0.06s linear', borderRadius: '0 999px 999px 0' }} />
      </div>

      {/* Top nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>🏠</span>
          <span style={{ color: '#fff', fontWeight: 900 }}>VeriProp <span style={{ color: s.accent }}>Nigeria</span></span>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
          {PROPERTY_TEASERS.map((_, i) => <div key={i} onClick={() => goTeaser(i)} style={{ width: i === teaserIdx ? 24 : 8, height: 8, borderRadius: 999, background: i === teaserIdx ? s.accent : 'rgba(255,255,255,0.25)', cursor: 'pointer', transition: 'all 0.3s' }} />)}
        </div>
        <button onClick={skipTeasers} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.35rem 0.875rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
          Skip →
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem 1.5rem 2rem' }}>
        <div style={{ width: '100%', maxWidth: 880, display: 'grid', gridTemplateColumns: window.innerWidth > 680 ? '1fr 1fr' : '1fr', gap: '1.5rem', alignItems: 'center' }}>
          {/* Image carousel */}
          <div style={{ height: 360, position: 'relative' }}>
            <ImageCarousel images={s.images} accent={s.accent} />
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', color: s.accent, padding: '0.3rem 0.875rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>
              {s.tag}
            </div>
          </div>

          {/* Text */}
          <div>
            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)', padding: '0.3rem 0.875rem', borderRadius: '999px', fontSize: '0.75rem', marginBottom: '1rem' }}>
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
              <button onClick={() => teaserIdx < PROPERTY_TEASERS.length - 1 ? goTeaser(teaserIdx + 1) : setPhase('vetpro')}
                style={{ background: s.accent, color: '#1e3a5f', padding: '0.875rem 1.75rem', borderRadius: '0.75rem', fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: '0.95rem', boxShadow: `0 8px 24px ${s.accent}40` }}>
                {teaserIdx < PROPERTY_TEASERS.length - 1 ? 'Next →' : 'Meet VetPro AI →'}
              </button>
              <button onClick={skipTeasers} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '0.875rem 1.25rem', borderRadius: '0.75rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '0.95rem' }}>
                Skip Intro
              </button>
            </div>
            <div style={{ marginTop: '0.75rem', color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem' }}>
              Auto-advancing in {Math.max(0, Math.ceil((TEASER_DURATION * (1 - progress / 100)) / 1000))}s
            </div>
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', padding: '1rem', flexWrap: 'wrap' }}>
        {['🛡️ Zero-Trust', '🔒 Multi-Sig Escrow', '🤖 AI Verified', '⚖️ NDPR Compliant', '🆓 Didit KYC'].map(b => (
          <span key={b} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>{b}</span>
        ))}
      </div>
    </div>
  )

  // ── PHASE 2: VETPRO AI WELCOME (SCREEN_8) ──────────────────────
  if (phase === 'vetpro') return (
    <div style={{ minHeight: '100vh', background: '#0d1117', fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {VETPRO_DIALOGUE.map((_, i) => <div key={i} style={{ width: i === dialogueIdx ? 24 : 8, height: 8, borderRadius: 999, background: i === dialogueIdx ? d.accent : '#21262d', transition: 'all 0.3s' }} />)}
        </div>
        <button onClick={() => setPhase('roles')} style={{ background: 'transparent', border: '1px solid #21262d', color: '#6e7681', padding: '0.3rem 0.75rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.75rem' }}>
          Skip →
        </button>
      </div>

      {/* Main dialogue */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem 1.5rem 2rem' }}>
        {/* VetPro avatar */}
        <div style={{ width: 96, height: 96, borderRadius: '50%', background: `linear-gradient(135deg,${d.accent}30,${d.accent}10)`, border: `3px solid ${d.accent}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', marginBottom: '1.5rem', boxShadow: `0 0 40px ${d.accent}30`, transition: 'all 0.5s' }}>
          {d.icon}
        </div>

        <h2 style={{ color: '#f0f6fc', fontWeight: 900, fontSize: '1.5rem', margin: '0 0 0.25rem', textAlign: 'center' }}>{d.title}</h2>
        <div style={{ color: d.accent, fontSize: '0.8rem', fontWeight: 600, margin: '0 0 2rem' }}>VetPro AI · VeriProp Nigeria</div>

        {/* Chat bubble */}
        <div style={{ maxWidth: 520, width: '100%', background: '#161b22', border: `1px solid ${d.accent}30`, borderRadius: '1rem', padding: '1.5rem', marginBottom: '2rem', minHeight: 160 }}>
          {d.lines.slice(0, lineIdx).map((line, i) => (
            <p key={i} style={{ color: '#8b949e', fontSize: '0.9rem', margin: '0 0 0.75rem', lineHeight: 1.6 }}>{line}</p>
          ))}
          {lineIdx < d.lines.length && (
            <p style={{ color: '#f0f6fc', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
              <Typewriter text={d.lines[lineIdx]} onDone={() => setLineDone(true)} />
            </p>
          )}
        </div>

        {/* Line dots */}
        <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '2rem' }}>
          {d.lines.map((_, i) => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i <= lineIdx ? d.accent : '#21262d', transition: 'all 0.3s' }} />)}
        </div>

        <button onClick={nextDialogue}
          style={{ background: d.accent, color: '#fff', padding: '0.875rem 2.5rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '1rem', border: 'none', cursor: 'pointer', boxShadow: `0 8px 24px ${d.accent}40` }}>
          {dialogueIdx < VETPRO_DIALOGUE.length - 1 ? 'Continue →' : 'Start My Journey →'}
        </button>
      </div>
    </div>
  )

  // ── PHASE 3: ROLE HUB (SCREEN_152) ────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0d1b2a,#1b4332,#0d1b2a)', fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      {/* Image strip from teasers */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', height: 80, width: '100%', maxWidth: 580, overflow: 'hidden', borderRadius: '0.875rem', opacity: 0.55 }}>
        {PROPERTY_TEASERS.flatMap(t => t.images.slice(0, 2)).slice(0, 6).map((img, i) => (
          <div key={i} style={{ flex: 1, flexShrink: 0, borderRadius: '0.375rem', overflow: 'hidden' }}>
            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${i + 30}/200/80` }} />
          </div>
        ))}
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem', maxWidth: 520 }}>
        <div style={{ display: 'inline-flex', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#f59e0b', padding: '0.3rem 0.875rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, marginBottom: '1rem' }}>
          🇳🇬 JOIN VERIPROP NIGERIA
        </div>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(1.75rem,4vw,2.75rem)', lineHeight: 1.15, marginBottom: '0.75rem' }}>
          Nigeria&apos;s Most Trusted<br />Property Marketplace
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', lineHeight: 1.7 }}>
          Choose your role to unlock a personalized experience powered by VetPro AI
        </p>
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '1rem' }}>
          {[{ v: '0%', l: 'Fraud Rate' }, { v: '100%', l: 'Escrow Safe' }].map(s => (
            <div key={s.l}>
              <div style={{ color: '#f59e0b', fontWeight: 900, fontSize: '1.4rem' }}>{s.v}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Role grid */}
      <div style={{ width: '100%', maxWidth: 560, marginBottom: '1.5rem' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: 600 }}>
          I am joining as a...
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.625rem' }}>
          {ROLES.map(r => (
            <button key={r.v} onClick={() => setSelectedRole(r.v)}
              style={{ background: selectedRole === r.v ? '#f59e0b' : 'rgba(255,255,255,0.07)', border: `2px solid ${selectedRole === r.v ? '#f59e0b' : 'rgba(255,255,255,0.12)'}`, borderRadius: '0.875rem', padding: '0.875rem 0.375rem', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', transform: selectedRole === r.v ? 'scale(1.04)' : 'scale(1)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{r.icon}</div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.75rem' }}>{r.label}</div>
              <div style={{ color: selectedRole === r.v ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.35)', fontSize: '0.6rem', marginTop: '0.1rem' }}>{r.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* CTAs */}
      <div style={{ width: '100%', maxWidth: 520 }}>
        <a href={selectedRole ? `/register?role=${selectedRole}` : '/register'}
          onClick={() => localStorage.setItem('vp_onboarding_seen', '1')}
          style={{ display: 'block', textAlign: 'center', background: '#f59e0b', color: '#1e3a5f', padding: '1rem', borderRadius: '0.875rem', fontWeight: 800, fontSize: '1.05rem', textDecoration: 'none', marginBottom: '0.75rem', boxShadow: '0 8px 24px rgba(245,158,11,0.35)' }}>
          {selectedRole ? `Continue as ${ROLES.find(r => r.v === selectedRole)?.label} →` : 'Create Free Account →'}
        </a>
        <div style={{ textAlign: 'center', display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/login" onClick={() => localStorage.setItem('vp_onboarding_seen', '1')}
            style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: '0.85rem' }}>
            Have an account? <span style={{ color: '#fff', fontWeight: 700 }}>Sign In</span>
          </a>
          <a href="/?skip=1" onClick={() => localStorage.setItem('vp_onboarding_seen', '1')}
            style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontSize: '0.85rem' }}>
            Browse Marketplace →
          </a>
        </div>
      </div>

      {/* Bottom trust */}
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {['🛡️ 3-Tier KYC', '🤳 Selfie Liveness', '🔐 Multi-Sig Escrow', '🤖 VetPro AI', '🆓 500 Free/mo'].map(b => (
          <span key={b} style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>{b}</span>
        ))}
      </div>
    </div>
  )
}
