import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'

// Root (smart: onboarding for new users, marketplace for returning)
const RootPage              = lazy(() => import('./pages/RootPage'))
const Onboarding            = lazy(() => import('./pages/onboarding/Onboarding'))
const UnifiedOnboarding     = lazy(() => import('./pages/onboarding/UnifiedOnboarding'))

// Monetization
const PricingPlans      = lazy(() => import('./pages/monetization/PricingPlans'))
const BoostProperty     = lazy(() => import('./pages/monetization/BoostProperty'))

// Map
const MapSearchView         = lazy(() => import('./components/PropertyMap').then((m: any) => ({ default: m.MapSearchView })))

// AI Advisors
const MarketIntelligence    = lazy(() => import('./pages/ai-advisors/MarketIntelligenceHub'))
const VetProAdvisors        = lazy(() => import('./pages/ai-advisors/VetProAdvisors'))

// Marketplace
const MarketplaceHome   = lazy(() => import('./pages/marketplace/MarketplaceHome'))
const Properties        = lazy(() => import('./pages/marketplace/Properties'))
const PropertyDetail    = lazy(() => import('./pages/marketplace/PropertyDetail'))
const ListProperty      = lazy(() => import('./pages/marketplace/ListProperty'))

// Auth
const Login             = lazy(() => import('./pages/auth/Login'))
const Register          = lazy(() => import('./pages/auth/Register'))
const VerificationHub   = lazy(() => import('./pages/auth/VerificationHub'))
const BiometricVerify   = lazy(() => import('./pages/auth/BiometricVerification'))

// User
const Dashboard         = lazy(() => import('./pages/user/Dashboard'))

// Transactions
const EscrowCheckout    = lazy(() => import('./pages/transaction/EscrowCheckout'))
const MultiSigViz       = lazy(() => import('./pages/transaction/MultiSigVisualization'))
const SecureChat        = lazy(() => import('./pages/transaction/SecureChat'))
const TransactionReceipt = lazy(() => import('./pages/transaction/TransactionReceipt'))
const SuccessPage       = lazy(() => import('./pages/transaction/SuccessPage'))

// Dashboards
const AgentDashboard    = lazy(() => import('./pages/dashboards/AgentDashboard'))
const InvestorDashboard = lazy(() => import('./pages/dashboards/InvestorDashboard'))
const Analytics         = lazy(() => import('./pages/dashboards/MarketplaceAnalytics'))

// Admin
const AdminLogin        = lazy(() => import('./pages/admin/AdminLogin'))
const AdminDashboard    = lazy(() => import('./pages/admin/AdminDashboard'))

// Compliance
const ComplianceHub     = lazy(() => import('./pages/compliance/ComplianceHub'))
const DisputeResolution = lazy(() => import('./pages/management/DisputeResolution'))
const AdminFraudHub     = lazy(() => import('./pages/management/AdminFraudHub'))

// Legal
const Terms             = lazy(() => import('./pages/legal/Terms'))
const Privacy           = lazy(() => import('./pages/legal/Privacy'))
const EscrowPolicy      = lazy(() => import('./pages/legal/EscrowPolicy'))

// Utility
const LowDataMode       = lazy(() => import('./pages/management/LowDataMode'))

const Soon = ({ name }: { name: string }) => (
  <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'Inter,sans-serif', background:'#f8fafc' }}>
    <div style={{ fontSize:'3rem' }}>🏠</div>
    <h1 style={{ color:'#1e3a5f' }}>VeriProp Nigeria</h1>
    <p style={{ color:'#64748b', marginBottom:'2rem' }}>{name} — Coming Soon</p>
    <a href="/" style={{ color:'#1d4ed8', fontWeight:700, textDecoration:'none' }}>← Back to Home</a>
  </div>
)

const Loader = () => (
  <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#1e3a5f' }}>
    <div style={{ textAlign:'center', color:'#fff' }}>
      <div style={{ fontSize:'3rem' }}>🏠</div>
      <p style={{ marginTop:'0.5rem', color:'rgba(255,255,255,0.6)' }}>VeriProp Nigeria</p>
    </div>
  </div>
)

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Root: smart routing — onboarding for new, marketplace for returning */}
            <Route path="/"                     element={<RootPage />} />
            <Route path="/welcome"              element={<UnifiedOnboarding />} />
            <Route path="/onboarding"           element={<UnifiedOnboarding />} />
            <Route path="/properties"           element={<Properties />} />
            <Route path="/properties/:id"       element={<PropertyDetail />} />
            <Route path="/list-property"        element={<ListProperty />} />

            {/* Auth */}
            <Route path="/login"                element={<Login />} />
            <Route path="/register"             element={<Register />} />
            <Route path="/verify"               element={<VerificationHub />} />
            <Route path="/verify/biometric"     element={<BiometricVerify />} />

            {/* User */}
            <Route path="/dashboard"            element={<Dashboard />} />
            <Route path="/portfolio"            element={<Soon name="Portfolio" />} />

            {/* Transactions */}
            <Route path="/escrow/checkout"      element={<EscrowCheckout />} />
            <Route path="/escrow/multisig"      element={<MultiSigViz />} />
            <Route path="/chat/:roomId"         element={<SecureChat />} />
            <Route path="/transaction/receipt"  element={<TransactionReceipt />} />
            <Route path="/success"              element={<SuccessPage />} />
            <Route path="/payment/callback"     element={<Navigate to="/success" replace />} />

            {/* Role Dashboards */}
            <Route path="/agent/dashboard"      element={<AgentDashboard />} />
            <Route path="/investor/dashboard"   element={<InvestorDashboard />} />
            <Route path="/analytics"            element={<Analytics />} />

            {/* Admin Portal */}
            <Route path="/admin/login"          element={<AdminLogin />} />
            <Route path="/admin/dashboard"      element={<AdminDashboard />} />

            {/* Compliance & Admin */}
            <Route path="/compliance"           element={<ComplianceHub />} />
            <Route path="/admin/disputes"       element={<DisputeResolution />} />
            <Route path="/admin/fraud"          element={<AdminFraudHub />} />
            <Route path="/admin/*"              element={<Soon name="Admin Panel" />} />

            {/* Legal */}
            <Route path="/legal/terms"          element={<Terms />} />
            <Route path="/legal/privacy"        element={<Privacy />} />
            <Route path="/legal/escrow"         element={<EscrowPolicy />} />

            {/* Utility */}
            <Route path="/low-data"             element={<LowDataMode />} />

            {/* Monetization */}
            <Route path="/pricing"              element={<PricingPlans />} />
            <Route path="/boost"                element={<BoostProperty />} />
            <Route path="/advertise"            element={<PricingPlans />} />

            {/* Map */}
            <Route path="/map"                  element={<MapSearchView />} />

            {/* AI Advisors */}
            <Route path="/ai/market"            element={<MarketIntelligence />} />
            <Route path="/ai/advisor"           element={<VetProAdvisors />} />

            {/* Catch all */}
            <Route path="*"                     element={<Soon name="Page Not Found" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
