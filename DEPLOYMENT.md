# VeriPro Nigeria — Deployment Guide

## 🚀 Quick Deploy Options

---

## Option 1: Vercel (Frontend) + Railway (Backend) — RECOMMENDED

### Frontend → Vercel
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Set environment variables from `.env.example`
5. Deploy → Your frontend is live!

### Backend → Railway
1. Go to [railway.app](https://railway.app) → New Project
2. Deploy from GitHub repo
3. Add PostgreSQL plugin
4. Add Redis plugin
5. Set environment variables
6. Deploy → Your backend is live!

---

## Option 2: Docker Compose (Self-Hosted / VPS)

### Prerequisites
- Ubuntu 22.04 VPS (min 2GB RAM)
- Docker & Docker Compose installed
- Domain name pointed to your server

### Steps
```bash
# 1. Clone the repo
git clone https://github.com/yourusername/veripro-nigeria.git
cd veripro-nigeria

# 2. Set environment variables
cp .env.example .env
nano .env  # Fill in all values

# 3. Run database migrations
docker-compose run --rm backend npx prisma migrate deploy

# 4. Start all services
docker-compose up -d

# 5. Check status
docker-compose ps
docker-compose logs -f backend
```

---

## Option 3: Manual VPS Deployment

### Prerequisites
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm postgresql redis-server nginx certbot
```

### Steps
```bash
# Install Node 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Clone & install
git clone https://github.com/yourusername/veripro-nigeria.git
cd veripro-nigeria
npm install

# Setup database
sudo -u postgres psql
CREATE DATABASE veripro_nigeria;
CREATE USER veripro_user WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE veripro_nigeria TO veripro_user;

# Run migrations
npx prisma migrate deploy

# Build frontend
npm run build

# Start backend with PM2
npm install -g pm2
pm2 start backend/server.js --name veripro-backend
pm2 save
pm2 startup
```

---

## 🔐 SSL Certificate (Free with Let's Encrypt)
```bash
sudo certbot --nginx -d veripronigeria.com -d www.veripronigeria.com
```

---

## 📊 Monitoring
- Logs: `docker-compose logs -f`
- Health: `curl https://yourdomain.com/api/health`
- PM2: `pm2 monit`

---

## ✅ Post-Deployment Checklist
- [ ] All environment variables set
- [ ] Database migrations run
- [ ] SSL certificate active
- [ ] Health endpoint responding
- [ ] Email/SMS sending working
- [ ] Payment webhooks configured
- [ ] Admin account created
- [ ] Backups configured
