import React from 'react'

const NAV = () => (
  <nav style={{ background:'#1e3a5f', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
    <a href="/" style={{ color:'#fff', fontWeight:800, fontSize:'1.1rem', textDecoration:'none' }}>🏠 VeriProp <span style={{ color:'#f59e0b' }}>Nigeria</span></a>
    <a href="/" style={{ color:'#94a3b8', textDecoration:'none', fontSize:'0.875rem' }}>← Back to Home</a>
  </nav>
)

const Step = ({ n, title, desc }: { n: string; title: string; desc: string }) => (
  <div style={{ display:'flex', gap:'1rem', marginBottom:'1.25rem', alignItems:'flex-start' }}>
    <div style={{ width:36, height:36, borderRadius:'50%', background:'#1d4ed8', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, flexShrink:0, fontSize:'0.9rem' }}>{n}</div>
    <div>
      <div style={{ fontWeight:700, color:'#1e3a5f', marginBottom:'0.25rem' }}>{title}</div>
      <div style={{ color:'#64748b', fontSize:'0.875rem', lineHeight:1.6 }}>{desc}</div>
    </div>
  </div>
)

export default function EscrowPolicy() {
  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'Inter,sans-serif' }}>
      <NAV />
      <div style={{ maxWidth:800, margin:'0 auto', padding:'2rem 1.5rem' }}>
        <div style={{ background:'#fff', borderRadius:'1rem', padding:'2.5rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ textAlign:'center', marginBottom:'2rem' }}>
            <div style={{ fontSize:'3rem' }}>🔐</div>
            <h1 style={{ color:'#1e3a5f', fontWeight:900, margin:'0.5rem 0 0.25rem' }}>Escrow Policy</h1>
            <p style={{ color:'#64748b', fontSize:'0.875rem' }}>How VeriProp protects every naira of your transaction</p>
          </div>

          {/* How it works */}
          <div style={{ background:'#eff6ff', borderRadius:'0.75rem', padding:'1.5rem', marginBottom:'2rem' }}>
            <h2 style={{ color:'#1e3a5f', fontWeight:700, margin:'0 0 1rem' }}>How VeriProp Escrow Works</h2>
            <Step n="1" title="Buyer Funds Escrow" desc="Buyer deposits the full transaction amount (plus 1.5% escrow fee) into VeriProp's secure escrow vault via Paystack. Funds are immediately locked — the seller cannot access them yet." />
            <Step n="2" title="Property Inspection" desc="Buyer inspects the property physically or virtually. VeriProp notifies both parties of the inspection status." />
            <Step n="3" title="Document Verification" desc="VeriProp's compliance team verifies all property documents: Certificate of Occupancy (C of O), survey plan, deed of assignment, and seller's identity." />
            <Step n="4" title="Multi-Signature Release" desc="Funds are released ONLY when at least 2 of these parties sign: Buyer + Seller, OR Buyer + VeriProp Legal, OR Seller + VeriProp Legal. No single party can release funds alone." />
            <Step n="5" title="Automated Fund Split" desc="Upon multi-sig approval, funds are automatically distributed within 24 hours: platform fee, agent commission, taxes, and net proceeds to the seller." />
          </div>

          {/* Fee breakdown */}
          <div style={{ marginBottom:'2rem' }}>
            <h2 style={{ color:'#1e3a5f', fontWeight:700, marginBottom:'1rem' }}>💸 Automated Fund Distribution</h2>
            <div style={{ border:'1px solid #e2e8f0', borderRadius:'0.75rem', overflow:'hidden' }}>
              {[
                { label:'Platform Fee', rate:'5%', note:'VeriProp service fee', color:'#3b82f6' },
                { label:'Agent Commission', rate:'10%', note:'Where agent is involved', color:'#10b981' },
                { label:'VAT (7.5%)', rate:'7.5%', note:'Remitted to FIRS', color:'#8b5cf6' },
                { label:'Withholding Tax', rate:'5-10%', note:'5% individuals / 10% companies — remitted to FIRS', color:'#f59e0b' },
                { label:'Net to Seller', rate:'Remainder', note:'Balance paid to seller within 24hrs', color:'#1d4ed8' },
              ].map((row, i) => (
                <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.875rem 1.25rem', background: i%2===0 ? '#f8fafc':'#fff', borderBottom:'1px solid #f1f5f9' }}>
                  <div style={{ display:'flex', gap:'0.75rem', alignItems:'center' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:row.color }} />
                    <div>
                      <div style={{ fontWeight:600, color:'#1e3a5f', fontSize:'0.9rem' }}>{row.label}</div>
                      <div style={{ color:'#94a3b8', fontSize:'0.75rem' }}>{row.note}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight:700, color:row.color }}>{row.rate}</div>
                </div>
              ))}
            </div>
            <p style={{ color:'#64748b', fontSize:'0.8rem', marginTop:'0.75rem', textAlign:'center' }}>
              Escrow fee: 1.5% of transaction value (min ₦5,000 / max ₦500,000) — paid by buyer
            </p>
          </div>

          {/* Multi-sig */}
          <div style={{ background:'#fef9c3', borderRadius:'0.75rem', padding:'1.5rem', marginBottom:'2rem', border:'1px solid #fde68a' }}>
            <h2 style={{ color:'#92400e', fontWeight:700, margin:'0 0 0.75rem' }}>✍️ Multi-Signature Release Rules</h2>
            <p style={{ color:'#92400e', fontSize:'0.875rem', margin:'0 0 0.75rem' }}>Funds can ONLY be released when at least 2 of the following parties provide cryptographic signatures:</p>
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
              {[
                'Buyer + Seller',
                'Buyer + VeriProp Legal',
                'Seller + VeriProp Legal',
              ].map(combo => (
                <span key={combo} style={{ background:'#fff', border:'1px solid #fde68a', color:'#92400e', padding:'0.35rem 0.75rem', borderRadius:'999px', fontSize:'0.8rem', fontWeight:600 }}>{combo}</span>
              ))}
            </div>
            <p style={{ color:'#92400e', fontSize:'0.8rem', margin:'0.75rem 0 0' }}>Every signature is cryptographically hashed and permanently recorded on the VeriProp audit ledger. Signatures cannot be retracted.</p>
          </div>

          {/* Disputes */}
          <div style={{ marginBottom:'2rem' }}>
            <h2 style={{ color:'#1e3a5f', fontWeight:700, marginBottom:'1rem' }}>⚖️ Dispute Resolution</h2>
            {[
              { q:'What if the buyer is unsatisfied after inspection?', a:'The buyer can raise a dispute before approving release. VeriProp\'s compliance team reviews within 7 business days and may order a refund or partial release.' },
              { q:'What if documents are forged?', a:'If document forgery is discovered, escrow is immediately frozen, funds are held pending investigation, and the matter is reported to relevant authorities.' },
              { q:'What if the seller disappears?', a:'VeriProp can release funds back to the buyer using the Platform Legal signature after the 30-day escrow expiry period.' },
              { q:'Can I cancel a transaction?', a:'Transactions can be cancelled before escrow is funded at no cost. After funding, cancellation requires dispute resolution and may incur a ₦5,000 processing fee.' },
            ].map(({ q, a }) => (
              <div key={q} style={{ marginBottom:'1rem', padding:'1rem', background:'#f8fafc', borderRadius:'0.5rem', border:'1px solid #e2e8f0' }}>
                <div style={{ fontWeight:700, color:'#1e3a5f', marginBottom:'0.4rem', fontSize:'0.9rem' }}>Q: {q}</div>
                <div style={{ color:'#64748b', fontSize:'0.875rem', lineHeight:1.6 }}>A: {a}</div>
              </div>
            ))}
          </div>

          {/* Installments */}
          <div style={{ background:'#f0fdf4', borderRadius:'0.75rem', padding:'1.5rem', marginBottom:'2rem' }}>
            <h2 style={{ color:'#166534', fontWeight:700, margin:'0 0 0.75rem' }}>📅 Installment Payment (Split Escrow)</h2>
            <p style={{ color:'#374151', fontSize:'0.875rem', lineHeight:1.7, margin:0 }}>
              For installmental transactions, buyers pay a 20% down payment upfront with the remaining balance spread across 3-24 monthly installments. Each installment is processed through escrow with the same multi-signature security. Missed payments after 30 days result in default status and may trigger contract rescission per the deed of assignment.
            </p>
          </div>

          <div style={{ display:'flex', gap:'1rem', marginTop:'1.5rem', justifyContent:'center', flexWrap:'wrap' }}>
            <a href="/legal/terms" style={{ color:'#1d4ed8', textDecoration:'none', fontWeight:600, fontSize:'0.875rem' }}>Terms of Service →</a>
            <a href="/legal/privacy" style={{ color:'#1d4ed8', textDecoration:'none', fontWeight:600, fontSize:'0.875rem' }}>Privacy Policy →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
