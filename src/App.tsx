import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'

const MarketplaceHome  = lazy(() => import('./pages/marketplace/MarketplaceHome'))
const Properties       = lazy(() => import('./pages/marketplace/Properties'))
const PropertyDetail   = lazy(() => import('./pages/marketplace/PropertyDetail'))
const ListProperty     = lazy(() => import('./pages/marketplace/ListProperty'))
const Login            = lazy(() => import('./pages/auth/Login'))
const Register         = lazy(() => import('./pages/auth/Register'))
const VerificationHub  = lazy(() => import('./pages/auth/VerificationHub'))
const Dashboard        = lazy(() => import('./pages/user/Dashboard'))
const LowDataMode      = lazy(() => import('./pages/management/LowDataMode'))
const SuccessPage      = lazy(() => import('./pages/transaction/SuccessPage'))
const Terms            = lazy(() => import('./pages/legal/Terms'))
const Privacy          = lazy(() => import('./pages/legal/Privacy'))
const EscrowPolicy     = lazy(() => import('./pages/legal/EscrowPolicy'))

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
      <p>VeriProp Nigeria</p>
    </div>
  </div>
)

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Main */}
            <Route path="/"                  element={<MarketplaceHome />} />
            <Route path="/properties"        element={<Properties />} />
            <Route path="/properties/:id"    element={<PropertyDetail />} />
            <Route path="/list-property"     element={<ListProperty />} />

            {/* Auth */}
            <Route path="/login"             element={<Login />} />
            <Route path="/register"          element={<Register />} />
            <Route path="/verify"            element={<VerificationHub />} />

            {/* User */}
            <Route path="/dashboard"         element={<Dashboard />} />
            <Route path="/portfolio"         element={<Soon name="Portfolio" />} />

            {/* Legal */}
            <Route path="/legal/terms"       element={<Terms />} />
            <Route path="/legal/privacy"     element={<Privacy />} />
            <Route path="/legal/escrow"      element={<EscrowPolicy />} />

            {/* Utility */}
            <Route path="/low-data"          element={<LowDataMode />} />
            <Route path="/success"           element={<SuccessPage />} />
            <Route path="/admin/*"           element={<Soon name="Admin Dashboard" />} />
            <Route path="/payment/callback"  element={<Navigate to="/" replace />} />
            <Route path="*"                  element={<Soon name="Page Not Found" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
