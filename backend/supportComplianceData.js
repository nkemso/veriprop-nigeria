'use strict';

const SUPPORT_CATEGORIES = [
  { id: 'account', label: 'Account & Profile' },
  { id: 'listing', label: 'Property Listings' },
  { id: 'transaction', label: 'Transactions & Payments' },
  { id: 'escrow', label: 'Escrow Issues' },
  { id: 'verification', label: 'Identity Verification' },
  { id: 'fraud', label: 'Report Fraud' },
  { id: 'legal', label: 'Legal & Disputes' },
  { id: 'technical', label: 'Technical Issues' },
  { id: 'other', label: 'Other' },
];

const COMPLIANCE_REQUIREMENTS = {
  individual: ['nin', 'bvn', 'phone', 'photo_id'],
  agent: ['nin', 'bvn', 'phone', 'photo_id', 'real_estate_license'],
  agency: ['cac_registration', 'tin', 'address_proof', 'director_nin'],
  developer: ['cac_registration', 'tin', 'address_proof', 'director_nin'],
};

const FRAUD_REPORT_TYPES = [
  'fake_listing', 'impersonation', 'advance_fee',
  'document_forgery', 'title_fraud', 'double_selling',
];

const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '023', name: 'Citibank' },
  { code: '050', name: 'Ecobank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '058', name: 'GTBank' },
  { code: '030', name: 'Heritage Bank' },
  { code: '301', name: 'Jaiz Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '526', name: 'Moniepoint' },
  { code: '076', name: 'Polaris Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC' },
  { code: '068', name: 'Standard Chartered' },
  { code: '232', name: 'Sterling Bank' },
  { code: '100', name: 'Suntrust Bank' },
  { code: '032', name: 'Union Bank' },
  { code: '033', name: 'United Bank for Africa' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '000017', name: 'Kuda Bank' },
  { code: '000013', name: 'GTBank (MFB)' },
  { code: '000014', name: 'Opay' },
  { code: '000015', name: 'Palmpay' },
];

module.exports = {
  SUPPORT_CATEGORIES,
  COMPLIANCE_REQUIREMENTS,
  FRAUD_REPORT_TYPES,
  NIGERIAN_BANKS,
};
