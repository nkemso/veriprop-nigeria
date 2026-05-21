import React from 'react';
export default function ComplianceCenter() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e3a5f' }}>📋 Compliance Center</h1>
      <p style={{ color: '#64748b' }}>NDPR · CBN · SEC · EFCC compliance monitoring dashboard.</p>
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {[
          ['🇳🇬 NDPR', 'Nigeria Data Protection Regulation', 'Compliant'],
          ['🏦 CBN KYC', 'Central Bank KYC Requirements', 'Compliant'],
          ['📊 SEC', 'Securities & Exchange Commission', 'Compliant'],
          ['🔍 EFCC AML', 'Anti-Money Laundering Checks', 'Active'],
          ['💰 FIRS Tax', 'Federal Inland Revenue Service', 'Reporting'],
          ['📄 FAAN', 'Foreign Asset Acquisition Notice', 'Monitoring'],
        ].map(([title, desc, status]) => (
          <div key={title} style={{ background: '#fff', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ fontWeight: 700, color: '#1e3a5f', marginBottom: '0.25rem' }}>{title}</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>{desc}</div>
            <span style={{ background: '#dcfce7', color: '#166534', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 }}>
              ✓ {status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
