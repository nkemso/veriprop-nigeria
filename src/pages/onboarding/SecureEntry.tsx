import React, { useEffect, useState } from 'react'

// SCREEN_169 — Secure Entry Welcome
// Animated trust-first entry screen before onboarding begins
export default function SecureEntry({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timings = [800, 1600, 2400, 3200]
    const timers = timings.map((t, i) => setTimeout(() => setPhase(i + 1), t))
    const done = setTimeout(onComplete, 4500)
    return () => { timers.forEach(clearTimeout); clearTimeout(done) }
  }, [onComplete])

  const PILLARS = [
    { icon: '🛡️', label: 'Zero-Trust Security' },
    { icon: '🔐', label: 'Multi-Sig Escrow' },
    { icon: '🤖', label: 'AI Fraud Guard' },
    { icon: '⚖️', label: 'NDPR Compliant' },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: '#0d1117',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'Inter,sans-serif', padding: '2rem',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Animated background rings */}
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          position: 'absolute', width: i * 300, height: i * 300,
          borderRadius: '50%', border: '1px solid rgba(29,78,216,0.15)',
          top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          animation: `pulse ${2 + i * 0.5}s ease-in-out infinite`,
        }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.5}50%{transform:translate(-50%,-50%) scale(1.05);opacity:1}}`}</style>

      {/* Logo */}
      <div style={{ opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.8s', textAlign: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
        <div style={{ width: 80, height: 80, borderRadius: '1.25rem', background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 1rem', boxShadow: '0 0 40px rgba(29,78,216,0.4)' }}>🏠</div>
        <h1 style={{ color: '#f0f6fc', fontWeight: 900, fontSize: '2rem', margin: 0 }}>VeriProp <span style={{ color: '#f59e0b' }}>Nigeria</span></h1>
        <p style={{ color: '#8b949e', marginTop: '0.5rem', fontSize: '0.9rem' }}>Nigeria&apos;s Most Trusted Property Marketplace</p>
      </div>

      {/* Trust pillars */}
      <div style={{ opacity: phase >= 2 ? 1 : 0, transition: 'opacity 0.8s 0.3s', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
        {PILLARS.map((p, i) => (
          <div key={p.label} style={{
            opacity: phase >= 2 + (i * 0.3) ? 1 : 0.3, transition: `opacity 0.5s ${i * 0.15}s`,
            background: 'rgba(29,78,216,0.1)', border: '1px solid rgba(29,78,216,0.3)',
            borderRadius: '0.875rem', padding: '0.875rem 1.25rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span style={{ fontSize: '1.25rem' }}>{p.icon}</span>
            <span style={{ color: '#60a5fa', fontSize: '0.8rem', fontWeight: 600 }}>{p.label}</span>
          </div>
        ))}
      </div>

      {/* Loading bar */}
      <div style={{ opacity: phase >= 3 ? 1 : 0, transition: 'opacity 0.5s', width: 280, position: 'relative', zIndex: 1 }}>
        <div style={{ height: 3, background: '#21262d', borderRadius: 999, overflow: 'hidden', marginBottom: '0.75rem' }}>
          <div style={{ height: '100%', background: 'linear-gradient(90deg,#1d4ed8,#7c3aed,#f59e0b)', borderRadius: 999, animation: 'load 3s ease forwards' }} />
        </div>
        <style>{`@keyframes load{from{width:0}to{width:100%}}`}</style>
        <p style={{ color: '#6e7681', fontSize: '0.75rem', textAlign: 'center', margin: 0 }}>Initializing secure environment...</p>
      </div>
    </div>
  )
}
