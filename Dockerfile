FROM node:20-alpine

# Cache bust: 2026-05-28
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npx prisma generate

EXPOSE 5000

CMD ["sh", "start.sh"]
