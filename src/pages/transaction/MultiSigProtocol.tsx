// SCREEN_122 — Multi-Sig Protocol Screen
import React, { useState, useEffect } from 'react';

interface Signature { signerRole: string; signedAt: string; signer: { firstName: string; lastName: string } }
interface MultiSigState {
  escrowId: string; multiSigStatus: string; quorumMet: boolean;
  signatures: Signature[]; signedRoles: string[]; pendingRoles: string[];
}

export default function MultiSigProtocol({ escrowId }: { escrowId: string }) {
  const [state, setState] = useState<MultiSigState | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/escrow/${escrowId}/multisig`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const data = await res.json();
      if (data.success) setState(data.data);
    } catch { setError('Failed to load multi-sig status'); }
    setLoading(false);
  };

  useEffect(() => { fetchStatus(); }, [escrowId]);

  const submitSignature = async (role: string) => {
    setSigning(true);
    setError('');
    try {
      const res = await fetch(`/api/escrow/${escrowId}/multisig/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({ signerRole: role }),
      });
      const data = await res.json();
      if (data.success) { setSuccess(data.message); fetchStatus(); }
      else setError(data.message);
    } catch { setError('Signing failed. Try again.'); }
    setSigning(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Loading multi-sig status...</div>;

  const ROLE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
    buyer: { label: 'Buyer', icon: '🏠', color: '#3b82f6' },
    seller: { label: 'Seller/Owner', icon: '🔑', color: '#10b981' },
    platform_legal: { label: 'VeriProp Legal', icon: '⚖️', color: '#8b5cf6' },
    notary: { label: 'Notary Public', icon: '📜', color: '#f59e0b' },
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3.5rem' }}>✍️</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a5f' }}>Multi-Signature Release</h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
          Funds are released only when the required parties approve.
        </p>
      </div>

      {/* Quorum Status */}
      <div style={{
        background: state?.quorumMet ? '#dcfce7' : '#eff6ff',
        border: `2px solid ${state?.quorumMet ? '#10b981' : '#3b82f6'}`,
        borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'center',
      }}>
        {state?.quorumMet ? (
          <>
            <div style={{ fontSize: '2rem' }}>✅</div>
            <div style={{ fontWeight: 700, color: '#166534', fontSize: '1.125rem' }}>Quorum Achieved!</div>
            <div style={{ color: '#166534', fontSize: '0.875rem' }}>All required signatures collected. Funds are being released.</div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2rem' }}>⏳</div>
            <div style={{ fontWeight: 700, color: '#1d4ed8' }}>Awaiting Signatures</div>
            <div style={{ color: '#3b82f6', fontSize: '0.875rem' }}>
              {state?.signedRoles.length || 0} of 2 required signatures collected
            </div>
          </>
        )}
      </div>

      {/* Quorum Rules */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem' }}>
        <p style={{ fontWeight: 700, color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>📋 Release Requires ANY of:</p>
        {[
          ['Buyer', '+', 'Seller'],
          ['Buyer', '+', 'VeriProp Legal'],
          ['Seller', '+', 'VeriProp Legal'],
        ].map((combo, i) => (
          <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.25rem', fontSize: '0.8rem', color: '#64748b' }}>
            <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontWeight: 600 }}>{combo[0]}</span>
            <span>{combo[1]}</span>
            <span style={{ background: '#d1fae5', color: '#059669', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontWeight: 600 }}>{combo[2]}</span>
          </div>
        ))}
      </div>

      {/* Signature Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        {Object.entries(ROLE_LABELS).map(([role, meta]) => {
          const signed = state?.signedRoles.includes(role);
          const sig = state?.signatures.find(s => s.signerRole === role);
          return (
            <div key={role} style={{
              background: '#fff', borderRadius: '0.75rem', padding: '1.25rem',
              border: signed ? `2px solid ${meta.color}` : '2px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.75rem' }}>{meta.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e3a5f' }}>{meta.label}</div>
                    {signed && sig && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {sig.signer.firstName} {sig.signer.lastName} — {new Date(sig.signedAt).toLocaleString('en-NG')}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  padding: '0.375rem 0.875rem', borderRadius: '999px', fontWeight: 700, fontSize: '0.8rem',
                  background: signed ? meta.color : '#f1f5f9',
                  color: signed ? '#fff' : '#94a3b8',
                }}>
                  {signed ? '✓ Signed' : 'Pending'}
                </div>
              </div>
              {!signed && (role === 'buyer' || role === 'seller') && (
                <button
                  onClick={() => submitSignature(role)}
                  disabled={signing}
                  style={{
                    marginTop: '0.75rem', width: '100%', padding: '0.625rem',
                    background: meta.color, color: '#fff', border: 'none',
                    borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
                  }}
                >
                  {signing ? 'Signing...' : `Sign as ${meta.label} →`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>❌ {error}</div>}
      {success && <div style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>✅ {success}</div>}

      <div style={{ background: '#fef9c3', border: '1px solid #fbbf24', borderRadius: '0.75rem', padding: '1rem', fontSize: '0.8rem', color: '#92400e' }}>
        🔐 <strong>Security:</strong> Every signature is cryptographically hashed and immutably recorded on the VeriProp audit ledger. Once signed, signatures cannot be retracted.
      </div>
    </div>
  );
}
