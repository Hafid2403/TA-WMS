#!/bin/bash

# WMS (Warehouse Management System) - Backend Deployment Script
# Handles configuration setup, container building, dependency installation,
# permissions, health checks, and database migrations.

set -e

echo "══════════════════════════════════════════════"
echo " 🚀 WMS BACKEND DEPLOYMENT"
echo "══════════════════════════════════════════════"

# ──────────────────────────────────────────────────
# 1. Environment Configuration
# ──────────────────────────────────────────────────

if [ ! -f .env ]; then
    echo "📄 .env not found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ .env created."
fi

echo "🔧 Modifying environment variables to match Docker environment..."

# Helper to securely set or replace variables in the .env file
set_env_var() {
    local key=$1
    local value=$2
    if grep -q "^${key}=" .env; then
        sed -i "s|^${key}=.*|${key}=${value}|" .env
    elif grep -q "^# ${key}=" .env; then
        sed -i "s|^# ${key}=.*|${key}=${value}|" .env
    else
        echo "${key}=${value}" >> .env
    fi
}

set_env_var "APP_ENV" "production"
set_env_var "APP_DEBUG" "false"
set_env_var "DB_CONNECTION" "mysql"
set_env_var "DB_HOST" "db"
set_env_var "DB_PORT" "3306"
set_env_var "DB_DATABASE" "wmsmuhamad"
set_env_var "DB_USERNAME" "user"
set_env_var "DB_PASSWORD" "password"

echo "✅ Environment variables updated."

# ──────────────────────────────────────────────────
# 2. Build & Start Containers
# ──────────────────────────────────────────────────

echo "🐳 Building and starting Docker containers..."
docker compose up -d --build

# ──────────────────────────────────────────────────
# 3. Health Check - Wait for App Container
# ──────────────────────────────────────────────────

echo "⏳ Waiting for application container to be ready..."
MAX_RETRIES=30
COUNT=0
until [ "$(docker inspect -f '{{.State.Running}}' wms-backend-app 2>/dev/null)" == "true" ] || [ $COUNT -eq $MAX_RETRIES ]; do
    echo "  Waiting for container... ($COUNT/$MAX_RETRIES)"
    sleep 2
    COUNT=$((COUNT + 1))
done

if [ $COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Timeout: Application container failed to start."
    exit 1
fi

# ──────────────────────────────────────────────────
# 4. Health Check - Wait for MySQL
# ──────────────────────────────────────────────────

echo "⏳ Waiting for MySQL to accept connections..."
COUNT=0
until docker compose exec -T db mysqladmin ping -h "localhost" --silent 2>/dev/null || [ $COUNT -eq $MAX_RETRIES ]; do
    echo "  Waiting for MySQL... ($COUNT/$MAX_RETRIES)"
    sleep 3
    COUNT=$((COUNT + 1))
done

if [ $COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Timeout: MySQL failed to accept connections."
    exit 1
fi

echo "✅ MySQL is ready."

# ──────────────────────────────────────────────────
# 5. Health Check - Wait for Vendor Autoload
# ──────────────────────────────────────────────────

echo "⏳ Checking vendor availability..."
COUNT=0
until docker compose exec -T app ls /var/www/vendor/autoload.php > /dev/null 2>&1 || [ $COUNT -eq $MAX_RETRIES ]; do
    echo "  Waiting for vendor/autoload.php..."
    sleep 2
    COUNT=$((COUNT + 1))
done

# ──────────────────────────────────────────────────
# 6. Install Dependencies
# ──────────────────────────────────────────────────

echo "📦 Installing Composer dependencies..."
docker compose exec -u root -T app git config --global --add safe.directory /var/www
docker compose exec -u root -T app composer install --no-interaction --prefer-dist --optimize-autoloader

# ──────────────────────────────────────────────────
# 7. Permissions
# ──────────────────────────────────────────────────

echo "🔒 Setting directory permissions..."
docker compose exec -u root -T app chmod -R 775 storage bootstrap/cache
docker compose exec -u root -T app chown -R www-data:www-data storage bootstrap/cache

# ──────────────────────────────────────────────────
# 8. Clear Old Caches
# ──────────────────────────────────────────────────

echo "🧹 Clearing old caches..."
docker compose exec -T app php artisan config:clear || true
docker compose exec -T app php artisan route:clear || true
docker compose exec -T app php artisan view:clear || true

# ──────────────────────────────────────────────────
# 9. Laravel Core Setup
# ──────────────────────────────────────────────────

echo "🔑 Generating application key..."
docker compose exec -u root -T app php artisan key:generate --force || true

echo "🔗 Creating storage symlink..."
docker compose exec -u root -T app php artisan storage:link --force || true

# ──────────────────────────────────────────────────
# 10. Database Migration & Seeding
# ──────────────────────────────────────────────────

echo "🗄️  Running database migrations and seeding..."
docker compose exec -T app php artisan migrate:fresh --seed --force

# ──────────────────────────────────────────────────
# 11. Production Optimization
# ──────────────────────────────────────────────────

echo "⚡ Optimizing application for production..."
docker compose exec -T app php artisan config:cache
docker compose exec -T app php artisan route:cache
docker compose exec -T app php artisan view:cache

echo ""
echo "══════════════════════════════════════════════"
echo " ✅ WMS BACKEND DEPLOYMENT COMPLETE"
echo " 🌐 Backend API is running on http://localhost:49978"
echo "══════════════════════════════════════════════"
