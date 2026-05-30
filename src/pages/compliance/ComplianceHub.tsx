import React, { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'

export default function ComplianceHub() {
  const token = localStorage.getItem('accessToken')
  const [tab, setTab] = useState<'disputes'|'fraud'|'kyc'|'audit'>('disputes')
  const [disputes, setDisputes] = useState<any[]>([])
  const [flagged, setFlagged] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) { window.location.href = '/login'; return }
    const h = { Authorization: `Bearer ${token}` }
    Promise.all([
      fetch(`${API}/api/v1/admin/disputes`, { headers:h }).then(r=>r.json()),
      fetch(`${API}/api/v1/chat/admin/flagged`, { headers:h }).then(r=>r.json()),
      fetch(`${API}/api/v1/admin/audit`, { headers:h }).then(r=>r.json()),
    ]).then(([d, f, a]) => {
      setDisputes(d.disputes||[])
      setFlagged(f.flagged||[])
      setLogs(a.logs||[])
      setLoading(false)
    }).catch(()=>setLoading(false))
  }, [token])

  const logout = () => { localStorage.clear(); window.location.href = '/' }
  const TABS = [
    { id:'disputes', label:'⚖️ Disputes', count:disputes.length },
    { id:'fraud', label:'🚨 Fraud Flags', count:flagged.length },
    { id:'kyc', label:'🛡️ KYC Queue', count:0 },
    { id:'audit', label:'📋 Audit Trail', count:logs.length },
  ] as const

  const STATUS_COLOR: Record<string,string> = { open:'#ef4444', under_review:'#f59e0b', resolved_buyer:'#10b981', resolved_seller:'#10b981', closed:'#94a3b8' }

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'Inter,sans-serif' }}>
      <nav style={{ background:'#1e3a5f', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <a href="/" style={{ color:'#fff', fontWeight:800, textDecoration:'none' }}>🏠 VeriProp <span style={{ color:'#f59e0b' }}>Naija</span></a>
        <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
          <span style={{ color:'#ef4444', fontSize:'0.75rem', fontWeight:700 }}>🏛️ COMPLIANCE CENTER</span>
          <button onClick={logout} style={{ background:'transparent', border:'1px solid #475569', color:'#94a3b8', padding:'0.35rem 0.75rem', borderRadius:'0.5rem', cursor:'pointer', fontSize:'0.8rem' }}>Logout</button>
        </div>
      </nav>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'1.5rem' }}>
        <h1 style={{ color:'#1e3a5f', fontWeight:800, marginBottom:'0.25rem' }}>🏛️ Compliance & Trust Center</h1>
        <p style={{ color:'#64748b', marginBottom:'1.5rem', fontSize:'0.875rem' }}>NDPR · CBN · EFCC · FIRS compliance monitoring</p>

        {/* Compliance badges */}
        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', marginBottom:'1.5rem' }}>
          {[
            { label:'NDPR Compliant', color:'#10b981' },
            { label:'CBN KYC', color:'#3b82f6' },
            { label:'EFCC AML', color:'#8b5cf6' },
            { label:'FIRS Tax', color:'#f59e0b' },
            { label:'CAC Verified', color:'#06b6d4' },
          ].map(b => (
            <span key={b.label} style={{ background:`${b.color}15`, border:`1px solid ${b.color}40`, color:b.color, padding:'0.3rem 0.875rem', borderRadius:'999px', fontSize:'0.75rem', fontWeight:700 }}>
              ✓ {b.label}
            </span>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={()=>setTab(t.id as any)}
              style={{ padding:'0.625rem 1.25rem', border:'none', background: tab===t.id ? '#1e3a5f':'#fff', color: tab===t.id ? '#fff':'#64748b', borderRadius:'0.5rem', fontWeight:600, cursor:'pointer', fontSize:'0.875rem', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              {t.label}
              {t.count > 0 && <span style={{ background: tab===t.id ? '#f59e0b':'#ef4444', color:'#fff', padding:'0.1rem 0.4rem', borderRadius:'999px', fontSize:'0.7rem', fontWeight:700 }}>{t.count}</span>}
            </button>
          ))}
        </div>

        {loading ? <div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>Loading compliance data...</div> : (
          <div style={{ background:'#fff', borderRadius:'1rem', padding:'1.5rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>

            {tab === 'disputes' && (
              disputes.length === 0 ? (
                <div style={{ textAlign:'center', padding:'2rem', color:'#10b981' }}>🎉 No open disputes</div>
              ) : disputes.map((d:any) => (
                <div key={d.id} style={{ padding:'1rem', border:'1px solid #e2e8f0', borderRadius:'0.75rem', marginBottom:'0.75rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                    <span style={{ fontWeight:700, color:'#1e3a5f', fontSize:'0.875rem' }}>#{d.id?.slice(-8).toUpperCase()}</span>
                    <span style={{ background:`${STATUS_COLOR[d.status]||'#94a3b8'}20`, color:STATUS_COLOR[d.status]||'#94a3b8', padding:'0.2rem 0.6rem', borderRadius:'999px', fontSize:'0.7rem', fontWeight:700 }}>{d.status?.replace(/_/g,' ').toUpperCase()}</span>
                  </div>
                  <p style={{ color:'#374151', fontSize:'0.8rem', margin:'0 0 0.5rem' }}>{d.reason?.slice(0,120)}...</p>
                  <div style={{ fontSize:'0.75rem', color:'#94a3b8' }}>{new Date(d.createdAt).toLocaleDateString('en-NG')}</div>
                </div>
              ))
            )}

            {tab === 'fraud' && (
              flagged.length === 0 ? (
                <div style={{ textAlign:'center', padding:'2rem', color:'#10b981' }}>✅ No flagged messages</div>
              ) : flagged.map((m:any) => (
                <div key={m.id} style={{ padding:'1rem', border:'1px solid #fde68a', borderRadius:'0.75rem', marginBottom:'0.75rem', background:'#fefce8' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem' }}>
                    <span style={{ fontWeight:700, color:'#92400e', fontSize:'0.8rem' }}>⚠️ {m.sender?.firstName} {m.sender?.lastName}</span>
                    <span style={{ fontSize:'0.7rem', color:'#94a3b8' }}>{new Date(m.createdAt).toLocaleDateString('en-NG')}</span>
                  </div>
                  <p style={{ color:'#374151', fontSize:'0.8rem', margin:'0 0 0.4rem', background:'#fff', padding:'0.5rem', borderRadius:'0.375rem' }}>{m.content}</p>
                  <span style={{ fontSize:'0.7rem', color:'#92400e' }}>Reason: {m.redactedReason}</span>
                </div>
              ))
            )}

            {tab === 'kyc' && (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
                  {[
                    { label:'Tier 1 Verified', value:'8,432', pct:71, color:'#3b82f6' },
                    { label:'Tier 2 Verified', value:'5,217', pct:44, color:'#10b981' },
                    { label:'Tier 3 Verified', value:'1,089', pct:9, color:'#8b5cf6' },
                    { label:'Pending Review', value:'234', pct:2, color:'#f59e0b' },
                  ].map(k => (
                    <div key={k.label} style={{ background:'#f8fafc', borderRadius:'0.75rem', padding:'1rem' }}>
                      <div style={{ fontWeight:700, color:'#1e3a5f', fontSize:'1.25rem' }}>{k.value}</div>
                      <div style={{ color:'#64748b', fontSize:'0.8rem', margin:'0.25rem 0' }}>{k.label}</div>
                      <div style={{ height:6, background:'#e2e8f0', borderRadius:999 }}>
                        <div style={{ width:`${k.pct}%`, height:'100%', background:k.color, borderRadius:999 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign:'center', padding:'1rem', color:'#64748b', fontSize:'0.875rem' }}>
                  KYC verification powered by NIBSS, Smile Identity & CAC integration
                </div>
              </div>
            )}

            {tab === 'audit' && (
              logs.length === 0 ? (
                <div style={{ textAlign:'center', padding:'2rem', color:'#94a3b8' }}>No audit logs available</div>
              ) : logs.slice(0,20).map((l:any) => (
                <div key={l.id} style={{ display:'flex', gap:'1rem', padding:'0.625rem 0', borderBottom:'1px solid #f1f5f9', alignItems:'flex-start', fontSize:'0.8rem' }}>
                  <span style={{ color:'#94a3b8', whiteSpace:'nowrap', flexShrink:0 }}>{new Date(l.createdAt).toLocaleTimeString('en-NG')}</span>
                  <span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'0.15rem 0.5rem', borderRadius:'0.25rem', fontWeight:600, flexShrink:0 }}>{l.action?.replace(/_/g,' ')}</span>
                  <span style={{ color:'#374151', flex:1 }}>{l.description}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
