FROM node:20-alpine

# Fix OpenSSL for Prisma on Alpine
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Generate Prisma with correct binary target
RUN npx prisma generate

EXPOSE 5000

CMD ["node", "backend/server.js"]
