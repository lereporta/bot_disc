FROM node:18

# Diretório de trabalho dentro do container
WORKDIR /usr/src/app

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm install

# Copiar todo o resto do código
COPY . .

# Expor a porta (não obrigatório se não usa servidor HTTP)
EXPOSE 3000

# Comando para rodar o bot
CMD ["node", "index.js"]

