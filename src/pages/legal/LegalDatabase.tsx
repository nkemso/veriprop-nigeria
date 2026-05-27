import React, { useState } from 'react'

// ================================================================
// VERIPROP NIGERIA — LEGAL DATABASE (DOCUMENT_190)
// Nigeria Property Law Reference + Platform Legal Framework
// ================================================================

const LEGAL_DOCS = {
  'property-ownership': {
    title: 'Property Ownership Rights in Nigeria',
    category: 'Property Law',
    icon: '🏠',
    content: `
## Land Tenure in Nigeria

Under the **Land Use Act 1978 (as amended)**, all land in Nigeria is vested in the Governor of each State, held in trust for the use and common benefit of all Nigerians.

### Types of Ownership

**Certificate of Occupancy (C of O)**
The principal document of title to land in Nigeria. Granted by the State Governor, it confers statutory right of occupancy for a term not exceeding 99 years. Holders may apply for renewal upon expiry.

**Deed of Assignment**
A legal instrument that conveys the assignor's interest in a property to the assignee. Must be stamped and registered at the Land Registry. VeriProp generates and stores all deeds digitally.

**Deed of Lease**
Used for residential and commercial rentals exceeding 3 years. Must be registered if the term is for 3 years or more. VeriProp escrow protects all lease deposits.

**Governor's Consent**
Required for all alienation (sale, mortgage, sublease) of land under a Certificate of Occupancy. Failure to obtain consent renders the transaction void. VeriProp compliance team facilitates consent applications.

### Registration Requirements

All instruments affecting land must be registered at the relevant State Land Registry within **60 days** of execution (Lagos: 60 days; FCT: 90 days). VeriProp's legal team tracks all registration deadlines for platform transactions.

### VeriProp Escrow & Title Protection

VeriProp's multi-signature escrow ensures that:
1. Funds are not released until **title search is completed** and found clear
2. All documents are verified by VeriProp's compliance team
3. Governor's Consent (where required) is confirmed before fund release
4. All deeds are registered before final disbursement to seller
    `,
  },
  'stamp-duty': {
    title: 'Stamp Duty & Property Tax',
    category: 'Tax & Fiscal',
    icon: '📋',
    content: `
## Stamp Duties Act (as Amended 2020)

### Applicable Rates for Property Transactions

**Purchase Transactions**
- Properties above ₦1,000,000: **1.5% of consideration** payable to FIRS
- Stamp duty is the buyer's liability
- Must be paid before registration at Land Registry

**Lease/Tenancy Agreements**
- Annual rent ≤ ₦7,999: Flat ₦200
- Annual rent ₦8,000 – ₦21,999: Flat ₦1,000  
- Annual rent ₦22,000 and above: **3% of annual rent**

**Mortgage Instruments**
- Mortgage deed: **0.375% of mortgage amount**

### Capital Gains Tax
- **10% CGT** applies on disposal of property
- Exemptions: Principal residence (subject to conditions), inheritance

### Value Added Tax (VAT)
- **7.5% VAT** applies to commercial property rentals and property management fees
- Residential rentals are exempt
- VeriProp automatically withholds and remits VAT on applicable transactions

### Withholding Tax (WHT)
- **10% WHT** for corporate sellers/landlords
- **5% WHT** for individual sellers/landlords
- VeriProp automatically withholds and remits to FIRS via its tax vault system

### VeriProp Automated Tax Compliance

All VeriProp transactions include:
- Automatic WHT deduction at point of escrow release
- VAT calculation on applicable transactions
- FIRS remittance within 21 days of transaction
- Tax receipt generated for all parties
    `,
  },
  'tenancy-law': {
    title: 'Tenancy & Landlord-Tenant Law',
    category: 'Tenancy Law',
    icon: '🤝',
    content: `
## Tenancy Laws by State

### Lagos State (Tenancy Law 2011)

**Security Deposit Limits:**
- Maximum 1 year advance rent for residential properties
- No advance collection of more than 1 year permitted
- VeriProp escrow holds all deposits until verified occupancy

**Notice Periods:**
- Monthly tenancy: 1 month notice
- Yearly tenancy: 6 months notice
- Tenant refusing to vacate: Landlord must obtain court order (no self-help eviction)

**Prohibited Practices:**
- Lock-out of tenant without court order is illegal
- Disconnection of utilities as eviction tactic is prohibited
- Distress for rent only permissible after court order

### FCT (Abuja) Regulations

**Rent Control:**
- FCT has no formal rent control legislation
- Market rates apply
- VeriProp AI provides market pricing intelligence

**Eviction Process:**
- 6 months notice for yearly tenancies
- Recovery of Premises Act applies
- VeriProp dispute resolution team available for mediation

### Nationwide — Tenants' Rights

1. Right to habitable premises
2. Right to receipt for all payments (VeriProp provides digital receipts)
3. Right to quiet enjoyment
4. Right to formal tenancy agreement
5. Right to security deposit return within 30 days of vacation

### VeriProp Tenant Protection

All VeriProp rental transactions include:
- Digital tenancy agreement generation
- Escrow protection for security deposits
- Automated receipt generation for all payments
- Dispute resolution support
- Legal consultation referral service
    `,
  },
  'anti-fraud': {
    title: 'Anti-Fraud & Money Laundering',
    category: 'Compliance',
    icon: '🛡️',
    content: `
## Anti-Money Laundering (AML) Framework

### Applicable Laws

**Money Laundering (Prevention and Prohibition) Act 2022**
- Reporting entities must conduct Customer Due Diligence (CDD)
- Suspicious Transaction Reports (STR) to NFIU within 24 hours
- Enhanced Due Diligence (EDD) for high-value/high-risk transactions
- Record keeping for minimum 5 years

**Terrorism (Prevention and Prohibition) Act 2022**
- Prohibition of financing terrorist activities
- Mandatory screening against UN/OFAC/EFCC watchlists
- VeriProp screens all users against 1,300+ AML databases (via Didit)

### Real Estate Sector Specific Requirements

**SCUML Registration**
- All real estate agents must register with Special Control Unit Against Money Laundering (SCUML)
- VeriProp facilitates SCUML compliance for platform agents

**Transaction Reporting Thresholds**
- Cash transactions above ₦5,000,000: Currency Transaction Report (CTR)
- All suspicious transactions regardless of amount: STR
- VeriProp's closed-loop payment system ensures all transactions are traceable

### VeriProp AML Controls

1. **Identity Verification:** 3-tier KYC (BVN + ID + Biometric) mandatory
2. **Screening:** Didit AML screening against 1,300+ global watchlists
3. **Monitoring:** Real-time transaction monitoring by VetPro AI
4. **Reporting:** Automated STR filing for suspicious patterns
5. **Record Keeping:** 7-year immutable audit trail on VeriProp ledger
6. **Closed Loop:** All payments through Paystack (no cash transactions)

### Property Fraud Prevention

**Common Fraud Patterns Detected by VetPro AI:**
- Duplicate title document fraud
- Advance fee (419) property scams
- Identity impersonation
- Double-selling of properties
- Inflated valuation fraud

**VeriProp Zero-Fraud Architecture:**
- Multi-sig escrow prevents premature fund release
- AI redaction prevents off-platform contact
- All listings moderated by VetPro before publication
- Biometric verification eliminates anonymous actors
    `,
  },
  'dispute-resolution': {
    title: 'Dispute Resolution Framework',
    category: 'Dispute Resolution',
    icon: '⚖️',
    content: `
## VeriProp Dispute Resolution Process

### Tier 1 — Platform Mediation (0-7 days)
1. Aggrieved party raises dispute via VeriProp dashboard
2. VeriProp compliance officer reviews within 48 hours
3. Both parties provide evidence via secure document portal
4. Compliance officer issues binding recommendation
5. Escrow released per recommendation or held pending escalation

### Tier 2 — Legal Arbitration (7-30 days)
If Platform Mediation fails:
1. Matter referred to VeriProp's appointed arbitrators
2. Governed by **Arbitration and Conciliation Act Cap A18 LFN 2004**
3. Arbitration seat: Lagos, Nigeria
4. Award is final and binding on both parties
5. Costs shared equally unless arbitrator determines otherwise

### Tier 3 — Court of Law (30+ days)
As a last resort:
- **Lagos State:** Property disputes in High Court or Land Use Allocation Committee
- **FCT:** FCT High Court has jurisdiction
- **Other States:** State High Court with property jurisdiction

### Evidence Admissibility
VeriProp maintains:
- Immutable transaction logs (admissible as digital evidence under **Cybercrimes Act 2015**)
- Cryptographically signed escrow receipts
- Timestamped audit trail for all platform activities
- Biometrically verified identity records

### Emergency Injunctions
VeriProp will cooperate with:
- Court orders to freeze escrow funds
- EFCC investigation requests
- NFIU suspicious transaction investigations
- Police investigation orders

### Consumer Protection
All VeriProp users are protected by:
- **Consumer Protection Council Act** (goods and services)
- **NDPR 2019** (data privacy)
- **CBN Payment System Guidelines** (payment protection)
    `,
  },
}

const CATEGORIES = ['All', 'Property Law', 'Tax & Fiscal', 'Tenancy Law', 'Compliance', 'Dispute Resolution']

export default function LegalDatabase() {
  const [selected, setSelected] = useState<string | null>(null)
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = Object.entries(LEGAL_DOCS).filter(([, doc]) => {
    const matchCat = category === 'All' || doc.category === category
    const matchSearch = !search || doc.title.toLowerCase().includes(search.toLowerCase()) || doc.content.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const selectedDoc = selected ? LEGAL_DOCS[selected as keyof typeof LEGAL_DOCS] : null

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter,sans-serif' }}>
      <nav style={{ background: '#1e3a5f', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/" style={{ color: '#fff', fontWeight: 800, textDecoration: 'none' }}>🏠 VeriProp <span style={{ color: '#f59e0b' }}>Nigeria</span></a>
        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>⚖️ Legal Database</span>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#1e3a5f', fontWeight: 900, margin: '0 0 0.5rem' }}>📚 Nigeria Property Law Database</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Comprehensive legal reference for Nigerian property transactions</p>
        </div>

        {/* Search + filter */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search legal topics..."
            style={{ flex: 1, minWidth: 200, padding: '0.625rem 0.875rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none' }} />
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              style={{ padding: '0.5rem 0.875rem', border: 'none', background: category === cat ? '#1e3a5f' : '#fff', color: category === cat ? '#fff' : '#64748b', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selectedDoc ? '320px 1fr' : '1fr', gap: '1.25rem' }}>
          {/* Document list */}
          <div>
            {filtered.map(([key, doc]) => (
              <div key={key} onClick={() => setSelected(selected === key ? null : key)}
                style={{ background: '#fff', borderRadius: '0.875rem', padding: '1.125rem', marginBottom: '0.75rem', cursor: 'pointer', border: `2px solid ${selected === key ? '#1e3a5f' : '#e2e8f0'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.75rem' }}>{doc.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '0.9rem' }}>{doc.title}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.15rem' }}>{doc.category}</div>
                  </div>
                  <span style={{ marginLeft: 'auto', color: '#94a3b8' }}>{selected === key ? '▲' : '▼'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Document content */}
          {selectedDoc && (
            <div style={{ background: '#fff', borderRadius: '1rem', padding: '2rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', overflowY: 'auto', maxHeight: '80vh' }}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2.5rem' }}>{selectedDoc.icon}</span>
                <div>
                  <h2 style={{ color: '#1e3a5f', fontWeight: 900, margin: 0, fontSize: '1.1rem' }}>{selectedDoc.title}</h2>
                  <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '0.15rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>{selectedDoc.category}</span>
                </div>
              </div>
              <div style={{ color: '#374151', lineHeight: 1.8, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                {selectedDoc.content.trim().split('\n').map((line, i) => {
                  if (line.startsWith('## ')) return <h3 key={i} style={{ color: '#1e3a5f', fontWeight: 800, marginTop: '1.5rem', marginBottom: '0.5rem' }}>{line.slice(3)}</h3>
                  if (line.startsWith('### ')) return <h4 key={i} style={{ color: '#1d4ed8', fontWeight: 700, marginTop: '1rem', marginBottom: '0.35rem' }}>{line.slice(4)}</h4>
                  if (line.startsWith('**') && line.endsWith('**')) return <p key={i} style={{ fontWeight: 700, color: '#1e3a5f', margin: '0.5rem 0' }}>{line.slice(2, -2)}</p>
                  if (line.startsWith('- ')) return <li key={i} style={{ marginLeft: '1.25rem', marginBottom: '0.25rem' }}>{line.slice(2)}</li>
                  if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) return <li key={i} style={{ marginLeft: '1.25rem', marginBottom: '0.25rem' }}>{line.replace(/^\d+\. /, '')}</li>
                  if (!line.trim()) return <br key={i} />
                  return <p key={i} style={{ margin: '0.35rem 0' }}>{line}</p>
                })}
              </div>
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#eff6ff', borderRadius: '0.625rem' }}>
                <p style={{ color: '#1d4ed8', fontSize: '0.8rem', margin: 0, textAlign: 'center' }}>
                  ⚠️ This is general legal information only. For specific legal advice, consult a qualified Nigerian property lawyer.
                  VeriProp offers legal referral services — <a href="/ai/advisor" style={{ color: '#1d4ed8', fontWeight: 700 }}>consult VetPro AI →</a>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
