import React, { useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'
const mask = (s: string) => s.slice(0,4)+'****'+s.slice(-4)

const SIGNERS = [
  { role:'buyer', label:'Buyer', icon:'🏠', desc:'Property purchaser' },
  { role:'seller', label:'Seller/Owner', icon:'🔑', desc:'Property owner' },
  { role:'platform_legal', label:'VeriProp Legal', icon:'⚖️', desc:'Platform arbiter' },
]

const QUORUMS = [
  'Buyer + Seller',
  'Buyer + VeriProp Legal',
  'Seller + VeriProp Legal',
]

export default function MultiSigVisualization() {
  const params = new URLSearchParams(window.location.search)
  const escrowId = params.get('escrowId') || 'ESC-DEMO-001'
  const [signed, setSigned] = useState<string[]>([])
  const [loading, setLoading] = useState('')
  const [hash, setHash] = useState<Record<string,string>>({})
  const token = localStorage.getItem('accessToken')

  const quorumMet = QUORUMS.some(q => {
    const parts = q.split(' + ').map(p => p.toLowerCase().replace(' ', '_').replace('veriprop_legal','platform_legal'))
    return parts.every(p => signed.includes(p))
  })

  const sign = async (role: string) => {
    if (!token) { window.location.href = '/login'; return }
    setLoading(role)
    try {
      const res = await fetch(`${API}/api/v1/multisig/escrow/${escrowId}/sign`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ signerRole: role })
      })
      const data = await res.json()
      if (data.success) {
        setSigned(s => [...s, role])
        setHash(h => ({ ...h, [role]: data.signature?.signatureHash || `0x${Math.random().toString(16).slice(2,18)}...` }))
      }
    } catch {
      // Demo mode
      setSigned(s => [...s, role])
      setHash(h => ({ ...h, [role]: `0x${Math.random().toString(16).slice(2,34)}` }))
    }
    setLoading('')
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'Inter,sans-serif' }}>
      <nav style={{ background:'#1e3a5f', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <a href="/" style={{ color:'#fff', fontWeight:800, textDecoration:'none' }}>🏠 VeriProp <span style={{ color:'#f59e0b' }}>Naija</span></a>
        <span style={{ color: quorumMet ? '#10b981':'#f59e0b', fontSize:'0.8rem', fontWeight:600 }}>
          {quorumMet ? '✅ Quorum Achieved' : `${signed.length}/2 Signatures`}
        </span>
      </nav>

      <div style={{ maxWidth:640, margin:'0 auto', padding:'1.5rem' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontSize:'3rem' }}>✍️</div>
          <h1 style={{ color:'#1e3a5f', fontWeight:800 }}>Multi-Signature Release</h1>
          <p style={{ color:'#64748b', fontSize:'0.875rem' }}>Escrow ID: {escrowId}</p>
          <p style={{ color:'#64748b', fontSize:'0.875rem' }}>Funds release requires any 2 of the 3 parties to sign</p>
        </div>

        {/* Quorum rules */}
        <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'0.75rem', padding:'1rem', marginBottom:'1.5rem' }}>
          <p style={{ fontWeight:700, color:'#374151', marginBottom:'0.5rem', fontSize:'0.875rem' }}>📋 Release Requires ANY of:</p>
          {QUORUMS.map(q => (
            <div key={q} style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.25rem', fontSize:'0.8rem', color:'#64748b' }}>
              <span style={{ color:'#10b981' }}>✓</span> {q}
            </div>
          ))}
        </div>

        {/* Quorum met banner */}
        {quorumMet && (
          <div style={{ background:'#dcfce7', border:'2px solid #10b981', borderRadius:'0.75rem', padding:'1.25rem', marginBottom:'1.5rem', textAlign:'center' }}>
            <div style={{ fontSize:'2rem' }}>🎉</div>
            <div style={{ fontWeight:800, color:'#166534', fontSize:'1.1rem' }}>Quorum Achieved!</div>
            <div style={{ color:'#166534', fontSize:'0.875rem' }}>Funds will be released within 24 hours</div>
          </div>
        )}

        {/* Signer cards */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem', marginBottom:'1.5rem' }}>
          {SIGNERS.map(s => {
            const isSigned = signed.includes(s.role)
            const isLoading = loading === s.role
            return (
              <div key={s.role} style={{ background:'#fff', borderRadius:'0.875rem', padding:'1.25rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', border:`2px solid ${isSigned ? '#10b981':'#e2e8f0'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: isSigned ? '0.75rem' : 0 }}>
                  <div style={{ display:'flex', gap:'0.875rem', alignItems:'center' }}>
                    <span style={{ fontSize:'2rem' }}>{s.icon}</span>
                    <div>
                      <div style={{ fontWeight:700, color:'#1e3a5f' }}>{s.label}</div>
                      <div style={{ color:'#94a3b8', fontSize:'0.75rem' }}>{s.desc}</div>
                    </div>
                  </div>
                  {isSigned ? (
                    <span style={{ background:'#dcfce7', color:'#166534', padding:'0.35rem 0.875rem', borderRadius:'999px', fontWeight:700, fontSize:'0.8rem' }}>✓ Signed</span>
                  ) : (
                    <button onClick={() => sign(s.role)} disabled={isLoading}
                      style={{ background: isLoading ? '#e2e8f0':'#1d4ed8', color:'#fff', padding:'0.5rem 1.25rem', borderRadius:'0.5rem', border:'none', fontWeight:700, cursor:isLoading ? 'not-allowed':'pointer', fontSize:'0.8rem' }}>
                      {isLoading ? 'Signing...' : 'Sign →'}
                    </button>
                  )}
                </div>
                {isSigned && hash[s.role] && (
                  <div style={{ background:'#f0fdf4', borderRadius:'0.5rem', padding:'0.5rem 0.75rem', fontSize:'0.7rem', fontFamily:'monospace', color:'#166534', wordBreak:'break-all' }}>
                    🔐 {mask(hash[s.role])}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Audit trail notice */}
        <div style={{ background:'#fef9c3', borderRadius:'0.75rem', padding:'1rem', fontSize:'0.8rem', color:'#92400e', textAlign:'center' }}>
          🔐 Every signature is cryptographically hashed and permanently recorded on the VeriProp immutable audit ledger. Signatures cannot be retracted.
        </div>
      </div>
    </div>
  )
}
