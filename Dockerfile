FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

RUN npm install --production=false

COPY . .

CMD ["npm", "start"]
