import React, { useState, useEffect } from 'react'

// SCREEN_166 — AI Journey Walkthrough
// VetPro AI introduces the platform capabilities
const AI_STEPS = [
  {
    icon: '🤖',
    title: 'Meet VetPro AI',
    subtitle: 'Your Intelligent Property Advisor',
    lines: [
      "Hello! I'm VetPro, your AI-powered property guide.",
      "I analyze thousands of listings to find your perfect match.",
      "I verify every property and flag suspicious activity.",
      "I protect your transactions with real-time fraud detection.",
    ],
    accent: '#3b82f6',
  },
  {
    icon: '🔍',
    title: 'I Verify Everything',
    subtitle: 'AI-Powered Due Diligence',
    lines: [
      "Every listing is moderated before it goes live.",
      "I check titles, prices, locations, and seller identity.",
      "Suspicious patterns trigger instant alerts.",
      "You only see verified, trustworthy properties.",
    ],
    accent: '#10b981',
  },
  {
    icon: '🔒',
    title: 'I Guard Your Money',
    subtitle: 'Multi-Sig Escrow Protection',
    lines: [
      "Your funds are held in secure escrow — never at risk.",
      "Multi-signature approval required before release.",
      "Automated splits: platform fee, agent, tax, seller.",
      "Every naira is accounted for and auditable.",
    ],
    accent: '#f59e0b',
  },
  {
    icon: '💬',
    title: 'I Monitor All Chats',
    subtitle: 'Closed-Loop Communication',
    lines: [
      "All conversations happen on-platform — always.",
      "I automatically redact phone numbers and WhatsApp links.",
      "Fraud patterns in chat are flagged instantly.",
      "Your privacy and security, protected 24/7.",
    ],
    accent: '#8b5cf6',
  },
]

export default function AIJourneyWalkthrough({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const [lineIdx, setLineIdx] = useState(0)
  const [typed, setTyped] = useState('')
  const [typing, setTyping] = useState(true)

  const current = AI_STEPS[step]
  const currentLine = current.lines[lineIdx] || ''

  // Typewriter effect
  useEffect(() => {
    setTyped('')
    setTyping(true)
    let i = 0
    const t = setInterval(() => {
      if (i < currentLine.length) {
        setTyped(currentLine.slice(0, i + 1))
        i++
      } else {
        clearInterval(t)
        setTyping(false)
        // Auto-advance line after 1.5s
        setTimeout(() => {
          if (lineIdx < current.lines.length - 1) {
            setLineIdx(l => l + 1)
          }
        }, 1500)
      }
    }, 28)
    return () => clearInterval(t)
  }, [step, lineIdx])

  const nextStep = () => {
    if (step < AI_STEPS.length - 1) {
      setStep(s => s + 1)
      setLineIdx(0)
    } else {
      onComplete()
    }
  }

  const skip = () => onComplete()

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', fontFamily: 'Inter,sans-serif', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.375rem' }}>
          {AI_STEPS.map((_, i) => (
            <div key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 999, background: i === step ? current.accent : '#21262d', transition: 'all 0.3s' }} />
          ))}
        </div>
        <button onClick={skip} style={{ background: 'transparent', border: '1px solid #21262d', color: '#6e7681', padding: '0.3rem 0.75rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.75rem' }}>
          Skip →
        </button>
      </div>

      {/* AI Avatar */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', background: `linear-gradient(135deg, ${current.accent}30, ${current.accent}10)`, border: `3px solid ${current.accent}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', marginBottom: '1.5rem', boxShadow: `0 0 40px ${current.accent}30`, transition: 'all 0.5s' }}>
          {current.icon}
        </div>

        <h2 style={{ color: '#f0f6fc', fontWeight: 900, fontSize: '1.5rem', margin: '0 0 0.25rem', textAlign: 'center' }}>{current.title}</h2>
        <p style={{ color: current.accent, fontSize: '0.875rem', margin: '0 0 2rem', fontWeight: 600 }}>{current.subtitle}</p>

        {/* Chat bubble */}
        <div style={{ maxWidth: 480, width: '100%', background: '#161b22', border: `1px solid ${current.accent}30`, borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.5rem', minHeight: 180 }}>
          {/* Previous lines */}
          {current.lines.slice(0, lineIdx).map((line, i) => (
            <p key={i} style={{ color: '#8b949e', fontSize: '0.9rem', margin: '0 0 0.75rem', lineHeight: 1.6 }}>{line}</p>
          ))}
          {/* Current typing line */}
          {lineIdx < current.lines.length && (
            <p style={{ color: '#f0f6fc', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
              {typed}
              {typing && <span style={{ opacity: 0.7, animation: 'blink 0.7s infinite' }}>|</span>}
            </p>
          )}
        </div>

        <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>

        {/* Line indicators */}
        <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '2rem' }}>
          {current.lines.map((_, i) => (
            <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i <= lineIdx ? current.accent : '#21262d', transition: 'all 0.3s' }} />
          ))}
        </div>

        <button onClick={nextStep}
          style={{ background: current.accent, color: '#fff', padding: '0.875rem 2.5rem', borderRadius: '0.75rem', fontWeight: 800, fontSize: '1rem', border: 'none', cursor: 'pointer', boxShadow: `0 8px 24px ${current.accent}40`, transition: 'all 0.3s' }}>
          {step < AI_STEPS.length - 1 ? 'Continue →' : 'Start My Journey →'}
        </button>
      </div>
    </div>
  )
}
