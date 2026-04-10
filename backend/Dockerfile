FROM node:18-bullseye-slim

WORKDIR /app

# Instalar pacotes necessários para o Prisma (OpenSSL e compilações)
RUN apt-get update -y && apt-get install -y openssl

# Instala as dependências
COPY package*.json ./
RUN npm install

# Copia o definition file do Prisma primeiro (para cache do Docker client generation se possivel)
COPY prisma ./prisma/
RUN npx prisma generate

# Copia resto do código TS e compila
COPY . .
RUN npm run build

# Expõe porta padrao do Backend Node
EXPOSE 3333

CMD ["npm", "start"]
