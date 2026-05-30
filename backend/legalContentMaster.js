'use strict';

module.exports = {
  terms: {
    type: 'terms',
    version: '1.0',
    title: 'Terms of Service — VeriPro Nigeria',
    lastUpdated: '2026-01-01',
    content: `
# Terms of Service

## 1. Acceptance
By using VeriPro Nigeria, you agree to these terms.

## 2. Platform Use
VeriPro Nigeria is a property marketplace for Nigerian real estate transactions.
All users must be 18+ and Nigerian residents or citizens.

## 3. Verification
Users must complete identity verification (NIN) before transacting.
VeriPro Nigeria reserves the right to reject unverified listings.

## 4. Fees
VeriPro charges a 1.5% escrow fee on all transactions (min ₦5,000, max ₦500,000).

## 5. Escrow
All transactions are secured via VeriPro Escrow. Funds are released only when
buyer confirms satisfaction and all documents are verified.

## 6. Disputes
Disputes are resolved by VeriPro's compliance team within 7 business days.

## 7. Fraud
Fraudulent activity will result in immediate account termination and legal action.
    `.trim(),
  },

  privacy: {
    type: 'privacy',
    version: '1.0',
    title: 'Privacy Policy — VeriPro Nigeria',
    lastUpdated: '2026-01-01',
    content: `
# Privacy Policy

## 1. Data Collection
We collect: name, email, phone, NIN, property data, transaction history.

## 2. Data Use
Your data is used to: verify identity, process transactions, prevent fraud.

## 3. Data Sharing
We share data with: payment processors (Paystack), verification services (NIBSS),
law enforcement when legally required.

## 4. Data Security
All data is encrypted at rest and in transit using AES-256 and TLS 1.3.

## 5. Your Rights
You may request data access, correction, or deletion via support@veripronigeria.com.

## 6. Nigeria Data Protection
We comply with NDPR (Nigeria Data Protection Regulation) 2019.
    `.trim(),
  },

  escrowPolicy: {
    type: 'escrowPolicy',
    version: '1.0',
    title: 'Escrow Policy — VeriPro Nigeria',
    lastUpdated: '2026-01-01',
    content: `
# VeriPro Escrow Policy

## How It Works
1. Buyer deposits funds into VeriPro Escrow
2. Seller is notified to prepare property documents
3. Property inspection is conducted
4. Documents are verified by VeriPro team
5. Buyer approves release of funds
6. Funds are transferred to seller within 24 hours
7. Property title is transferred to buyer

## Dispute Resolution
If issues arise, VeriPro's compliance team reviews within 7 days.
Decision is binding on both parties.

## Fees
1.5% of transaction value (min ₦5,000 / max ₦500,000)
    `.trim(),
  },
};
