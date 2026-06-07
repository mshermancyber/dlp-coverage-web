# ── Stage 1: Build React app ──
FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build

# ── Stage 2: Production image with nginx ──
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Remove default nginx site
RUN rm -f /etc/nginx/sites-enabled/default

# Copy nginx site config
COPY nginx/nginx.conf /etc/nginx/sites-enabled/dlp-coverage-map.conf

# Copy built React app from builder stage
COPY --from=builder /app/dist/ /var/www/dlp-coverage-map/

# Entrypoint: generate a unique self-signed cert at container startup, then start nginx.
# Override by volume-mounting your own certs to /etc/nginx/ssl/.
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80 443

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
