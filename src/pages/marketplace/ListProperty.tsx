import React, { useState } from 'react'
import { NIGERIA_STATES, PROPERTY_TYPES, LISTING_TYPES } from '../../lib/property-search'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'

export default function ListProperty() {
  const token = localStorage.getItem('accessToken')
  const [form, setForm] = useState({ title:'', description:'', price:'', propertyType:'apartment', listingType:'sale', state:'Lagos', lga:'', address:'', bedrooms:'', bathrooms:'', size:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif', flexDirection:'column', gap:'1rem' }}>
        <div style={{ fontSize:'3rem' }}>🔒</div>
        <h2 style={{ color:'#1e3a5f' }}>Login Required</h2>
        <p style={{ color:'#64748b' }}>You must be logged in to list a property</p>
        <a href="/login" style={{ background:'#1d4ed8', color:'#fff', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:700, textDecoration:'none' }}>Sign In →</a>
      </div>
    )
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/v1/properties`, {
        method:'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ ...form, price: parseFloat(form.price), bedrooms: form.bedrooms ? parseInt(form.bedrooms) : undefined, bathrooms: form.bathrooms ? parseInt(form.bathrooms) : undefined }),
      })
      const data = await res.json()
      if (data.success) { setSuccess(true) }
      else setError(data.errors?.[0]?.msg || data.message || 'Failed to list property')
    } catch { setError('Connection error') }
    setLoading(false)
  }

  if (success) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif', background:'#f0fdf4', flexDirection:'column' }}>
      <div style={{ fontSize:'4rem' }}>🎉</div>
      <h2 style={{ color:'#166534', fontWeight:800 }}>Property Listed!</h2>
      <p style={{ color:'#64748b' }}>Your property has been submitted for review</p>
      <a href="/dashboard" style={{ background:'#1d4ed8', color:'#fff', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:700, textDecoration:'none' }}>Go to Dashboard →</a>
    </div>
  )

  const inp = { width:'100%', padding:'0.75rem 1rem', border:'2px solid #e2e8f0', borderRadius:'0.5rem', fontSize:'0.9rem', outline:'none', boxSizing:'border-box' as const }

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', fontFamily:'Inter,sans-serif' }}>
      <nav style={{ background:'#1e3a5f', padding:'1rem 1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <a href="/" style={{ color:'#fff', fontWeight:800, fontSize:'1.1rem', textDecoration:'none' }}>🏠 VeriProp <span style={{ color:'#f59e0b' }}>Nigeria</span></a>
        <a href="/dashboard" style={{ color:'#94a3b8', textDecoration:'none', fontSize:'0.875rem' }}>← Dashboard</a>
      </nav>
      <div style={{ maxWidth:700, margin:'0 auto', padding:'1.5rem' }}>
        <div style={{ background:'#fff', borderRadius:'1rem', padding:'2rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <h1 style={{ color:'#1e3a5f', fontWeight:800, marginBottom:'0.5rem' }}>List Your Property</h1>
          <p style={{ color:'#64748b', marginBottom:'1.5rem', fontSize:'0.875rem' }}>All listings are AI-moderated for quality and fraud prevention</p>
          {error && <div style={{ background:'#fee2e2', color:'#991b1b', padding:'0.75rem', borderRadius:'0.5rem', marginBottom:'1rem', fontSize:'0.875rem' }}>❌ {error}</div>}
          <form onSubmit={submit}>
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>Title *</label>
              <input value={form.title} onChange={set('title')} required placeholder="e.g. 3 Bedroom Apartment in Lekki Phase 1" style={inp} />
            </div>
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>Description *</label>
              <textarea value={form.description} onChange={set('description')} required rows={4} placeholder="Describe your property..." style={{ ...inp, resize:'vertical' }} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1rem' }}>
              <div>
                <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>Price (₦) *</label>
                <input type="number" value={form.price} onChange={set('price')} required placeholder="5000000" style={inp} />
              </div>
              <div>
                <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>Listing Type *</label>
                <select value={form.listingType} onChange={set('listingType')} style={{ ...inp, background:'#fff' }}>
                  {LISTING_TYPES.map(l=><option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1rem' }}>
              <div>
                <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>Property Type *</label>
                <select value={form.propertyType} onChange={set('propertyType')} style={{ ...inp, background:'#fff' }}>
                  {PROPERTY_TYPES.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>State *</label>
                <select value={form.state} onChange={set('state')} style={{ ...inp, background:'#fff' }}>
                  {NIGERIA_STATES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>LGA *</label>
              <input value={form.lga} onChange={set('lga')} required placeholder="e.g. Eti-Osa" style={inp} />
            </div>
            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>Address *</label>
              <input value={form.address} onChange={set('address')} required placeholder="e.g. 15 Admiralty Way, Lekki Phase 1" style={inp} />
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'0.75rem', marginBottom:'1.5rem' }}>
              <div>
                <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>Bedrooms</label>
                <input type="number" value={form.bedrooms} onChange={set('bedrooms')} placeholder="3" style={inp} />
              </div>
              <div>
                <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>Bathrooms</label>
                <input type="number" value={form.bathrooms} onChange={set('bathrooms')} placeholder="2" style={inp} />
              </div>
              <div>
                <label style={{ display:'block', fontWeight:600, color:'#374151', marginBottom:'0.4rem', fontSize:'0.875rem' }}>Size (sqm)</label>
                <input type="number" value={form.size} onChange={set('size')} placeholder="120" style={inp} />
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ width:'100%', padding:'0.875rem', background: loading ? '#94a3b8':'#1d4ed8', color:'#fff', border:'none', borderRadius:'0.75rem', fontWeight:800, fontSize:'1rem', cursor: loading ? 'not-allowed':'pointer' }}>
              {loading ? 'Submitting...' : '🏠 Submit Listing'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
