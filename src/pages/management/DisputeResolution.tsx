// SCREEN_63 — Dispute Resolution
import React, { useState, useEffect } from 'react';

export default function DisputeResolution() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [resolution, setResolution] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/disputes', { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } })
      .then(r => r.json()).then(d => { if (d.success) setDisputes(d.disputes); }).finally(() => setLoading(false));
  }, []);

  const resolveDispute = async (id: string, outcome: string) => {
    await fetch(`/api/admin/disputes/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      body: JSON.stringify({ resolution, outcome }),
    });
    setDisputes(prev => prev.map(d => d.id === id ? { ...d, status: `resolved_${outcome}` } : d));
    setSelected(null);
  };

  const STATUS_COLORS: Record<string, string> = {
    open: '#ef4444', under_review: '#f59e0b', mediation: '#8b5cf6',
    escalated: '#ef4444', resolved_buyer: '#10b981', resolved_seller: '#10b981',
    resolved_platform: '#3b82f6', closed: '#94a3b8',
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e3a5f', marginBottom: '0.5rem' }}>⚖️ Dispute Resolution</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>Active disputes requiring compliance review</p>

      {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading disputes...</div>}
      {!loading && disputes.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: '#10b981', fontSize: '1.125rem' }}>🎉 No open disputes!</div>}

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '1.5rem' }}>
        {/* Disputes List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {disputes.map(d => (
            <div key={d.id} onClick={() => setSelected(d)} style={{
              background: '#fff', borderRadius: '0.75rem', padding: '1.25rem', cursor: 'pointer',
              border: selected?.id === d.id ? '2px solid #1d4ed8' : '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ fontWeight: 700, color: '#1e3a5f', fontSize: '0.875rem' }}>#{d.id.slice(-8).toUpperCase()}</div>
                <span style={{ background: `${STATUS_COLORS[d.status] || '#94a3b8'}20`, color: STATUS_COLORS[d.status] || '#94a3b8', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.7rem', fontWeight: 700 }}>
                  {d.status.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              <div style={{ color: '#374151', fontSize: '0.875rem', marginBottom: '0.25rem' }}>{d.reason?.substring(0, 80)}...</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(d.createdAt).toLocaleDateString('en-NG')}</div>
            </div>
          ))}
        </div>

        {/* Resolution Panel */}
        {selected && (
          <div style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontWeight: 800, color: '#1e3a5f', marginBottom: '1rem' }}>Dispute #{selected.id.slice(-8).toUpperCase()}</h3>
            <div style={{ background: '#f8fafc', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1rem', fontSize: '0.875rem', color: '#374151' }}>
              <strong>Reason:</strong><br />{selected.reason}
            </div>
            <label style={{ fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Resolution Notes</label>
            <textarea value={resolution} onChange={e => setResolution(e.target.value)} rows={4}
              placeholder="Document the resolution decision and supporting evidence..."
              style={{ width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', resize: 'none', boxSizing: 'border-box', marginBottom: '1rem' }}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              {[
                ['buyer', 'Refund Buyer', '#3b82f6'],
                ['seller', 'Release to Seller', '#10b981'],
                ['platform', 'Platform Decision', '#8b5cf6'],
              ].map(([outcome, label, color]) => (
                <button key={outcome} onClick={() => resolveDispute(selected.id, outcome as string)} disabled={!resolution.trim()}
                  style={{ padding: '0.75rem', background: resolution.trim() ? color : '#e2e8f0', color: resolution.trim() ? '#fff' : '#94a3b8', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.8rem', cursor: resolution.trim() ? 'pointer' : 'not-allowed' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
