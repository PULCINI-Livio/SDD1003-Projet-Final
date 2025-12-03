FROM node:20-alpine
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy all source code and public assets
COPY . .

# Expose Node port
EXPOSE 3000

# Start the server
CMD ["node", "src/server.js"]
