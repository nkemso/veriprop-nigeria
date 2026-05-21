// SCREEN_72 — Low-Data Mode (for users on limited/slow data)
import React, { useState, useEffect } from 'react';
import { formatPrice } from '../../lib/property-search';

const API = import.meta.env.VITE_API_URL || '';

export default function LowDataMode() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState('Lagos');
  const [type, setType] = useState('');

  useEffect(() => {
    fetch(`${API}/api/properties?state=${state}&limit=10&status=active${type ? `&type=${type}` : ''}`)
      .then(r => r.json()).then(d => { setProperties(d.data || []); }).finally(() => setLoading(false));
  }, [state, type]);

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '1rem', fontFamily: 'Inter, sans-serif', background: '#fff', minHeight: '100vh' }}>
      {/* Minimal Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '2px solid #e2e8f0' }}>
        <div style={{ fontWeight: 800, color: '#1e3a5f', fontSize: '1.1rem' }}>🏠 VeriProp</div>
        <span style={{ background: '#dcfce7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>⚡ Low-Data Mode</span>
      </div>

      {/* Simple Filters — text only, no images in filter */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
        <select value={state} onChange={e => setState(e.target.value)} style={{ padding: '0.625rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
          {['Lagos', 'FCT', 'Rivers', 'Ogun', 'Kano', 'Kaduna', 'Oyo', 'Delta', 'Anambra'].map(s =>
            <option key={s} value={s}>{s}</option>
          )}
        </select>
        <select value={type} onChange={e => setType(e.target.value)} style={{ padding: '0.625rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
          <option value="">All Types</option>
          <option value="apartment">Apartment</option>
          <option value="house">House</option>
          <option value="land">Land</option>
          <option value="commercial">Commercial</option>
        </select>
      </div>

      {/* TEXT-ONLY Property List (no images = data saving) */}
      {loading && <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>Loading...</div>}
      {properties.map(p => (
        <a key={p.id} href={`/properties/${p.id}?lowdata=1`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ borderBottom: '1px solid #f1f5f9', padding: '0.875rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{p.title}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📍 {p.lga}, {p.state}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {p.bedrooms && `🛏 ${p.bedrooms}bd `}{p.bathrooms && `🚿 ${p.bathrooms}ba`}
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 80 }}>
                <div style={{ fontWeight: 800, color: '#1d4ed8', fontSize: '0.9rem' }}>{formatPrice(p.price)}</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>{p.listingType}</div>
                {p.isVerified && <div style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>✓ Verified</div>}
              </div>
            </div>
          </div>
        </a>
      ))}

      {!loading && properties.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.875rem' }}>No properties found.</div>
      )}

      {/* Switch to full mode */}
      <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
        <a href="/properties" style={{ color: '#1d4ed8', fontSize: '0.8rem' }}>Switch to Full Mode →</a>
      </div>
    </div>
  );
}
