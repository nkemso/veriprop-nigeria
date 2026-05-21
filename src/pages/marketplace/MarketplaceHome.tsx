// SCREEN_82 — Marketplace Home
import React, { useState, useEffect } from 'react';
import { formatPrice, NIGERIA_STATES, PROPERTY_TYPES, LISTING_TYPES } from '../../lib/property-search';
import type { Property } from '../../types/property';

const API = import.meta.env.VITE_API_URL || '';

export default function MarketplaceHome() {
  const [featured, setFeatured] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchState, setSearchState] = useState('');
  const [searchType, setSearchType] = useState('');
  const [listingType, setListingType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    fetch(`${API}/api/properties?featured=true&limit=6&status=active`)
      .then(r => r.json())
      .then(d => { setFeatured(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchState) params.set('state', searchState);
    if (searchType) params.set('type', searchType);
    if (listingType) params.set('listingType', listingType);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    window.location.href = `/properties?${params.toString()}`;
  };

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif', background: '#f8fafc' }}>
      {/* NAV */}
      <nav style={{ background: '#1e3a5f', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/" style={{ color: '#fff', fontWeight: 800, fontSize: '1.25rem', textDecoration: 'none' }}>
          🏠 VeriProp <span style={{ color: '#f59e0b' }}>Nigeria</span>
        </a>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <a href="/properties" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Browse</a>
          <a href="/list-property" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>List Property</a>
          <a href="/login" style={{
            background: '#f59e0b', color: '#1e3a5f', padding: '0.5rem 1.25rem',
            borderRadius: '0.5rem', fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem',
          }}>Sign In</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 100%)',
        padding: '5rem 2rem 4rem', textAlign: 'center', color: '#fff',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.15)', padding: '0.5rem 1rem', borderRadius: '999px', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            🇳🇬 Nigeria's Most Trusted Property Marketplace
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: '1rem' }}>
            Find Your Perfect Property<br />
            <span style={{ color: '#fbbf24' }}>Safe. Verified. Secured.</span>
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#bfdbfe', marginBottom: '2.5rem' }}>
            Every listing verified. Every transaction secured by VeriProp Escrow.<br />
            Zero fraud. 100% trust.
          </p>

          {/* SEARCH BOX */}
          <div style={{
            background: '#fff', borderRadius: '1rem', padding: '1.5rem',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            <select value={listingType} onChange={e => setListingType(e.target.value)} style={{ padding: '0.875rem', border: '2px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }}>
              <option value="">For Sale/Rent</option>
              {LISTING_TYPES.map(lt => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
            </select>
            <select value={searchType} onChange={e => setSearchType(e.target.value)} style={{ padding: '0.875rem', border: '2px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }}>
              <option value="">Property Type</option>
              {PROPERTY_TYPES.map(pt => <option key={pt.value} value={pt.value}>{pt.label}</option>)}
            </select>
            <select value={searchState} onChange={e => setSearchState(e.target.value)} style={{ padding: '0.875rem', border: '2px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }}>
              <option value="">Select State</option>
              {NIGERIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <input type="number" placeholder="Min Price (₦)" value={minPrice} onChange={e => setMinPrice(e.target.value)}
              style={{ padding: '0.875rem', border: '2px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }} />
            <input type="number" placeholder="Max Price (₦)" value={maxPrice} onChange={e => setMaxPrice(e.target.value)}
              style={{ padding: '0.875rem', border: '2px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }} />
            <button onClick={handleSearch} style={{
              background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '0.5rem',
              fontWeight: 700, fontSize: '1rem', cursor: 'pointer', padding: '0.875rem',
            }}>
              🔍 Search
            </button>
          </div>
        </div>
      </section>

      {/* TRUST BADGES */}
      <section style={{ background: '#1e3a5f', padding: '1.5rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '1rem' }}>
          {[
            ['🛡️', 'Verified Listings'],
            ['🔒', 'Escrow Protected'],
            ['⚖️', 'Multi-Sig Release'],
            ['🤖', 'AI Fraud Detection'],
            ['📋', 'Legal Documents'],
          ].map(([icon, label]) => (
            <div key={label as string} style={{ color: '#fff', textAlign: 'center', fontSize: '0.9rem' }}>
              <div style={{ fontSize: '1.5rem' }}>{icon as string}</div>
              <div style={{ color: '#94a3b8', marginTop: '0.25rem' }}>{label as string}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED PROPERTIES */}
      <section style={{ padding: '3rem 2rem', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e3a5f' }}>✨ Featured Properties</h2>
          <a href="/properties" style={{ color: '#1d4ed8', fontWeight: 600, textDecoration: 'none' }}>View All →</a>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: '#e2e8f0', borderRadius: '1rem', height: 320, animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {featured.map(p => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: '#eff6ff', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e3a5f', marginBottom: '2rem' }}>
            How VeriProp Works
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
            {[
              ['1️⃣', 'Verify Identity', 'Complete BVN + Govt ID verification'],
              ['2️⃣', 'Find Property', 'Browse AI-verified listings nationwide'],
              ['3️⃣', 'Secure Escrow', 'Funds held safely until all parties sign'],
              ['4️⃣', 'Multi-Sig Release', 'Buyer + Seller approve → funds split automatically'],
            ].map(([step, title, desc]) => (
              <div key={title as string} style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{step as string}</div>
                <div style={{ fontWeight: 700, color: '#1e3a5f', marginBottom: '0.5rem' }}>{title as string}</div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{desc as string}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#1e3a5f', color: '#94a3b8', padding: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
        <p>© 2026 VeriProp Nigeria. All rights reserved. | Nigeria's Most Trusted Property Marketplace</p>
        <p style={{ marginTop: '0.5rem' }}>
          <a href="/legal/terms" style={{ color: '#64748b', marginRight: '1rem' }}>Terms</a>
          <a href="/legal/privacy" style={{ color: '#64748b', marginRight: '1rem' }}>Privacy</a>
          <a href="/legal/escrow" style={{ color: '#64748b' }}>Escrow Policy</a>
        </p>
      </footer>
    </div>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const img = property.images?.[0]?.url;
  return (
    <a href={`/properties/${property.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ background: '#fff', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', transition: 'transform 0.2s', cursor: 'pointer' }}>
        <div style={{ position: 'relative', height: 200, background: '#e2e8f0', overflow: 'hidden' }}>
          {img && <img src={img} alt={property.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
          <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.5rem' }}>
            {property.isFeatured && <span style={{ background: '#f59e0b', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: 700 }}>FEATURED</span>}
            {property.isVerified && <span style={{ background: '#10b981', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: 700 }}>✓ VERIFIED</span>}
          </div>
          <div style={{ position: 'absolute', bottom: '0.75rem', right: '0.75rem', background: '#1d4ed8', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '999px', fontWeight: 700, fontSize: '0.875rem' }}>
            {formatPrice(property.price)}
            {property.listingType === 'rent' && <span style={{ fontWeight: 400, fontSize: '0.75rem' }}>/yr</span>}
          </div>
        </div>
        <div style={{ padding: '1rem' }}>
          <div style={{ fontWeight: 700, color: '#1e3a5f', marginBottom: '0.25rem', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{property.title}</div>
          <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.75rem' }}>📍 {property.lga}, {property.state}</div>
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#374151' }}>
            {property.bedrooms && <span>🛏 {property.bedrooms} beds</span>}
            {property.bathrooms && <span>🚿 {property.bathrooms} baths</span>}
            {property.size && <span>📐 {property.size} {property.sizeUnit}</span>}
          </div>
        </div>
      </div>
    </a>
  );
}
