# Base image : Node.js avec Debian pour faciliter l'installation Python
FROM node:20-bullseye

# Installer Python 3 et pip
RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Définir le dossier de travail
WORKDIR /app

# Copier les fichiers Node.js depuis backend
COPY backend/package*.json ./
RUN npm install --production

# Copier le front-end dans l'image
COPY frontend/ ../frontend/

# Copier le reste du backend
COPY backend/ ./

# Installer les dépendances Python
RUN pip install --no-cache-dir \
      torch==2.4.0 --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir \
      sentence-transformers \
      pymongo \
      numpy \
      python-dotenv \
      scikit-learn \
      xgboost \
      matplotlib \
      seaborn \
      pandas

# Exposer le port Node.js
EXPOSE 3000

# Commande pour lancer le serveur Node.js
CMD ["node", "src/server.js"]
