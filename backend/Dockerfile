# ============================================
# VeriPro Nigeria - Backend Dockerfile
# ============================================
FROM node:20-alpine AS base

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy backend source
COPY backend/ ./backend/
COPY prisma/ ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S veripro -u 1001

USER veripro

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["dumb-init", "node", "backend/server.js"]
