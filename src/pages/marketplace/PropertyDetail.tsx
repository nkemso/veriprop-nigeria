import React, { useState, useEffect } from 'react'
import { formatPrice } from '../../lib/property-search'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'

export default function PropertyDetail() {
  const id = window.location.pathname.split('/').pop()
  const [property, setProperty] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [imgIdx, setImgIdx] = useState(0)

  useEffect(() => {
    fetch(`${API}/api/v1/properties/${id}`)
      .then(r => r.json())
      .then(d => { setProperty(d.property || null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif' }}><p>Loading property...</p></div>
  if (!property) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif', flexDirection:'column' }}><div style={{ fontSize:'3rem' }}>🏠</div><h2>Property not found</h2><a href="/properties" style={{ color:'#1d4ed8' }}>← Browse Properties</a></div>

  const imgs = property.images || []

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'Inter,sans-serif' }}>
      <nav style={{ background:'#1e3a5f', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <a href="/" style={{ color:'#fff', fontWeight:800, fontSize:'1.1rem', textDecoration:'none' }}>🏠 VeriProp <span style={{ color:'#f59e0b' }}>Naija</span></a>
        <a href="/properties" style={{ color:'#94a3b8', textDecoration:'none', fontSize:'0.875rem' }}>← All Properties</a>
      </nav>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'1.5rem' }}>
        {/* Images */}
        {imgs.length > 0 && (
          <div style={{ borderRadius:'1rem', overflow:'hidden', marginBottom:'1.5rem', position:'relative', height:320, background:'#e2e8f0' }}>
            <img src={imgs[imgIdx]?.url} alt={property.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            {imgs.length > 1 && (
              <div style={{ position:'absolute', bottom:'1rem', left:'50%', transform:'translateX(-50%)', display:'flex', gap:'0.5rem' }}>
                {imgs.map((_:any, i:number) => (
                  <button key={i} onClick={()=>setImgIdx(i)} style={{ width:8, height:8, borderRadius:'50%', border:'none', background: i===imgIdx ? '#fff' : 'rgba(255,255,255,0.5)', cursor:'pointer', padding:0 }} />
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'1.5rem' }}>
          {/* Main Info */}
          <div style={{ background:'#fff', borderRadius:'1rem', padding:'1.5rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem', flexWrap:'wrap', gap:'0.5rem' }}>
              <div>
                <h1 style={{ color:'#1e3a5f', fontSize:'1.25rem', fontWeight:800, margin:'0 0 0.25rem' }}>{property.title}</h1>
                <p style={{ color:'#64748b', margin:0 }}>📍 {property.address}, {property.lga}, {property.state}</p>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'1.5rem', fontWeight:900, color:'#1d4ed8' }}>{formatPrice(property.price)}</div>
                <div style={{ color:'#64748b', fontSize:'0.875rem', textTransform:'uppercase' }}>{property.listingType}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', marginBottom:'1rem' }}>
              {property.bedrooms && <span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'0.25rem 0.75rem', borderRadius:'999px', fontSize:'0.8rem' }}>🛏 {property.bedrooms} Bedrooms</span>}
              {property.bathrooms && <span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'0.25rem 0.75rem', borderRadius:'999px', fontSize:'0.8rem' }}>🚿 {property.bathrooms} Bathrooms</span>}
              {property.size && <span style={{ background:'#eff6ff', color:'#1d4ed8', padding:'0.25rem 0.75rem', borderRadius:'999px', fontSize:'0.8rem' }}>📐 {property.size} {property.sizeUnit}</span>}
              {property.isVerified && <span style={{ background:'#dcfce7', color:'#166534', padding:'0.25rem 0.75rem', borderRadius:'999px', fontSize:'0.8rem' }}>✓ Verified</span>}
            </div>
            <p style={{ color:'#374151', lineHeight:1.7, margin:0 }}>{property.description}</p>
          </div>

          {/* CTA */}
          <div style={{ background:'#1e3a5f', borderRadius:'1rem', padding:'1.5rem', color:'#fff' }}>
            <h3 style={{ margin:'0 0 1rem', fontWeight:700 }}>🔒 Secure This Property</h3>
            <p style={{ color:'#94a3b8', fontSize:'0.875rem', margin:'0 0 1rem' }}>All transactions are protected by VeriProp Escrow. Funds released only after multi-signature approval.</p>
            <a href="/login" style={{ display:'block', textAlign:'center', background:'#f59e0b', color:'#1e3a5f', padding:'0.875rem', borderRadius:'0.75rem', fontWeight:800, textDecoration:'none', marginBottom:'0.75rem' }}>
              🔐 Proceed to Secure Payment
            </a>
            <a href="/login" style={{ display:'block', textAlign:'center', background:'rgba(255,255,255,0.1)', color:'#fff', padding:'0.75rem', borderRadius:'0.75rem', fontWeight:600, textDecoration:'none', fontSize:'0.875rem' }}>
              💬 Chat with Owner
            </a>
          </div>

          {/* Owner */}
          {property.owner && (
            <div style={{ background:'#fff', borderRadius:'1rem', padding:'1.5rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ color:'#1e3a5f', margin:'0 0 1rem', fontWeight:700 }}>Listed by</h3>
              <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:'#1d4ed8', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:'1.25rem' }}>
                  {property.owner.firstName?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight:700, color:'#1e3a5f' }}>{property.owner.firstName} {property.owner.lastName}</div>
                  <div style={{ color:'#64748b', fontSize:'0.8rem', textTransform:'capitalize' }}>{property.owner.role}</div>
                  {property.owner.isVerified && <div style={{ color:'#10b981', fontSize:'0.75rem', fontWeight:600 }}>✓ Verified User</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
