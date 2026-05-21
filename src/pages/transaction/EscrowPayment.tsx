// SCREEN_131 — Escrow Payment Screen
import React, { useState } from 'react';
import { formatPrice } from '../../lib/property-search';

interface EscrowPaymentProps { propertyId: string; propertyTitle: string; amount: number; listingType: string; sellerId: string; }

export default function EscrowPayment({ propertyId, propertyTitle, amount, listingType, sellerId }: EscrowPaymentProps) {
  const [paymentPlan, setPaymentPlan] = useState<'full' | 'installment'>('full');
  const [installments, setInstallments] = useState(6);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'review' | 'payment' | 'success'>('review');
  const [error, setError] = useState('');

  const platformFee = amount * 0.05;
  const agentCommission = amount * 0.10;
  const vat = amount * 0.075;
  const wht = amount * 0.05;
  const totalDeductions = platformFee + agentCommission + vat + wht;
  const netToSeller = amount - totalDeductions;
  const downPayment = paymentPlan === 'installment' ? amount * 0.20 : amount + platformFee;
  const monthlyInstallment = paymentPlan === 'installment' ? (amount * 0.80) / installments : 0;

  const initiateTransaction = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({ propertyId, type: listingType, paymentPlan, installments: paymentPlan === 'installment' ? installments : undefined }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.message); setLoading(false); return; }

      // Initialize Paystack payment
      const payRes = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({
          amount: paymentPlan === 'installment' ? downPayment : amount + platformFee,
          transactionId: data.transaction.id,
        }),
      });
      const payData = await payRes.json();
      if (payData.success) {
        // Redirect to Paystack
        window.location.href = payData.data.authorization_url;
      } else {
        setError(payData.message);
      }
    } catch { setError('Transaction failed. Please try again.'); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem' }}>🔐</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a5f' }}>Secure Escrow Payment</h1>
        <p style={{ color: '#64748b' }}>Funds are held safely until all parties approve release.</p>
      </div>

      {/* Property Summary */}
      <div style={{ background: '#eff6ff', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ fontWeight: 700, color: '#1e3a5f', marginBottom: '0.25rem' }}>{propertyTitle}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1d4ed8' }}>{formatPrice(amount)}</div>
      </div>

      {/* Payment Plan Toggle */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ fontWeight: 700, color: '#374151', display: 'block', marginBottom: '0.75rem' }}>Payment Plan</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {(['full', 'installment'] as const).map(plan => (
            <button key={plan} onClick={() => setPaymentPlan(plan)} style={{
              padding: '1rem', border: `2px solid ${paymentPlan === plan ? '#1d4ed8' : '#e2e8f0'}`,
              borderRadius: '0.75rem', background: paymentPlan === plan ? '#eff6ff' : '#fff',
              color: paymentPlan === plan ? '#1d4ed8' : '#374151', fontWeight: 700, cursor: 'pointer',
            }}>
              {plan === 'full' ? '💰 Full Payment' : '📅 Installments'}
            </button>
          ))}
        </div>
        {paymentPlan === 'installment' && (
          <div style={{ marginTop: '1rem' }}>
            <label style={{ fontSize: '0.875rem', color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>Number of Monthly Installments</label>
            <select value={installments} onChange={e => setInstallments(parseInt(e.target.value))}
              style={{ width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.95rem' }}>
              {[3, 6, 9, 12, 18, 24].map(n => <option key={n} value={n}>{n} months</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Split Breakdown */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ padding: '0.875rem 1rem', background: '#f8fafc', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e2e8f0', fontSize: '0.875rem' }}>
          💸 Automated Fund Distribution
        </div>
        {[
          ['Property Amount', formatPrice(amount), '#374151'],
          ['Platform Fee (5%)', `- ${formatPrice(platformFee)}`, '#ef4444'],
          ['Agent Commission (10%)', `- ${formatPrice(agentCommission)}`, '#f59e0b'],
          ['VAT (7.5%)', `- ${formatPrice(vat)}`, '#8b5cf6'],
          ['WHT (5%)', `- ${formatPrice(wht)}`, '#06b6d4'],
          ['Net to Seller', formatPrice(netToSeller), '#10b981'],
        ].map(([label, value, color]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ color: '#64748b', fontSize: '0.875rem' }}>{label}</span>
            <span style={{ fontWeight: 700, color, fontSize: '0.875rem' }}>{value}</span>
          </div>
        ))}
        {paymentPlan === 'installment' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#eff6ff', borderBottom: '1px solid #dbeafe' }}>
              <span style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '0.875rem' }}>Down Payment (20%)</span>
              <span style={{ fontWeight: 800, color: '#1d4ed8', fontSize: '0.875rem' }}>{formatPrice(downPayment)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#eff6ff' }}>
              <span style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '0.875rem' }}>Monthly Installment × {installments}</span>
              <span style={{ fontWeight: 800, color: '#1d4ed8', fontSize: '0.875rem' }}>{formatPrice(monthlyInstallment)}/mo</span>
            </div>
          </>
        )}
      </div>

      {/* Total to Pay Now */}
      <div style={{ background: '#1e3a5f', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
          {paymentPlan === 'installment' ? 'Pay Now (Down Payment)' : 'Total to Pay Now'}
        </div>
        <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: '1.5rem' }}>
          {formatPrice(paymentPlan === 'installment' ? downPayment : amount + platformFee)}
        </div>
      </div>

      {/* Escrow Notice */}
      <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: '#166534' }}>
        🔒 <strong>Escrow Protection:</strong> Your payment is held securely by VeriProp. Funds are released only after multi-signature approval from buyer + seller (or VeriProp Legal).
      </div>

      {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.875rem', borderRadius: '0.5rem', marginBottom: '1rem', fontWeight: 600 }}>❌ {error}</div>}

      <button onClick={initiateTransaction} disabled={loading} style={{
        width: '100%', padding: '1rem', background: loading ? '#94a3b8' : '#1d4ed8',
        color: '#fff', border: 'none', borderRadius: '0.75rem', fontWeight: 800,
        fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer',
      }}>
        {loading ? 'Processing...' : `🔐 Fund Escrow — ${formatPrice(paymentPlan === 'installment' ? downPayment : amount + platformFee)}`}
      </button>

      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '1rem' }}>
        Secured by Paystack · Protected by VeriProp Escrow · Subject to Multi-Sig Release
      </p>
    </div>
  );
}
