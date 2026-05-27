import React, { useEffect, useRef, useState } from 'react'

// ================================================================
// VeriProp Nigeria — OpenStreetMap Component
// FREE — No API key required
// Uses Leaflet.js + OpenStreetMap tiles
// Geocoding via Nominatim (free, no key needed)
// ================================================================

interface MapMarker {
  id: string
  lat: number
  lng: number
  title: string
  price: number
  type: string
  verified?: boolean
}

interface PropertyMapProps {
  markers?: MapMarker[]
  center?: [number, number]
  zoom?: number
  height?: number | string
  showSearch?: boolean
  onMarkerClick?: (id: string) => void
  singleProperty?: { lat?: number; lng?: number; title: string; address: string }
}

const fmt = (n: number) => n >= 1e9 ? `₦${(n/1e9).toFixed(1)}B` : n >= 1e6 ? `₦${(n/1e6).toFixed(1)}M` : `₦${n?.toLocaleString()}`

// Nigeria center coordinates
const NIGERIA_CENTER: [number, number] = [9.082, 8.6753]

// Geocode an address using Nominatim (FREE)
export async function geocodeAddress(address: string, state?: string): Promise<[number, number] | null> {
  try {
    const query = [address, state, 'Nigeria'].filter(Boolean).join(', ')
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=ng`
    const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'VeriPropNigeria/1.0' } })
    const data = await res.json()
    if (data?.[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
  } catch {}
  return null
}

// Reverse geocode coordinates to address (FREE)
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    const res = await fetch(url, { headers: { 'Accept-Language': 'en', 'User-Agent': 'VeriPropNigeria/1.0' } })
    const data = await res.json()
    return data?.display_name || null
  } catch {}
  return null
}

export default function PropertyMap({
  markers = [],
  center = NIGERIA_CENTER,
  zoom = 6,
  height = 400,
  showSearch = false,
  onMarkerClick,
  singleProperty,
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)

  // Load Leaflet dynamically (no npm install needed)
  useEffect(() => {
    if (mapInstance.current) return

    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    // Load Leaflet JS
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => initMap()
    document.head.appendChild(script)

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  const initMap = () => {
    if (!mapRef.current || mapInstance.current) return
    const L = (window as any).L
    if (!L) return

    // Create map
    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: true,
      scrollWheelZoom: true,
    })

    // Add OpenStreetMap tiles (FREE)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)

    mapInstance.current = map
    setMapLoaded(true)

    // Add markers
    addMarkers(map, L)
  }

  const addMarkers = (map: any, L: any) => {
    // Clear existing markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    // Single property marker
    if (singleProperty?.lat && singleProperty?.lng) {
      const icon = L.divIcon({
        html: `<div style="background:#1d4ed8;color:#fff;padding:6px 10px;border-radius:8px;font-weight:800;font-size:12px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.3);border:2px solid #fff">📍 ${singleProperty.title.slice(0, 20)}</div>`,
        className: '',
        iconAnchor: [0, 0],
      })
      const marker = L.marker([singleProperty.lat, singleProperty.lng], { icon })
        .addTo(map)
        .bindPopup(`<b>${singleProperty.title}</b><br/>${singleProperty.address}`)
      markersRef.current.push(marker)
      map.setView([singleProperty.lat, singleProperty.lng], 15)
      return
    }

    // Multiple property markers
    markers.forEach(m => {
      const color = m.verified ? '#10b981' : '#1d4ed8'
      const icon = L.divIcon({
        html: `
          <div style="background:${color};color:#fff;padding:5px 8px;border-radius:6px;font-weight:800;font-size:11px;white-space:nowrap;box-shadow:0 3px 8px rgba(0,0,0,0.25);border:2px solid #fff;cursor:pointer">
            ${m.verified ? '✓ ' : ''}${fmt(m.price)}
          </div>`,
        className: '',
        iconAnchor: [20, 0],
      })

      const marker = L.marker([m.lat, m.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:180px">
            <b style="font-size:13px">${m.title}</b>
            <div style="color:#64748b;font-size:12px;margin:4px 0">${m.type}</div>
            <div style="font-weight:800;color:#1d4ed8;font-size:14px">${fmt(m.price)}</div>
            ${m.verified ? '<div style="color:#10b981;font-size:11px;margin-top:4px">✅ Verified listing</div>' : ''}
            <a href="/properties/${m.id}" style="display:inline-block;margin-top:8px;background:#1d4ed8;color:#fff;padding:4px 12px;border-radius:4px;text-decoration:none;font-size:12px;font-weight:700">View →</a>
          </div>
        `)
        .on('click', () => onMarkerClick?.(m.id))

      markersRef.current.push(marker)
    })

    // Fit bounds to show all markers
    if (markers.length > 1) {
      const group = L.featureGroup(markersRef.current)
      map.fitBounds(group.getBounds().pad(0.1))
    } else if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 14)
    }
  }

  // Update markers when data changes
  useEffect(() => {
    if (!mapLoaded || !mapInstance.current) return
    const L = (window as any).L
    if (L) addMarkers(mapInstance.current, L)
  }, [markers, mapLoaded, singleProperty])

  // Search location
  const searchLocation = async () => {
    if (!searchQuery.trim() || !mapLoaded) return
    setSearching(true)
    const coords = await geocodeAddress(searchQuery)
    if (coords && mapInstance.current) {
      mapInstance.current.setView(coords, 13)
      const L = (window as any).L
      const marker = L.marker(coords)
        .addTo(mapInstance.current)
        .bindPopup(`<b>${searchQuery}</b>`)
        .openPopup()
      markersRef.current.push(marker)
    }
    setSearching(false)
  }

  return (
    <div style={{ fontFamily: 'Inter,sans-serif' }}>
      {/* Search bar */}
      {showSearch && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchLocation()}
            placeholder="Search area, state, LGA..."
            style={{ flex: 1, padding: '0.625rem 0.875rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none' }}
          />
          <button onClick={searchLocation} disabled={searching}
            style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '0.625rem 1rem', borderRadius: '0.5rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem' }}>
            {searching ? '...' : '🔍'}
          </button>
        </div>
      )}

      {/* Map container */}
      <div style={{ position: 'relative', height, borderRadius: '0.875rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* Loading state */}
        {!mapLoaded && (
          <div style={{ position: 'absolute', inset: 0, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '2rem' }}>🗺️</div>
            <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>Loading map...</p>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>Powered by OpenStreetMap (Free)</p>
          </div>
        )}
      </div>

      {/* Attribution */}
      <p style={{ color: '#94a3b8', fontSize: '0.7rem', margin: '0.375rem 0 0', textAlign: 'right' }}>
        🗺️ Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8' }}>OpenStreetMap</a> contributors · FREE, no API key
      </p>
    </div>
  )
}

// ================================================================
// Map Search Page — Find properties on map
// ================================================================
export function MapSearchView() {
  const [properties, setProperties] = useState<MapMarker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'
    fetch(`${API}/api/v1/properties?limit=50&status=active`)
      .then(r => r.json())
      .then(data => {
        // Map properties with coordinates (geocode if needed)
        const mapped = (data.data || [])
          .filter((p: any) => p.latitude && p.longitude)
          .map((p: any) => ({
            id: p.id,
            lat: p.latitude,
            lng: p.longitude,
            title: p.title,
            price: p.price,
            type: p.propertyType,
            verified: p.isVerified,
          }))
        setProperties(mapped)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter,sans-serif' }}>
      <nav style={{ background: '#1e3a5f', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/" style={{ color: '#fff', fontWeight: 800, textDecoration: 'none' }}>🏠 VeriProp <span style={{ color: '#f59e0b' }}>Nigeria</span></a>
        <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 700 }}>🗺️ MAP SEARCH</span>
      </nav>

      <div style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h1 style={{ color: '#1e3a5f', fontWeight: 800, margin: '0 0 0.25rem' }}>Property Map</h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
            {loading ? 'Loading properties...' : `${properties.length} verified properties on map`} ·
            <span style={{ color: '#10b981' }}> Powered by OpenStreetMap (Free)</span>
          </p>
        </div>

        <PropertyMap
          markers={properties}
          height={500}
          showSearch={true}
          onMarkerClick={id => window.location.href = `/properties/${id}`}
        />

        <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ background: '#10b981', color: '#fff', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '10px' }}>✓ ₦5M</span>
            Verified listing
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ background: '#1d4ed8', color: '#fff', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '10px' }}>₦5M</span>
            Unverified listing
          </span>
        </div>
      </div>
    </div>
  )
}
