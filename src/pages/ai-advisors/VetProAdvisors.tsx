import React, { useState, useEffect, useRef, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'

// ================================================================
// Typing Animation Component
// ================================================================
function TypingText({ text, speed = 12, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('')
  const doneRef = useRef(false)
  useEffect(() => {
    doneRef.current = false
    let i = 0
    setDisplayed('')
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) { clearInterval(interval); doneRef.current = true; onDone?.() }
    }, speed)
    return () => clearInterval(interval)
  }, [text])
  return <>{displayed}{!doneRef.current && displayed.length < text.length && <span className="cursor">▍</span>}</>
}

// ================================================================
// Voice Hook — Speech-to-Text + Text-to-Speech
// ================================================================
function useVoice() {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const recRef = useRef<any>(null)

  const listen = useCallback((onResult: (t: string) => void) => {
    try {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (!SR) return
      const r = new SR()
      r.lang = 'en-NG'; r.interimResults = false; r.continuous = false
      r.onstart = () => setListening(true)
      r.onend = () => setListening(false)
      r.onerror = () => setListening(false)
      r.onresult = (e: any) => { const t = e.results[0][0].transcript; onResult(t) }
      recRef.current = r
      r.start()
    } catch { setListening(false) }
  }, [])

  const stopListen = useCallback(() => { try { recRef.current?.stop() } catch {} setListening(false) }, [])

  const speak = useCallback((text: string) => {
    try {
      const synth = window.speechSynthesis
      if (!synth) return
      synth.cancel()
      // Clean text for speech
      const clean = text.replace(/[📍💰🏠🛏️✅🔒📋🔔₦#\*]/g, '').replace(/\n+/g, '. ').replace(/\d\.\s/g, '')
      const utt = new SpeechSynthesisUtterance(clean)
      utt.rate = 0.92; utt.pitch = 1.05
      // Prefer female Nigerian/British voice
      const voices = synth.getVoices()
      const preferred = voices.find(v => v.lang === 'en-NG') || voices.find(v => v.lang === 'en-GB' && v.name.includes('Female')) || voices.find(v => v.lang.startsWith('en'))
      if (preferred) utt.voice = preferred
      utt.onstart = () => setSpeaking(true)
      utt.onend = () => setSpeaking(false)
      utt.onerror = () => setSpeaking(false)
      synth.speak(utt)
    } catch { setSpeaking(false) }
  }, [])

  const stopSpeak = useCallback(() => { try { window.speechSynthesis?.cancel() } catch {} setSpeaking(false) }, [])

  return { listening, speaking, listen, stopListen, speak, stopSpeak }
}

// ================================================================
// Main Component
// ================================================================
export default function VetProAdvisors() {
  // Determine user role from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const token = localStorage.getItem('accessToken')
  const userRole = user.role || 'buyer'

  // Map user roles to advisor type
  const roleToAdvisor: Record<string, string> = {
    buyer: 'buyer', seller: 'buyer', tenant: 'buyer',
    agent: 'agent', agency: 'agent',
    landlord: 'landlord',
    developer: 'developer',
    super_admin: 'buyer', admin: 'buyer', compliance_officer: 'buyer',
  }

  const advisorType = roleToAdvisor[userRole] || 'buyer'

  const advisorConfig: Record<string, { icon: string; name: string; accent: string; greeting: string; suggestions: string[] }> = {
    buyer: {
      icon: '🔍', name: 'SeekerPro', accent: '#3b82f6',
      greeting: user.firstName
        ? `Hello ${user.firstName}! 👋 I'm your VeriProp property concierge. Tell me what you're looking for — area, budget, bedrooms — and I'll search verified listings for you right now. I speak Pidgin too! 🇳🇬`
        : "Welcome to VeriProp! 👋 I'm your personal property concierge. Tell me your dream property and I'll find it. Try speaking to me — tap the 🎤 button!",
      suggestions: ['3 bed apartment in Lekki', 'Abeg I dey find house for Ajah', 'Land for sale in Abuja', 'Shortlet in Victoria Island', 'Cheap rent in Surulere'],
    },
    agent: {
      icon: '🤝', name: 'AgentPro', accent: '#10b981',
      greeting: `Welcome ${user.firstName || 'Agent'}! 💼 I'm AgentPro — your AI deal-closing coach. Ask me about market rates, pricing strategies, or negotiation tactics. Let's close more deals together!`,
      suggestions: ['Market rate for 2bed in Ikeja', 'How to handle price objections', 'Best areas for quick rental deals', 'Commission negotiation tips', 'Hot market areas right now'],
    },
    landlord: {
      icon: '🏘️', name: 'LandlordPro', accent: '#f59e0b',
      greeting: `Hello ${user.firstName || 'Landlord'}! 🏘️ I'm LandlordPro — your property investment advisor. Let me help you maximize rental yield and manage your portfolio smartly.`,
      suggestions: ['Optimal rent for my Lekki flat', 'Short-let vs long-let analysis', 'Best investment areas 2026', 'Tenant screening checklist', 'Property tax obligations'],
    },
    developer: {
      icon: '🏙️', name: 'DevPro', accent: '#8b5cf6',
      greeting: `Welcome ${user.firstName || 'Developer'}! 🏙️ I'm DevPro — your real estate development strategist. I analyze land values, construction costs, and ROI projections. What project are you evaluating?`,
      suggestions: ['Land value in Epe corridor', 'Construction cost per sqm 2026', 'ROI for 10-unit apartment block', 'Best states for development', 'Off-plan pricing strategy'],
    },
  }

  const config = advisorConfig[advisorType]

  const [messages, setMessages] = useState<Array<{ role: string; text: string; typing?: boolean; properties?: any[] }>>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState('english')
  const [autoVoice, setAutoVoice] = useState(false)
  const [aiModel, setAiModel] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const voice = useVoice()

  // Init greeting
  useEffect(() => {
    setMessages([{ role: 'ai', text: config.greeting, typing: true }])
    // Load voices
    window.speechSynthesis?.getVoices()
  }, [])

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }), 100)
  }, [messages, loading])

  // Send message
  const send = async (text: string) => {
    const msg = text.trim()
    if (!msg || loading) return
    setMessages(m => [...m, { role: 'user', text: msg }])
    setInput('')
    setLoading(true)
    voice.stopSpeak()

    try {
      const res = await fetch(`${API}/api/v1/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: msg, role: advisorType, language: lang }),
      })

      if (!res.ok) throw new Error(`Server error ${res.status}`)

      const data = await res.json()

      if (data.success && data.response) {
        setAiModel(data.model || '')
        setMessages(m => [...m, {
          role: 'ai',
          text: data.response,
          typing: true,
          properties: data.properties,
        }])
        if (autoVoice) setTimeout(() => voice.speak(data.response), 300)
      } else {
        setMessages(m => [...m, { role: 'ai', text: data.message || 'Sorry, something went wrong. Please try again.' }])
      }
    } catch (err) {
      setMessages(m => [...m, { role: 'ai', text: 'I couldn\'t reach the server. Please check your connection and try again.' }])
    }
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 200)
  }

  // Voice input handler
  const toggleMic = () => {
    if (voice.listening) { voice.stopListen(); return }
    voice.listen((text) => { setInput(text); send(text) })
  }

  // Speak a specific message
  const speakMsg = (text: string) => {
    if (voice.speaking) { voice.stopSpeak(); return }
    voice.speak(text)
  }

  const S = { fontFamily: "'Inter',-apple-system,sans-serif" }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#f0f6fc', display: 'flex', flexDirection: 'column', ...S }}>
      <style>{`
        .cursor { animation: blink .7s infinite }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
        @keyframes glow { 0%,100%{box-shadow:0 0 8px ${config.accent}40} 50%{box-shadow:0 0 20px ${config.accent}80} }
        .mic-active { animation: pulse 1s infinite; box-shadow: 0 0 0 4px #ef444440 !important }
        textarea:focus { border-color: ${config.accent} !important }
      `}</style>

      {/* Header */}
      <div style={{ background: '#161b22', borderBottom: '1px solid #21262d', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a href="/dashboard" style={{ color: '#6e7681', textDecoration: 'none', fontSize: '1.2rem' }}>←</a>
          <span style={{ fontSize: '1.3rem' }}>{config.icon}</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: config.accent }}>{config.name}</div>
            <div style={{ fontSize: '0.6rem', color: '#6e7681' }}>
              {aiModel ? `Powered by ${aiModel}` : 'VeriProp AI'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={() => setAutoVoice(!autoVoice)}
            style={{ background: autoVoice ? '#10b98120' : 'transparent', color: autoVoice ? '#10b981' : '#6e7681', border: '1px solid #21262d', padding: '0.25rem 0.5rem', borderRadius: '999px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600 }}>
            {autoVoice ? '🔊 On' : '🔇 Off'}
          </button>
          <a href="/" style={{ color: '#6e7681', fontSize: '0.7rem', textDecoration: 'none' }}>🏠</a>
        </div>
      </div>

      {/* Language Bar */}
      <div style={{ display: 'flex', gap: '0.25rem', padding: '0.4rem 0.75rem', background: '#0d1117', borderBottom: '1px solid #161b22', overflowX: 'auto' }}>
        {[
          { id: 'english', label: '🇬🇧 English', color: '#3b82f6' },
          { id: 'pidgin', label: '🇳🇬 Pidgin', color: '#10b981' },
          { id: 'yoruba', label: 'Yorùbá', color: '#f59e0b' },
          { id: 'igbo', label: 'Igbo', color: '#8b5cf6' },
          { id: 'hausa', label: 'Hausa', color: '#ef4444' },
        ].map(l => (
          <button key={l.id} onClick={() => setLang(l.id)}
            style={{
              background: lang === l.id ? l.color + '20' : 'transparent',
              color: lang === l.id ? l.color : '#6e7681',
              border: lang === l.id ? `1px solid ${l.color}40` : '1px solid transparent',
              padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.6rem',
              cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
            }}>
            {l.label}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', gap: '0.5rem', alignItems: 'flex-start' }}>
            {m.role === 'ai' && (
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${config.accent}, ${config.accent}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0, animation: loading && i === messages.length - 1 ? 'glow 2s infinite' : 'none' }}>
                {config.icon}
              </div>
            )}
            <div style={{
              maxWidth: '82%',
              background: m.role === 'user' ? config.accent : '#161b22',
              border: m.role === 'ai' ? '1px solid #21262d' : 'none',
              borderRadius: m.role === 'user' ? '1rem 0 1rem 1rem' : '0 1rem 1rem 1rem',
              padding: '0.75rem 0.875rem',
              fontSize: '0.85rem', lineHeight: 1.7, color: '#f0f6fc',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {m.typing ? <TypingText text={m.text} /> : m.text}

              {/* Property cards */}
              {m.properties && m.properties.length > 0 && (
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {m.properties.map((p: any, j: number) => (
                    <a key={j} href={`/properties/${p.id}`} style={{
                      display: 'block', background: '#0d1117', border: '1px solid #30363d',
                      borderRadius: '0.5rem', padding: '0.5rem 0.75rem', textDecoration: 'none', color: '#f0f6fc',
                    }}>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{p.title}</div>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.7rem', color: '#8b949e' }}>
                        <span style={{ color: '#10b981', fontWeight: 700 }}>₦{(p.price || 0).toLocaleString()}</span>
                        <span>{p.bedrooms}bed</span>
                        <span>{p.state}, {p.lga}</span>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {/* Speak button for AI messages */}
              {m.role === 'ai' && !m.typing && (
                <button onClick={() => speakMsg(m.text)}
                  style={{ marginTop: '0.5rem', background: 'transparent', border: 'none', color: '#6e7681', cursor: 'pointer', fontSize: '0.7rem', padding: 0 }}>
                  {voice.speaking ? '🔇 Stop' : '🔊 Listen'}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${config.accent}, ${config.accent}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0, animation: 'pulse 1s infinite' }}>
              {config.icon}
            </div>
            <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0 1rem 1rem 1rem', padding: '0.75rem 0.875rem', fontSize: '0.85rem', color: '#6e7681' }}>
              <span className="cursor">Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Suggestions */}
      <div style={{ display: 'flex', gap: '0.3rem', padding: '0.25rem 0.75rem', overflowX: 'auto' }}>
        {config.suggestions.map(s => (
          <button key={s} onClick={() => send(s)}
            style={{
              background: '#161b2280', border: `1px solid ${config.accent}30`,
              color: '#8b949e', padding: '0.3rem 0.6rem', borderRadius: '999px',
              cursor: 'pointer', fontSize: '0.65rem', fontWeight: 600,
              whiteSpace: 'nowrap', flexShrink: 0,
            }}>
            {s}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div style={{ padding: '0.5rem 0.75rem 0.75rem', background: '#161b22', borderTop: '1px solid #21262d' }}>
        {voice.listening && (
          <div style={{ textAlign: 'center', padding: '0.4rem', color: '#ef4444', fontSize: '0.7rem', fontWeight: 700 }}>
            <span className="cursor">🎤 Listening... speak now</span>
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-end' }}>
          {/* Mic */}
          <button onClick={toggleMic}
            className={voice.listening ? 'mic-active' : ''}
            style={{
              width: 42, height: 42, borderRadius: '50%', border: 'none', flexShrink: 0,
              background: voice.listening ? '#ef4444' : '#21262d',
              color: voice.listening ? '#fff' : '#8b949e',
              fontSize: '1.1rem', cursor: 'pointer',
            }}>
            {voice.listening ? '⏹' : '🎤'}
          </button>

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
            placeholder={lang === 'pidgin' ? 'Wetin you dey find? Type or tap 🎤' : 'Ask me anything about property...'}
            rows={1}
            style={{
              flex: 1, padding: '0.65rem 0.875rem', background: '#0d1117',
              border: '1.5px solid #30363d', borderRadius: '1.25rem',
              color: '#f0f6fc', fontSize: '0.85rem', outline: 'none',
              resize: 'none', lineHeight: 1.4, boxSizing: 'border-box',
            }}
          />

          {/* Send */}
          <button onClick={() => send(input)} disabled={!input.trim() || loading}
            style={{
              width: 42, height: 42, borderRadius: '50%', border: 'none', flexShrink: 0,
              background: input.trim() && !loading ? config.accent : '#21262d',
              color: '#fff', fontSize: '1.1rem',
              cursor: input.trim() && !loading ? 'pointer' : 'default',
            }}>
            {loading ? '⏳' : '↑'}
          </button>
        </div>
      </div>
    </div>
  )
}
