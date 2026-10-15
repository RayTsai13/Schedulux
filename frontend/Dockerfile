# Build context: repository root (see docker-compose.yml)

# Stage 1: Build the shared availability engine (used by /playground)
FROM node:20-alpine AS engine
WORKDIR /app/packages/availability-engine
COPY packages/availability-engine/package*.json ./
RUN npm ci
COPY packages/availability-engine/ ./
RUN npm run build && npm prune --omit=dev

# Stage 2: Build the SPA
FROM node:20-alpine AS builder
COPY --from=engine /app/packages/availability-engine /app/packages/availability-engine
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 3: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
