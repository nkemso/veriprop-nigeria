FROM node:20-alpine

# Fix OpenSSL for Prisma on Alpine
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

COPY package*.json ./

# Install ALL deps (including prisma CLI in devDeps)
RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Remove dev dependencies after build
RUN npm prune --production

EXPOSE 5000

CMD ["node", "backend/server.js"]
