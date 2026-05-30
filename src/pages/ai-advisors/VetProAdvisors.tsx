import React, { useState, useEffect } from 'react'
// SCREEN_113, 135, 108, 115 — Role-specific VetPro AI Advisors

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'

// VetPro AI chat message
function AIMessage({ text, typing }: { text: string; typing?: boolean }) {
  const [shown, setShown] = useState('')
  useEffect(() => {
    if (!typing) { setShown(text); return }
    let i = 0
    const t = setInterval(() => {
      setShown(text.slice(0, i + 1))
      i++
      if (i >= text.length) clearInterval(t)
    }, 20)
    return () => clearInterval(t)
  }, [text, typing])
  return (
    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🤖</div>
      <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0 0.875rem 0.875rem 0.875rem', padding: '0.875rem 1rem', maxWidth: '85%', fontSize: '0.875rem', lineHeight: 1.6, color: '#f0f6fc' }}>
        {shown}{typing && shown.length < text.length && <span style={{ animation: 'blink 0.7s infinite' }}>▍</span>}
      </div>
    </div>
  )
}

function UserMessage({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
      <div style={{ background: '#1d4ed8', borderRadius: '0.875rem 0 0.875rem 0.875rem', padding: '0.875rem 1rem', maxWidth: '80%', fontSize: '0.875rem', lineHeight: 1.6, color: '#fff' }}>
        {text}
      </div>
    </div>
  )
}

const ADVISOR_CONFIGS: Record<string, {
  icon: string; name: string; title: string; accent: string;
  greeting: string; suggestions: string[];
  quickStats: Array<{ icon: string; label: string; value: string }>;
}> = {
  developer: {
    icon: '🏙️', name: 'DevPro AI', title: 'Developer Strategic Advisor',
    accent: '#8b5cf6',
    greeting: "Hello! I'm DevPro, your AI development advisor. I analyze land banks, zoning laws, off-plan demand, and ROI projections for Nigerian real estate developers. What project are you evaluating today?",
    suggestions: ['Analyze Epe corridor land value', 'ROI calculator for 20-unit block', 'Lekki Phase 2 demand forecast', 'JV partnership structure advice'],
    quickStats: [
      { icon: '📐', label: 'Avg Land Appreciation', value: '31% YoY' },
      { icon: '🏗️', label: 'Construction Cost/sqm', value: '₦180K-₦320K' },
      { icon: '💰', label: 'Avg Off-Plan Markup', value: '35-45%' },
    ],
  },
  landlord: {
    icon: '🏘️', name: 'LandlordPro AI', title: 'Landlord & Investor Command',
    accent: '#f59e0b',
    greeting: "Welcome to LandlordPro! I help you maximize rental yield, manage tenant relationships, and grow your property portfolio strategically across Nigeria. What can I help you with?",
    suggestions: ['Optimize my rental pricing', 'Tenant screening checklist', 'Short-let vs long-let analysis', 'Portfolio expansion strategy'],
    quickStats: [
      { icon: '📈', label: 'Avg Lagos Rental Yield', value: '8.5% PA' },
      { icon: '🏠', label: 'Short-let Premium', value: '+41% vs LT' },
      { icon: '⏱️', label: 'Avg Tenant Tenure', value: '2.3 years' },
    ],
  },
  agent: {
    icon: '🤝', name: 'AgentPro AI', title: 'Agent Strategic Advisor',
    accent: '#10b981',
    greeting: "Hi! I'm AgentPro, your AI-powered performance coach. I help you close more deals, price properties accurately, and build a high-converting client pipeline. Ready to level up?",
    suggestions: ['Pricing strategy for Ikoyi listing', 'Client objection handling scripts', 'This week\'s hottest listings', 'Commission negotiation tips'],
    quickStats: [
      { icon: '💼', label: 'Avg Commission (Sale)', value: '5-10%' },
      { icon: '⚡', label: 'Avg Deal Close Time', value: '23 days' },
      { icon: '🎯', label: 'Top Convert. Channel', value: 'WhatsApp → VeriProp' },
    ],
  },
  buyer: {
    icon: '🔍', name: 'SeekerPro AI', title: 'Property Seeker Concierge',
    accent: '#3b82f6',
    greeting: "Hello! I'm your personal property concierge. Tell me your budget, preferred location, and lifestyle needs — I'll find the perfect verified properties for you across Nigeria. Let's start!",
    suggestions: ['Find 3-bed in Lekki ₦5M budget', 'Best areas for my ₦20M budget', 'Compare Abuja vs Lagos', 'First-time buyer guide'],
    quickStats: [
      { icon: '🏠', label: 'Matched Properties Today', value: '1,247' },
      { icon: '✅', label: 'Verified Listings', value: '98.3%' },
      { icon: '📍', label: 'States Covered', value: '36 + FCT' },
    ],
  },
}

export default function VetProAdvisors() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const role = user.role || 'buyer'
  const advisor = ADVISOR_CONFIGS[role] || ADVISOR_CONFIGS.buyer
  const [messages, setMessages] = useState([{ type: 'ai', text: advisor.greeting, typing: true }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState('english')
  const token = localStorage.getItem('accessToken')

  if (!token) { window.location.href = '/login'; return null }

  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    const userMsg = { type: 'user', text }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(API + '/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: 'Bearer ' + token }),
        },
        body: JSON.stringify({ message: text, role: activeAdvisor, language: lang }),
      })

      const data = await res.json()

      if (data.success) {
        let response = data.response || 'I could not process that request. Please try again.'

        // If properties were found, append them
        if (data.properties && data.properties.length > 0) {
          response += '\n\n📍 Properties found:\n' + data.properties.map((p: any, i: number) =>
            `${i + 1}. ${p.title} — ₦${(p.price || 0).toLocaleString()} | ${p.bedrooms || '?'}bed | ${p.state}, ${p.lga}`
          ).join('\n')
        }

        setMessages(m => [...m, { type: 'ai', text: response, typing: true }])
      } else {
        setMessages(m => [...m, { type: 'ai', text: 'Sorry, I encountered an error. Please try again.', typing: true }])
      }
    } catch {
      setMessages(m => [...m, { type: 'ai', text: 'Connection error. Please check your internet and try again.', typing: true }])
    }

    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', fontFamily: 'Inter,sans-serif', color: '#f0f6fc', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ background: '#161b22', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #21262d' }}>
        <a href="/" style={{ color: '#fff', fontWeight: 800, textDecoration: 'none' }}>🏠 VeriProp <span style={{ color: '#f59e0b' }}>Nigeria</span></a>
        <span style={{ color: advisor.accent, fontSize: '0.75rem', fontWeight: 700 }}>🤖 {advisor.name.toUpperCase()}</span>
      </nav>

      <div style={{ maxWidth: 820, margin: '0 auto', width: '100%', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Advisor header */}
        <div style={{ background: `linear-gradient(135deg,${advisor.accent}15,${advisor.accent}08)`, border: `1px solid ${advisor.accent}30`, borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg,${advisor.accent},${advisor.accent}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', flexShrink: 0 }}>
            {advisor.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{advisor.name}</div>
            <div style={{ color: advisor.accent, fontSize: '0.8rem', fontWeight: 600 }}>{advisor.title}</div>
          </div>
          {/* Quick stats */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {advisor.quickStats.map(s => (
              <div key={s.label} style={{ textAlign: 'right' }}>
                <div style={{ color: advisor.accent, fontWeight: 800, fontSize: '0.9rem' }}>{s.value}</div>
                <div style={{ color: '#6e7681', fontSize: '0.65rem' }}>{s.icon} {s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div style={{ flex: 1, background: '#0d1117', borderRadius: '1rem', border: '1px solid #21262d', padding: '1.25rem', marginBottom: '1rem', overflowY: 'auto', minHeight: 300, maxHeight: 450 }}>
          <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
          {messages.map((m, i) => m.type === 'ai'
            ? <AIMessage key={i} text={m.text} typing={m.typing && i === messages.length - 1} />
            : <UserMessage key={i} text={m.text} />
          )}
          {loading && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🤖</div>
              <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0 0.875rem 0.875rem 0.875rem', padding: '0.875rem 1rem', display: 'flex', gap: '0.375rem' }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: advisor.accent, animation: `blink 1s ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.875rem' }}>
          {advisor.suggestions.map(s => (
            <button key={s} onClick={() => sendMessage(s)}
              style={{ background: '#161b22', border: `1px solid ${advisor.accent}40`, color: '#8b949e', padding: '0.4rem 0.875rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {s}
            </button>
          ))}
        </div>

        {/* Language toggle */}
        <div style={{ display: 'flex', gap: '0.375rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'english', label: '🇬🇧 English' },
            { id: 'pidgin', label: '🇳🇬 Pidgin' },
            { id: 'yoruba', label: 'Yorùbá' },
            { id: 'igbo', label: 'Igbo' },
            { id: 'hausa', label: 'Hausa' },
          ].map(l => (
            <button key={l.id} onClick={() => setLang(l.id)}
              style={{ background: lang === l.id ? advisor.accent + '30' : '#0d1117', color: lang === l.id ? advisor.accent : '#6e7681', border: '1px solid #21262d', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.65rem', cursor: 'pointer' }}>
              {l.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
            placeholder={`Ask ${advisor.name} anything...`}
            style={{ flex: 1, background: '#161b22', border: '1px solid #21262d', color: '#f0f6fc', padding: '0.875rem 1rem', borderRadius: '0.75rem', outline: 'none', fontSize: '0.9rem' }}
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
            style={{ background: input.trim() ? advisor.accent : '#21262d', color: '#fff', border: 'none', padding: '0.875rem 1.5rem', borderRadius: '0.75rem', fontWeight: 700, cursor: input.trim() ? 'pointer' : 'not-allowed', fontSize: '0.9rem' }}>
            Send →
          </button>
        </div>
      </div>
    </div>
  )
}
