FROM node:20-alpine

# Fix OpenSSL for Prisma on Alpine
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

COPY package*.json ./

# Install ALL deps including prisma CLI
RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate

# NOTE: Do NOT prune dev deps - prisma CLI needed at runtime for migrations
EXPOSE 5000

CMD ["node", "backend/server.js"]
