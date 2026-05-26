import React, { useEffect, useState } from 'react'

// Dynamically import both pages
const Onboarding = React.lazy(() => import('./onboarding/UnifiedOnboarding'))
const MarketplaceHome = React.lazy(() => import('./marketplace/MarketplaceHome'))

export default function RootPage() {
  // Check if user has seen the onboarding before
  const [ready, setReady] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('vp_onboarding_seen')
    const token = localStorage.getItem('accessToken')
    
    // Show marketplace directly if:
    // - Already logged in
    // - Already seen onboarding
    if (token || seen) {
      setShowOnboarding(false)
    } else {
      setShowOnboarding(true)
    }
    setReady(true)
  }, [])

  if (!ready) return null

  return showOnboarding ? <Onboarding /> : <MarketplaceHome />
}
