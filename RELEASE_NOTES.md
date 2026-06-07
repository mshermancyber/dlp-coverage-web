# DLP Coverage Web — v1.0.0

**Release Date:** June 6, 2026
**License:** GPL-3.0-or-later

## Overview

First stable release of DLP Coverage Web as a full React + TypeScript application. Previously released as a single-file static HTML application (BETA 1–3), this version is a ground-up rewrite with a modern component architecture, type safety, and Docker-based deployment.

## What's New in v1.0.0

### Architecture
- Complete React 19 + TypeScript rewrite from the BETA 3 static HTML app
- 12 modular components with clean separation of concerns
- React Context for global state management
- Runtime-validated localStorage persistence
- Whitelist-based input validation for all imported/loaded data

### 3D Visualization
- `@react-three/fiber` and `@react-three/drei` replacing raw Three.js
- Smooth damped camera zoom to selected nodes
- Deterministic node rotations (no more random jumps)
- Proper geometry/memory disposal on unmount

### Security
- Full input validation on localStorage load and JSON import
- Content-Security-Policy, HSTS, X-Frame-Options, X-Content-Type-Options headers
- XSS protection via React JSX escaping + HTML report escaping
- Per-container TLS certificate generation (not baked into image)
- No secrets, API keys, or credentials in the codebase

### Deployment
- Multi-stage Docker build (Node 22 builder → Debian bookworm + nginx)
- HTTPS on port 8443 with auto-generated self-signed TLS
- HTTP on port 8080 with automatic 301 redirect to HTTPS
- Volume-mountable TLS certificates for production use
- Health check endpoint at `/health`

## Upgrading from BETA 3

v1.0.0 is backward-compatible with BETA 3 JSON save files. Your existing `.json` exports and localStorage data will load normally (validated on import for safety).

### Docker users
```bash
docker compose down
docker compose up -d --build
```

### Non-Docker users
```bash
npm install
npm run build
# Serve dist/ with any static file server
```

## Known Limitations
- Self-signed TLS certificate requires browser exception (replace with real cert for production)
- Three.js bundle (~310KB gzipped) — code splitting deferred to future release
- No multi-user or server-side persistence (by design — self-contained single-user tool)

## File Manifest
See `MANIFEST.sha256` for integrity verification.
