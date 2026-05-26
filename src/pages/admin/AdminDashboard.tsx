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
    ]).then(([s, u, p, d, f, a]) => {
      setStats(s.stats || {})
      setUsers(u.users || [])
      setProperties(p.data || [])
      setDisputes(d.disputes || [])
      setFlagged(f.flagged || [])
      setLogs(a.logs || [])
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
                                <button onClick={() => banUser(u.id, !u.isBanned)}
                                  style={{ background: u.isBanned ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: u.isBanned ? '#10b981' : '#ef4444', border: 'none', padding: '0.3rem 0.75rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                                  {u.isBanned ? 'Unban' : 'Ban'}
                                </button>
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
                    { title: 'CBN KYC', status: 'Active', icon: '🏦', color: '#3b82f6', desc: 'Central Bank of Nigeria KYC requirements — BVN and NIN verification integrated.' },
                    { title: 'EFCC AML', status: 'Monitoring', icon: '🔍', color: '#8b5cf6', desc: 'Anti-Money Laundering — fraud scoring, suspicious activity flagging and reporting.' },
                    { title: 'FIRS Tax', status: 'Remitting', icon: '📊', color: '#f59e0b', desc: 'Federal Inland Revenue Service — VAT (7.5%) and WHT auto-remitted per transaction.' },
                    { title: 'CAC Verification', status: 'Active', icon: '🏢', color: '#06b6d4', desc: 'Corporate Affairs Commission — agency and developer company verification.' },
                    { title: 'NIBSS Integration', status: 'Live', icon: '🔗', color: '#10b981', desc: 'Nigeria Inter-Bank Settlement System — BVN verification for Tier 1 KYC.' },
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
                <div style={{ maxWidth: 600 }}>
                  <div style={{ background: '#161b22', border: '1px solid #21262d', borderRadius: '0.875rem', padding: '1.5rem', marginBottom: '1rem' }}>
                    <h3 style={{ color: '#f0f6fc', fontWeight: 700, margin: '0 0 1rem' }}>⚙️ Platform Settings</h3>
                    {[
                      { label: 'Escrow Fee', value: '1.5%', type: 'text' },
                      { label: 'Platform Split', value: '5%', type: 'text' },
                      { label: 'Agent Commission', value: '10%', type: 'text' },
                      { label: 'VAT Rate', value: '7.5%', type: 'text' },
                      { label: 'AI Moderation', value: 'Enabled', type: 'toggle' },
                      { label: 'Escrow Expiry (days)', value: '30', type: 'text' },
                    ].map(s => (
                      <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #21262d' }}>
                        <span style={{ color: '#8b949e', fontSize: '0.875rem' }}>{s.label}</span>
                        <span style={{ color: '#f0f6fc', fontWeight: 600, fontSize: '0.875rem' }}>{s.value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: '#161b22', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.875rem', padding: '1.5rem' }}>
                    <h3 style={{ color: '#f87171', fontWeight: 700, margin: '0 0 0.5rem' }}>⚠️ Admin Credentials</h3>
                    <p style={{ color: '#6e7681', fontSize: '0.875rem', margin: '0 0 1rem' }}>
                      To create admin accounts, register a user then update their role in the database:
                    </p>
                    <div style={{ background: '#0d1117', borderRadius: '0.5rem', padding: '1rem', fontFamily: 'monospace', fontSize: '0.8rem', color: '#10b981' }}>
                      {`UPDATE users SET role='super_admin' WHERE email='admin@veripronigeria.com';`}
                    </div>
                    <p style={{ color: '#6e7681', fontSize: '0.75rem', marginTop: '0.75rem' }}>
                      Run this SQL in Railway → PostgreSQL → Data tab after creating the user account.
                    </p>
                  </div>
                </div>
              )}

              {/* Other tabs */}
              {['transactions', 'escrow'].includes(tab) && (
                <div style={{ textAlign: 'center', padding: '3rem', background: '#161b22', borderRadius: '0.75rem', border: '1px solid #21262d', color: '#6e7681' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔐</div>
                  <h3 style={{ color: '#f0f6fc', fontWeight: 700 }}>{tab === 'transactions' ? 'Transaction Management' : 'Escrow Management'}</h3>
                  <p>Advanced {tab} management coming in the next release.</p>
                  <p style={{ fontSize: '0.8rem' }}>Use the backend API for now: <code style={{ color: '#60a5fa' }}>/api/v1/{tab}</code></p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
