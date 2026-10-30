#!/bin/bash

# WMS (Warehouse Management System) - Frontend Deployment Script
# Handles container compilation, building and startup

set -e

echo "══════════════════════════════════════════════"
echo " 🚀 WMS FRONTEND DEPLOYMENT"
echo "══════════════════════════════════════════════"

# ──────────────────────────────────────────────────
# 1. Build & Start Containers
# ──────────────────────────────────────────────────

echo "🐳 Building and starting Frontend Docker container..."
docker compose up -d --build

# ──────────────────────────────────────────────────
# 2. Health Check - Wait for Frontend Container
# ──────────────────────────────────────────────────

echo "⏳ Waiting for frontend container to be ready..."
MAX_RETRIES=30
COUNT=0
until [ "$(docker inspect -f '{{.State.Running}}' wms-frontend 2>/dev/null)" == "true" ] || [ $COUNT -eq $MAX_RETRIES ]; do
    echo "  Waiting for container... ($COUNT/$MAX_RETRIES)"
    sleep 2
    COUNT=$((COUNT + 1))
done

if [ $COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Timeout: Frontend container failed to start."
    exit 1
fi

echo ""
echo "══════════════════════════════════════════════"
echo " ✅ WMS FRONTEND DEPLOYMENT COMPLETE"
echo " 🌐 Frontend is running on http://localhost:49977"
echo "══════════════════════════════════════════════"
