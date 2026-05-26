import React, { useState, useEffect } from 'react'
import { formatPrice, NIGERIA_STATES, PROPERTY_TYPES, LISTING_TYPES } from '../../lib/property-search'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'

export default function Properties() {
  const [properties, setProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const params = new URLSearchParams(window.location.search)
  const [filters, setFilters] = useState({
    state: params.get('state') || '',
    type: params.get('type') || '',
    listingType: params.get('listingType') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    q: params.get('q') || '',
  })

  useEffect(() => {
    setLoading(true)
    const q = new URLSearchParams({ page: String(page), limit: '12', ...Object.fromEntries(Object.entries(filters).filter(([,v])=>v)) })
    fetch(`${API}/api/v1/properties?${q}`)
      .then(r => r.json())
      .then(d => { setProperties(d.data || []); setTotal(d.pagination?.total || 0); setLoading(false) })
      .catch(() => setLoading(false))
  }, [filters, page])

  const inp = { padding:'0.625rem 0.75rem', border:'1px solid #e2e8f0', borderRadius:'0.5rem', fontSize:'0.875rem', background:'#fff', width:'100%', boxSizing:'border-box' as const }

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'Inter,sans-serif' }}>
      {/* Nav */}
      <nav style={{ background:'#1e3a5f', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <a href="/" style={{ color:'#fff', fontWeight:800, fontSize:'1.1rem', textDecoration:'none' }}>🏠 VeriProp <span style={{ color:'#f59e0b' }}>Nigeria</span></a>
        <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
          <a href="/list-property" style={{ color:'#94a3b8', textDecoration:'none', fontSize:'0.875rem' }}>List Property</a>
          <a href="/login" style={{ background:'#f59e0b', color:'#1e3a5f', padding:'0.4rem 1rem', borderRadius:'0.5rem', fontWeight:700, textDecoration:'none', fontSize:'0.875rem' }}>Sign In</a>
        </div>
      </nav>

      {/* Filters */}
      <div style={{ background:'#fff', padding:'1rem 1.5rem', borderBottom:'1px solid #e2e8f0', display:'flex', gap:'0.5rem', flexWrap:'wrap', alignItems:'center' }}>
        <input value={filters.q} onChange={e=>setFilters(f=>({...f,q:e.target.value}))} placeholder="Search properties..." style={{ ...inp, maxWidth:200 }} />
        <select value={filters.listingType} onChange={e=>setFilters(f=>({...f,listingType:e.target.value}))} style={{ ...inp, maxWidth:130 }}>
          <option value="">For Sale/Rent</option>
          {LISTING_TYPES.map(l=><option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
        <select value={filters.type} onChange={e=>setFilters(f=>({...f,type:e.target.value}))} style={{ ...inp, maxWidth:130 }}>
          <option value="">Property Type</option>
          {PROPERTY_TYPES.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select value={filters.state} onChange={e=>setFilters(f=>({...f,state:e.target.value}))} style={{ ...inp, maxWidth:130 }}>
          <option value="">All States</option>
          {NIGERIA_STATES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ color:'#64748b', fontSize:'0.875rem' }}>{total} properties</span>
      </div>

      {/* Grid */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'1.5rem' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:'3rem', color:'#94a3b8' }}>Loading properties...</div>
        ) : properties.length === 0 ? (
          <div style={{ textAlign:'center', padding:'3rem' }}>
            <div style={{ fontSize:'3rem' }}>🏠</div>
            <h3 style={{ color:'#1e3a5f' }}>No properties found</h3>
            <p style={{ color:'#64748b' }}>Try adjusting your filters</p>
            <a href="/list-property" style={{ color:'#1d4ed8', fontWeight:700 }}>Be the first to list →</a>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'1.5rem' }}>
            {properties.map((p:any) => (
              <a key={p.id} href={`/properties/${p.id}`} style={{ textDecoration:'none', color:'inherit' }}>
                <div style={{ background:'#fff', borderRadius:'1rem', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.08)', transition:'transform 0.2s', cursor:'pointer' }}>
                  <div style={{ height:180, background:'#e2e8f0', position:'relative', overflow:'hidden' }}>
                    {p.images?.[0] && <img src={p.images[0].url} alt={p.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
                    <div style={{ position:'absolute', top:'0.5rem', left:'0.5rem', display:'flex', gap:'0.25rem' }}>
                      {p.isFeatured && <span style={{ background:'#f59e0b', color:'#fff', padding:'0.15rem 0.4rem', borderRadius:'0.25rem', fontSize:'0.65rem', fontWeight:700 }}>FEATURED</span>}
                      {p.isVerified && <span style={{ background:'#10b981', color:'#fff', padding:'0.15rem 0.4rem', borderRadius:'0.25rem', fontSize:'0.65rem', fontWeight:700 }}>✓ VERIFIED</span>}
                    </div>
                    <div style={{ position:'absolute', bottom:'0.5rem', right:'0.5rem', background:'#1d4ed8', color:'#fff', padding:'0.2rem 0.6rem', borderRadius:'999px', fontWeight:700, fontSize:'0.8rem' }}>
                      {formatPrice(p.price)}{p.listingType==='rent' ? '/yr' : ''}
                    </div>
                  </div>
                  <div style={{ padding:'0.875rem' }}>
                    <div style={{ fontWeight:700, color:'#1e3a5f', fontSize:'0.9rem', marginBottom:'0.25rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</div>
                    <div style={{ color:'#64748b', fontSize:'0.75rem', marginBottom:'0.5rem' }}>📍 {p.lga}, {p.state}</div>
                    <div style={{ display:'flex', gap:'0.75rem', fontSize:'0.75rem', color:'#374151' }}>
                      {p.bedrooms && <span>🛏 {p.bedrooms}</span>}
                      {p.bathrooms && <span>🚿 {p.bathrooms}</span>}
                      {p.size && <span>📐 {p.size}{p.sizeUnit}</span>}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
        {total > 12 && (
          <div style={{ display:'flex', justifyContent:'center', gap:'0.5rem', marginTop:'2rem' }}>
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ padding:'0.5rem 1rem', border:'1px solid #e2e8f0', borderRadius:'0.5rem', background: page===1 ? '#f8fafc':'#fff', cursor: page===1 ? 'not-allowed':'pointer' }}>← Prev</button>
            <span style={{ padding:'0.5rem 1rem', color:'#64748b' }}>Page {page}</span>
            <button onClick={()=>setPage(p=>p+1)} disabled={page*12>=total} style={{ padding:'0.5rem 1rem', border:'1px solid #e2e8f0', borderRadius:'0.5rem', background: page*12>=total ? '#f8fafc':'#fff', cursor: page*12>=total ? 'not-allowed':'pointer' }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  )
}
