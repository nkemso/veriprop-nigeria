// SCREEN_76 — Transaction Success Flow
import React, { useEffect, useState } from 'react';
import { formatPrice } from '../../lib/property-search';

export default function SuccessFlow({ transactionId }: { transactionId?: string }) {
  const [confetti, setConfetti] = useState(false);
  useEffect(() => { setConfetti(true); setTimeout(() => setConfetti(false), 4000); }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: '2rem' }}>
      <div style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
        {/* Success Animation */}
        <div style={{ fontSize: '5rem', marginBottom: '1.5rem', animation: 'bounce 0.5s ease' }}>🎉</div>
        <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }`}</style>

        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#166534', marginBottom: '0.5rem' }}>Transaction Complete!</h1>
        <p style={{ color: '#4ade80', fontSize: '1.125rem', marginBottom: '2rem' }}>
          Your VeriProp transaction has been successfully completed.
        </p>

        {/* Summary Card */}
        <div style={{ background: '#fff', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              ['✅', 'Identity Verified', 'All parties KYC-confirmed'],
              ['🔒', 'Escrow Released', 'Funds distributed via multi-sig'],
              ['💸', 'Split Processed', '5% Platform · 10% Agent · 7.5% VAT'],
              ['📜', 'Deed Signed', 'Legal document recorded'],
              ['🏠', 'Property Transferred', 'Ownership updated on ledger'],
            ].map(([icon, title, desc]) => (
              <div key={title as string} style={{ display: 'flex', gap: '1rem', alignItems: 'center', textAlign: 'left' }}>
                <span style={{ fontSize: '1.5rem', minWidth: 36 }}>{icon as string}</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '0.9rem' }}>{title as string}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{desc as string}</div>
                </div>
              </div>
            ))}
          </div>

          {transactionId && (
            <div style={{ marginTop: '1.5rem', padding: '0.75rem', background: '#f0fdf4', borderRadius: '0.75rem', fontSize: '0.75rem', color: '#166534', fontFamily: 'monospace' }}>
              Transaction ID: {transactionId}
            </div>
          )}
        </div>

        {/* CTAs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <a href="/dashboard" style={{ padding: '0.875rem', background: '#1d4ed8', color: '#fff', borderRadius: '0.75rem', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}>
            📊 View Portfolio
          </a>
          <a href="/properties" style={{ padding: '0.875rem', background: '#fff', color: '#1d4ed8', borderRadius: '0.75rem', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem', border: '2px solid #1d4ed8' }}>
            🏠 Browse More
          </a>
        </div>

        <p style={{ color: '#4ade80', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          Receipt sent to your registered email · Support: support@veripronigeria.com
        </p>
      </div>
    </div>
  );
}
