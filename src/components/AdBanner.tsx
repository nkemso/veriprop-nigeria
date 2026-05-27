import React, { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'

// ================================================================
// AD BANNER COMPONENT — Renders ads in the app
// Supports: banner, native, interstitial, push
// ================================================================

interface Ad {
  id: string
  type: 'banner' | 'native' | 'sponsored'
  title: string
  body?: string
  imageUrl?: string
  ctaText: string
  ctaUrl: string
  advertiser: string
  badge?: string
  color?: string
}

// Demo ads (in production these come from the backend)
const DEMO_ADS: Ad[] = [
  {
    id: 'ad1',
    type: 'native',
    title: 'Get a Mortgage for Your Dream Home',
    body: 'Access up to ₦50M home loans at competitive rates. Apply in 5 minutes.',
    ctaText: 'Apply Now →',
    ctaUrl: 'https://veripronigeria.com/advertise',
    advertiser: 'First Bank Nigeria',
    badge: 'Sponsored',
    color: '#1d4ed8',
  },
  {
    id: 'ad2',
    type: 'native',
    title: 'Transform Your New Home with Premium Furniture',
    body: 'Lagos finest furniture store. Free delivery on orders above ₦200K.',
    ctaText: 'Shop Now →',
    ctaUrl: 'https://veripronigeria.com/advertise',
    advertiser: 'Lagos Furniture Hub',
    badge: 'Ad',
    color: '#f59e0b',
  },
  {
    id: 'ad3',
    type: 'banner',
    title: 'Transfer Money to Nigeria — Zero Fees',
    body: 'Best rates for diaspora property payments. Send from UK, US, Canada.',
    ctaText: 'Send Money →',
    ctaUrl: 'https://veripronigeria.com/advertise',
    advertiser: 'RemitPro Nigeria',
    badge: 'Sponsored',
    color: '#10b981',
  },
  {
    id: 'ad4',
    type: 'native',
    title: 'Build Your Property Portfolio with PropVest',
    body: 'Fractional property investment from ₦100K. Earn 15% annual returns.',
    ctaText: 'Invest Now →',
    ctaUrl: 'https://veripronigeria.com/advertise',
    advertiser: 'PropVest Nigeria',
    badge: 'Promoted',
    color: '#8b5cf6',
  },
]

// ── BANNER AD (horizontal strip)
export function BannerAd({ position = 'bottom' }: { position?: 'top' | 'bottom' | 'inline' }) {
  const [ad, setAd] = useState<Ad | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Pick random banner ad
    const bannerAds = DEMO_ADS.filter(a => a.type === 'banner' || a.type === 'native')
    setAd(bannerAds[Math.floor(Math.random() * bannerAds.length)])
  }, [])

  if (!ad || dismissed) return null

  const trackClick = () => {
    fetch(`${API}/api/v1/ads/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: ad.id, position }),
    }).catch(() => {})
    window.open(ad.ctaUrl, '_blank')
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem',
      padding: '0.875rem 1rem', marginBottom: '1rem', fontFamily: 'Inter,sans-serif',
      display: 'flex', gap: '0.875rem', alignItems: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'relative',
    }}>
      {/* Ad indicator */}
      <span style={{ position: 'absolute', top: 6, left: 8, background: '#f1f5f9', color: '#94a3b8', padding: '1px 6px', borderRadius: 3, fontSize: '0.6rem', fontWeight: 700 }}>
        {ad.badge || 'Ad'}
      </span>
      {/* Close */}
      <button onClick={() => setDismissed(true)}
        style={{ position: 'absolute', top: 6, right: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.875rem', padding: 0 }}>✕</button>

      <div style={{ width: 44, height: 44, borderRadius: '0.5rem', background: `${ad.color}15`, border: `1px solid ${ad.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
        {ad.advertiser[0]}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingTop: '0.5rem' }}>
        <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.title}</div>
        {ad.body && <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ad.body}</div>}
        <div style={{ color: '#94a3b8', fontSize: '0.65rem', marginTop: '0.1rem' }}>by {ad.advertiser}</div>
      </div>
      <button onClick={trackClick}
        style={{ background: ad.color, color: '#fff', border: 'none', padding: '0.4rem 0.875rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.75rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
        {ad.ctaText}
      </button>
    </div>
  )
}

// ── NATIVE AD (blends with property cards)
export function NativeAd() {
  const [ad, setAd] = useState<Ad | null>(null)

  useEffect(() => {
    setAd(DEMO_ADS[Math.floor(Math.random() * DEMO_ADS.length)])
  }, [])

  if (!ad) return null

  const trackClick = () => {
    fetch(`${API}/api/v1/ads/click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: ad.id, position: 'native' }),
    }).catch(() => {})
    window.open(ad.ctaUrl, '_blank')
  }

  return (
    <div onClick={trackClick} style={{
      background: '#fff', borderRadius: '1rem', overflow: 'hidden', cursor: 'pointer',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: `1px solid ${ad.color}20`,
      fontFamily: 'Inter,sans-serif', position: 'relative',
    }}>
      <div style={{ height: 140, background: `linear-gradient(135deg, ${ad.color}20, ${ad.color}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
        {ad.advertiser[0]}
      </div>
      <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '2px 6px', borderRadius: 3, fontSize: '0.6rem', fontWeight: 700 }}>
        {ad.badge || 'Sponsored'}
      </div>
      <div style={{ padding: '0.875rem' }}>
        <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{ad.title}</div>
        <div style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '0.5rem' }}>{ad.body}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>{ad.advertiser}</span>
          <span style={{ background: ad.color, color: '#fff', padding: '0.25rem 0.625rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>{ad.ctaText}</span>
        </div>
      </div>
    </div>
  )
}

// ── SPONSORED LISTING (appears in property search)
export function SponsoredListing() {
  const ad = DEMO_ADS[0]
  return (
    <div style={{
      background: 'linear-gradient(135deg,#eff6ff,#f8fafc)', border: '1px solid #dbeafe',
      borderRadius: '0.75rem', padding: '0.875rem', marginBottom: '0.75rem',
      fontFamily: 'Inter,sans-serif', display: 'flex', alignItems: 'center', gap: '0.75rem',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: '0.5rem', background: '#1d4ed810', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
        📌
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.2rem' }}>
          <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '1px 6px', borderRadius: 3, fontSize: '0.6rem', fontWeight: 700 }}>SPONSORED</span>
          <span style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '0.85rem' }}>{ad.title}</span>
        </div>
        <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{ad.body}</div>
      </div>
      <a href={ad.ctaUrl} target="_blank" rel="noopener noreferrer"
        style={{ background: '#1d4ed8', color: '#fff', padding: '0.35rem 0.875rem', borderRadius: '0.5rem', fontWeight: 700, textDecoration: 'none', fontSize: '0.75rem', flexShrink: 0 }}>
        {ad.ctaText}
      </a>
    </div>
  )
}

// ── AD INTERSTITIAL (full screen between views)
export function useInterstitialAd() {
  const [shown, setShown] = useState(false)
  const [viewCount, setViewCount] = useState(0)

  const onPropertyView = (callback: () => void) => {
    const newCount = viewCount + 1
    setViewCount(newCount)
    // Show interstitial every 5th property view
    if (newCount % 5 === 0 && !shown) {
      setShown(true)
    } else {
      callback()
    }
  }

  const AdModal = shown ? (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ background: '#fff', borderRadius: '1.25rem', maxWidth: 380, width: '90%', overflow: 'hidden' }}>
        <div style={{ height: 200, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>🏦</div>
        <div style={{ padding: '1.5rem' }}>
          <div style={{ background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 4, fontSize: '0.65rem', fontWeight: 700, display: 'inline-block', marginBottom: '0.5rem' }}>ADVERTISEMENT</div>
          <h3 style={{ color: '#1e3a5f', fontWeight: 800, margin: '0 0 0.5rem' }}>Get Pre-Approved for a Mortgage</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>Access up to ₦50M home loan. Rates from 15% per annum. Apply online in minutes.</p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a href="https://veripronigeria.com/advertise" target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, background: '#1d4ed8', color: '#fff', padding: '0.75rem', borderRadius: '0.625rem', fontWeight: 700, textDecoration: 'none', textAlign: 'center', fontSize: '0.875rem' }}>
              Apply Now →
            </a>
            <button onClick={() => setShown(false)}
              style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: '0.75rem 1rem', borderRadius: '0.625rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
              Skip
            </button>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.65rem', textAlign: 'center', marginTop: '0.75rem' }}>First Bank Nigeria · Advertise on VeriProp</p>
        </div>
      </div>
    </div>
  ) : null

  return { onPropertyView, AdModal }
}

export default BannerAd
