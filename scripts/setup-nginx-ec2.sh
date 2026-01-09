#!/bin/bash

# =============================================================================
# Work-Zen NGINX Setup Script for EC2
# =============================================================================
# This script sets up NGINX with Docker on an EC2 instance
# Run this script on your EC2 instance after cloning the repository
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root. Run as a regular user with sudo privileges."
    exit 1
fi

print_header "Work-Zen NGINX Setup for EC2"

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"
print_success "Working directory: $PROJECT_DIR"

# =============================================================================
# Step 1: Create necessary directories
# =============================================================================
print_header "Step 1: Creating directories"

mkdir -p nginx/logs
mkdir -p certbot/conf
mkdir -p certbot/www

print_success "Created nginx/logs directory"
print_success "Created certbot directories"

# =============================================================================
# Step 2: Check Docker installation
# =============================================================================
print_header "Step 2: Checking Docker installation"

if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    echo "Run these commands to install Docker:"
    echo "  sudo apt update"
    echo "  sudo apt install -y docker.io"
    echo "  sudo systemctl enable docker"
    echo "  sudo usermod -aG docker \$USER"
    exit 1
fi
print_success "Docker is installed: $(docker --version)"

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not installed."
    exit 1
fi
print_success "Docker Compose is available"

# =============================================================================
# Step 3: Check environment file
# =============================================================================
print_header "Step 3: Checking environment configuration"

if [ ! -f ".env" ]; then
    print_warning ".env file not found. Creating from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning "Please edit .env file with your configuration:"
        echo "  nano .env"
    else
        cat > .env << 'EOF'
# MongoDB Configuration
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/
MONGO_DB_NAME=ems_database

# API Keys
OPENROUTER_API_KEY=sk-or-v1-your_key_here
HUGGINGFACE_API_KEY=hf_your_key_here

# URLs - Update with your EC2 IP or domain
NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP/api
FRONTEND_URL=http://YOUR_EC2_IP

# Docker Image Tag
IMAGE_TAG=latest
EOF
        print_warning "Created .env file. Please edit it with your configuration:"
        echo "  nano .env"
    fi
    exit 1
fi
print_success ".env file exists"

# =============================================================================
# Step 4: Stop existing containers
# =============================================================================
print_header "Step 4: Stopping existing containers"

docker-compose down 2>/dev/null || true
docker-compose -f docker-compose.nginx.yml down 2>/dev/null || true

print_success "Stopped existing containers"

# =============================================================================
# Step 5: Pull latest images
# =============================================================================
print_header "Step 5: Pulling latest Docker images"

docker-compose -f docker-compose.nginx.yml pull

print_success "Pulled latest images"

# =============================================================================
# Step 6: Start services with NGINX
# =============================================================================
print_header "Step 6: Starting services with NGINX"

docker-compose -f docker-compose.nginx.yml up -d

print_success "Services started"

# =============================================================================
# Step 7: Wait for services to be healthy
# =============================================================================
print_header "Step 7: Waiting for services to be healthy"

echo "Waiting for containers to start..."
sleep 10

# Check container status
echo ""
echo "Container Status:"
docker-compose -f docker-compose.nginx.yml ps

# =============================================================================
# Step 8: Test endpoints
# =============================================================================
print_header "Step 8: Testing endpoints"

echo "Testing health endpoint..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost/health | grep -q "200"; then
    print_success "NGINX health check passed"
else
    print_warning "NGINX health check returned non-200 status (service may still be starting)"
fi

echo ""
echo "Testing frontend..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost/ | grep -qE "200|304"; then
    print_success "Frontend is accessible"
else
    print_warning "Frontend may still be starting up"
fi

echo ""
echo "Testing backend API..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health 2>/dev/null | grep -q "200"; then
    print_success "Backend API is accessible"
else
    print_warning "Backend API may still be starting up"
fi

# =============================================================================
# Summary
# =============================================================================
print_header "Setup Complete!"

# Get public IP
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com 2>/dev/null || echo "YOUR_EC2_IP")

echo -e "${GREEN}Your Work-Zen application is now running with NGINX!${NC}"
echo ""
echo "Access your application at:"
echo -e "  ${BLUE}Frontend:${NC}  http://$PUBLIC_IP"
echo -e "  ${BLUE}API:${NC}       http://$PUBLIC_IP/api/"
echo -e "  ${BLUE}API Docs:${NC}  http://$PUBLIC_IP/docs"
echo ""
echo "Useful commands:"
echo "  View logs:      docker-compose -f docker-compose.nginx.yml logs -f"
echo "  NGINX logs:     docker-compose -f docker-compose.nginx.yml logs -f nginx"
echo "  Stop services:  docker-compose -f docker-compose.nginx.yml down"
echo "  Restart:        docker-compose -f docker-compose.nginx.yml restart"
echo ""

# SSL setup instructions
print_header "Optional: Setup SSL with Let's Encrypt"

echo "If you have a domain name, you can enable HTTPS:"
echo ""
echo "1. Point your domain to: $PUBLIC_IP"
echo ""
echo "2. Run the SSL setup script:"
echo "   ./scripts/setup-ssl.sh your-domain.com"
echo ""
echo "3. Update your .env file:"
echo "   NEXT_PUBLIC_API_URL=https://your-domain.com/api"
echo "   FRONTEND_URL=https://your-domain.com"
echo ""
