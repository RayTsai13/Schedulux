# Build context: repository root (see docker-compose.yml)

# Stage 1: Build the shared availability engine
FROM node:20-alpine AS engine
WORKDIR /app/packages/availability-engine
COPY packages/availability-engine/package*.json ./
RUN npm ci
COPY packages/availability-engine/ ./
RUN npm run build && npm prune --omit=dev

# Stage 2: Build the API
FROM node:20-alpine AS builder
COPY --from=engine /app/packages/availability-engine /app/packages/availability-engine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/tsconfig.json backend/tsconfig.build.json ./
COPY backend/src/ ./src/
RUN npm run build

# Stage 3: Production
FROM node:20-alpine
# The backend links the engine via file:../packages/availability-engine, so keep the same layout
COPY --from=engine /app/packages/availability-engine /app/packages/availability-engine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/backend/dist ./dist
COPY backend/migrations/ ./migrations/
ENV NODE_ENV=production
EXPOSE 3000
CMD ["sh", "-c", "npm run migrate && npm start"]
