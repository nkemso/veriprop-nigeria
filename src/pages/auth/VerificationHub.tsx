import React, { useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'

const TIERS = [
  {
    tier: 'TIER1_BVN',
    label: 'Step 1 — Register BVN',
    desc: 'Enter your Bank Verification Number to link your identity.',
    icon: '🏦',
    required: true,
  },
  {
    tier: 'TIER2_GOVT_ID',
    label: 'Step 2 — Register NIN',
    desc: 'Enter your National Identity Number for government ID linkage.',
    icon: '🪪',
    required: true,
  },
  {
    tier: 'TIER3_BIOMETRIC',
    label: 'Step 3 — Document & Biometric Verification',
    desc: 'Scan your ID card + selfie via Didit. This verifies your identity for real — document OCR, face match, and liveness check.',
    icon: '🛡️',
    required: true,
  },
]

export default function VerificationHub() {
  const [openTier, setOpenTier] = useState<string | null>('TIER1_BVN')

  // BVN state
  const [bvn, setBvn] = useState('')
  const [bvnLoading, setBvnLoading] = useState(false)
  const [bvnMsg, setBvnMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // NIN state
  const [idNumber, setIdNumber] = useState('')
  const [ninLoading, setNinLoading] = useState(false)
  const [ninMsg, setNinMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // KYC session state
  const [kycLoading, setKycLoading] = useState(false)
  const [kycMsg, setKycMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const token = localStorage.getItem('accessToken')

  const submitBVN = async () => {
    if (bvn.length !== 11) return
    if (!token) { setBvnMsg({ ok: false, text: 'Please log in first.' }); return }
    setBvnLoading(true)
    setBvnMsg(null)
    try {
      const res = await fetch(`${API}/api/v1/verify/bvn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bvn }),
      })
      if (!res.ok && res.status === 401) {
        setBvnMsg({ ok: false, text: 'Session expired. Please log in again.' })
        setBvnLoading(false)
        return
      }
      const data = await res.json()
      setBvnMsg({ ok: data.success, text: data.message || (data.success ? 'BVN registered!' : 'Registration failed') })
      if (data.success) {
        const u = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({ ...u, bvnVerified: true, verificationTier: data.verificationTier || 'TIER1_BVN', ...(data.user || {}) }))
        window.dispatchEvent(new Event('userUpdated'))
      }
    } catch {
      setBvnMsg({ ok: false, text: 'Network error. Check your connection.' })
    }
    setBvnLoading(false)
  }

  const submitNIN = async () => {
    if (idNumber.length !== 11) return
    if (!token) { setNinMsg({ ok: false, text: 'Please log in first.' }); return }
    setNinLoading(true)
    setNinMsg(null)
    try {
      const res = await fetch(`${API}/api/v1/verify/nin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nin: idNumber }),
      })
      if (!res.ok && res.status === 401) {
        setNinMsg({ ok: false, text: 'Session expired. Please log in again.' })
        setNinLoading(false)
        return
      }
      const data = await res.json()
      setNinMsg({ ok: data.success, text: data.message || (data.success ? 'NIN registered!' : 'Registration failed') })
      if (data.success) {
        const u = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({ ...u, ninVerified: true, verificationTier: data.verificationTier || 'TIER2_GOVT_ID', ...(data.user || {}) }))
        window.dispatchEvent(new Event('userUpdated'))
      }
    } catch {
      setNinMsg({ ok: false, text: 'Network error. Check your connection.' })
    }
    setNinLoading(false)
  }

  const startKYCSession = async () => {
    if (!token) { setKycMsg({ ok: false, text: 'Please log in first.' }); return }
    setKycLoading(true)
    setKycMsg(null)
    try {
      const res = await fetch(`${API}/api/v1/verify/kyc-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      if (data.alreadyVerified) {
        setKycMsg({ ok: true, text: '✅ You are already fully verified!' })
        setKycLoading(false)
        return
      }

      if (data.success && data.sessionUrl) {
        setKycMsg({ ok: true, text: 'Redirecting to secure verification...' })
        // Redirect to Didit's hosted verification UI
        window.location.href = data.sessionUrl
        return
      }

      setKycMsg({ ok: false, text: data.message || 'Failed to start verification.' })
    } catch {
      setKycMsg({ ok: false, text: 'Network error. Check your connection.' })
    }
    setKycLoading(false)
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
            Complete all 3 steps to unlock full marketplace access.
          </p>
        </div>

        {/* How it works */}
        <div style={{ background: '#eff6ff', borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1.5rem', border: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>🔐</span>
            <div>
              <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '0.9rem', marginBottom: '0.25rem' }}>How verification works</div>
              <div style={{ color: '#475569', fontSize: '0.8rem', lineHeight: 1.6 }}>
                <strong>Steps 1-2:</strong> Register your BVN and NIN (duplicate detection prevents multiple accounts).<br/>
                <strong>Step 3:</strong> Scan your actual ID document + take a selfie. Didit AI verifies your document is real, your face matches, and you're a live person. <strong>100% free</strong> — 500 verifications/month.
              </div>
            </div>
          </div>
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
                    background: '#dbeafe', color: '#1d4ed8',
                    padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700,
                  }}>
                    Required
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '1rem', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                    ▼
                  </span>
                </div>
              </div>

              {isOpen && (
                <div
                  style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid #f1f5f9' }}
                  onClick={e => e.stopPropagation()}
                >

                  {/* ── STEP 1: BVN ── */}
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
                        onFocus={e => e.stopPropagation()}
                        onClick={e => e.stopPropagation()}
                        placeholder="e.g. 12345678901"
                        autoComplete="off"
                        style={inp}
                      />
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', marginBottom: '1rem' }}>
                        🔒 Your BVN is encrypted (SHA-256 hash) and never stored in plain text. It will be cross-verified when you scan your ID document in Step 3.
                      </p>
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
                        {bvnLoading ? '⏳ Registering...' : `Register BVN (${bvn.length}/11) →`}
                      </button>
                    </div>
                  )}

                  {/* ── STEP 2: NIN ── */}
                  {tier.tier === 'TIER2_GOVT_ID' && (
                    <div style={{ paddingTop: '1.25rem' }}>
                      {ninMsg && (
                        <div style={{ background: ninMsg.ok ? '#dcfce7' : '#fee2e2', color: ninMsg.ok ? '#166534' : '#991b1b', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>
                          {ninMsg.ok ? '✅' : '❌'} {ninMsg.text}
                        </div>
                      )}
                      <label style={{ fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        Enter your NIN (11 digits)
                      </label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={11}
                        value={idNumber}
                        onChange={e => {
                          e.stopPropagation()
                          setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 11))
                        }}
                        onFocus={e => e.stopPropagation()}
                        onClick={e => e.stopPropagation()}
                        placeholder="e.g. 12345678901"
                        autoComplete="off"
                        style={inp}
                      />

                      <div style={{ display: 'flex', gap: '0.25rem', margin: '0.75rem 0' }}>
                        {Array.from({ length: 11 }).map((_, i) => (
                          <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i < idNumber.length ? '#10b981' : '#e2e8f0', transition: 'background 0.2s' }} />
                        ))}
                      </div>

                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem', marginBottom: '1rem' }}>
                        🔒 Your NIN is encrypted and cross-verified when you scan your ID document in Step 3.
                      </p>

                      <button
                        onClick={submitNIN}
                        disabled={idNumber.length !== 11 || ninLoading || !token}
                        style={{
                          width: '100%', padding: '0.875rem',
                          background: idNumber.length === 11 && !ninLoading && token ? '#10b981' : '#94a3b8',
                          color: '#fff', border: 'none', borderRadius: '0.5rem',
                          fontWeight: 700, fontSize: '1rem',
                          cursor: idNumber.length === 11 && !ninLoading && token ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {ninLoading ? '⏳ Registering...' : `Register NIN (${idNumber.length}/11) →`}
                      </button>
                    </div>
                  )}

                  {/* ── STEP 3: DIDIT DOCUMENT + BIOMETRIC ── */}
                  {tier.tier === 'TIER3_BIOMETRIC' && (
                    <div style={{ paddingTop: '1.25rem' }}>
                      {kycMsg && (
                        <div style={{ background: kycMsg.ok ? '#dcfce7' : '#fee2e2', color: kycMsg.ok ? '#166534' : '#991b1b', padding: '0.75rem 1rem', borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>
                          {kycMsg.ok ? '✅' : '❌'} {kycMsg.text}
                        </div>
                      )}

                      <div style={{ background: 'linear-gradient(135deg,#0d1117,#161b22)', border: '1px solid #21262d', borderRadius: '0.875rem', padding: '1.5rem', marginBottom: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🛡️</div>
                        <div style={{ fontWeight: 800, color: '#f0f6fc', fontSize: '1rem', marginBottom: '0.5rem' }}>Didit Identity Verification</div>
                        <p style={{ color: '#8b949e', fontSize: '0.8rem', lineHeight: 1.7, margin: '0 0 1rem' }}>
                          You'll be redirected to Didit's secure verification page to scan your ID document and take a selfie. This proves you are who you say you are.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                          {['📄 Scan ID card', '🤳 Take selfie', '🔍 Face match', '✅ Liveness check'].map(p => (
                            <span key={p} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem' }}>{p}</span>
                          ))}
                        </div>

                        <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '0.5rem', padding: '0.625rem', fontSize: '0.75rem', color: '#60a5fa', marginBottom: '0.75rem' }}>
                          📋 Accepted documents: NIN Slip, International Passport, Driver's License, National ID Card
                        </div>

                        <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '0.5rem', padding: '0.625rem', fontSize: '0.75rem', color: '#10b981' }}>
                          🆓 100% FREE — powered by Didit AI. No charges. NDPR 2019 compliant.
                        </div>
                      </div>

                      <button
                        onClick={startKYCSession}
                        disabled={kycLoading || !token}
                        style={{
                          width: '100%', padding: '1rem',
                          background: !kycLoading && token ? '#10b981' : '#94a3b8',
                          color: '#fff', border: 'none', borderRadius: '0.5rem',
                          fontWeight: 800, fontSize: '1rem',
                          cursor: !kycLoading && token ? 'pointer' : 'not-allowed',
                          boxShadow: !kycLoading && token ? '0 8px 24px rgba(16,185,129,0.3)' : 'none',
                        }}
                      >
                        {kycLoading ? '⏳ Creating session...' : '🛡️ Start Document Verification →'}
                      </button>

                      <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.75rem', textAlign: 'center' }}>
                        You'll be redirected to Didit's secure page. After verification, you'll be sent back here automatically.
                      </p>
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
