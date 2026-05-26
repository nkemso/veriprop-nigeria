import React, { useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'

const TIERS = [
  {
    tier: 'TIER1_BVN',
    label: 'Tier 1 — BVN Verification',
    desc: 'Link your Bank Verification Number to unlock basic marketplace access.',
    icon: '🏦',
    required: true,
  },
  {
    tier: 'TIER2_GOVT_ID',
    label: 'Tier 2 — Government ID',
    desc: 'Upload a valid NIN slip, International Passport, or Drivers License.',
    icon: '🪪',
    required: true,
  },
  {
    tier: 'TIER3_BIOMETRIC',
    label: 'Tier 3 — Selfie Liveness Check',
    desc: 'Mandatory biometric verification. A 30-second selfie scan to confirm your identity.',
    icon: '🤳',
    required: true,
  },
]

export default function VerificationHub() {
  const [openTier, setOpenTier] = useState<string | null>('TIER1_BVN')

  // BVN state
  const [bvn, setBvn] = useState('')
  const [bvnLoading, setBvnLoading] = useState(false)
  const [bvnMsg, setBvnMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // NIN / ID state
  const [idType, setIdType] = useState('nin')
  const [idNumber, setIdNumber] = useState('')
  const [ninLoading, setNinLoading] = useState(false)
  const [ninMsg, setNinMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const token = localStorage.getItem('accessToken')

  const submitBVN = async () => {
    if (bvn.length !== 11) return
    setBvnLoading(true)
    setBvnMsg(null)
    try {
      const res = await fetch(`${API}/api/v1/verify/bvn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bvn }),
      })
      const data = await res.json()
      setBvnMsg({ ok: data.success, text: data.message })
    } catch {
      setBvnMsg({ ok: false, text: 'Verification failed. Please try again.' })
    }
    setBvnLoading(false)
  }

  const submitNIN = async () => {
    if (idNumber.length < 9) return
    setNinLoading(true)
    setNinMsg(null)
    try {
      const res = await fetch(`${API}/api/v1/verify/nin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nin: idNumber }),
      })
      const data = await res.json()
      setNinMsg({ ok: data.success, text: data.message })
    } catch {
      setNinMsg({ ok: false, text: 'Verification failed. Please try again.' })
    }
    setNinLoading(false)
  }

  const toggleTier = (tier: string) => {
    setOpenTier(prev => prev === tier ? null : tier)
  }

  const inp: React.CSSProperties = {
    width: '100%',
    padding: '0.875rem 1rem',
    border: '2px solid #e2e8f0',
    borderRadius: '0.5rem',
    fontSize: '1.1rem',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'monospace',
    letterSpacing: '0.1em',
    color: '#1e3a5f',
    background: '#fff',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter,sans-serif' }}>
      {/* Nav */}
      <nav style={{ background: '#1e3a5f', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/" style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', textDecoration: 'none' }}>
          🏠 VeriProp <span style={{ color: '#f59e0b' }}>Nigeria</span>
        </a>
        <a href="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.875rem' }}>← Dashboard</a>
      </nav>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem' }}>🛡️</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e3a5f', margin: '0.5rem 0 0.25rem' }}>
            Identity Verification
          </h1>
          <p style={{ color: '#64748b', margin: 0 }}>
            Complete your KYC to unlock full marketplace access.
          </p>
        </div>

        {!token && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem', fontWeight: 600, textAlign: 'center' }}>
            ⚠️ Please <a href="/login" style={{ color: '#1d4ed8' }}>log in</a> first to complete verification.
          </div>
        )}

        {/* Tier Cards */}
        {TIERS.map(tier => {
          const isOpen = openTier === tier.tier

          return (
            <div key={tier.tier} style={{
              background: '#fff', borderRadius: '1rem', marginBottom: '1rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
              border: isOpen ? '2px solid #1d4ed8' : '2px solid transparent',
              overflow: 'hidden',
            }}>
              {/* Header row — ONLY this row is clickable to toggle */}
              <div
                onClick={() => toggleTier(tier.tier)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1.25rem 1.5rem', cursor: 'pointer', userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '2rem' }}>{tier.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e3a5f' }}>{tier.label}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>{tier.desc}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0, marginLeft: '1rem' }}>
                  <span style={{
                    background: tier.required ? '#dbeafe' : '#f1f5f9',
                    color: tier.required ? '#1d4ed8' : '#64748b',
                    padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                  }}>
                    {tier.required ? 'Required' : 'Optional'}
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '1rem', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                    ▼
                  </span>
                </div>
              </div>

              {/* Expanded form — NOT inside the clickable header */}
              {isOpen && (
                <div
                  style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid #f1f5f9' }}
                  onClick={e => e.stopPropagation()} // ← Stop ALL clicks inside from bubbling
                >

                  {/* ── TIER 1: BVN ── */}
                  {tier.tier === 'TIER1_BVN' && (
                    <div style={{ paddingTop: '1.25rem' }}>
                      {bvnMsg && (
                        <div style={{ background: bvnMsg.ok ? '#dcfce7' : '#fee2e2', color: bvnMsg.ok ? '#166534' : '#991b1b', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>
                          {bvnMsg.ok ? '✅' : '❌'} {bvnMsg.text}
                        </div>
                      )}
                      <label style={{ fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        Enter your BVN (11 digits)
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={11}
                        value={bvn}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 11)
                          setBvn(val)
                        }}
                        onFocus={e => { e.stopPropagation() }}
                        onClick={e => { e.stopPropagation() }}
                        placeholder="e.g. 12345678901"
                        autoComplete="off"
                        style={inp}
                      />
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', marginBottom: '1rem' }}>
                        🔒 Your BVN is encrypted and never stored in plain text. We use NIBSS for verification.
                      </p>
                      {/* Visual digit counter */}
                      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
                        {Array.from({ length: 11 }).map((_, i) => (
                          <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i < bvn.length ? '#1d4ed8' : '#e2e8f0', transition: 'background 0.2s' }} />
                        ))}
                      </div>
                      <button
                        onClick={submitBVN}
                        disabled={bvn.length !== 11 || bvnLoading || !token}
                        style={{
                          width: '100%', padding: '0.875rem',
                          background: bvn.length === 11 && !bvnLoading && token ? '#1d4ed8' : '#94a3b8',
                          color: '#fff', border: 'none', borderRadius: '0.5rem',
                          fontWeight: 700, fontSize: '1rem',
                          cursor: bvn.length === 11 && !bvnLoading && token ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {bvnLoading ? '⏳ Verifying...' : `Verify BVN (${bvn.length}/11) →`}
                      </button>
                    </div>
                  )}

                  {/* ── TIER 2: GOVT ID / NIN ── */}
                  {tier.tier === 'TIER2_GOVT_ID' && (
                    <div style={{ paddingTop: '1.25rem' }}>
                      {ninMsg && (
                        <div style={{ background: ninMsg.ok ? '#dcfce7' : '#fee2e2', color: ninMsg.ok ? '#166534' : '#991b1b', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>
                          {ninMsg.ok ? '✅' : '❌'} {ninMsg.text}
                        </div>
                      )}
                      <label style={{ fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        Select ID Type
                      </label>
                      <select
                        value={idType}
                        onChange={e => { e.stopPropagation(); setIdType(e.target.value) }}
                        onClick={e => e.stopPropagation()}
                        style={{ ...inp, fontFamily: 'Inter,sans-serif', letterSpacing: 'normal', marginBottom: '1rem', cursor: 'pointer' }}
                      >
                        <option value="nin">NIN (National Identity Number)</option>
                        <option value="passport">International Passport</option>
                        <option value="drivers_license">Drivers License</option>
                        <option value="voters_card">Voter Card</option>
                      </select>

                      <label style={{ fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        {idType === 'nin' ? 'NIN (11 digits)' : idType === 'passport' ? 'Passport Number' : idType === 'drivers_license' ? 'License Number' : 'Voter Card Number'}
                      </label>
                      <input
                        type={idType === 'nin' ? 'tel' : 'text'}
                        inputMode={idType === 'nin' ? 'numeric' : 'text'}
                        maxLength={idType === 'nin' ? 11 : 20}
                        value={idNumber}
                        onChange={e => {
                          e.stopPropagation()
                          const val = idType === 'nin'
                            ? e.target.value.replace(/\D/g, '').slice(0, 11)
                            : e.target.value.slice(0, 20)
                          setIdNumber(val)
                        }}
                        onFocus={e => e.stopPropagation()}
                        onClick={e => e.stopPropagation()}
                        placeholder={idType === 'nin' ? 'e.g. 12345678901' : 'Enter ID number'}
                        autoComplete="off"
                        style={inp}
                      />

                      {idType === 'nin' && (
                        <div style={{ display: 'flex', gap: '0.25rem', margin: '0.75rem 0' }}>
                          {Array.from({ length: 11 }).map((_, i) => (
                            <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i < idNumber.length ? '#10b981' : '#e2e8f0', transition: 'background 0.2s' }} />
                          ))}
                        </div>
                      )}

                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', marginBottom: '1rem' }}>
                        🔒 Your ID details are encrypted and verified securely via NIBSS / Smile Identity.
                      </p>

                      <button
                        onClick={submitNIN}
                        disabled={idNumber.length < 9 || ninLoading || !token}
                        style={{
                          width: '100%', padding: '0.875rem',
                          background: idNumber.length >= 9 && !ninLoading && token ? '#10b981' : '#94a3b8',
                          color: '#fff', border: 'none', borderRadius: '0.5rem',
                          fontWeight: 700, fontSize: '1rem',
                          cursor: idNumber.length >= 9 && !ninLoading && token ? 'pointer' : 'not-allowed',
                          marginBottom: '0.75rem',
                        }}
                      >
                        {ninLoading ? '⏳ Verifying...' : `Verify ${idType.replace('_', ' ').toUpperCase()} →`}
                      </button>
                    </div>
                  )}

                  {/* ── TIER 3: NOTARY ── */}
                  {tier.tier === 'TIER3_BIOMETRIC' && (
                    <div style={{ paddingTop: '1.25rem' }}>
                      <div style={{ background: 'linear-gradient(135deg,#0d1117,#161b22)', border: '1px solid #21262d', borderRadius: '0.875rem', padding: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🤳</div>
                        <div style={{ fontWeight: 800, color: '#f0f6fc', fontSize: '1rem', marginBottom: '0.5rem' }}>Biometric Selfie Liveness Check</div>
                        <p style={{ color: '#8b949e', fontSize: '0.8rem', lineHeight: 1.7, margin: '0 0 1rem' }}>
                          A 30-second guided selfie scan to confirm you are a real, live person. No document upload needed.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                          {['👀 Look straight', '⬅️ Turn left', '➡️ Turn right', '👁️ Blink', '😊 Smile'].map(p => (
                            <span key={p} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem' }}>{p}</span>
                          ))}
                        </div>
                        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '0.5rem', padding: '0.625rem', fontSize: '0.75rem', color: '#10b981', marginBottom: '1rem' }}>
                          🔒 Biometric data is processed locally per NDPR 2019 and never stored permanently.
                        </div>
                      </div>
                      <a
                        href="/verify/biometric"
                        onClick={e => e.stopPropagation()}
                        style={{ display: 'block', width: '100%', padding: '0.875rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', textDecoration: 'none', textAlign: 'center', boxSizing: 'border-box' }}>
                        🤳 Start Biometric Scan →
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Why Verify */}
        <div style={{ background: '#eff6ff', borderRadius: '1rem', padding: '1.5rem', marginTop: '1.5rem' }}>
          <h3 style={{ color: '#1d4ed8', fontWeight: 700, marginBottom: '0.75rem', margin: '0 0 0.75rem' }}>
            🔐 Why do we verify?
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              'Prevent fraud and fake listings',
              'Protect buyers from property scams',
              'Ensure only genuine sellers list properties',
              'Comply with CBN KYC and NDPR regulations',
              'Unlock escrow and multi-sig transaction features',
            ].map(item => (
              <li key={item} style={{ color: '#374151', display: 'flex', gap: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ color: '#1d4ed8' }}>✅</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
