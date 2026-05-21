// SCREEN_40 — Analytics Dashboard
import React, { useState, useEffect } from 'react';
import { formatPrice } from '../../lib/property-search';

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [vaults, setVaults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    Promise.all([
      fetch('/api/admin/dashboard', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/admin/vaults', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([sData, vData]) => {
      if (sData.success) setStats(sData.stats);
      if (vData.success) setVaults(vData.vaults);
    }).finally(() => setLoading(false));
  }, []);

  const METRIC_CARDS = stats ? [
    { icon: '👥', label: 'Total Users', value: stats.totalUsers?.toLocaleString(), color: '#3b82f6' },
    { icon: '🏠', label: 'Active Listings', value: stats.totalProperties?.toLocaleString(), color: '#10b981' },
    { icon: '💰', label: 'Transactions', value: stats.totalTransactions?.toLocaleString(), color: '#8b5cf6' },
    { icon: '⏳', label: 'Pending Review', value: stats.pendingReview?.toLocaleString(), color: '#f59e0b' },
    { icon: '🔒', label: 'Active Escrows', value: stats.activeEscrows?.toLocaleString(), color: '#06b6d4' },
    { icon: '💎', label: 'Platform Revenue', value: formatPrice(stats.totalRevenue || 0), color: '#ef4444' },
  ] : [];

  const VAULT_COLORS: Record<string, string> = {
    platform_fee: '#3b82f6',
    agent_commission: '#10b981',
    vat_pool: '#8b5cf6',
    wht_pool: '#f59e0b',
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'Inter, sans-serif', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e3a5f', marginBottom: '0.5rem' }}>📊 Analytics Dashboard</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>Real-time platform metrics and vault balances</p>

      {loading && <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading analytics...</div>}

      {/* Metric Cards */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {METRIC_CARDS.map(card => (
            <div key={card.label} style={{ background: '#fff', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${card.color}` }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{card.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '1.5rem', color: card.color }}>{card.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Vault Balances */}
      {!loading && vaults.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontWeight: 800, color: '#1e3a5f', marginBottom: '1rem' }}>🏦 Fund Vaults</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {vaults.map((vault: any) => {
              const color = VAULT_COLORS[vault.name] || '#64748b';
              return (
                <div key={vault.id} style={{ background: '#fff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `2px solid ${color}20` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 700, color: '#374151', textTransform: 'capitalize', fontSize: '0.875rem' }}>
                      {vault.name.replace(/_/g, ' ')}
                    </span>
                    <span style={{ background: `${color}20`, color, padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.7rem', fontWeight: 700 }}>VAULT</span>
                  </div>
                  <div style={{ fontWeight: 900, fontSize: '1.5rem', color }}>{formatPrice(vault.balance)}</div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    Total in: {formatPrice(vault.totalIn)} · Total out: {formatPrice(vault.totalOut)}
                  </div>
                  <div style={{ marginTop: '0.5rem', height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (vault.balance / Math.max(vault.totalIn, 1)) * 100)}%`, height: '100%', background: color, borderRadius: 2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
