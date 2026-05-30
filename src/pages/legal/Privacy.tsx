import React from 'react'

const NAV = () => (
  <nav style={{ background:'#1e3a5f', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
    <a href="/" style={{ color:'#fff', fontWeight:800, fontSize:'1.1rem', textDecoration:'none' }}>🏠 VeriProp <span style={{ color:'#f59e0b' }}>Nigeria</span></a>
    <a href="/" style={{ color:'#94a3b8', textDecoration:'none', fontSize:'0.875rem' }}>← Back to Home</a>
  </nav>
)

export default function Privacy() {
  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'Inter,sans-serif' }}>
      <NAV />
      <div style={{ maxWidth:800, margin:'0 auto', padding:'2rem 1.5rem' }}>
        <div style={{ background:'#fff', borderRadius:'1rem', padding:'2.5rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <div style={{ fontSize:'3rem' }}>🔒</div>
            <h1 style={{ color:'#1e3a5f', fontWeight:900, margin:'0.5rem 0 0.25rem' }}>Privacy Policy</h1>
            <p style={{ color:'#64748b', fontSize:'0.875rem' }}>Last updated: January 1, 2026 · Compliant with NDPR 2019</p>
          </div>

          {[
            { title:'1. Information We Collect', content:'We collect the following personal information:\n\nAccount Information: Full name, email address, phone number, role\nIdentity Verification: NIN (hashed), Government ID scans, Notary documents\nTransaction Data: Property listings, escrow records, payment references, chat messages\nDevice & Usage: IP address, device type, browser, session logs\nFinancial: Bank account details (encrypted), Paystack recipient codes\n\nWe NEVER store raw NIN numbers — only cryptographic hashes.' },
            { title:'2. How We Use Your Information', content:'Your data is used to:\n• Verify your identity and prevent fraud\n• Process property transactions securely\n• Enforce our closed-loop communication policy\n• Generate automated fund splitting receipts\n• Comply with Nigerian tax regulations (FIRS)\n• Detect and prevent fraudulent activity\n• Improve our AI moderation systems\n• Send transaction notifications and alerts' },
            { title:'3. AI Moderation & Data Processing', content:'VeriProp uses artificial intelligence to:\n• Moderate all property listings before publication\n• Redact personal contact information from chat messages\n• Detect fraud patterns and suspicious activity\n• Assign fraud scores to user accounts\n\nAll AI decisions can be reviewed by our compliance team.' },
            { title:'4. Data Sharing', content:'We share your data with:\n• Paystack/Flutterwave: Payment processing\n• NIBSS/Smile Identity: NIN verification\n• CAC: Company registration verification\n• FIRS: Tax remittance (VAT and WHT)\n• EFCC: Fraud reporting (when legally required)\n• Law enforcement: Upon valid court order\n\nWe do NOT sell your personal data to third parties.' },
            { title:'5. Data Security', content:'We protect your data using:\n• AES-256 encryption at rest\n• TLS 1.3 encryption in transit\n• Cryptographic hashing for sensitive IDs\n• Multi-factor authentication\n• Role-based access controls\n• Immutable audit logs\n• Regular security audits' },
            { title:'6. Data Retention', content:'We retain your data for:\n• Account data: Duration of account + 7 years\n• Transaction records: 7 years (Nigerian tax law)\n• Chat messages: 2 years\n• Session logs: 1 year\n• Fraud flags: 5 years\n\nYou may request deletion of non-legally-required data.' },
            { title:'7. Your Rights (NDPR)', content:'Under the Nigeria Data Protection Regulation (NDPR) 2019, you have the right to:\n• Access your personal data\n• Correct inaccurate data\n• Request deletion (where legally permitted)\n• Object to processing\n• Data portability\n• Withdraw consent\n\nSubmit requests to: privacy@veripronigeria.com' },
            { title:'8. Cookies', content:'We use essential cookies for session management and security. We do not use advertising or tracking cookies. You can disable non-essential cookies in your browser settings.' },
            { title:'9. Children', content:'VeriProp Nigeria is not intended for users under 18 years of age. We do not knowingly collect data from minors.' },
            { title:'10. Contact', content:'Data Protection Officer: dpo@veripronigeria.com\nPrivacy inquiries: privacy@veripronigeria.com\nAddress: Lagos, Nigeria' },
          ].map(section => (
            <div key={section.title} style={{ marginBottom:'1.5rem', paddingBottom:'1.5rem', borderBottom:'1px solid #f1f5f9' }}>
              <h2 style={{ color:'#1e3a5f', fontWeight:700, fontSize:'1.05rem', marginBottom:'0.75rem' }}>{section.title}</h2>
              <p style={{ color:'#374151', lineHeight:1.8, margin:0, whiteSpace:'pre-line', fontSize:'0.9rem' }}>{section.content}</p>
            </div>
          ))}

          <div style={{ background:'#f0fdf4', borderRadius:'0.75rem', padding:'1.25rem', marginTop:'1rem' }}>
            <p style={{ color:'#166534', margin:0, fontSize:'0.875rem', textAlign:'center' }}>
              🛡️ VeriProp Nigeria is fully compliant with the Nigeria Data Protection Regulation (NDPR) 2019.
            </p>
          </div>

          <div style={{ display:'flex', gap:'1rem', marginTop:'1.5rem', justifyContent:'center', flexWrap:'wrap' }}>
            <a href="/legal/terms" style={{ color:'#1d4ed8', textDecoration:'none', fontWeight:600, fontSize:'0.875rem' }}>Terms of Service →</a>
            <a href="/legal/escrow" style={{ color:'#1d4ed8', textDecoration:'none', fontWeight:600, fontSize:'0.875rem' }}>Escrow Policy →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
