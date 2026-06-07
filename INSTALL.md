# DLP Coverage Web — Installation Guide

## Prerequisites
- Docker and Docker Compose (recommended)
- Alternatively: Node.js 22+ and npm

## Option 1: Docker Compose (recommended)

```bash
cd dlp-coverage-web_v1.0.0_2026-06-06
docker compose up -d --build
```

Open `https://localhost:8443` (accept the self-signed certificate warning).

HTTP on port 8080 redirects automatically to HTTPS.

## Option 2: Docker (manual)

```bash
docker build -t dlp-coverage-web .
docker run -d --name dlp-coverage-web \
  -p 8080:80 -p 8443:443 \
  --restart unless-stopped \
  dlp-coverage-web
```

## Option 3: Node.js (no Docker)

```bash
npm install
npm run build
# Serve the dist/ directory with any static file server, e.g.:
npx serve -s dist -l 8443
```

Note: without nginx, TLS and the HTTP→HTTPS redirect are not provided. Use a reverse proxy (nginx, Caddy, etc.) for production.

## Changing Ports

Edit `docker-compose.yml`:
```yaml
ports:
  - "8080:80"    # Change 8080 to your preferred HTTP port
  - "8443:443"   # Change 8443 to your preferred HTTPS port
```

If you change the HTTPS port, also update the redirect target in `nginx/nginx.conf`.

## Replacing the TLS Certificate

Volume-mount your own certificate in `docker-compose.yml`:
```yaml
services:
  dlp-coverage-map:
    volumes:
      - /path/to/fullchain.pem:/etc/nginx/ssl/selfsigned.crt:ro
      - /path/to/privkey.pem:/etc/nginx/ssl/selfsigned.key:ro
```

The container will use mounted certificates instead of generating a self-signed one.

## Verifying Integrity

```bash
sha256sum -c MANIFEST.sha256 | grep -v 'OK$'
```
Empty output means all files are intact.

## Upgrading

1. Back up your data: click **💾 Save** in the app toolbar to export a JSON file
2. Stop and remove the old container: `docker compose down`
3. Deploy the new version: `docker compose up -d --build`
4. Load your data: click **📂 Load** and select the JSON file
