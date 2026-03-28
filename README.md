# DLP Coverage Web — BETA 3

> GPL-3.0-or-later · Self-hosted · Single HTML file · Debian/nginx Docker container

An interactive 3D DLP policy coverage mapping tool. Define your data classifications, map exfiltration channels, create enforcement rules, and visualize gaps in real time on a rotating 3D node graph.

---

## Features

- **3D interactive graph** — Three.js force-directed model with classification and vector nodes, color-coded by coverage depth
- **Rule builder** — multi-classification support, auto-generated rule names (`DLP-{Channel}-{Classification}-{Response}`)
- **Coverage thresholds** — green (2+ rules), yellow (1 rule), red (0 rules)
- **Click to zoom** — click any node to zoom in and see all rules covering it
- **Org info panel** — org name, department, audience, analyst pre-populated
- **PDF report export** — print-ready coverage matrix, gap analysis, full rule list
- **Save / Load** — exports JSON + auto-saves to browser localStorage
- **GPL-3.0 licensed** — fully open source

---

## Project structure

```
.
├── dlp-coverage-map.html   # The entire application (self-contained)
├── logo.png                # Anonymous crest — favicon + header logo
├── Dockerfile              # debian:bookworm-slim + nginx
├── docker-compose.yml      # Compose deployment (port 8080)
├── nginx.conf              # nginx site config with security headers
├── .dockerignore
├── README.md
└── SETUP.txt               # Step-by-step deployment instructions
```

---

## Quick start

### Docker Compose (recommended)

```bash
docker compose up -d --build
```

Open: `http://<host-ip>:8080`

### Plain Docker

```bash
docker build -t dlp-coverage-web .
docker run -d --name dlp-coverage-web -p 8080:80 --restart unless-stopped dlp-coverage-web
```

---

## Rebuild after updates

Any time `dlp-coverage-map.html` changes:

```bash
docker compose down
docker compose up -d --build
```

---

## Changing the port

Edit `docker-compose.yml`:

```yaml
ports:
  - "80:80"      # standard HTTP
  - "8080:80"    # non-privileged
  - "3000:80"    # custom
```

---

## License

Copyright (C) 2025 Contributors

This program is free software: you can redistribute it and/or modify it under the terms of the **GNU General Public License** as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

See [https://www.gnu.org/licenses/gpl-3.0.txt](https://www.gnu.org/licenses/gpl-3.0.txt) for the full license text.

`SPDX-License-Identifier: GPL-3.0-or-later`
