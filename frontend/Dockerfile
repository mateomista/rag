# frontend/Dockerfile

FROM node:20-alpine

WORKDIR /app

# Copiamos los archivos de dependencias
COPY package.json package-lock.json* ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Exponemos el puerto 3000
EXPOSE 3000

# Iniciamos en modo desarrollo
CMD ["npm", "run", "dev"]