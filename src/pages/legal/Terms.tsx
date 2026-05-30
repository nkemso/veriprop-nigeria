import React from 'react'

const NAV = () => (
  <nav style={{ background:'#1e3a5f', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
    <a href="/" style={{ color:'#fff', fontWeight:800, fontSize:'1.1rem', textDecoration:'none' }}>🏠 VeriProp <span style={{ color:'#f59e0b' }}>Naija</span></a>
    <a href="/" style={{ color:'#94a3b8', textDecoration:'none', fontSize:'0.875rem' }}>← Back to Home</a>
  </nav>
)

export default function Terms() {
  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'Inter,sans-serif' }}>
      <NAV />
      <div style={{ maxWidth:800, margin:'0 auto', padding:'2rem 1.5rem' }}>
        <div style={{ background:'#fff', borderRadius:'1rem', padding:'2.5rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <div style={{ fontSize:'3rem' }}>⚖️</div>
            <h1 style={{ color:'#1e3a5f', fontWeight:900, margin:'0.5rem 0 0.25rem' }}>Terms of Service</h1>
            <p style={{ color:'#64748b', fontSize:'0.875rem' }}>Last updated: January 1, 2026 · Version 1.0</p>
          </div>

          {[
            { title:'1. Acceptance of Terms', content:'By accessing or using VeriProp Nigeria ("Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use our Platform. These terms apply to all users including buyers, sellers, agents, landlords, tenants, and developers.' },
            { title:'2. Eligibility', content:'You must be at least 18 years of age and a Nigerian resident or citizen to use this Platform for property transactions. Corporate entities must be duly registered with the Corporate Affairs Commission (CAC).' },
            { title:'3. Identity Verification', content:'All users must complete our 3-tier KYC verification before initiating any transaction:\n• Tier 1: National Identity Number (NIN)\n• Tier 2: Government-issued ID (NIN, Passport, or Drivers License)\n• Tier 3: Notarized affidavit (for high-value transactions)\n\nVeriProp reserves the right to reject or suspend accounts that fail verification.' },
            { title:'4. Closed-Loop Policy', content:'All communications and payments MUST remain on the VeriProp platform. Sharing phone numbers, email addresses, WhatsApp links, or any off-platform contact information in chat or profile fields is strictly prohibited and will result in automatic account suspension. Our AI moderation system actively enforces this policy.' },
            { title:'5. Escrow & Payment', content:'VeriProp uses a secure escrow system for all transactions. Funds are held in escrow and released only upon:\n• Multi-signature approval from both buyer and seller\n• OR approval from buyer/seller and VeriProp Legal\n\nVeriProp charges a 1.5% escrow fee (minimum ₦5,000, maximum ₦500,000) on all transactions.' },
            { title:'6. Automated Fund Splitting', content:'Upon escrow release, funds are automatically distributed:\n• Platform Fee: 5%\n• Agent Commission: 10% (where applicable)\n• VAT: 7.5% (remitted to FIRS)\n• Withholding Tax: 5-10% (remitted to FIRS)\n• Net proceeds: Remaining balance to seller/landlord' },
            { title:'7. Property Listings', content:'All listings are subject to AI-powered moderation. VeriProp reserves the right to remove listings that:\n• Contain false or misleading information\n• Are priced suspiciously below market value\n• Contain off-platform contact attempts\n• Fail document verification\n• Exhibit fraud indicators' },
            { title:'8. Dispute Resolution', content:'In the event of a dispute, VeriProp\'s Compliance Team will review within 7 business days. The decision of VeriProp\'s compliance team is binding on both parties during the escrow period. Users may escalate to formal arbitration in accordance with Nigerian law.' },
            { title:'9. Prohibited Activities', content:'Users are prohibited from:\n• Creating fake listings or profiles\n• Attempting to transact outside the platform\n• Using stolen or unauthorized payment methods\n• Impersonating other users or agents\n• Any form of property fraud or 419 activity\n\nViolations will result in immediate account termination and may be reported to the EFCC.' },
            { title:'10. Liability Limitation', content:'VeriProp Nigeria provides a marketplace platform and is not liable for disputes arising from misrepresentation by users. However, our escrow system protects all parties\' funds throughout the transaction.' },
            { title:'11. Governing Law', content:'These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in Lagos State courts or through arbitration as applicable.' },
            { title:'12. Contact', content:'Legal inquiries: legal@veripronigeria.com\nCompliance: compliance@veripronigeria.com\nSupport: support@veripronigeria.com' },
          ].map(section => (
            <div key={section.title} style={{ marginBottom:'1.5rem', paddingBottom:'1.5rem', borderBottom:'1px solid #f1f5f9' }}>
              <h2 style={{ color:'#1e3a5f', fontWeight:700, fontSize:'1.05rem', marginBottom:'0.75rem' }}>{section.title}</h2>
              <p style={{ color:'#374151', lineHeight:1.8, margin:0, whiteSpace:'pre-line', fontSize:'0.9rem' }}>{section.content}</p>
            </div>
          ))}

          <div style={{ background:'#eff6ff', borderRadius:'0.75rem', padding:'1.25rem', marginTop:'1rem' }}>
            <p style={{ color:'#1d4ed8', margin:0, fontSize:'0.875rem', textAlign:'center' }}>
              By using VeriProp Nigeria, you confirm you have read, understood, and agreed to these Terms of Service.
            </p>
          </div>

          <div style={{ display:'flex', gap:'1rem', marginTop:'1.5rem', justifyContent:'center', flexWrap:'wrap' }}>
            <a href="/legal/privacy" style={{ color:'#1d4ed8', textDecoration:'none', fontWeight:600, fontSize:'0.875rem' }}>Privacy Policy →</a>
            <a href="/legal/escrow" style={{ color:'#1d4ed8', textDecoration:'none', fontWeight:600, fontSize:'0.875rem' }}>Escrow Policy →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
