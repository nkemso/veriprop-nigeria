# 💰 VeriProp Nigeria — Fee Structure (DRAFT)

## Decisions Made ✅
- **Agent commission**: 5-10% (agent sets their rate per listing)
- **Direct listings**: Reduced combined fee (platform acts as agent at lower rate)

## Decisions Pending ⏳
- Who pays platform fee? (buyer, seller, split, or agent?)
- Platform fee percentage?

---

## How It Currently Works in Nigerian Real Estate

| Scenario | Who Pays What |
|---|---|
| **Buyer/Renter → Agent → Landlord** | Buyer pays: Property price + Agent fee (5-10%). Agent fee is paid separately, not deducted from price. Landlord receives full asking price. |
| **Buyer → Landlord directly** | Buyer pays: Property price only. No agent fee. |

## Models to Consider

### Model A: Buyer Pays Everything
```
Buyer pays:  Property price + Agent fee (5-10%) + Platform fee (X%)
Landlord receives: Full property price (100%)
Agent receives: Their 5-10% commission
Platform receives: X% platform fee
```
**Pro**: Landlords love it (they get full amount). Attracts more listings.
**Con**: Buyers pay more. May reduce transactions.

### Model B: Split Platform Fee (Buyer + Seller)
```
Buyer pays: Property price + Agent fee (5-10%) + Platform fee (X/2%)
Landlord receives: Property price - Platform fee (X/2%)
Agent receives: Their 5-10% commission
Platform receives: X% total (half from each side)
```
**Pro**: Fair to both sides. Neither feels overcharged.
**Con**: More complex. Landlords see a deduction.

### Model C: Platform Fee from Agent Commission
```
Buyer pays: Property price + Agent fee (5-10%)
Landlord receives: Full property price (100%)
Agent receives: Commission minus platform cut
Platform receives: Cut from agent's commission
```
**Pro**: No extra cost to buyer or seller. Invisible to end users.
**Con**: Agents earn less. May discourage agent signups.

### Model D: Buyer Pays, But Baked Into Price
```
Listing shows: ₦5,000,000 (all-in price including fees)
Behind the scenes: Property = ₦4,750,000 + Platform = ₦250,000
Agent fee: 5-10% of ₦5M = paid by buyer separately
```
**Pro**: Transparent single price. No surprise add-ons.
**Con**: Listings look more expensive vs competitors.

---

## Direct Listing (No Agent) — Agreed: Reduced Combined Fee

When landlord lists directly without an agent:
- Platform acts as the discovery/trust layer (not full agent service)
- Platform charges a SINGLE reduced fee (e.g., 3-5% instead of 5% platform + 10% agent)
- This fee is lower than what a buyer would pay with a full agent
- Incentivizes direct listings while still generating revenue

Example: 
- With agent: Buyer pays 5% platform + 10% agent = 15% on top
- Direct listing: Buyer pays 5% combined (platform acts as agent)
- Landlord saves money, buyer saves money, platform still earns

---

## Questions to Answer Before Implementation

1. **What % is the platform fee?** (2%, 3%, 5%?)
2. **Who pays it?** (buyer only? split? from agent commission?)
3. **What's the direct listing fee?** (reduced combined %)
4. **Is the agent fee range enforced by platform?** (min 5%, max 10%?)
5. **Are fees different for sale vs rent?** (e.g., 5% for rent, 2% for sale?)
6. **Are fees different for property value ranges?** (lower % for high-value properties?)

---

*Take your time on these. When ready, we'll implement the exact model you choose.*
