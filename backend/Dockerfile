FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Build
RUN npm run build

EXPOSE 3000

# Usar start:prod
CMD ["npm", "run", "start:prod"]
