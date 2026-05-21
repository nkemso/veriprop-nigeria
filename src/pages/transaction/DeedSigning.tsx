// SCREEN_54 — Deed Signing
import React, { useState } from 'react';

export default function DeedSigning({ transactionId }: { transactionId: string }) {
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [role, setRole] = useState<'buyer' | 'seller'>('buyer');

  const signDeed = async () => {
    setSigning(true);
    try {
      const res = await fetch(`/api/legal/deed/${transactionId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success) setSigned(true);
    } catch {}
    setSigning(false);
  };

  if (signed) return (
    <div style={{ textAlign: 'center', padding: '3rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
      <h2 style={{ color: '#166534', fontWeight: 800 }}>Deed Signed Successfully!</h2>
      <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Your digital signature has been recorded on the VeriProp ledger.</p>
      <div style={{ background: '#dcfce7', borderRadius: '0.75rem', padding: '1rem', marginTop: '1.5rem', fontSize: '0.875rem', color: '#166534' }}>
        🔐 Signature Hash recorded · {new Date().toLocaleString('en-NG')}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem' }}>📜</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a5f' }}>Deed of Assignment</h1>
        <p style={{ color: '#64748b' }}>Review and sign the property transfer document.</p>
      </div>

      {/* Deed Preview */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#374151', lineHeight: 1.8, maxHeight: 300, overflowY: 'auto' }}>
        <h3 style={{ fontWeight: 800, marginBottom: '1rem', color: '#1e3a5f' }}>DEED OF ASSIGNMENT</h3>
        <p>THIS DEED OF ASSIGNMENT is made between the Vendor (Seller) and the Purchaser (Buyer) for the property identified under Transaction ID: <strong>{transactionId}</strong>.</p>
        <p style={{ marginTop: '1rem' }}>The Vendor hereby assigns, transfers, and conveys unto the Purchaser all rights, title, and interest in the said property, subject to completion of the VeriProp Escrow multi-signature release process.</p>
        <p style={{ marginTop: '1rem' }}>This deed is legally binding under Nigerian Property Law and the VeriProp Nigeria Terms of Service.</p>
        <p style={{ marginTop: '1rem' }}><strong>Transaction ID:</strong> {transactionId}</p>
        <p><strong>Date:</strong> {new Date().toLocaleDateString('en-NG', { dateStyle: 'full' })}</p>
      </div>

      {/* Role Selection */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>Signing as:</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          {(['buyer', 'seller'] as const).map(r => (
            <button key={r} onClick={() => setRole(r)} style={{
              padding: '0.75rem', border: `2px solid ${role === r ? '#1d4ed8' : '#e2e8f0'}`,
              borderRadius: '0.5rem', background: role === r ? '#eff6ff' : '#fff',
              color: role === r ? '#1d4ed8' : '#374151', fontWeight: 700, cursor: 'pointer',
              textTransform: 'capitalize',
            }}>{role === r ? '✓ ' : ''}{r}</button>
          ))}
        </div>
      </div>

      {/* Consent Checkbox */}
      <label style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '1.5rem', padding: '1rem', background: '#fef9c3', borderRadius: '0.75rem' }}>
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: '0.25rem', width: 18, height: 18, cursor: 'pointer' }} />
        <span style={{ fontSize: '0.875rem', color: '#92400e', lineHeight: 1.6 }}>
          I have read and understood the Deed of Assignment above. I agree that my digital signature on this platform constitutes a legally binding signature under Nigerian law.
        </span>
      </label>

      <button onClick={signDeed} disabled={!agreed || signing} style={{
        width: '100%', padding: '1rem', background: agreed ? '#1d4ed8' : '#94a3b8',
        color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: 800,
        fontSize: '1.1rem', cursor: agreed ? 'pointer' : 'not-allowed',
      }}>
        {signing ? 'Signing...' : '✍️ Sign Deed of Assignment'}
      </button>
    </div>
  );
}
