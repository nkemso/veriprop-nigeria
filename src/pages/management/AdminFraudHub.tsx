// SCREEN_98 — Admin Fraud Hub
import React, { useState, useEffect } from 'react';

interface FlaggedUser { id: string; firstName: string; lastName: string; email: string; fraudScore: number; fraudFlags: string[]; isBanned: boolean; }

export default function AdminFraudHub() {
  const [users, setUsers] = useState<FlaggedUser[]>([]);
  const [flaggedMessages, setFlaggedMessages] = useState<any[]>([]);
  const [tab, setTab] = useState<'users' | 'chat' | 'audit'>('users');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    Promise.all([
      fetch('/api/admin/users?fraudScore=1', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/chat/admin/flagged', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([uData, mData]) => {
      if (uData.success) setUsers(uData.users || []);
      if (mData.success) setFlaggedMessages(mData.flagged || []);
    }).finally(() => setLoading(false));
  }, []);

  const banUser = async (userId: string, ban: boolean) => {
    await fetch(`/api/admin/users/${userId}/ban`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      body: JSON.stringify({ ban, reason: ban ? 'High fraud score — Admin action' : 'Unbanned by admin' }),
    });
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: ban } : u));
  };

  const TABS = [
    { id: 'users', label: '👥 Flagged Users', count: users.length },
    { id: 'chat', label: '💬 Redacted Chats', count: flaggedMessages.length },
    { id: 'audit', label: '📋 Audit Trail', count: null },
  ] as const;

  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif', maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e3a5f' }}>🚨 Fraud & Compliance Hub</h1>
          <p style={{ color: '#64748b' }}>Monitor, flag, and take action on suspicious activity</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {[
            ['🚩', users.filter(u => u.fraudScore >= 50).length, 'High Risk', '#fee2e2', '#991b1b'],
            ['💬', flaggedMessages.length, 'Redacted', '#fef9c3', '#92400e'],
          ].map(([icon, count, label, bg, color]) => (
            <div key={label as string} style={{ background: bg as string, borderRadius: '0.75rem', padding: '0.75rem 1.25rem', textAlign: 'center', minWidth: 80 }}>
              <div style={{ fontSize: '1.5rem' }}>{icon as string}</div>
              <div style={{ fontWeight: 800, color: color as string, fontSize: '1.25rem' }}>{count as number}</div>
              <div style={{ fontSize: '0.7rem', color: color as string }}>{label as string}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '0.75rem 1.25rem', border: 'none', background: 'transparent',
            fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? '#1d4ed8' : '#64748b',
            borderBottom: tab === t.id ? '3px solid #1d4ed8' : '3px solid transparent',
            cursor: 'pointer', fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            {t.label}
            {t.count !== null && <span style={{ background: '#fee2e2', color: '#991b1b', padding: '0.1rem 0.4rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading fraud data...</div>}

      {/* Flagged Users Tab */}
      {!loading && tab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {users.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No flagged users. 🎉</div>}
          {users.map(user => (
            <div key={user.id} style={{
              background: '#fff', borderRadius: '0.75rem', padding: '1.25rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              border: user.fraudScore >= 50 ? '2px solid #ef4444' : '1px solid #e2e8f0',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#1e3a5f' }}>{user.firstName} {user.lastName}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{user.email}</div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ background: '#fee2e2', color: '#991b1b', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: 700 }}>
                    Fraud Score: {user.fraudScore}
                  </span>
                  {user.fraudFlags.slice(0, 2).map((f, i) => (
                    <span key={i} style={{ background: '#fef9c3', color: '#92400e', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.7rem' }}>
                      {f.split(':')[0]}
                    </span>
                  ))}
                  {user.isBanned && <span style={{ background: '#1e3a5f', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.7rem' }}>BANNED</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a href={`/admin/users/${user.id}`} style={{ padding: '0.5rem 0.875rem', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>View</a>
                <button onClick={() => banUser(user.id, !user.isBanned)} style={{
                  padding: '0.5rem 0.875rem',
                  background: user.isBanned ? '#dcfce7' : '#fee2e2',
                  color: user.isBanned ? '#166534' : '#991b1b',
                  border: 'none', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                }}>
                  {user.isBanned ? '✓ Unban' : '🚫 Ban'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Redacted Chat Tab */}
      {!loading && tab === 'chat' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {flaggedMessages.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No redacted messages found. ✅</div>}
          {flaggedMessages.map((msg: any) => (
            <div key={msg.id} style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: '0.75rem', padding: '1rem', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.875rem' }}>
                  ⚠️ {msg.sender?.firstName} {msg.sender?.lastName} — {msg.sender?.email}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(msg.createdAt).toLocaleString('en-NG')}</div>
              </div>
              <div style={{ background: '#fef9c3', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', color: '#374151' }}>
                {msg.content}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                Room: {msg.room?.transactionId || msg.roomId} · Reason: {msg.redactedReason}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Tab */}
      {!loading && tab === 'audit' && (
        <AuditTrailPanel />
      )}
    </div>
  );
}

function AuditTrailPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/admin/audit', { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
      .then(r => r.json()).then(d => { if (d.success) setLogs(d.logs); });
  }, []);
  return (
    <div>
      {logs.map((log: any) => (
        <div key={log.id} style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem', alignItems: 'flex-start' }}>
          <div style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString('en-NG')}</div>
          <div style={{ background: '#eff6ff', color: '#1d4ed8', padding: '0.1rem 0.5rem', borderRadius: '0.25rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{log.action}</div>
          <div style={{ color: '#374151', flex: 1 }}>{log.description}</div>
          {log.user && <div style={{ color: '#64748b', whiteSpace: 'nowrap' }}>{log.user.firstName} {log.user.lastName}</div>}
        </div>
      ))}
    </div>
  );
}
