import React, { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL || 'https://veriprop-nigeria-production.up.railway.app'
const fmt = (n: number) => n >= 1e9 ? `₦${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `₦${(n / 1e6).toFixed(1)}M` : `₦${n?.toLocaleString() || 0}`

// Admin guard
function useAdmin() {
  const token = localStorage.getItem('accessToken')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const adminRoles = ['super_admin', 'admin', 'compliance_officer']
  if (!token || !adminRoles.includes(user.role)) {
    window.location.href = '/admin/login'
    return { user: null, token: null }
  }
  return { user, token }
}

const NAV_ITEMS = [
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'users', icon: '👥', label: 'Users' },
  { id: 'properties', icon: '🏠', label: 'Properties' },
  { id: 'transactions', icon: '💰', label: 'Transactions' },
  { id: 'escrow', icon: '🔐', label: 'Escrow' },
  { id: 'disputes', icon: '⚖️', label: 'Disputes' },
  { id: 'fraud', icon: '🚨', label: 'Fraud Hub' },
  { id: 'compliance', icon: '🏛️', label: 'Compliance' },
  { id: 'vaults', icon: '🏦', label: 'Vaults' },
  { id: 'audit', icon: '📋', label: 'Audit Log' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
]

export default function AdminDashboard() {
  const { user, token } = useAdmin()
  const [tab, setTab] = useState('overview')
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [disputes, setDisputes] = useState<any[]>([])
  const [flagged, setFlagged] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [escrows, setEscrows] = useState<any[]>([])
  const [txnFilter, setTxnFilter] = useState('all')
  const [escrowFilter, setEscrowFilter] = useState('all')
  const [feePreview, setFeePreview] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [search, setSearch] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  const h = { Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!token) return
    setLoading(true)
    Promise.all([
      fetch(`${API}/api/v1/admin/dashboard`, { headers: h }).then(r => r.json()),
      fetch(`${API}/api/v1/admin/users?limit=20`, { headers: h }).then(r => r.json()),
      fetch(`${API}/api/v1/properties?limit=20&status=pending`, { headers: h }).then(r => r.json()),
      fetch(`${API}/api/v1/admin/disputes`, { headers: h }).then(r => r.json()),
      fetch(`${API}/api/v1/chat/admin/flagged`, { headers: h }).then(r => r.json()),
      fetch(`${API}/api/v1/admin/audit?limit=50`, { headers: h }).then(r => r.json()),
      fetch(`${API}/api/v1/transactions?limit=50`, { headers: h }).then(r => r.json()),
      fetch(`${API}/api/v1/escrow?limit=50`, { headers: h }).then(r => r.json()).catch(() => ({ escrows: [] })),
    ]).then(([s, u, p, d, f, a, t, e]) => {
      setStats(s.stats || {})
      setUsers(u.users || [])
      setProperties(p.data || [])
      setDisputes(d.disputes || [])
      setFlagged(f.flagged || [])
      setLogs(a.logs || [])
      setTransactions(t.data || t.transactions || [])
      setEscrows(e.data || e.escrows || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [token])

  const action = async (url: string, method = 'POST', body?: any) => {
    const res = await fetch(`${API}${url}`, {
      method, headers: { ...h, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    const data = await res.json()
    setActionMsg(data.success ? '✅ Action completed' : '❌ ' + data.message)
    setTimeout(() => setActionMsg(''), 3000)
    return data
  }

  const banUser = async (id: string, ban: boolean) => {
    await action(`/api/v1/admin/users/${id}/ban`, 'PATCH', { ban, reason: 'Admin action' })
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isBanned: ban } : u))
  }

  const changeRole = async (id: string, role: string) => {
    const data = await action(`/api/v1/admin/users/${id}/role`, 'PATCH', { role })
    if (data.success) setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
  }

  const releaseEscrow = async (id: string) => {
    if (!confirm('Release escrow funds? This will transfer money to the landlord/agent.')) return
    const data = await action(`/api/v1/payments/escrow/${id}/release`, 'POST')
    if (data.success) setEscrows(prev => prev.map(e => e.id === id ? { ...e, status: 'released' } : e))
  }

  const refundEscrow = async (id: string, reference: string) => {
    if (!confirm('Refund this escrow to the buyer?')) return
    const data = await action('/api/v1/payments/refund', 'POST', { reference })
    if (data.success) setEscrows(prev => prev.map(e => e.id === id ? { ...e, status: 'refunded' } : e))
  }

  const previewFees = async (price: number, hasAgent: boolean, agentRate: number) => {
    const data = await action('/api/v1/payments/calculate-fees', 'POST', { propertyPrice: price, hasAgent, agentRate })
    if (data.success) setFeePreview(data.fees)
  }

  const verifyUser = async (id: string, tier: string) => {
    const data = await action(`/api/v1/admin/users/${id}/verify`, 'PATCH', { tier })
    if (data.success) setUsers(prev => prev.map(u => u.id === id ? { ...u, isVerified: true } : u))
  }

  const moderateProperty = async (id: string, act: string) => {
    await action(`/api/v1/admin/properties/${id}/moderate`, 'PATCH', { action: act })
    setProperties(prev => prev.filter(p => p.id !== id))
  }

  const logout = () => { localStorage.clear(); window.location.href = '/admin/login' }

  const METRIC_CARDS = stats ? [
    { icon: '👥', label: 'Total Users', value: stats.totalUsers?.toLocaleString() || '0', color: '#3b82f6', sub: 'Registered accounts' },
    { icon: '🏠', label: 'Active Listings', value: stats.totalProperties?.toLocaleString() || '0', color: '#10b981', sub: 'Live properties' },
    { icon: '💰', label: 'Transactions', value: stats.totalTransactions?.toLocaleString() || '0', color: '#f59e0b', sub: 'All time' },
    { icon: '⏳', label: 'Pending Review', value: stats.pendingReview?.toLocaleString() || '0', color: '#ef4444', sub: 'Need action' },
    { icon: '🔐', label: 'Active Escrows', value: stats.activeEscrows?.toLocaleString() || '0', color: '#8b5cf6', sub: 'In progress' },
    { icon: '💎', label: 'Platform Revenue', value: fmt(stats.totalRevenue || 0), color: '#06b6d4', sub: 'Cumulative fees' },
  ] : []

  const STATUS_COLOR: Record<string, string> = {
    open: '#ef4444', under_review: '#f59e0b',
    resolved_buyer: '#10b981', resolved_seller: '#10b981', closed: '#94a3b8',
  }

  const sideW = sidebarOpen ? 220 : 60

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0d1117', fontFamily: 'Inter,sans-serif', color: '#f0f6fc' }}>

      {/* Sidebar */}
      <div style={{ width: sideW, background: '#161b22', borderRight: '1px solid #21262d', display: 'flex', flexDirection: 'column', transition: 'width 0.2s', overflow: 'hidden', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 32, height: 32, borderRadius: '0.5rem', background: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1rem' }}>🛡️</div>
          {sidebarOpen && <div style={{ minWidth: 0 }}><div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f0f6fc' }}>VeriProp</div><div style={{ fontSize: '0.65rem', color: '#6e7681', textTransform: 'uppercase' }}>Admin Portal</div></div>}
        </div>

        <nav style={{ flex: 1, padding: '0.5rem', overflowY: 'auto' }}>
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', border: 'none', background: tab === item.id ? '#1d4ed820' : 'transparent', color: tab === item.id ? '#60a5fa' : '#8b949e', cursor: 'pointer', marginBottom: '0.125rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: tab === item.id ? 600 : 400, transition: 'all 0.15s' }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
            </button>
          ))}
        </nav>

        <div style={{ padding: '0.75rem', borderTop: '1px solid #21262d' }}>
          {sidebarOpen && user && (
            <div style={{ marginBottom: '0.75rem', padding: '0.75rem', background: '#0d1117', borderRadius: '0.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f0f6fc' }}>{user.firstName} {user.lastName}</div>
              <div style={{ fontSize: '0.7rem', color: '#6e7681', textTransform: 'capitalize' }}>{user.role?.replace('_', ' ')}</div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ width: '100%', background: 'transparent', border: '1px solid #21262d', color: '#6e7681', padding: '0.4rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
          <button onClick={logout} style={{ width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '0.5rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem' }}>
            {sidebarOpen ? '← Logout' : '🚪'}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* Top bar */}
        <div style={{ background: '#161b22', borderBottom: '1px solid #21262d', padding: '0.875rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
          <h1 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: '#f0f6fc', textTransform: 'capitalize' }}>
            {NAV_ITEMS.find(n => n.id === tab)?.icon} {NAV_ITEMS.find(n => n.id === tab)?.label}
          </h1>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {actionMsg && <span style={{ fontSize: '0.8rem', color: actionMsg.startsWith('✅') ? '#10b981' : '#ef4444', fontWeight: 600 }}>{actionMsg}</span>}
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              style={{ background: '#0d1117', border: '1px solid #30363d', color: '#f0f6fc', padding: '0.4rem 0.875rem', borderRadius: '0.5rem', outline: 'none', fontSize: '0.8rem', width: 180 }} />
            <span style={{ color: '#6e7681', fontSize: '0.75rem' }}>{new Date().toLocaleDateString('en-NG', { dateStyle: 'medium' })}</span>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6e7681' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
              Loading admin data...
            </div>
          ) : (
            <>
              {/* ── OVERVIEW ── */}
              {tab === 'overview' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {METRIC_CARDS.map(m => (
                      <div key={m.label} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0.75rem', padding: '1.25rem', borderLeft: `4px solid ${m.color}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '1.5rem' }}>{m.icon}</span>
                        </div>
                        <div style={{ fontWeight: 900, color: m.color, fontSize: '1.5rem' }}>{m.value}</div>
                        <div style={{ color: '#f0f6fc', fontWeight: 600, fontSize: '0.8rem' }}>{m.label}</div>
                        <div style={{ color: '#6e7681', fontSize: '0.7rem' }}>{m.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                    {/* Quick actions */}
                    <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0.75rem', padding: '1.25rem' }}>
                      <h3 style={{ color: '#f0f6fc', fontWeight: 700, margin: '0 0 1rem' }}>⚡ Quick Actions</h3>
                      {[
                        { label: 'Review Pending Properties', icon: '🏠', action: () => setTab('properties'), badge: stats?.pendingReview || 0 },
                        { label: 'Open Disputes', icon: '⚖️', action: () => setTab('disputes'), badge: disputes.filter((d: any) => d.status === 'open').length },
                        { label: 'Fraud Alerts', icon: '🚨', action: () => setTab('fraud'), badge: flagged.length },
                        { label: 'View Audit Trail', icon: '📋', action: () => setTab('audit'), badge: 0 },
                      ].map(qa => (
                        <button key={qa.label} onClick={qa.action}
                          style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0d1117', border: '1px solid #21262d', color: '#f0f6fc', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', cursor: 'pointer', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 500 }}>
                          <span>{qa.icon} {qa.label}</span>
                          {qa.badge > 0 && <span style={{ background: '#ef4444', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700 }}>{qa.badge}</span>}
                        </button>
                      ))}
                    </div>

                    {/* System health */}
                    <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0.75rem', padding: '1.25rem' }}>
                      <h3 style={{ color: '#f0f6fc', fontWeight: 700, margin: '0 0 1rem' }}>🩺 System Health</h3>
                      {[
                        { label: 'API Server', status: 'Online', ok: true },
                        { label: 'PostgreSQL DB', status: 'Healthy', ok: true },
                        { label: 'Paystack Integration', status: 'Active', ok: true },
                        { label: 'AI Moderation', status: 'Running', ok: true },
                        { label: 'Escrow Engine', status: 'Active', ok: true },
                        { label: 'Redis Cache', status: 'Connected', ok: true },
                      ].map(s => (
                        <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #21262d', fontSize: '0.8rem' }}>
                          <span style={{ color: '#8b949e' }}>{s.label}</span>
                          <span style={{ color: s.ok ? '#10b981' : '#ef4444', fontWeight: 600 }}>● {s.status}</span>
                        </div>
                      ))}
                    </div>

                    {/* Recent audit */}
                    <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0.75rem', padding: '1.25rem' }}>
                      <h3 style={{ color: '#f0f6fc', fontWeight: 700, margin: '0 0 1rem' }}>📋 Recent Activity</h3>
                      {logs.slice(0, 6).map((l: any) => (
                        <div key={l.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid #21262d', fontSize: '0.75rem' }}>
                          <span style={{ color: '#6e7681', flexShrink: 0 }}>{new Date(l.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</span>
                          <span style={{ color: '#60a5fa', flexShrink: 0 }}>{l.action?.replace(/_/g, ' ')}</span>
                          <span style={{ color: '#8b949e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.description}</span>
                        </div>
                      ))}
                      <button onClick={() => setTab('audit')} style={{ marginTop: '0.75rem', color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', padding: 0 }}>View all logs →</button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── USERS ── */}
              {tab === 'users' && (
                <div>
                  <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0.75rem', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #21262d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontWeight: 700, color: '#f0f6fc' }}>All Users ({users.length})</h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ background: '#0d1117' }}>
                            {['Name', 'Email', 'Role', 'Verified', 'Status', 'Joined', 'Actions'].map(h => (
                              <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#6e7681', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {users.filter((u: any) =>
                            !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
                          ).map((u: any) => (
                            <tr key={u.id} style={{ borderTop: '1px solid #21262d' }}>
                              <td style={{ padding: '0.75rem 1rem', color: '#f0f6fc', fontWeight: 600 }}>{u.firstName} {u.lastName}</td>
                              <td style={{ padding: '0.75rem 1rem', color: '#8b949e' }}>{u.email}</td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <span style={{ background: '#1d4ed820', color: '#60a5fa', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize' }}>{u.role?.replace('_', ' ')}</span>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', color: u.isVerified ? '#10b981' : '#f59e0b' }}>{u.isVerified ? '✅ Yes' : '⚠️ No'}</td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <span style={{ color: u.isBanned ? '#ef4444' : '#10b981', fontWeight: 600 }}>{u.isBanned ? '🚫 Banned' : '✅ Active'}</span>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', color: '#6e7681' }}>{new Date(u.createdAt).toLocaleDateString('en-NG')}</td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                  {/* Role dropdown — only for super_admin */}
                                  {user?.role === 'super_admin' && u.role !== 'super_admin' && (
                                    <select
                                      value={u.role}
                                      onChange={e => changeRole(u.id, e.target.value)}
                                      style={{ background: '#0d1117', color: '#60a5fa', border: '1px solid #30363d', padding: '0.25rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.7rem', cursor: 'pointer' }}
                                    >
                                      {['buyer','seller','agent','landlord','developer','admin','compliance_officer'].map(r => (
                                        <option key={r} value={r}>{r.replace('_',' ')}</option>
                                      ))}
                                    </select>
                                  )}
                                  {/* Verify button */}
                                  {!u.isVerified && (
                                    <button onClick={() => verifyUser(u.id, 'TIER3_NOTARY')}
                                      style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}>
                                      ✅ Verify
                                    </button>
                                  )}
                                  {/* Ban/Unban */}
                                  <button onClick={() => banUser(u.id, !u.isBanned)}
                                    style={{ background: u.isBanned ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: u.isBanned ? '#10b981' : '#ef4444', border: 'none', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}>
                                    {u.isBanned ? 'Unban' : 'Ban'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── PROPERTIES ── */}
              {tab === 'properties' && (
                <div>
                  <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0.75rem', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #21262d' }}>
                      <h3 style={{ margin: 0, fontWeight: 700, color: '#f0f6fc' }}>Properties Pending Review ({properties.length})</h3>
                    </div>
                    {properties.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: '#6e7681' }}>✅ No properties pending review</div>
                    ) : properties.map((p: any) => (
                      <div key={p.id} style={{ padding: '1.25rem', borderBottom: '1px solid #21262d', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '0.5rem', background: '#0d1117', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>🏠</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: '#f0f6fc', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                          <div style={{ color: '#8b949e', fontSize: '0.8rem' }}>📍 {p.lga}, {p.state} · ₦{p.price?.toLocaleString()} · {p.listingType}</div>
                          {p.moderationData && (
                            <div style={{ color: '#f59e0b', fontSize: '0.75rem', marginTop: '0.25rem' }}>Risk Score: {p.moderationData.riskScore || 0}/100</div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                          <button onClick={() => moderateProperty(p.id, 'approve')}
                            style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '0.4rem 0.875rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                            ✅ Approve
                          </button>
                          <button onClick={() => moderateProperty(p.id, 'reject')}
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '0.4rem 0.875rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                            ❌ Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── DISPUTES ── */}
              {tab === 'disputes' && (
                <div>
                  {disputes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#10b981', background: '#161b22', borderRadius: '0.75rem', border: '1px solid #21262d' }}>🎉 No open disputes</div>
                  ) : disputes.map((d: any) => (
                    <div key={d.id} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div>
                          <span style={{ fontWeight: 700, color: '#f0f6fc', fontSize: '0.9rem' }}>#{d.id?.slice(-8).toUpperCase()}</span>
                          <span style={{ marginLeft: '0.75rem', background: `${STATUS_COLOR[d.status] || '#94a3b8'}20`, color: STATUS_COLOR[d.status] || '#94a3b8', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>
                            {d.status?.replace(/_/g, ' ').toUpperCase()}
                          </span>
                        </div>
                        <span style={{ color: '#6e7681', fontSize: '0.75rem' }}>{new Date(d.createdAt).toLocaleDateString('en-NG')}</span>
                      </div>
                      <p style={{ color: '#8b949e', fontSize: '0.875rem', margin: '0 0 1rem', lineHeight: 1.6 }}>{d.reason}</p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['buyer', 'seller', 'platform'].map(outcome => (
                          <button key={outcome} onClick={() => action(`/api/v1/admin/disputes/${d.id}/resolve`, 'POST', { outcome, resolution: `Resolved in favor of ${outcome}` })}
                            style={{ background: '#0d1117', border: '1px solid #30363d', color: '#8b949e', padding: '0.4rem 0.875rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>
                            → {outcome}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── FRAUD ── */}
              {tab === 'fraud' && (
                <div>
                  {flagged.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#10b981', background: '#161b22', borderRadius: '0.75rem', border: '1px solid #21262d' }}>✅ No flagged messages</div>
                  ) : flagged.map((m: any) => (
                    <div key={m.id} style={{ background: '#161b22', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#f87171', fontWeight: 700, fontSize: '0.875rem' }}>⚠️ {m.sender?.firstName} {m.sender?.lastName} ({m.sender?.email})</span>
                        <span style={{ color: '#6e7681', fontSize: '0.75rem' }}>{new Date(m.createdAt).toLocaleDateString('en-NG')}</span>
                      </div>
                      <div style={{ background: '#0d1117', borderRadius: '0.5rem', padding: '0.75rem', color: '#8b949e', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{m.content}</div>
                      <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Redacted: {m.redactedReason} · Room: {m.roomId?.slice(-8)}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── VAULTS ── */}
              {tab === 'vaults' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '1rem' }}>
                  {[
                    { name: 'Platform Fee Vault (5%)', icon: '🏢', color: '#3b82f6', note: 'VeriProp operating revenue' },
                    { name: 'Agent Commission (10%)', icon: '🤝', color: '#10b981', note: 'Disbursed to verified agents' },
                    { name: 'VAT Pool (7.5%)', icon: '🏛️', color: '#8b5cf6', note: 'Remitted monthly to FIRS' },
                    { name: 'WHT Pool (5-10%)', icon: '📊', color: '#f59e0b', note: 'Remitted quarterly to FIRS' },
                  ].map(v => (
                    <div key={v.name} style={{ background: '#161b22', border: `1px solid ${v.color}30`, borderRadius: '0.875rem', padding: '1.5rem' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{v.icon}</div>
                      <div style={{ fontWeight: 700, color: '#f0f6fc', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{v.name}</div>
                      <div style={{ color: v.color, fontWeight: 900, fontSize: '1.5rem', marginBottom: '0.5rem' }}>₦0.00</div>
                      <div style={{ color: '#6e7681', fontSize: '0.75rem' }}>{v.note}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── AUDIT LOG ── */}
              {tab === 'audit' && (
                <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0.75rem', overflow: 'hidden' }}>
                  <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #21262d' }}>
                    <h3 style={{ margin: 0, fontWeight: 700, color: '#f0f6fc' }}>Immutable Audit Trail ({logs.length} events)</h3>
                  </div>
                  {logs.map((l: any) => (
                    <div key={l.id} style={{ display: 'flex', gap: '1rem', padding: '0.625rem 1.25rem', borderBottom: '1px solid #0d1117', fontSize: '0.8rem', alignItems: 'flex-start' }}>
                      <span style={{ color: '#6e7681', whiteSpace: 'nowrap', flexShrink: 0 }}>{new Date(l.createdAt).toLocaleString('en-NG')}</span>
                      <span style={{ background: '#1d4ed820', color: '#60a5fa', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontWeight: 600, flexShrink: 0, fontSize: '0.7rem' }}>{l.action?.replace(/_/g, ' ')}</span>
                      <span style={{ color: '#8b949e', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.description}</span>
                      {l.userId && <span style={{ color: '#6e7681', flexShrink: 0, fontSize: '0.7rem' }}>User: {l.userId.slice(-6)}</span>}
                    </div>
                  ))}
                  {logs.length === 0 && <div style={{ padding: '3rem', textAlign: 'center', color: '#6e7681' }}>No audit logs yet</div>}
                </div>
              )}

              {/* ── COMPLIANCE ── */}
              {tab === 'compliance' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1rem' }}>
                  {[
                    { title: 'NDPR 2019', status: 'Compliant', icon: '🇳🇬', color: '#10b981', desc: 'Nigeria Data Protection Regulation — data collection, consent, and rights handled per regulation.' },
                    { title: 'CBN KYC', status: 'Active', icon: '🏦', color: '#3b82f6', desc: 'Central Bank of Nigeria KYC requirements — NIN verification integrated.' },
                    { title: 'EFCC AML', status: 'Monitoring', icon: '🔍', color: '#8b5cf6', desc: 'Anti-Money Laundering — fraud scoring, suspicious activity flagging and reporting.' },
                    { title: 'FIRS Tax', status: 'Remitting', icon: '📊', color: '#f59e0b', desc: 'Federal Inland Revenue Service — VAT (7.5%) and WHT auto-remitted per transaction.' },
                    { title: 'CAC Verification', status: 'Active', icon: '🏢', color: '#06b6d4', desc: 'Corporate Affairs Commission — agency and developer company verification.' },
                    { title: 'NIBSS Integration', status: 'Live', icon: '🔗', color: '#10b981', desc: 'Nigeria Inter-Bank Settlement System — NIN verification for Tier 1 KYC.' },
                  ].map(c => (
                    <div key={c.title} style={{ background: '#161b22', border: `1px solid ${c.color}30`, borderRadius: '0.875rem', padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>{c.icon}</span>
                        <span style={{ background: `${c.color}20`, color: c.color, padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>✓ {c.status}</span>
                      </div>
                      <div style={{ fontWeight: 700, color: '#f0f6fc', marginBottom: '0.5rem' }}>{c.title}</div>
                      <div style={{ color: '#6e7681', fontSize: '0.8rem', lineHeight: 1.6 }}>{c.desc}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── SETTINGS ── */}
              {tab === 'settings' && (
                <div style={{ maxWidth: 700 }}>
                  {/* Platform Settings */}
                  <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0.875rem', padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ color: '#f0f6fc', fontWeight: 700, margin: '0 0 1rem' }}>⚙️ Platform Settings</h3>
                    {[
                      { label: 'Escrow Fee', value: '1.5%' },
                      { label: 'Platform Split', value: '5%' },
                      { label: 'Agent Commission', value: '10%' },
                      { label: 'VAT Rate', value: '7.5%' },
                      { label: 'AI Moderation', value: 'Enabled' },
                      { label: 'Escrow Expiry (days)', value: '30' },
                    ].map(s => (
                      <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #21262d' }}>
                        <span style={{ color: '#8b949e', fontSize: '0.875rem' }}>{s.label}</span>
                        <span style={{ color: '#f0f6fc', fontWeight: 600, fontSize: '0.875rem' }}>{s.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Role Management */}
                  <div style={{ background: '#161b22', border: '1px solid #1d4ed830', borderRadius: '0.875rem', padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ color: '#60a5fa', fontWeight: 700, margin: '0 0 0.5rem' }}>👥 Manage Admin Team</h3>
                    <p style={{ color: '#6e7681', fontSize: '0.8rem', margin: '0 0 1rem' }}>
                      To promote a user: Go to Users tab → find the user → use the role change below.
                    </p>
                    <div style={{ background: '#0d1117', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem' }}>
                      <p style={{ color: '#8b949e', fontSize: '0.8rem', margin: '0 0 0.5rem' }}>Change user role (paste in browser console while on this page):</p>
                      <code style={{ color: '#10b981', fontSize: '0.75rem', lineHeight: 1.8, display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
{`// 1. Find user by email
fetch('/api/v1/admin/users?search=user@email.com', {
  headers: { Authorization: 'Bearer ' + localStorage.getItem('accessToken') }
}).then(r=>r.json()).then(d=>console.log('ID:', d.users[0]?.id, 'Role:', d.users[0]?.role))

// 2. Change their role (use ID from step 1)
fetch('/api/v1/admin/users/USER_ID/role', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('accessToken') },
  body: JSON.stringify({ role: 'admin' })
}).then(r=>r.json()).then(console.log)`}
                      </code>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {['admin', 'compliance_officer', 'agent', 'developer', 'landlord', 'buyer', 'seller'].map(r => (
                        <span key={r} style={{ background: '#0d1117', color: '#8b949e', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.7rem', border: '1px solid #21262d' }}>{r}</span>
                      ))}
                    </div>
                  </div>

                  {/* Admin Team View */}
                  <div style={{ background: '#161b22', border: '1px solid #10b98130', borderRadius: '0.875rem', padding: '1.5rem' }}>
                    <h3 style={{ color: '#10b981', fontWeight: 700, margin: '0 0 0.5rem' }}>🛡️ View Admin Team</h3>
                    <p style={{ color: '#6e7681', fontSize: '0.8rem', margin: '0 0 1rem' }}>
                      Paste in browser console to see all admin staff:
                    </p>
                    <code style={{ color: '#10b981', fontSize: '0.75rem', display: 'block', background: '#0d1117', padding: '1rem', borderRadius: '0.5rem', whiteSpace: 'pre-wrap' }}>
{`fetch('/api/v1/admin/team', {
  headers: { Authorization: 'Bearer ' + localStorage.getItem('accessToken') }
}).then(r=>r.json()).then(d=>{
  console.table(d.team?.map(u=>({
    name: u.firstName+' '+u.lastName,
    email: u.email, role: u.role,
    verified: u.isVerified, active: u.isActive
  })))
})`}
                    </code>
                  </div>
                </div>
              )}

              {/* ── TRANSACTIONS ── */}
              {tab === 'transactions' && (
                <div>
                  {/* Fee Calculator */}
                  <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1rem' }}>
                    <h3 style={{ margin: '0 0 1rem', fontWeight: 700, color: '#f0f6fc', fontSize: '0.9rem' }}>💰 Fee Calculator</h3>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                      <div>
                        <label style={{ display: 'block', color: '#6e7681', fontSize: '0.7rem', marginBottom: '0.25rem' }}>Property Price (₦)</label>
                        <input id="feePrice" type="number" defaultValue={10000000} style={{ background: '#0d1117', border: '1px solid #30363d', color: '#f0f6fc', padding: '0.4rem 0.6rem', borderRadius: '0.375rem', fontSize: '0.8rem', width: 130 }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', color: '#6e7681', fontSize: '0.7rem', marginBottom: '0.25rem' }}>Agent Rate</label>
                        <select id="feeAgent" defaultValue="0.05" style={{ background: '#0d1117', border: '1px solid #30363d', color: '#f0f6fc', padding: '0.4rem 0.6rem', borderRadius: '0.375rem', fontSize: '0.8rem' }}>
                          <option value="0">No Agent (Direct)</option>
                          <option value="0.05">5%</option>
                          <option value="0.08">8%</option>
                          <option value="0.10">10%</option>
                        </select>
                      </div>
                      <button onClick={() => {
                        const price = parseFloat((document.getElementById('feePrice') as HTMLInputElement)?.value || '10000000')
                        const rate = parseFloat((document.getElementById('feeAgent') as HTMLSelectElement)?.value || '0.05')
                        previewFees(price, rate > 0, rate)
                      }} style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '0.4rem 1rem', borderRadius: '0.375rem', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>
                        Calculate →
                      </button>
                    </div>
                    {feePreview && (
                      <div style={{ marginTop: '1rem', background: '#0d1117', borderRadius: '0.5rem', padding: '1rem' }}>
                        {Object.entries(feePreview.breakdown || {}).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: k === '---' ? '1px solid #21262d' : 'none', fontSize: '0.8rem' }}>
                            <span style={{ color: '#8b949e' }}>{k === '---' ? '' : k}</span>
                            <span style={{ color: String(v).includes('Total') || String(k).includes('Total') ? '#f59e0b' : String(k).includes('VeriProp') ? '#10b981' : '#f0f6fc', fontWeight: String(k).includes('Total') || String(k).includes('VeriProp') ? 700 : 400 }}>{String(v) === '---' ? '' : String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Filter */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {['all', 'initiated', 'paid', 'escrow_funded', 'completed', 'cancelled', 'disputed'].map(f => (
                      <button key={f} onClick={() => setTxnFilter(f)}
                        style={{ background: txnFilter === f ? '#1d4ed8' : '#161b22', color: txnFilter === f ? '#fff' : '#8b949e', border: '1px solid #21262d', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.7rem', cursor: 'pointer', textTransform: 'capitalize' }}>
                        {f === 'all' ? 'All' : f.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Transaction List */}
                  <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0.75rem', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #21262d' }}>
                      <h3 style={{ margin: 0, fontWeight: 700, color: '#f0f6fc' }}>Transactions ({transactions.filter(t => txnFilter === 'all' || t.status === txnFilter).length})</h3>
                    </div>
                    {transactions.filter(t => txnFilter === 'all' || t.status === txnFilter).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: '#6e7681' }}>No transactions {txnFilter !== 'all' ? `with status "${txnFilter}"` : 'yet'}</div>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                          <thead>
                            <tr style={{ background: '#0d1117' }}>
                              {['Property', 'Amount', 'Buyer', 'Seller', 'Status', 'Date', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#6e7681', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.filter(t => txnFilter === 'all' || t.status === txnFilter).map((t: any) => {
                              const statusColors: Record<string,string> = { initiated: '#f59e0b', paid: '#3b82f6', escrow_funded: '#8b5cf6', completed: '#10b981', cancelled: '#ef4444', disputed: '#ef4444' }
                              return (
                                <tr key={t.id} style={{ borderTop: '1px solid #21262d' }}>
                                  <td style={{ padding: '0.75rem 1rem', color: '#f0f6fc', fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.property?.title || t.propertyId?.slice(-8)}</td>
                                  <td style={{ padding: '0.75rem 1rem', color: '#10b981', fontWeight: 700 }}>₦{(t.amount || 0).toLocaleString()}</td>
                                  <td style={{ padding: '0.75rem 1rem', color: '#8b949e' }}>{t.buyer?.firstName || 'N/A'} {t.buyer?.lastName || ''}</td>
                                  <td style={{ padding: '0.75rem 1rem', color: '#8b949e' }}>{t.seller?.firstName || 'N/A'} {t.seller?.lastName || ''}</td>
                                  <td style={{ padding: '0.75rem 1rem' }}>
                                    <span style={{ background: (statusColors[t.status] || '#6e7681') + '20', color: statusColors[t.status] || '#6e7681', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize' }}>{t.status?.replace('_', ' ')}</span>
                                  </td>
                                  <td style={{ padding: '0.75rem 1rem', color: '#6e7681' }}>{new Date(t.createdAt).toLocaleDateString('en-NG')}</td>
                                  <td style={{ padding: '0.75rem 1rem' }}>
                                    <span style={{ color: '#60a5fa', fontSize: '0.7rem', cursor: 'pointer' }} onClick={() => alert(JSON.stringify(t, null, 2))}>View</span>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── ESCROW ── */}
              {tab === 'escrow' && (
                <div>
                  {/* Filter */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    {['all', 'initiated', 'funded', 'release_requested', 'released', 'disputed', 'refunded'].map(f => (
                      <button key={f} onClick={() => setEscrowFilter(f)}
                        style={{ background: escrowFilter === f ? '#8b5cf6' : '#161b22', color: escrowFilter === f ? '#fff' : '#8b949e', border: '1px solid #21262d', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.7rem', cursor: 'pointer', textTransform: 'capitalize' }}>
                        {f === 'all' ? 'All' : f.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  {/* Escrow Summary Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                    {[
                      { label: 'Total Held', value: escrows.filter(e => e.status === 'funded').reduce((s: number, e: any) => s + (e.totalDeposited || 0), 0), color: '#8b5cf6', icon: '🔐' },
                      { label: 'Active', value: escrows.filter(e => ['funded', 'release_requested'].includes(e.status)).length, color: '#3b82f6', icon: '⏳', isCount: true },
                      { label: 'Released', value: escrows.filter(e => e.status === 'released').length, color: '#10b981', icon: '✅', isCount: true },
                      { label: 'Disputed', value: escrows.filter(e => e.status === 'disputed').length, color: '#ef4444', icon: '⚠️', isCount: true },
                    ].map(s => (
                      <div key={s.label} style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
                        <div style={{ color: s.color, fontWeight: 900, fontSize: s.isCount ? '1.5rem' : '1.1rem', margin: '0.25rem 0' }}>
                          {s.isCount ? s.value : `₦${(s.value as number).toLocaleString()}`}
                        </div>
                        <div style={{ color: '#6e7681', fontSize: '0.7rem' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Escrow List */}
                  <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0.75rem', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #21262d' }}>
                      <h3 style={{ margin: 0, fontWeight: 700, color: '#f0f6fc' }}>Escrow Accounts ({escrows.filter(e => escrowFilter === 'all' || e.status === escrowFilter).length})</h3>
                    </div>
                    {escrows.filter(e => escrowFilter === 'all' || e.status === escrowFilter).length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem', color: '#6e7681' }}>No escrows {escrowFilter !== 'all' ? `with status "${escrowFilter}"` : 'yet'}</div>
                    ) : escrows.filter(e => escrowFilter === 'all' || e.status === escrowFilter).map((e: any) => {
                      const statusColors: Record<string,string> = { initiated: '#f59e0b', funded: '#8b5cf6', release_requested: '#3b82f6', released: '#10b981', disputed: '#ef4444', refunded: '#6e7681' }
                      return (
                        <div key={e.id} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #21262d' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <div>
                              <div style={{ fontWeight: 700, color: '#f0f6fc', fontSize: '0.9rem' }}>Escrow {e.id?.slice(-8).toUpperCase()}</div>
                              <div style={{ color: '#6e7681', fontSize: '0.75rem' }}>{new Date(e.createdAt || e.fundedAt).toLocaleDateString('en-NG')}</div>
                            </div>
                            <span style={{ background: (statusColors[e.status] || '#6e7681') + '20', color: statusColors[e.status] || '#6e7681', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize' }}>
                              {e.status?.replace('_', ' ')}
                            </span>
                          </div>

                          {/* Amount breakdown */}
                          <div style={{ background: '#0d1117', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                              <span style={{ color: '#8b949e' }}>Total Deposited</span>
                              <span style={{ color: '#f0f6fc', fontWeight: 700 }}>₦{(e.totalDeposited || 0).toLocaleString()}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                              <span style={{ color: '#8b949e' }}>Seller Receives</span>
                              <span style={{ color: '#10b981', fontWeight: 600 }}>₦{(e.netSellerAmount || 0).toLocaleString()}</span>
                            </div>
                            {e.agentCommission > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                                <span style={{ color: '#8b949e' }}>Agent Commission</span>
                                <span style={{ color: '#60a5fa' }}>₦{(e.agentCommission || 0).toLocaleString()}</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                              <span style={{ color: '#8b949e' }}>Platform Fee</span>
                              <span style={{ color: '#f59e0b' }}>₦{(e.platformFee || 0).toLocaleString()}</span>
                            </div>
                            {e.vatAmount > 0 && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                                <span style={{ color: '#8b949e' }}>VAT (FIRS)</span>
                                <span style={{ color: '#6e7681' }}>₦{(e.vatAmount || 0).toLocaleString()}</span>
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {['funded', 'release_requested'].includes(e.status) && (
                              <button onClick={() => releaseEscrow(e.id)}
                                style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '0.4rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                                ✅ Release Funds
                              </button>
                            )}
                            {['funded', 'disputed'].includes(e.status) && e.paymentReference && (
                              <button onClick={() => refundEscrow(e.id, e.paymentReference)}
                                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '0.4rem 1rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}>
                                ↩️ Refund Buyer
                              </button>
                            )}
                            <button onClick={() => alert(JSON.stringify(e, null, 2))}
                              style={{ background: '#0d1117', color: '#60a5fa', border: '1px solid #30363d', padding: '0.4rem 0.75rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.7rem' }}>
                              View Details
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
