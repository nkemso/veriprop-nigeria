FROM node:20-alpine

RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npm prune --production

EXPOSE 5000

CMD ["node", "backend/server.js"]