FROM node:16-bullseye

WORKDIR /app

# Copie les fichiers de configuration
COPY package*.json ./

# Installe les dépendances
RUN npm ci && npm cache clean --force

# Copie le reste de l'application
COPY . .

# Copie le fichier .env.production
COPY .env.production .env.production

# Crée un utilisateur non-root
RUN apt-get update && apt-get install -y sudo && \
    groupadd -r appgroup && useradd -r -g appgroup appuser && \
    mkdir -p /home/appuser && chown -R appuser:appgroup /home/appuser && \
    chown -R appuser:appgroup /app

# Passe à l'utilisateur non-root
USER appuser

# Expose le port
EXPOSE 3000

# Définit NODE_ENV explicitement
ENV NODE_ENV=production

# Démarre l'application
CMD ["npm", "start"]
