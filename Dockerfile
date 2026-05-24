FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN chmod +x start.sh

EXPOSE 5000
CMD ["sh", "start.sh"]
