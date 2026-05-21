import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';

// ─── Lazy-loaded pages ───────────────────────────────────────
// Auth & Identity
const VerificationHub    = lazy(() => import('./pages/auth/VerificationHub'));
const Login              = lazy(() => import('./pages/auth/Login'));
const Register           = lazy(() => import('./pages/auth/Register'));

// Marketplace
const MarketplaceHome    = lazy(() => import('./pages/marketplace/MarketplaceHome'));
const Properties         = lazy(() => import('./pages/marketplace/Properties'));
const PropertyDetail     = lazy(() => import('./pages/marketplace/PropertyDetail'));
const MapSearch          = lazy(() => import('./pages/marketplace/MapSearch'));
const SearchFilters      = lazy(() => import('./pages/marketplace/SearchFilters'));
const ListProperty       = lazy(() => import('./pages/marketplace/ListProperty'));

// Transactions
const EscrowPaymentPage  = lazy(() => import('./pages/transaction/EscrowPaymentPage'));
const MultiSigPage       = lazy(() => import('./pages/transaction/MultiSigPage'));
const SecureChatPage     = lazy(() => import('./pages/transaction/SecureChatPage'));
const DeedSigningPage    = lazy(() => import('./pages/transaction/DeedSigningPage'));
const SuccessPage        = lazy(() => import('./pages/transaction/SuccessPage'));

// User
const Dashboard          = lazy(() => import('./pages/user/Dashboard'));
const Profile            = lazy(() => import('./pages/user/Profile'));
const Portfolio          = lazy(() => import('./pages/user/Portfolio'));

// Admin & Management
const AdminFraudHub      = lazy(() => import('./pages/management/AdminFraudHub'));
const AnalyticsDashboard = lazy(() => import('./pages/management/AnalyticsDashboard'));
const DisputeResolution  = lazy(() => import('./pages/management/DisputeResolution'));
const ComplianceCenter   = lazy(() => import('./pages/management/ComplianceCenter'));
const LowDataMode        = lazy(() => import('./pages/management/LowDataMode'));

// ─── Loader ──────────────────────────────────────────────────
const Loader = () => (
  <div style={{
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', gap: '1rem', background: '#f8fafc', fontFamily: 'Inter, sans-serif',
  }}>
    <div style={{ fontSize: '2.5rem' }}>🏠</div>
    <div style={{
      width: 40, height: 40, border: '3px solid #e2e8f0', borderTop: '3px solid #1d4ed8',
      borderRadius: '50%', animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>VeriPro Nigeria</p>
  </div>
);

// ─── Placeholder for pages not yet built ─────────────────────
const Placeholder = ({ name }: { name: string }) => (
  <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', flexDirection: 'column', gap: '1rem' }}>
    <div style={{ fontSize: '3rem' }}>🚧</div>
    <h2 style={{ color: '#1e3a5f' }}>{name}</h2>
    <p style={{ color: '#64748b' }}>This screen is being built.</p>
    <a href="/" style={{ color: '#1d4ed8' }}>← Back Home</a>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<Loader />}>
          <Routes>
            {/* Public */}
            <Route path="/"                    element={<MarketplaceHome />} />
            <Route path="/properties"          element={<Placeholder name="Property Listings" />} />
            <Route path="/properties/:id"      element={<Placeholder name="Property Detail" />} />
            <Route path="/map"                 element={<Placeholder name="Map Search" />} />
            <Route path="/search"              element={<Placeholder name="Search Filters" />} />
            <Route path="/low-data"            element={<LowDataMode />} />

            {/* Auth */}
            <Route path="/login"               element={<Placeholder name="Login" />} />
            <Route path="/register"            element={<Placeholder name="Register" />} />
            <Route path="/verify"              element={<VerificationHub />} />

            {/* User */}
            <Route path="/dashboard"           element={<Placeholder name="Dashboard" />} />
            <Route path="/profile"             element={<Placeholder name="Profile" />} />
            <Route path="/portfolio"           element={<Placeholder name="Portfolio" />} />
            <Route path="/list-property"       element={<Placeholder name="List Property" />} />

            {/* Transactions */}
            <Route path="/escrow/:propertyId"  element={<Placeholder name="Escrow Payment" />} />
            <Route path="/multisig/:escrowId"  element={<Placeholder name="Multi-Sig Protocol" />} />
            <Route path="/chat/:roomId"        element={<Placeholder name="Secure Chat" />} />
            <Route path="/deed/:txId"          element={<Placeholder name="Deed Signing" />} />
            <Route path="/success"             element={<SuccessPage />} />
            <Route path="/payment/callback"    element={<Navigate to="/success" replace />} />

            {/* Admin */}
            <Route path="/admin"               element={<AnalyticsDashboard />} />
            <Route path="/admin/fraud"         element={<AdminFraudHub />} />
            <Route path="/admin/disputes"      element={<DisputeResolution />} />
            <Route path="/admin/compliance"    element={<Placeholder name="Compliance Center" />} />

            {/* 404 */}
            <Route path="*" element={
              <div style={{ textAlign: 'center', padding: '4rem', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🏠</div>
                <h1 style={{ fontSize: '4rem', color: '#1d4ed8', margin: 0 }}>404</h1>
                <p style={{ color: '#64748b', fontSize: '1.125rem', marginBottom: '1.5rem' }}>Page not found</p>
                <a href="/" style={{ color: '#1d4ed8', textDecoration: 'none', fontWeight: 700 }}>← Back to VeriProp</a>
              </div>
            } />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}
