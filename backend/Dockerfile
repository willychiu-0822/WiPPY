FROM node:20-slim
WORKDIR /app

# Install all deps (including devDeps needed for TypeScript build)
COPY package*.json ./
RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Prune dev dependencies after build
RUN npm prune --production

EXPOSE 8080
CMD ["node", "dist/index.js"]
