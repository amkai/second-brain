FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies for both client and server
COPY package.json package-lock.json* ./
COPY server/package.json ./server/
COPY client/package.json ./client/

RUN npm install --workspace=server
RUN npm install --workspace=client

# Copy source code
COPY . .

# Build client
RUN npm run build --workspace=client

# Build server
RUN npm run build --workspace=server

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=base /app/server/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/server/package.json ./
COPY --from=base /app/client/dist ./public

ENV NODE_ENV=production
ENV PORT=3001
ENV STATIC_DIR=/app/public
ENV DATA_DIR=/app/data

EXPOSE 3001

CMD ["node", "dist/index.js"]
