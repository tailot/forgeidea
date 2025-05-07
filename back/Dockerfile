FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 4001

CMD [ "node", "dist/index.js" ]