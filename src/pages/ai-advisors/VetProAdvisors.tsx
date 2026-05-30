import React, { useState, useEffect, useRef, useCallback } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'

// ================================================================
// AI Message Bubble with typing effect
// ================================================================
function AIMessage({ text, typing, onSpeakDone }: { text: string; typing?: boolean; onSpeakDone?: () => void }) {
  const [shown, setShown] = useState('')
  useEffect(() => {
    if (!typing) { setShown(text); return }
    let i = 0
    const t = setInterval(() => {
      setShown(text.slice(0, i + 1))
      i++
      if (i >= text.length) { clearInterval(t); onSpeakDone?.() }
    }, 15)
    return () => clearInterval(t)
  }, [text, typing])
  return (
    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🤖</div>
      <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0 0.875rem 0.875rem 0.875rem', padding: '0.875rem 1rem', maxWidth: '85%', fontSize: '0.875rem', lineHeight: 1.7, color: '#f0f6fc', whiteSpace: 'pre-wrap' }}>
        {shown}{typing && shown.length < text.length && <span style={{ animation: 'blink 0.7s infinite' }}>▍</span>}
      </div>
    </div>
  )
}

function UserMessage({ text }: { text: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
      <div style={{ background: '#1d4ed8', borderRadius: '0.875rem 0 0.875rem 0.875rem', padding: '0.875rem 1rem', maxWidth: '80%', fontSize: '0.875rem', lineHeight: 1.7, color: '#fff', whiteSpace: 'pre-wrap' }}>
        {text}
      </div>
    </div>
  )
}

// ================================================================
// Voice Engine — Web Speech API
// ================================================================
function useVoice() {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null)

  // Speech-to-Text (microphone input)
  const startListening = useCallback((onResult: (text: string) => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { alert('Voice input not supported in this browser. Try Chrome.'); return }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-NG'
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript
      onResult(text)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  // Text-to-Speech (AI reads response aloud)
  const speak = useCallback((text: string, lang = 'en') => {
    if (!synthRef.current) return
    synthRef.current.cancel() // Stop any current speech

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1.0

    // Try to find a Nigerian/African English voice
    const voices = synthRef.current.getVoices()
    const nigerianVoice = voices.find((v: SpeechSynthesisVoice) =>
      v.lang.includes('en-NG') || v.lang.includes('en-GB') || (v.name.toLowerCase().includes('female') && v.lang.includes('en'))
    )
    if (nigerianVoice) utterance.voice = nigerianVoice
    utterance.lang = lang === 'pidgin' ? 'en-NG' : 'en-NG'

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    synthRef.current.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel()
    setIsSpeaking(false)
  }, [])

  return { isListening, isSpeaking, startListening, stopListening, speak, stopSpeaking }
}

// ================================================================
// Advisor Configs
// ================================================================
const ADVISORS: Record<string, {
  icon: string; name: string; title: string; accent: string;
  greeting: string; suggestions: string[];
}> = {
  buyer: {
    icon: '🔍', name: 'SeekerPro', title: 'Property Concierge',
    accent: '#3b82f6',
    greeting: "Hello! I'm your VeriProp property concierge. Tell me what you're looking for — location, budget, bedrooms — and I'll search our verified listings for you. I speak English, Pidgin, and understand Yoruba, Igbo, and Hausa!",
    suggestions: ['3 bedroom in Lekki under 5M', 'Abeg, I dey find house for Ajah', 'Land for sale in Abuja', 'Short-let apartments in VI'],
  },
  agent: {
    icon: '🤝', name: 'AgentPro', title: 'Agent Advisor',
    accent: '#10b981',
    greeting: "Welcome! I help agents price properties, handle objections, and close more deals. Ask me about market rates, commission strategies, or client management.",
    suggestions: ['Market rate for 2bed in Ikeja', 'How to handle price objection', 'Best areas for quick rental deals', 'Commission negotiation tips'],
  },
  landlord: {
    icon: '🏘️', name: 'LandlordPro', title: 'Landlord Advisor',
    accent: '#f59e0b',
    greeting: "Hello! I help landlords maximize rental yield and manage properties smartly. Ask about pricing, tenant screening, or portfolio growth.",
    suggestions: ['Optimal rent for my Lekki flat', 'Short-let vs long-let analysis', 'Tenant screening checklist', 'Property investment hotspots'],
  },
  developer: {
    icon: '🏙️', name: 'DevPro', title: 'Developer Advisor',
    accent: '#8b5cf6',
    greeting: "Welcome! I analyze land values, construction costs, and ROI projections for real estate development in Nigeria.",
    suggestions: ['Land value trend in Epe corridor', 'Construction cost per sqm Lagos', 'ROI for 10-unit apartment block', 'Best states for development'],
  },
}

// ================================================================
// Main Component
// ================================================================
export default function VetProAdvisors() {
  const [activeAdvisor, setActiveAdvisor] = useState('buyer')
  const [messages, setMessages] = useState<Array<{type: string; text: string; typing?: boolean}>>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [lang, setLang] = useState('english')
  const [autoSpeak, setAutoSpeak] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)
  const authToken = localStorage.getItem('accessToken')
  const voice = useVoice()

  const advisor = ADVISORS[activeAdvisor]

  // Initialize greeting
  useEffect(() => {
    setMessages([{ type: 'ai', text: advisor.greeting, typing: true }])
  }, [activeAdvisor])

  // Auto scroll to bottom
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  // Send message to real AI backend
  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    setMessages(m => [...m, { type: 'user', text }])
    setInput('')
    setLoading(true)
    voice.stopSpeaking()

    try {
      const res = await fetch(API + '/api/v1/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: 'Bearer ' + authToken }),
        },
        body: JSON.stringify({ message: text, role: activeAdvisor, language: lang }),
      })

      const data = await res.json()

      if (data.success) {
        let response = data.response || 'I could not process that. Please try again.'

        if (data.properties && data.properties.length > 0) {
          response += '\n\n📍 Properties found:\n' + data.properties.map((p: any, i: number) =>
            `${i + 1}. ${p.title} — ₦${(p.price || 0).toLocaleString()} | ${p.bedrooms || '?'}bed | ${p.state}, ${p.lga}`
          ).join('\n')
        }

        setMessages(m => [...m, { type: 'ai', text: response, typing: true }])

        // Auto-speak response if enabled
        if (autoSpeak) {
          setTimeout(() => voice.speak(response, lang), 500)
        }
      } else {
        setMessages(m => [...m, { type: 'ai', text: data.message || 'Sorry, an error occurred. Please try again.' }])
      }
    } catch {
      setMessages(m => [...m, { type: 'ai', text: 'I could not reach the server. Please check your connection and try again.' }])
    }

    setLoading(false)
  }

  // Handle voice input
  const handleVoiceInput = () => {
    if (voice.isListening) {
      voice.stopListening()
    } else {
      voice.startListening((text) => {
        setInput(text)
        sendMessage(text)
      })
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', fontFamily: 'Inter,sans-serif', color: '#f0f6fc', display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}} @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}} @keyframes ripple{0%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)}100%{box-shadow:0 0 0 20px rgba(239,68,68,0)}}`}</style>

      {/* Nav */}
      <nav style={{ background: '#161b22', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #21262d' }}>
        <a href="/" style={{ color: '#fff', fontWeight: 800, textDecoration: 'none', fontSize: '0.9rem' }}>🏠 VeriProp</a>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', color: advisor.accent, fontWeight: 700 }}>{advisor.name}</span>
          <a href="/dashboard" style={{ color: '#6e7681', fontSize: '0.75rem', textDecoration: 'none' }}>Dashboard</a>
        </div>
      </nav>

      {/* Advisor Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', padding: '0.5rem', background: '#0d1117', overflowX: 'auto' }}>
        {Object.entries(ADVISORS).map(([key, a]) => (
          <button key={key} onClick={() => setActiveAdvisor(key)}
            style={{
              background: activeAdvisor === key ? a.accent + '20' : 'transparent',
              color: activeAdvisor === key ? a.accent : '#6e7681',
              border: activeAdvisor === key ? `1px solid ${a.accent}40` : '1px solid transparent',
              padding: '0.4rem 0.75rem', borderRadius: '999px', fontSize: '0.7rem',
              cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
            }}>
            {a.icon} {a.name}
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div ref={chatRef} style={{ flex: 1, overflow: 'auto', padding: '1rem', maxHeight: 'calc(100vh - 260px)' }}>
        {messages.map((m, i) =>
          m.type === 'ai'
            ? <AIMessage key={i} text={m.text} typing={m.typing} />
            : <UserMessage key={i} text={m.text} />
        )}
        {loading && (
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🤖</div>
            <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0 0.875rem 0.875rem 0.875rem', padding: '0.875rem 1rem', fontSize: '0.875rem', color: '#6e7681' }}>
              <span style={{ animation: 'blink 1s infinite' }}>Thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Suggestions */}
      <div style={{ display: 'flex', gap: '0.375rem', padding: '0 1rem', overflowX: 'auto', flexShrink: 0 }}>
        {advisor.suggestions.map(s => (
          <button key={s} onClick={() => sendMessage(s)}
            style={{ background: '#161b22', border: `1px solid ${advisor.accent}40`, color: '#8b949e', padding: '0.4rem 0.75rem', borderRadius: '999px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {s}
          </button>
        ))}
      </div>

      {/* Controls: Language + Auto-speak */}
      <div style={{ display: 'flex', gap: '0.375rem', padding: '0.5rem 1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { id: 'english', label: '🇬🇧 EN' },
          { id: 'pidgin', label: '🇳🇬 Pidgin' },
          { id: 'yoruba', label: 'Yorùbá' },
          { id: 'igbo', label: 'Igbo' },
          { id: 'hausa', label: 'Hausa' },
        ].map(l => (
          <button key={l.id} onClick={() => setLang(l.id)}
            style={{ background: lang === l.id ? advisor.accent + '30' : '#0d1117', color: lang === l.id ? advisor.accent : '#6e7681', border: '1px solid #21262d', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.6rem', cursor: 'pointer', fontWeight: 600 }}>
            {l.label}
          </button>
        ))}
        <button onClick={() => setAutoSpeak(!autoSpeak)}
          style={{ marginLeft: 'auto', background: autoSpeak ? '#10b98120' : '#0d1117', color: autoSpeak ? '#10b981' : '#6e7681', border: '1px solid #21262d', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.6rem', cursor: 'pointer', fontWeight: 600 }}>
          {autoSpeak ? '🔊 Voice On' : '🔇 Voice Off'}
        </button>
      </div>

      {/* Input Area */}
      <div style={{ padding: '0.5rem 1rem 1rem', background: '#161b22', borderTop: '1px solid #21262d', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
          {/* Voice button */}
          <button onClick={handleVoiceInput}
            style={{
              width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
              background: voice.isListening ? '#ef4444' : '#21262d',
              color: voice.isListening ? '#fff' : '#8b949e',
              fontSize: '1.2rem',
              animation: voice.isListening ? 'pulse 1s infinite, ripple 1.5s infinite' : 'none',
            }}>
            {voice.isListening ? '⏹' : '🎤'}
          </button>

          {/* Text input */}
          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
              placeholder={voice.isListening ? 'Listening...' : lang === 'pidgin' ? 'Wetin you dey find?' : 'Ask me anything about Nigerian property...'}
              rows={1}
              style={{
                width: '100%', padding: '0.75rem 1rem', background: '#0d1117', border: '1px solid #30363d',
                borderRadius: '1.5rem', color: '#f0f6fc', fontSize: '0.875rem', outline: 'none', resize: 'none',
                boxSizing: 'border-box', lineHeight: 1.4,
              }}
            />
          </div>

          {/* Send button */}
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
            style={{
              width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              background: input.trim() && !loading ? advisor.accent : '#21262d',
              color: '#fff', fontSize: '1.1rem', flexShrink: 0,
            }}>
            {loading ? '⏳' : '↑'}
          </button>

          {/* Stop speaking button */}
          {voice.isSpeaking && (
            <button onClick={voice.stopSpeaking}
              style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer', background: '#ef444420', color: '#ef4444', fontSize: '1rem', flexShrink: 0, animation: 'pulse 1s infinite' }}>
              🔇
            </button>
          )}
        </div>

        {voice.isListening && (
          <div style={{ textAlign: 'center', marginTop: '0.5rem', color: '#ef4444', fontSize: '0.7rem', fontWeight: 700, animation: 'blink 1s infinite' }}>
            🎤 Listening... Speak now
          </div>
        )}
      </div>
    </div>
  )
}
