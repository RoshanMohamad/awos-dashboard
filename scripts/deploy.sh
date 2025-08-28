#!/bin/bash

# AWOS Dashboard Deployment Script
# This script deploys the application to a VPS using Docker

set -e

# Configuration
REPO_URL="https://github.com/yourusername/awos-dashboard.git"
DEPLOY_PATH="/srv/awos-dashboard"
COMPOSE_FILE="docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   log_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create deployment directory if it doesn't exist
if [ ! -d "$DEPLOY_PATH" ]; then
    log_info "Creating deployment directory: $DEPLOY_PATH"
    sudo mkdir -p "$DEPLOY_PATH"
    sudo chown $USER:$USER "$DEPLOY_PATH"
fi

# Navigate to deployment directory
cd "$DEPLOY_PATH"

# Clone or update repository
if [ ! -d ".git" ]; then
    log_info "Cloning repository..."
    git clone "$REPO_URL" .
else
    log_info "Updating repository..."
    git fetch origin
    git reset --hard origin/main
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    log_warn ".env.production not found. Creating template..."
    cat > .env.production << EOF
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://qxivgtnfvyorrtnqmmsz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aXZndG5mdnlvcnJ0bnFtbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMzQ1NjMsImV4cCI6MjA3MTcxMDU2M30.o2nNNZeHgi8O_9KAVjScrE6b04cvcAvNVeS1RCAM--s
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aXZndG5mdnlvcnJ0bnFtbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjEzNDU2MywiZXhwIjoyMDcxNzEwNTYzfQ.1IQwg1HpHlsnyNL1To6FMDkc2jd3nO0Kfr_jsG_libA
NEXT_PUBLIC_BASE_URL=https://roshanmohamad.github.io/awos-dashboard/

EOF
    log_error "Please edit .env.production with your actual values before continuing"
    exit 1
fi

# Build and deploy
log_info "Building and deploying application..."

# Pull latest images (if using pre-built images)
if docker compose -f "$COMPOSE_FILE" pull; then
    log_info "Using pre-built images"
else
    log_info "Building images locally"
fi

# Deploy with zero-downtime
log_info "Starting deployment..."
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

# Wait for health check
log_info "Waiting for application to be healthy..."
sleep 30

# Health check
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    log_info "Application is healthy!"
else
    log_error "Health check failed. Check logs with: docker compose -f $COMPOSE_FILE logs"
    exit 1
fi

# Clean up old images and containers
log_info "Cleaning up old Docker resources..."
docker system prune -f --filter "until=24h"

log_info "Deployment completed successfully!"
log_info "Application is running at http://localhost:3000"
log_info "To view logs: docker compose -f $COMPOSE_FILE logs -f"
log_info "To stop: docker compose -f $COMPOSE_FILE down"
