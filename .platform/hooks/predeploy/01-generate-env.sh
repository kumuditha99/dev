#!/usr/bin/env bash
# Exit on error
set -e

echo "Generating .env file from EB environment variables..."

PRIVATE_IP=$(hostname -I | awk '{print $1}')
COMBINED_HOSTNAME="${HOSTNAME}-${PRIVATE_IP}"

cat > .env <<EOF
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}
DB_DATABASE=${DB_DATABASE}
HOSTNAME=${COMBINED_HOSTNAME}
LOKI_ENDPOINT=${LOKI_ENDPOINT}
PROMETHEUS_ENDPOINT=${PROMETHEUS_ENDPOINT}
EOF

echo ".env file generated."
