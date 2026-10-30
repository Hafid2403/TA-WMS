#!/bin/bash

# WMS (Warehouse Management System) - Unified Deployment Script
# Orchestrates and automates the sequential startup of both Frontend and Backend environments

set -e

echo "══════════════════════════════════════════════"
echo " 🌐 WMS FULL SYSTEM UNIFIED DEPLOYMENT"
echo "══════════════════════════════════════════════"

# Get current script directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if Docker is installed and running
if ! [ -x "$(command -v docker)" ]; then
  echo "❌ Error: Docker is not installed. Please install Docker before running WMS." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "❌ Error: Docker daemon is not running. Please start Docker first." >&2
  exit 1
fi

# ──────────────────────────────────────────────────
# 1. Start Backend Environment
# ──────────────────────────────────────────────────
echo ""
echo "⚙️  Step 1: Deploying Backend Services..."
cd "$ROOT_DIR/backend"
if [ -f "./deploy.sh" ]; then
    bash ./deploy.sh
else
    echo "❌ Error: backend/deploy.sh not found!"
    exit 1
fi

# ──────────────────────────────────────────────────
# 2. Start Frontend Environment
# ──────────────────────────────────────────────────
echo ""
echo "⚙️  Step 2: Deploying Frontend Services..."
cd "$ROOT_DIR/frontend"
if [ -f "./deploy.sh" ]; then
    bash ./deploy.sh
else
    echo "❌ Error: frontend/deploy.sh not found!"
    exit 1
fi

# ──────────────────────────────────────────────────
# 3. Final Verification & Info Panel
# ──────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════"
echo " 🎉 ALL WMS SERVICES ARE UP AND RUNNING!"
echo "══════════════════════════════════════════════"
echo " 🖥️  Frontend: http://localhost:49977"
echo " 🔌 Backend API: http://localhost:49978"
echo "══════════════════════════════════════════════"
echo "💡 Commands for monitoring logs:"
echo "   • Backend Logs:  cd backend && docker compose logs -f"
echo "   • Frontend Logs: cd frontend && docker compose logs -f"
echo "══════════════════════════════════════════════"
