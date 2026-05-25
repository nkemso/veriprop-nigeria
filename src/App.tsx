import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'

const MarketplaceHome = lazy(() => import('./pages/marketplace/MarketplaceHome'))
const VerificationHub = lazy(() => import('./pages/auth/VerificationHub'))
const LowDataMode = lazy(() => import('./pages/management/LowDataMode'))

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
      <p style={{ marginTop:'1rem' }}>VeriProp Nigeria</p>
    </div>
  </div>
)

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/" element={<MarketplaceHome />} />
            <Route path="/verify" element={<VerificationHub />} />
            <Route path="/low-data" element={<LowDataMode />} />
            <Route path="/login" element={<Soon name="Login" />} />
            <Route path="/register" element={<Soon name="Register" />} />
            <Route path="/dashboard" element={<Soon name="Dashboard" />} />
            <Route path="/properties" element={<Soon name="Properties" />} />
            <Route path="/properties/:id" element={<Soon name="Property Detail" />} />
            <Route path="/list-property" element={<Soon name="List Property" />} />
            <Route path="/portfolio" element={<Soon name="Portfolio" />} />
            <Route path="/admin/*" element={<Soon name="Admin" />} />
            <Route path="/success" element={<Soon name="Transaction Complete" />} />
            <Route path="/payment/callback" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Soon name="Page Not Found" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
