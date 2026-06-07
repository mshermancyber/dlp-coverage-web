# DLP Coverage Web

> GPL-3.0-or-later · Self-hosted · React + Three.js · Docker/nginx

An interactive 3D DLP (Data Loss Prevention) policy coverage mapping tool. Define your data classifications, map exfiltration channels, create enforcement rules, and visualize gaps in real time on a rotating 3D node graph.

---

## Features

- **3D interactive graph** — Three.js visualization with classification and vector nodes, color-coded by coverage depth
- **Rule builder** — multi-classification support, auto-generated rule names (`DLP-{Channel}-{Classification}-{Response}`)
- **Coverage thresholds** — green (2+ rules), yellow (1 rule), red (0 rules)
- **Click to zoom** — click any node to zoom in and see all rules covering it
- **Org info panel** — organization name, department, audience, analyst fields
- **PDF report export** — print-ready coverage matrix, gap analysis, full rule list
- **Save / Load** — exports JSON + auto-saves to browser localStorage
- **HTTPS by default** — nginx reverse proxy with self-signed TLS, auto HTTP to HTTPS redirect
- **5 tab panels** — Rules, All Rules, Org, Classes, Vectors
- **GPL-3.0 licensed** — fully open source

---

## Project structure

```
.
├── src/                       # React source code
│   ├── components/            # React components
│   │   ├── Sidebar.tsx        # Sidebar with tab navigation
│   │   ├── RulesTab.tsx       # Rule creation + recent rules
│   │   ├── AllRulesTab.tsx    # Filtered full rule list
│   │   ├── OrgTab.tsx         # Organization info form
│   │   ├── ClassesTab.tsx     # Classification coverage cards
│   │   ├── VectorsTab.tsx     # Vector detail panels
│   │   ├── ThreeGraph.tsx     # 3D graph (@react-three/fiber)
│   │   ├── Toolbar.tsx        # Top toolbar (legend + save/load/report)
│   │   ├── OrgBanner.tsx      # Org info banner
│   │   ├── StatsBar.tsx       # Bottom statistics bar
│   │   ├── InfoPanel.tsx      # Slide-up node detail panel
│   │   └── Tooltip.tsx        # Hover tooltip
│   ├── context/
│   │   └── AppContext.tsx     # React context for global state + localStorage
│   ├── data/
│   │   ├── types.ts           # TypeScript type definitions
│   │   ├── vectors.ts         # Exfiltration channel definitions
│   │   └── presets.ts         # Classification presets + risk levels
│   ├── utils/
│   │   ├── coverage.ts        # Coverage counting + color helpers
│   │   └── report.ts          # PDF report generation + save/load
│   ├── styles/
│   │   └── global.css         # Dark theme stylesheet
│   ├── App.tsx                # Root app component
│   └── main.tsx               # React entry point
├── public/                    # Static assets served by Vite
├── nginx/
│   └── nginx.conf             # nginx site config (HTTPS + redirect + CSP)
├── assets/                    # Project branding (logo, screenshots)
├── examples/                  # Sample data, report, and screenshot
├── archive/                   # Original static HTML (backward-compat reference)
├── release/                   # Versioned release artifacts
├── Dockerfile                 # Multi-stage: Node build + nginx serve
├── docker-compose.yml         # Compose deployment (ports 8080, 8443)
├── docker-entrypoint.sh       # TLS cert generation at startup
├── package.json               # Vite + React 19 + Three.js deps
├── vite.config.ts             # Vite build config
└── tsconfig.json              # TypeScript config
```

---

## Tech stack

- **React 19** with TypeScript
- **Three.js** via `@react-three/fiber` + `@react-three/drei`
- **Vite 8** for build tooling
- **nginx** for serving + TLS termination
- **Docker** multi-stage build

---

## Development

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Type check
npx tsc --noEmit

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Quick start (Docker)

### Docker Compose (recommended)

```bash
docker compose up -d --build
```

Open: `https://localhost:8443` (or `http://localhost:8080` which redirects to HTTPS)

Note: browser will show a certificate warning since it's self-signed — this is expected for local deployments.

### Plain Docker

```bash
docker build -t dlp-coverage-web .
docker run -d --name dlp-coverage-web \
  -p 8080:80 -p 8443:443 \
  --restart unless-stopped \
  dlp-coverage-web
```

---

## Port mapping

| Host port | Container port | Protocol | Behavior |
|-----------|---------------|----------|----------|
| 8080 | 80 | HTTP | 301 redirect to `https://host:8443` |
| 8443 | 443 | HTTPS | Serves the app with TLS |

To change ports, edit the `ports` section in `docker-compose.yml`.

---

## Replacing the TLS certificate

Volume-mount your own cert to override the auto-generated self-signed default:

```yaml
volumes:
  - /path/to/fullchain.pem:/etc/nginx/ssl/selfsigned.crt:ro
  - /path/to/privkey.pem:/etc/nginx/ssl/selfsigned.key:ro
```

---

## Rebuild after updates

Any time source files change:

```bash
docker compose down
docker compose up -d --build
```

---

## License

Copyright (C) 2025 Contributors

This program is free software: you can redistribute it and/or modify it under the terms of the **GNU General Public License** as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

See [https://www.gnu.org/licenses/gpl-3.0.txt](https://www.gnu.org/licenses/gpl-3.0.txt) for the full license text.

`SPDX-License-Identifier: GPL-3.0-or-later`
