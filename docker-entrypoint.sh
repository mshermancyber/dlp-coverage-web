#!/bin/bash
set -e

CERT_DIR="/etc/nginx/ssl"
CERT_FILE="${CERT_DIR}/selfsigned.crt"
KEY_FILE="${CERT_DIR}/selfsigned.key"

# Only generate a self-signed cert if one wasn't volume-mounted in
if [ ! -f "${CERT_FILE}" ] || [ ! -f "${KEY_FILE}" ]; then
    mkdir -p "${CERT_DIR}"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "${KEY_FILE}" \
        -out "${CERT_FILE}" \
        -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=localhost" \
        2>/dev/null
    echo "Generated new self-signed TLS certificate"
fi

exec "$@"
