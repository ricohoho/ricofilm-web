# Spécifie l'image de base
FROM node:latest
# DÃ©finit le rÃ©pertoire de travail
WORKDIR /app
# Copie les fichiers de l'application
COPY package*.json ./
COPY app.js ./
# Installe les dÃ©pendances
RUN npm install
#  Copie les sources dependante
COPY . .
# Expose le port
EXPOSE 3000
# Démarrer l'application
CMD ["npm", "start"]