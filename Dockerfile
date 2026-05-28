FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./

# Use npm install instead of npm ci to avoid lock file sync issues
RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 5000

CMD ["sh", "start.sh"]
