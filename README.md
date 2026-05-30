# 🏠 VeriProp Naija Properties

**Nigeria's Most Trusted Property Marketplace**

A zero-trust, high-security property ecosystem built for the Nigerian market.

## 🔐 Core Security Pillars

- **3-Tier Identity Verification** — BVN, Government ID, Notary
- **Closed-Loop Communications** — AI redaction prevents off-platform contact
- **Multi-Sig Escrow** — Funds released only with 2+ authorized signatures
- **Automated Fund Splitting** — 5% platform fee, 10% agent commission, 7.5% VAT, WHT

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma ORM |
| Cache | Redis |
| Auth | JWT + Refresh Tokens |
| Payments | Paystack |
| AI | Qwen / DeepSeek / Groq / Gemini (configurable) |
| Deployment | Railway (backend) + Vercel (frontend) |

## 🚀 Deployment

### Backend (Railway)
```bash
# Set these variables in Railway dashboard
DATABASE_URL = ${{Postgres.DATABASE_URL}}
DIRECT_URL   = ${{Postgres.DATABASE_URL}}
REDIS_URL    = ${{Redis.REDIS_URL}}
JWT_SECRET   = your-secret-key
AI_PROVIDER  = groq
GROQ_API_KEY = gsk_...
PAYSTACK_SECRET_KEY = sk_live_...
```

### Start Command
```bash
npx prisma migrate deploy && node backend/server.js
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ops/health` | Health check |
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/properties` | Browse properties |
| POST | `/api/v1/transactions` | Start transaction |
| POST | `/api/v1/escrow/:id/release` | Release escrow |

## 🤖 AI Providers (Switch Anytime)

```
AI_PROVIDER = groq      # Free forever, fastest
AI_PROVIDER = qwen      # Free forever, high volume
AI_PROVIDER = deepseek  # Ultra cheap, best quality
AI_PROVIDER = gemini    # Free limited tier
AI_PROVIDER = local     # Regex only, zero cost
```

## 📋 Phases

- **Phase 1** — Identity & Foundation ✅
- **Phase 2** — Marketplace Discovery ✅
- **Phase 3** — Transaction & Escrow ✅
- **Phase 4** — Admin & Operations ✅
- **Phase 5** — Analytics & Scale ✅

---

Built with ❤️ for Nigeria 🇳🇬
RC-9580468 | CAC Registered
