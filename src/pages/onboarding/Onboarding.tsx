import React, { useState, useEffect, useRef } from 'react'

// ─── Property image collections (Unsplash CDN - no auth needed) ───────────
const IMAGE_COLLECTIONS = [
  {
    id: 1,
    tag: '🏙️ LUXURY PENTHOUSE',
    headline: 'Own Lagos\u2019 Most Exclusive\nSky Residences',
    sub: 'Verified titles. Zero fraud. Every naira protected by VeriProp Escrow.',
    badge: '📍 Victoria Island, Lagos',
    stat1: { value: '₦2.4B+', label: 'Secured in Escrow' },
    stat2: { value: '12,000+', label: 'Verified Properties' },
    cta: 'Explore Penthouses',
    accent: '#f59e0b',
    bg: 'linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80',
    ],
  },
  {
    id: 2,
    tag: '🏡 ABUJA ESTATE',
    headline: 'Secure Your Family\u2019s\nForever Home',
    sub: 'Multi-Sig escrow ensures your funds are untouchable until you\u2019re 100% satisfied.',
    badge: '📍 Maitama, Abuja FCT',
    stat1: { value: '3-Tier', label: 'Identity Verification' },
    stat2: { value: '2-of-3', label: 'Multi-Sig Release' },
    cta: 'Browse Estates',
    accent: '#10b981',
    bg: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80',
      'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80',
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80',
    ],
  },
  {
    id: 3,
    tag: '🏢 COMMERCIAL SPACE',
    headline: 'Grow Your Business\nin Prime Locations',
    sub: 'AI-verified listings. Transparent pricing. Institutional-grade property transactions.',
    badge: '📍 Lekki, Lagos Island',
    stat1: { value: '5%', label: 'Platform Fee Only' },
    stat2: { value: '24hrs', label: 'Fund Release' },
    cta: 'View Commercial',
    accent: '#3b82f6',
    bg: 'linear-gradient(160deg, #1e3c72 0%, #2a5298 50%, #1e3c72 100%)',
    images: [
      'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80',
      'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80',
      'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80',
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80',
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80',
    ],
  },
  {
    id: 4,
    tag: '🇳🇬 JOIN VERIPROP',
    headline: 'Nigeria\u2019s Most Trusted\nProperty Marketplace',
    sub: 'Choose your role and start your secure property journey today. 100% free to join.',
    badge: '✅ Free to join · Verified & Secure',
    stat1: { value: '0%', label: 'Fraud Rate' },
    stat2: { value: '100%', label: 'Escrow Protected' },
    cta: null,
    accent: '#f59e0b',
    bg: 'linear-gradient(160deg, #0d1b2a 0%, #1b4332 50%, #0d1b2a 100%)',
    images: [
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
      'https://images.unsplash.com/photo-1582407947304-fd86f28f5b2e?w=800&q=80',
      'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80',
      'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=800&q=80',
    ],
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

// ─── Image Carousel Component ────────────────────────────────────────────────
function ImageCarousel({ images, accent }: { images: string[]; accent: string }) {
  const [current, setCurrent] = useState(0)
  const [next, setNext] = useState(1)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // Each image shows for 4 seconds then cross-fades over 1 second
    const timer = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setCurrent(c => {
          const n = (c + 1) % images.length
          setNext((n + 1) % images.length)
          return n
        })
        setFading(false)
      }, 1000)
    }, 4000)
    return () => clearInterval(timer)
  }, [images.length])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '1.25rem', overflow: 'hidden' }}>
      {/* Current image */}
      <img
        src={images[current]}
        alt="Property"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', transition: 'opacity 1s ease',
          opacity: fading ? 0 : 1,
        }}
        onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${current}/800/600` }}
      />
      {/* Next image preloaded underneath */}
      <img
        src={images[next]}
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: fading ? 1 : 0, transition: 'opacity 1s ease' }}
        onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${next}/800/600` }}
      />
      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' }} />
      {/* Dot indicators */}
      <div style={{ position: 'absolute', bottom: '0.75rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.375rem' }}>
        {images.map((_, i) => (
          <div key={i} onClick={() => setCurrent(i)}
            style={{ width: i === current ? 20 : 6, height: 6, borderRadius: 999, background: i === current ? accent : 'rgba(255,255,255,0.4)', cursor: 'pointer', transition: 'all 0.4s' }} />
        ))}
      </div>
      {/* Image count badge */}
      <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 600 }}>
        {current + 1}/{images.length}
      </div>
    </div>
  )
}

// ─── Main Onboarding ─────────────────────────────────────────────────────────
export default function Onboarding() {
  const [screen, setScreen] = useState(0)
  const [selectedRole, setSelectedRole] = useState('')
  const [autoPlay, setAutoPlay] = useState(true)
  const [progress, setProgress] = useState(0)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const SCREEN_DURATION = 8000 // 8 seconds per screen — enough to read and admire

  // Progress bar + auto-advance
  useEffect(() => {
    if (!autoPlay || screen >= 3) {
      setProgress(0)
      return
    }
    setProgress(0)
    const step = 100 / (SCREEN_DURATION / 50)
    progressRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(progressRef.current!)
          setScreen(s => s + 1)
          return 0
        }
        return p + step
      })
    }, 50)
    return () => { if (progressRef.current) clearInterval(progressRef.current) }
  }, [screen, autoPlay])

  const goTo = (i: number) => {
    setAutoPlay(false)
    if (progressRef.current) clearInterval(progressRef.current)
    setProgress(0)
    setScreen(i)
  }

  const skip = () => goTo(3)

  const s = IMAGE_COLLECTIONS[screen]

  return (
    <div style={{ minHeight: '100vh', background: s.bg, fontFamily: 'Inter,sans-serif', transition: 'background 1.2s ease', position: 'relative', display: 'flex', flexDirection: 'column' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', position: 'relative', zIndex: 10 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🏠</span>
          <span style={{ color: '#fff', fontWeight: 900, fontSize: '1rem' }}>VeriProp <span style={{ color: s.accent }}>Nigeria</span></span>
        </div>

        {/* Screen dots */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {IMAGE_COLLECTIONS.map((_, i) => (
            <div key={i} onClick={() => goTo(i)}
              style={{ width: i === screen ? 28 : 8, height: 8, borderRadius: 999, background: i === screen ? s.accent : 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.4s ease' }} />
          ))}
        </div>

        {/* Skip */}
        {screen < 3 && (
          <button onClick={skip}
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', padding: '0.4rem 1rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            Skip →
          </button>
        )}
      </div>

      {/* Progress bar (screens 0-2 only) */}
      {screen < 3 && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.15)', zIndex: 20 }}>
          <div style={{ height: '100%', background: s.accent, width: `${progress}%`, transition: 'width 0.05s linear', borderRadius: '0 999px 999px 0' }} />
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem 1.5rem 2rem', gap: '1.5rem' }}>

        {screen < 3 ? (
          // ─── Property screens 0-2 ──────────────────────────────────────────
          <div style={{ width: '100%', maxWidth: 900, display: 'grid', gridTemplateColumns: window.innerWidth > 700 ? '1fr 1fr' : '1fr', gap: '1.5rem', alignItems: 'center' }}>

            {/* Left: Image carousel */}
            <div style={{ height: 380, position: 'relative' }}>
              <ImageCarousel images={s.images} accent={s.accent} />
              {/* Floating badge */}
              <div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', border: `1px solid ${s.accent}50`, color: s.accent, padding: '0.35rem 0.875rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                {s.tag}
              </div>
            </div>

            {/* Right: Content */}
            <div style={{ textAlign: 'left' }}>
              {/* Location badge */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)', padding: '0.3rem 0.875rem', borderRadius: '999px', fontSize: '0.75rem', marginBottom: '1rem' }}>
                {s.badge}
              </div>

              {/* Headline */}
              <h1 style={{ color: '#fff', fontSize: 'clamp(1.5rem, 3.5vw, 2.5rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: '1rem', whiteSpace: 'pre-line' }}>
                {s.headline}
              </h1>

              {/* Sub */}
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                {s.sub}
              </p>

              {/* Stats */}
              <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
                {[s.stat1, s.stat2].map(stat => (
                  <div key={stat.label}>
                    <div style={{ color: s.accent, fontWeight: 900, fontSize: '1.5rem' }}>{stat.value}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap' }}>
                <button onClick={() => goTo(screen + 1)}
                  style={{ background: s.accent, color: '#1e3a5f', padding: '0.875rem 1.75rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '0.95rem', border: 'none', cursor: 'pointer', boxShadow: `0 8px 24px ${s.accent}40` }}>
                  {s.cta} →
                </button>
                <button onClick={skip}
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '0.875rem 1.5rem', borderRadius: '0.75rem', fontWeight: 600, fontSize: '0.95rem', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}>
                  Skip Intro
                </button>
              </div>

              {/* Timer indicator */}
              {autoPlay && (
                <div style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>
                  Auto-advancing in {Math.ceil((SCREEN_DURATION * (1 - progress / 100)) / 1000)}s
                </div>
              )}
            </div>
          </div>
        ) : (
          // ─── Screen 4: Role Hub ────────────────────────────────────────────
          <div style={{ width: '100%', maxWidth: 640 }}>
            {/* Background images strip */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', height: 100, overflow: 'hidden', borderRadius: '1rem', opacity: 0.6 }}>
              {IMAGE_COLLECTIONS.flatMap(c => c.images.slice(0, 2)).slice(0, 6).map((img, i) => (
                <div key={i} style={{ flex: 1, borderRadius: '0.5rem', overflow: 'hidden', flexShrink: 0 }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${i + 10}/200/100` }} />
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.1)', border: `1px solid ${s.accent}50`, color: s.accent, padding: '0.3rem 0.875rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, marginBottom: '1rem' }}>
                {s.badge}
              </div>
              <h1 style={{ color: '#fff', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: '0.75rem', whiteSpace: 'pre-line' }}>
                {s.headline}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>{s.sub}</p>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: '2.5rem', justifyContent: 'center', margin: '1.25rem 0' }}>
                {[s.stat1, s.stat2].map(stat => (
                  <div key={stat.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.accent, fontWeight: 900, fontSize: '1.5rem' }}>{stat.value}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Role grid */}
            <h2 style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, margin: '0 0 1rem', fontSize: '1rem', textAlign: 'center' }}>
              I am joining as a...
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {ROLES.map(r => (
                <button key={r.value} onClick={() => setSelectedRole(r.value)}
                  style={{ background: selectedRole === r.value ? s.accent : 'rgba(255,255,255,0.08)', border: `2px solid ${selectedRole === r.value ? s.accent : 'rgba(255,255,255,0.15)'}`, borderRadius: '0.875rem', padding: '1rem 0.5rem', cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s', transform: selectedRole === r.value ? 'scale(1.04)' : 'scale(1)' }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>{r.icon}</div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>{r.label}</div>
                  <div style={{ color: selectedRole === r.value ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)', fontSize: '0.68rem', marginTop: '0.15rem' }}>{r.desc}</div>
                </button>
              ))}
            </div>

            {/* Final CTA */}
            <a href={selectedRole ? `/register?role=${selectedRole}` : '/register'}
              style={{ display: 'block', textAlign: 'center', background: s.accent, color: '#1e3a5f', padding: '1rem', borderRadius: '0.875rem', fontWeight: 800, fontSize: '1.05rem', textDecoration: 'none', marginBottom: '0.75rem', boxShadow: `0 8px 24px ${s.accent}40` }}>
              {selectedRole ? `Continue as ${ROLES.find(r => r.value === selectedRole)?.label} →` : 'Create Free Account →'}
            </a>
            <div style={{ textAlign: 'center' }}>
              <a href="/login" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontSize: '0.875rem' }}>
                Already have an account? <span style={{ color: '#fff', fontWeight: 700 }}>Sign In →</span>
              </a>
            </div>
          </div>
        )}

        {/* Trust badges */}
        <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', justifyContent: 'center', paddingTop: '0.5rem' }}>
          {['🛡️ Zero-Trust Security', '🔒 Escrow Protected', '🤖 AI Verified', '⚖️ NDPR Compliant', '🏦 Paystack Secured'].map(b => (
            <span key={b} style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem' }}>{b}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
