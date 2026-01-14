FROM node:12-bullseye

WORKDIR /app

# Installe sudo et crée un utilisateur non-root
RUN apt-get update && apt-get install -y sudo && \
    groupadd -r appgroup && useradd -r -g appgroup appuser && \
    mkdir -p /home/appuser && chown -R appuser:appgroup /home/appuser

# Copie les fichiers de configuration
COPY package*.json ./

# Installe les dépendances en tant que root
RUN npm install

# Copie le reste de l'application
COPY . .

# Copie le fichier .env.production
COPY .env.production .

# Change les permissions pour l'utilisateur non-root
RUN chown -R appuser:appgroup /app

# Passe à l'utilisateur non-root
USER appuser

# Expose le port
EXPOSE 3000

# Définit NODE_ENV explicitement
#ENV NODE_ENV=production
ENV NODE_ENV=local

# Démarre l'application
CMD ["npm", "start"]
