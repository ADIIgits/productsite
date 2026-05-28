FROM node:20-alpine

WORKDIR /app

#Installdependencies
COPY package*.json ./
RUN npm install --omit=dev

#Copysource
COPY . .

EXPOSE 5000

CMD ["node", "src/index.js"]
