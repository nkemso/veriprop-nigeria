// SCREEN_87 — Verification Hub
import React, { useState } from 'react';

const TIERS = [
  {
    tier: 'TIER1_BVN',
    label: 'Tier 1 — BVN Verification',
    desc: 'Link your Bank Verification Number to unlock basic marketplace access.',
    icon: '🏦',
    required: true,
    fields: ['bvn'],
  },
  {
    tier: 'TIER2_GOVT_ID',
    label: 'Tier 2 — Government ID',
    desc: 'Upload a valid NIN slip, International Passport, or Drivers License.',
    icon: '🪪',
    required: true,
    fields: ['idType', 'idNumber', 'idImage'],
  },
  {
    tier: 'TIER3_NOTARY',
    label: 'Tier 3 — Notary / Legal Certification',
    desc: 'Required for high-value transactions. Upload a notarized affidavit.',
    icon: '⚖️',
    required: false,
    fields: ['notaryDoc'],
  },
];

export default function VerificationHub() {
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [bvn, setBvn] = useState('');
  const [idType, setIdType] = useState('nin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const submitBVN = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/verify/bvn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ bvn }),
      });
      const data = await res.json();
      setMessage({ type: data.success ? 'success' : 'error', text: data.message });
    } catch {
      setMessage({ type: 'error', text: 'Verification failed. Try again.' });
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif', padding: '2rem 1rem' }}>
      {/* Header */}
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem' }}>🛡️</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e3a5f' }}>Identity Verification</h1>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
            VeriProp Nigeria uses a 3-tier verification system to protect all users.
          </p>
        </div>

        {/* Alert */}
        {message && (
          <div style={{
            padding: '1rem', borderRadius: '0.75rem', marginBottom: '1rem',
            background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            fontWeight: 600,
          }}>
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </div>
        )}

        {/* Tier Cards */}
        {TIERS.map((tier, i) => (
          <div key={tier.tier} style={{
            background: '#fff', borderRadius: '1rem', padding: '1.5rem',
            marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            border: currentTier === tier.tier ? '2px solid #1d4ed8' : '2px solid transparent',
            cursor: 'pointer',
          }} onClick={() => setCurrentTier(currentTier === tier.tier ? null : tier.tier)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '2rem' }}>{tier.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#1e3a5f' }}>{tier.label}</div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{tier.desc}</div>
                </div>
              </div>
              <span style={{
                background: tier.required ? '#dbeafe' : '#f1f5f9',
                color: tier.required ? '#1d4ed8' : '#64748b',
                padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600,
              }}>
                {tier.required ? 'Required' : 'Optional'}
              </span>
            </div>

            {/* Expanded Form */}
            {currentTier === tier.tier && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                {tier.tier === 'TIER1_BVN' && (
                  <div>
                    <label style={{ fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>
                      Enter BVN (11 digits)
                    </label>
                    <input
                      type="text" maxLength={11} value={bvn}
                      onChange={e => setBvn(e.target.value.replace(/\D/g, ''))}
                      placeholder="12345678901"
                      style={{
                        width: '100%', padding: '0.875rem 1rem', border: '2px solid #e2e8f0',
                        borderRadius: '0.5rem', fontSize: '1rem', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                      🔒 Your BVN is encrypted and never stored in plain text.
                    </p>
                    <button
                      onClick={submitBVN} disabled={bvn.length !== 11 || loading}
                      style={{
                        marginTop: '1rem', width: '100%', padding: '0.875rem',
                        background: bvn.length === 11 ? '#1d4ed8' : '#94a3b8',
                        color: '#fff', border: 'none', borderRadius: '0.5rem',
                        fontWeight: 700, fontSize: '1rem', cursor: bvn.length === 11 ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {loading ? 'Verifying...' : 'Verify BVN →'}
                    </button>
                  </div>
                )}
                {tier.tier === 'TIER2_GOVT_ID' && (
                  <div>
                    <label style={{ fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>
                      Select ID Type
                    </label>
                    <select
                      value={idType} onChange={e => setIdType(e.target.value)}
                      style={{ width: '100%', padding: '0.875rem', border: '2px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box' }}
                    >
                      <option value="nin">NIN Slip</option>
                      <option value="passport">International Passport</option>
                      <option value="drivers_license">Drivers License</option>
                      <option value="voters_card">Voter's Card</option>
                    </select>
                    <button style={{
                      marginTop: '1rem', width: '100%', padding: '0.875rem',
                      background: '#1d4ed8', color: '#fff', border: 'none',
                      borderRadius: '0.5rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                    }}>
                      Upload ID Document →
                    </button>
                  </div>
                )}
                {tier.tier === 'TIER3_NOTARY' && (
                  <div>
                    <p style={{ color: '#374151', marginBottom: '1rem' }}>
                      Upload a notarized affidavit or legal certification document (PDF, JPG, PNG).
                    </p>
                    <button style={{
                      width: '100%', padding: '0.875rem', background: '#1d4ed8',
                      color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer',
                    }}>
                      Upload Notary Document →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Why Verify */}
        <div style={{ background: '#eff6ff', borderRadius: '1rem', padding: '1.5rem', marginTop: '1.5rem' }}>
          <h3 style={{ color: '#1d4ed8', fontWeight: 700, marginBottom: '0.75rem' }}>
            🔐 Why do we verify?
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[
              'Prevent fraud and fake listings',
              'Protect buyers from property scams',
              'Ensure only genuine sellers list properties',
              'Comply with Nigerian KYC regulations',
            ].map((item, i) => (
              <li key={i} style={{ color: '#374151', display: 'flex', gap: '0.5rem' }}>
                <span>✅</span> {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
