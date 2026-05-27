import React, { useState } from 'react'

// SCREEN_189 — Property Tax & Regulatory Compliance
const fmt = (n: number) => `₦${n.toLocaleString()}`

export default function PropertyTaxCompliance() {
  const [propertyValue, setPropertyValue] = useState('')
  const [propertyType, setPropertyType] = useState('residential_sale')
  const [sellerType, setSellerType] = useState('individual')
  const [annualRent, setAnnualRent] = useState('')
  const [calculated, setCalculated] = useState<any>(null)

  const calculate = () => {
    const val = parseFloat(propertyValue) || 0
    const rent = parseFloat(annualRent) || 0
    let result: any = { propertyValue: val, type: propertyType }

    if (propertyType === 'residential_sale' || propertyType === 'commercial_sale') {
      // Stamp Duty
      const stampDuty = val > 1000000 ? val * 0.015 : 0
      // Capital Gains Tax (10%)
      const cgt = val * 0.10
      // WHT on seller proceeds
      const wht = val * (sellerType === 'corporate' ? 0.10 : 0.05)
      // VAT (commercial only)
      const vat = propertyType === 'commercial_sale' ? val * 0.075 : 0
      // Platform fee
      const platformFee = val * 0.05
      // Agent commission
      const agentComm = val * 0.10
      const totalDeductions = stampDuty + cgt + wht + vat + platformFee + agentComm
      const netSeller = val - platformFee - agentComm - wht - vat

      result = { ...result, stampDuty, cgt, wht, vat, platformFee, agentComm, totalDeductions, netSeller, type: 'sale' }
    } else if (propertyType === 'residential_rent' || propertyType === 'commercial_rent') {
      // Stamp duty on lease
      let stampDuty = 0
      if (rent < 8000) stampDuty = 200
      else if (rent < 22000) stampDuty = 1000
      else stampDuty = rent * 0.03
      // WHT on rent received
      const wht = rent * (sellerType === 'corporate' ? 0.10 : 0.05)
      // VAT (commercial rent only)
      const vat = propertyType === 'commercial_rent' ? rent * 0.075 : 0
      // Platform fee on rent
      const platformFee = rent * 0.05
      const netLandlord = rent - platformFee - wht - vat

      result = { ...result, stampDuty, wht, vat, platformFee, netLandlord, annualRent: rent, type: 'rent' }
    }

    setCalculated(result)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter,sans-serif' }}>
      <nav style={{ background: '#1e3a5f', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/" style={{ color: '#fff', fontWeight: 800, textDecoration: 'none' }}>🏠 VeriProp <span style={{ color: '#f59e0b' }}>Nigeria</span></a>
        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>📊 Tax & Compliance</span>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📋</div>
          <h1 style={{ color: '#1e3a5f', fontWeight: 900, margin: '0 0 0.5rem' }}>Property Tax & Compliance Center</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Automated tax calculation and regulatory compliance for all Nigerian property transactions</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 700 ? '1fr 1fr' : '1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {/* Calculator */}
          <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ color: '#1e3a5f', fontWeight: 700, margin: '0 0 1.25rem' }}>🧮 Tax Calculator</h3>
            <div style={{ marginBottom: '0.875rem' }}>
              <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.375rem', fontSize: '0.85rem' }}>Transaction Type</label>
              <select value={propertyType} onChange={e => setPropertyType(e.target.value)}
                style={{ width: '100%', padding: '0.625rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                <option value="residential_sale">Residential Sale</option>
                <option value="commercial_sale">Commercial Sale</option>
                <option value="residential_rent">Residential Rent</option>
                <option value="commercial_rent">Commercial Rent</option>
              </select>
            </div>
            <div style={{ marginBottom: '0.875rem' }}>
              <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.375rem', fontSize: '0.85rem' }}>Seller/Landlord Type</label>
              <select value={sellerType} onChange={e => setSellerType(e.target.value)}
                style={{ width: '100%', padding: '0.625rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                <option value="individual">Individual (5% WHT)</option>
                <option value="corporate">Corporate (10% WHT)</option>
              </select>
            </div>
            {(propertyType.includes('sale')) && (
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.375rem', fontSize: '0.85rem' }}>Property Value (₦)</label>
                <input type="number" value={propertyValue} onChange={e => setPropertyValue(e.target.value)} placeholder="e.g. 5000000"
                  style={{ width: '100%', padding: '0.625rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
            )}
            {(propertyType.includes('rent')) && (
              <div style={{ marginBottom: '0.875rem' }}>
                <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '0.375rem', fontSize: '0.85rem' }}>Annual Rent (₦)</label>
                <input type="number" value={annualRent} onChange={e => setAnnualRent(e.target.value)} placeholder="e.g. 2400000"
                  style={{ width: '100%', padding: '0.625rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', boxSizing: 'border-box' }} />
              </div>
            )}
            <button onClick={calculate} style={{ width: '100%', padding: '0.75rem', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '0.625rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
              Calculate Tax Obligations
            </button>
          </div>

          {/* Results */}
          <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h3 style={{ color: '#1e3a5f', fontWeight: 700, margin: '0 0 1.25rem' }}>📊 Tax Breakdown</h3>
            {!calculated ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🧮</div>
                <p style={{ fontSize: '0.875rem' }}>Enter transaction details and click Calculate</p>
              </div>
            ) : (
              <div>
                {calculated.type === 'sale' ? (
                  <>
                    {[
                      { label: 'Property Value', value: fmt(calculated.propertyValue), color: '#1e3a5f', bold: true },
                      { label: 'Stamp Duty (1.5%)', value: `- ${fmt(calculated.stampDuty)}`, color: '#ef4444', note: 'Buyer pays to State Govt' },
                      { label: 'Capital Gains Tax (10%)', value: `- ${fmt(calculated.cgt)}`, color: '#f59e0b', note: 'Seller pays to FIRS' },
                      { label: `WHT (${sellerType === 'corporate' ? '10' : '5'}%)`, value: `- ${fmt(calculated.wht)}`, color: '#8b5cf6', note: 'Auto-remitted to FIRS' },
                      { label: 'VAT (7.5%)', value: calculated.vat ? `- ${fmt(calculated.vat)}` : 'N/A (Residential)', color: '#06b6d4', note: 'Commercial only' },
                      { label: 'Platform Fee (5%)', value: `- ${fmt(calculated.platformFee)}`, color: '#1d4ed8', note: 'VeriProp service fee' },
                      { label: 'Agent Commission (10%)', value: `- ${fmt(calculated.agentComm)}`, color: '#10b981', note: 'Where agent involved' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: '#64748b' }}>{row.label}</span>
                          {row.note && <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{row.note}</div>}
                        </div>
                        <span style={{ color: row.color, fontWeight: row.bold ? 900 : 700 }}>{row.value}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.875rem 0 0', fontWeight: 900, fontSize: '1rem' }}>
                      <span style={{ color: '#1e3a5f' }}>Net to Seller</span>
                      <span style={{ color: '#10b981' }}>{fmt(calculated.netSeller)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    {[
                      { label: 'Annual Rent', value: fmt(calculated.annualRent), color: '#1e3a5f', bold: true },
                      { label: 'Stamp Duty on Lease', value: `- ${fmt(calculated.stampDuty)}`, color: '#ef4444', note: 'Per Stamp Duties Act' },
                      { label: `WHT (${sellerType === 'corporate' ? '10' : '5'}%)`, value: `- ${fmt(calculated.wht)}`, color: '#8b5cf6', note: 'Auto-remitted to FIRS' },
                      { label: 'VAT (7.5%)', value: calculated.vat ? `- ${fmt(calculated.vat)}` : 'N/A (Residential)', color: '#06b6d4', note: 'Commercial rent only' },
                      { label: 'Platform Fee (5%)', value: `- ${fmt(calculated.platformFee)}`, color: '#1d4ed8', note: 'VeriProp service fee' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
                        <div>
                          <span style={{ color: '#64748b' }}>{row.label}</span>
                          {row.note && <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{row.note}</div>}
                        </div>
                        <span style={{ color: row.color, fontWeight: row.bold ? 900 : 700 }}>{row.value}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.875rem 0 0', fontWeight: 900, fontSize: '1rem' }}>
                      <span style={{ color: '#1e3a5f' }}>Net to Landlord</span>
                      <span style={{ color: '#10b981' }}>{fmt(calculated.netLandlord)}</span>
                    </div>
                  </>
                )}
                <div style={{ background: '#f0fdf4', borderRadius: '0.5rem', padding: '0.75rem', marginTop: '1rem', fontSize: '0.75rem', color: '#166534', textAlign: 'center' }}>
                  ✅ All taxes auto-remitted by VeriProp to FIRS within 21 days
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compliance checklist */}
        <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '1.25rem' }}>
          <h3 style={{ color: '#1e3a5f', fontWeight: 700, margin: '0 0 1rem' }}>✅ VeriProp Automated Compliance</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '0.75rem' }}>
            {[
              { icon: '🧾', title: 'WHT Remittance', desc: 'Auto-deducted and remitted to FIRS within 21 days', status: 'Automated' },
              { icon: '💰', title: 'VAT Filing', desc: 'Monthly VAT returns filed automatically for commercial transactions', status: 'Automated' },
              { icon: '📄', title: 'Stamp Duty', desc: 'Electronic stamp duty payment and receipts via FIRS portal', status: 'Facilitated' },
              { icon: '🏛️', title: 'SCUML Compliance', desc: 'All agents verified and registered with SCUML database', status: 'Verified' },
              { icon: '🔍', title: 'AML Screening', desc: 'Didit screens all users against 1,300+ global watchlists', status: 'Real-time' },
              { icon: '📊', title: 'Audit Trail', desc: '7-year immutable record of all transactions for FIRS audit', status: 'Perpetual' },
            ].map(item => (
              <div key={item.title} style={{ background: '#f8fafc', borderRadius: '0.625rem', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                  <span style={{ background: '#dcfce7', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700 }}>{item.status}</span>
                </div>
                <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '0.85rem', marginBottom: '0.25rem' }}>{item.title}</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { href: '/legal/database', label: '📚 Legal Database' },
            { href: '/legal/terms', label: '📋 Terms of Service' },
            { href: '/legal/privacy', label: '🔒 Privacy Policy' },
            { href: '/legal/escrow', label: '🔐 Escrow Policy' },
            { href: '/ai/advisor', label: '🤖 VetPro Legal AI' },
          ].map(l => (
            <a key={l.href} href={l.href} style={{ background: '#fff', color: '#1e3a5f', padding: '0.5rem 1rem', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
