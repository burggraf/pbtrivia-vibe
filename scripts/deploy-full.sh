#!/bin/bash
set -e

echo "=== Full Deployment ==="
echo "1. Building and deploying frontend..."
./scripts/deploy-frontend.sh

echo ""
echo "2. Deploying migrations..."
./scripts/deploy-migrations.sh

echo ""
echo "=== Deployment Complete ==="

