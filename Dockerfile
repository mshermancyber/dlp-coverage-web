FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx \
    && rm -rf /var/lib/apt/lists/*

# Remove default nginx site
RUN rm -f /etc/nginx/sites-enabled/default

# Copy nginx site config
COPY nginx.conf /etc/nginx/sites-enabled/dlp-coverage-map.conf

# Copy the app
COPY dlp-coverage-map.html /var/www/dlp-coverage-map/index.html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
