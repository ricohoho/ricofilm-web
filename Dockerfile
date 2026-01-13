# Spécifie l'image de base
FROM node:18-alpine
#FROM node:18-alpine
#FROM node:12-alpine
# DÃ©finit le rÃ©pertoire de travail
WORKDIR /app
# Copie les fichiers de l'application
COPY package*.json ./
#COPY app.js ./
## Installe les dÃ©pendances
## RUN npm install
# Installe les dépendances et nettoie le cache
RUN npm ci && npm cache clean --force
#  Copie les sources dependante
COPY . .
#  Utilisé pour le deploiment dans GitHub ou le fichier .env.production est géné a la volée
COPY .env.production .env.production
# Crée un utilisateur non-root pour exécuter l'application
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
# Expose le port
EXPOSE 3000
# Démarrer l'application
CMD ["npm", "start"]