'use strict';

/**
 * ================================================================
 * VERIPROP NIGERIA — TENANCY AGREEMENT SERVICE
 * ================================================================
 * Standard tenancy agreement templates adapted to each state's laws.
 * Offered as optional add-on to users during transactions.
 *
 * Key Nigerian tenancy laws by state:
 *   - Lagos: Tenancy Law 2011 (+ 2025 Bill amendments)
 *   - Abuja/FCT: Recovery of Premises Act (Cap 544 LFN)
 *   - Rivers: Landlord and Tenant Edict 1999
 *   - Other states: Recovery of Premises Act (federal)
 *
 * Major differences:
 *   - Notice periods (weekly, monthly, quarterly, yearly)
 *   - Maximum advance rent (Lagos caps at 1 year)
 *   - Security deposit rules
 *   - Dispute resolution mechanisms
 *   - Agent fee regulations
 * ================================================================
 */

// ================================================================
// STATE-SPECIFIC TENANCY RULES
// ================================================================
const STATE_TENANCY_RULES = {
  // ── LAGOS ──────────────────────────────────────────────────
  Lagos: {
    governingLaw: 'Lagos State Tenancy Law 2011',
    maxAdvanceRent: {
      newTenant: '1 year',
      sittingTenantMonthly: '6 months',
      sittingTenantYearly: '1 year',
    },
    noticePeriods: {
      weekly: '1 week',
      monthly: '1 month',
      quarterly: '3 months',
      halfYearly: '3 months',
      yearly: '6 months',
    },
    autoLapse: {
      monthly: '6 months arrears → tenancy lapses automatically',
      quarterly: '1 year arrears → tenancy lapses automatically',
    },
    specialRules: [
      'Landlord must engage a registered agent under Lagos State Real Estate Regulatory Authority Law 2021',
      'Court-connected ADR is available for dispute resolution',
      'This law does NOT apply to Apapa, Ikeja GRA, Ikoyi, and Victoria Island (Recovery of Premises Act applies instead)',
      'Landlord cannot demand more than 1 year advance rent from new tenants',
      'Sitting tenants (monthly) cannot be asked for more than 6 months advance',
    ],
    disputeResolution: 'Lagos State Magistrate Court / High Court with Court-connected ADR',
  },

  // ── ABUJA / FCT ────────────────────────────────────────────
  Abuja: {
    governingLaw: 'Recovery of Premises Act (Cap 544 LFN 1990)',
    maxAdvanceRent: { newTenant: 'No statutory cap (negotiable)', sittingTenantMonthly: 'No statutory cap' },
    noticePeriods: {
      weekly: '1 week',
      monthly: '1 month',
      quarterly: '3 months (quarter)',
      yearly: '6 months',
      tenantAtWill: '1 week',
    },
    specialRules: [
      'No statutory cap on advance rent — subject to agreement between parties',
      'Notice to Quit must be in writing',
      'After Notice to Quit, landlord must issue 7 days Owner\'s Intention to Recover Possession',
      'Tenant can apply to court to stay execution of possession order',
    ],
    disputeResolution: 'FCT High Court / Magistrate Court',
  },

  // ── RIVERS ─────────────────────────────────────────────────
  Rivers: {
    governingLaw: 'Rivers State Landlord and Tenant Edict 1999',
    maxAdvanceRent: { newTenant: 'No statutory cap', sittingTenantMonthly: 'No statutory cap' },
    noticePeriods: {
      weekly: '1 week',
      monthly: '1 month',
      quarterly: '3 months',
      yearly: '6 months',
    },
    specialRules: [
      'Tenancy agreement must specify the exact term of the tenancy',
      'Termination requires written notice as specified in the agreement',
      'Either party can terminate with 3 months notice (if not specified)',
    ],
    disputeResolution: 'Rivers State High Court / Magistrate Court',
  },

  // ── DEFAULT (Federal — applies to states without specific laws) ──
  _default: {
    governingLaw: 'Recovery of Premises Act (Cap 544 LFN 1990)',
    maxAdvanceRent: { newTenant: 'No statutory cap', sittingTenantMonthly: 'No statutory cap' },
    noticePeriods: {
      weekly: '1 week',
      monthly: '1 month',
      quarterly: '3 months',
      yearly: '6 months',
      tenantAtWill: '1 week',
    },
    specialRules: [
      'Federal Recovery of Premises Act applies',
      'Notice to Quit must be in writing',
      '7 days Owner\'s Intention to Recover Possession required after Notice to Quit',
    ],
    disputeResolution: 'State High Court / Magistrate Court',
  },
};

// States that use the default (federal) law
const STATES_USING_DEFAULT = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi',
  'Kogi', 'Kwara', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun',
  'Oyo', 'Plateau', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];


// ================================================================
// GET STATE RULES
// ================================================================
function getStateRules(state) {
  const normalized = (state || '').trim();
  if (STATE_TENANCY_RULES[normalized]) return STATE_TENANCY_RULES[normalized];
  if (normalized === 'FCT' || normalized.toLowerCase().includes('abuja')) return STATE_TENANCY_RULES.Abuja;
  return STATE_TENANCY_RULES._default;
}


// ================================================================
// GENERATE TENANCY AGREEMENT
// ================================================================
function generateAgreement({
  landlordName,
  landlordAddress,
  tenantName,
  tenantAddress,
  propertyAddress,
  propertyType = 'residential',
  propertyDescription = '',
  state = 'Lagos',
  rent,
  rentFrequency = 'yearly',
  securityDeposit = 0,
  cautionDeposit = 0,
  tenancyStartDate,
  tenancyDuration = '1 year',
  agentName = '',
  agentFee = '',
  additionalClauses = [],
}) {
  const rules = getStateRules(state);
  const noticePeriod = rules.noticePeriods[rentFrequency] || rules.noticePeriods.yearly;
  const today = new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
  const startDate = tenancyStartDate || today;

  const agreement = `
═══════════════════════════════════════════════════════════════
                    TENANCY AGREEMENT
═══════════════════════════════════════════════════════════════

Made this ${today}

BETWEEN

${landlordName.toUpperCase()}
of ${landlordAddress}
in ${state} State of Nigeria
(hereinafter referred to as "the Landlord" which expression shall
where the context so admits include heirs, executors, personal
representatives, administrators and assigns)

                        OF THE ONE PART

AND

${tenantName.toUpperCase()}
of ${tenantAddress}
in ${state} State of Nigeria
(hereinafter referred to as "the Tenant" which expression shall
where the context so admits include heirs, executors, personal
representatives, administrators and assigns)

                        OF THE OTHER PART
${agentName ? `
Through the agency of ${agentName.toUpperCase()}
(hereinafter referred to as "the Agent")
` : ''}

───────────────────────────────────────────────────────────────
GOVERNING LAW: ${rules.governingLaw}
───────────────────────────────────────────────────────────────

WHEREAS the Landlord is the owner of the property described
herein and has agreed to let same to the Tenant upon the terms
and conditions contained in this Agreement.

NOW THIS AGREEMENT WITNESSETH AS FOLLOWS:

═══════════════════════════════════════════════════════════════
1. DEMISE AND TERM
═══════════════════════════════════════════════════════════════

1.1 IN CONSIDERATION of the rent, covenants and conditions to
    be performed and observed on the part of the Tenant, the
    Landlord HEREBY DEMISES to the Tenant:

    ALL THAT ${propertyType} property ${propertyDescription ? `described as ${propertyDescription}` : ''}
    situate at ${propertyAddress}, ${state} State
    (hereinafter referred to as "the Demised Premises")

1.2 TO HOLD same unto the Tenant for a term of ${tenancyDuration}
    commencing on ${startDate}.

═══════════════════════════════════════════════════════════════
2. RENT
═══════════════════════════════════════════════════════════════

2.1 The ${rentFrequency} rent for the Demised Premises shall be
    the sum of ₦${(rent || 0).toLocaleString()} (${numberToWords(rent)} Naira only)
    payable ${rentFrequency === 'yearly' ? 'annually' : rentFrequency} in advance.

2.2 Payment shall be made on or before the due date by bank
    transfer, cheque, or through the VeriProp escrow platform.

${rules.maxAdvanceRent.newTenant !== 'No statutory cap' ? `
2.3 ADVANCE RENT LIMITATION: In accordance with ${rules.governingLaw},
    the maximum advance rent payable by a new tenant shall not
    exceed ${rules.maxAdvanceRent.newTenant}.
` : ''}

${securityDeposit > 0 ? `
2.4 SECURITY DEPOSIT: The Tenant shall pay a refundable security
    deposit of ₦${securityDeposit.toLocaleString()} (${numberToWords(securityDeposit)} Naira)
    to be held by the Landlord and returned upon satisfactory
    vacation of the premises, less any deductions for damages
    beyond normal wear and tear.
` : ''}

${cautionDeposit > 0 ? `
2.5 CAUTION DEPOSIT: The Tenant shall pay a caution deposit of
    ₦${cautionDeposit.toLocaleString()} (${numberToWords(cautionDeposit)} Naira) which
    shall be applied towards repairs and maintenance of the
    Demised Premises at the expiration of the tenancy.
` : ''}

═══════════════════════════════════════════════════════════════
3. TENANT'S COVENANTS
═══════════════════════════════════════════════════════════════

The Tenant hereby covenants with the Landlord as follows:

(a) To use the Demised Premises solely for ${propertyType} purposes.

(b) To pay the rent reserved on the day and in the manner
    hereinbefore stipulated without any deduction whatsoever.

(c) To be responsible for the insurance of all personal property
    against theft, fire and other unforeseeable circumstances.

(d) To be responsible for the payment of tenement rate, water
    rate, neighbourhood improvement taxes, electricity bills,
    waste disposal charges and all other similar levies on the
    Demised Premises during the term hereby granted.

(e) Not to store or bring upon the Demised Premises any articles
    of combustible, inflammable or dangerous nature.

(f) Not to use or permit the Demised Premises to be used for
    any illegal or immoral purpose.

(g) Not to assign, sublet or part with possession of any part
    or the whole of the Demised Premises without the prior
    written consent of the Landlord.

(h) To keep the interior, fixtures and fittings of the Demised
    Premises in good and tenantable repair and condition during
    the tenancy, ordinary wear and tear excepted.

(i) To permit the Landlord or authorised agent, upon giving
    48 hours' notice, to enter the Demised Premises at
    reasonable times to view and examine the condition thereof.

(j) Not to make or permit any structural alteration or addition
    to the Demised Premises without the prior written consent
    of the Landlord.

(k) Not to permit or suffer anything which may constitute a
    nuisance or cause damage to the Landlord or occupiers of
    adjoining premises.

(l) At the expiration or termination of the tenancy, to
    surrender and yield up the Demised Premises in accordance
    with these terms and conditions.

═══════════════════════════════════════════════════════════════
4. LANDLORD'S COVENANTS
═══════════════════════════════════════════════════════════════

The Landlord hereby covenants with the Tenant as follows:

(a) That the Tenant, paying the rent and performing the
    covenants herein, shall peacefully and quietly enjoy the
    Demised Premises during the term without interruption.

(b) To maintain the structure, exterior walls, roof, foundations
    and common areas of the building in good repair.

(c) To ensure the provision of adequate water supply and
    drainage facilities to the Demised Premises.

(d) To carry out substantial repairs affecting the structure
    or rendering the premises uninhabitable within a reasonable
    time after receiving notice from the Tenant.

(e) Not to interfere with the Tenant's peaceful enjoyment
    of the Demised Premises except as provided herein.

═══════════════════════════════════════════════════════════════
5. TERMINATION AND NOTICE
═══════════════════════════════════════════════════════════════

5.1 NOTICE PERIOD: In accordance with ${rules.governingLaw},
    the notice required to determine this tenancy shall be
    ${noticePeriod} notice in writing.

5.2 The Landlord may terminate this tenancy by issuing:
    (a) A Notice to Quit of ${noticePeriod}; followed by
    (b) A seven (7) days' Owner's Intention to Recover Possession.

5.3 The Tenant may terminate this tenancy by issuing
    ${noticePeriod} written notice to the Landlord.

5.4 This tenancy shall also determine upon:
    (a) Breach of any covenant herein by either party;
    (b) Destruction of the Demised Premises by fire, flood
        or any Act of God rendering same uninhabitable;
    (c) Mutual agreement of both parties.

${rules.autoLapse?.[rentFrequency] ? `
5.5 AUTOMATIC LAPSE: Under ${rules.governingLaw}, ${rules.autoLapse[rentFrequency]}.
` : ''}

═══════════════════════════════════════════════════════════════
6. REPAIRS AND MAINTENANCE
═══════════════════════════════════════════════════════════════

6.1 The Tenant shall maintain the interior and fixtures in
    good condition and shall carry out minor repairs.

6.2 The Landlord shall be responsible for structural repairs,
    roof repairs, and major plumbing/electrical faults.

6.3 The Tenant shall notify the Landlord within 48 hours
    of any damage or defect requiring the Landlord's attention.

6.4 If the Tenant fails to effect repairs as required, the
    Landlord may effect same and recover costs from the Tenant.

═══════════════════════════════════════════════════════════════
7. DISPUTE RESOLUTION
═══════════════════════════════════════════════════════════════

7.1 Any dispute arising from this Agreement shall first be
    resolved through amicable negotiation between the parties.

7.2 If negotiation fails, the parties shall submit the dispute
    to mediation through VeriProp's dispute resolution platform
    or an independent mediator agreed upon by both parties.

7.3 If mediation fails, either party may institute legal
    proceedings at ${rules.disputeResolution}.

${agentName ? `
═══════════════════════════════════════════════════════════════
8. AGENT'S CLAUSE
═══════════════════════════════════════════════════════════════

8.1 The Agent, ${agentName}, facilitated this tenancy and
    is entitled to an agency fee of ${agentFee || '5-10% of annual rent'}
    as agreed between the parties.

8.2 The Agent's fee is payable by the Tenant/Landlord as
    agreed and is separate from the rent herein reserved.

8.3 The Agent shall not be liable for any default by either
    the Landlord or the Tenant under this Agreement.
` : ''}

═══════════════════════════════════════════════════════════════
${agentName ? '9' : '8'}. STATE-SPECIFIC PROVISIONS (${state} State)
═══════════════════════════════════════════════════════════════

${rules.specialRules.map((rule, i) => `${String.fromCharCode(97 + i)}) ${rule}`).join('\n\n')}

${additionalClauses.length > 0 ? `
═══════════════════════════════════════════════════════════════
${agentName ? '10' : '9'}. ADDITIONAL CLAUSES
═══════════════════════════════════════════════════════════════

${additionalClauses.map((clause, i) => `${i + 1}. ${clause}`).join('\n\n')}
` : ''}

═══════════════════════════════════════════════════════════════
GOVERNING LAW
═══════════════════════════════════════════════════════════════

This Agreement shall be governed by and construed in accordance
with ${rules.governingLaw} and the laws of the Federal Republic
of Nigeria.


═══════════════════════════════════════════════════════════════
IN WITNESS WHEREOF the parties hereto have set their hands
and seals on the date first written above.
═══════════════════════════════════════════════════════════════


SIGNED by the LANDLORD:

_________________________          Date: _______________
${landlordName}


SIGNED by the TENANT:

_________________________          Date: _______________
${tenantName}

${agentName ? `
SIGNED by the AGENT:

_________________________          Date: _______________
${agentName}
` : ''}

WITNESS 1:

Name: ___________________________
Address: ________________________
Signature: ______________________
Date: ___________________________


WITNESS 2:

Name: ___________________________
Address: ________________________
Signature: ______________________
Date: ___________________________


═══════════════════════════════════════════════════════════════
Generated via VeriProp Naija Properties (RC-9580468) — Nigeria's Zero-Trust Property Marketplace
https://veriprop-nigeriang.vercel.app
═══════════════════════════════════════════════════════════════
`;

  return agreement.trim();
}


// ================================================================
// HELPER — Number to words (Nigerian style)
// ================================================================
function numberToWords(num) {
  if (!num || num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convert(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 1000000000) return convert(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 ? ' ' + convert(n % 1000000) : '');
    return convert(Math.floor(n / 1000000000)) + ' Billion' + (n % 1000000000 ? ' ' + convert(n % 1000000000) : '');
  }

  return convert(Math.abs(Math.floor(num)));
}


// ================================================================
// LIST AVAILABLE STATES AND THEIR RULES
// ================================================================
function getAvailableStates() {
  const states = {};
  for (const [state, rules] of Object.entries(STATE_TENANCY_RULES)) {
    if (state === '_default') continue;
    states[state] = {
      governingLaw: rules.governingLaw,
      noticePeriods: rules.noticePeriods,
      maxAdvanceRent: rules.maxAdvanceRent,
    };
  }
  // Add default states
  for (const state of STATES_USING_DEFAULT) {
    states[state] = {
      governingLaw: STATE_TENANCY_RULES._default.governingLaw,
      noticePeriods: STATE_TENANCY_RULES._default.noticePeriods,
      maxAdvanceRent: STATE_TENANCY_RULES._default.maxAdvanceRent,
    };
  }
  return states;
}


module.exports = {
  generateAgreement,
  getStateRules,
  getAvailableStates,
  STATE_TENANCY_RULES,
  numberToWords,
};
