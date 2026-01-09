#!/bin/bash

# =============================================================================
# Work-Zen SSL Setup Script
# =============================================================================
# This script sets up Let's Encrypt SSL certificates for your domain
# Usage: ./scripts/setup-ssl.sh your-domain.com [email@example.com]
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check arguments
if [ -z "$1" ]; then
    print_error "Usage: $0 <domain> [email]"
    echo "  Example: $0 work-zen.example.com admin@example.com"
    exit 1
fi

DOMAIN="$1"
EMAIL="${2:-admin@$DOMAIN}"

print_header "SSL Setup for $DOMAIN"

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# =============================================================================
# Step 1: Create directories
# =============================================================================
print_header "Step 1: Creating certificate directories"

mkdir -p certbot/conf
mkdir -p certbot/www

print_success "Created certbot directories"

# =============================================================================
# Step 2: Update NGINX configuration for domain
# =============================================================================
print_header "Step 2: Updating NGINX configuration"

# Create domain-specific NGINX config
cat > nginx/conf.d/default.conf << EOF
# HTTP server - handles Let's Encrypt challenge and redirects to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Redirect to HTTPS (after certificates are obtained)
    location / {
        # Temporarily serve content for initial certificate request
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api/ {
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /docs {
        proxy_pass http://backend/docs;
        proxy_set_header Host \$host;
    }

    location /redoc {
        proxy_pass http://backend/redoc;
        proxy_set_header Host \$host;
    }

    location /openapi.json {
        proxy_pass http://backend/openapi.json;
        proxy_set_header Host \$host;
    }
}
EOF

print_success "Updated NGINX configuration for $DOMAIN"

# =============================================================================
# Step 3: Update docker-compose to include certbot volumes
# =============================================================================
print_header "Step 3: Enabling SSL in Docker Compose"

# Create SSL-enabled docker-compose
cat > docker-compose.ssl.yml << EOF
services:
  nginx:
    image: nginx:alpine
    container_name: work-zen-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/logs:/var/log/nginx
      - ./certbot/conf:/etc/letsencrypt:ro
      - ./certbot/www:/var/www/certbot:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
    networks:
      - work-zen-network
    command: "/bin/sh -c 'while :; do sleep 6h & wait \$\${!}; nginx -s reload; done & nginx -g \"daemon off;\"'"

  backend:
    image: shiranthads/work-zen-backend:\${IMAGE_TAG:-latest}
    container_name: work-zen-backend
    expose:
      - "8000"
    environment:
      - MONGO_URL=\${MONGO_URL}
      - MONGO_DB_NAME=\${MONGO_DB_NAME:-ems_database}
      - OPENROUTER_API_KEY=\${OPENROUTER_API_KEY}
      - HUGGINGFACE_API_KEY=\${HUGGINGFACE_API_KEY}
      - FRONTEND_URL=\${FRONTEND_URL:-https://$DOMAIN}
    restart: unless-stopped
    networks:
      - work-zen-network

  frontend:
    image: shiranthads/work-zen-frontend:\${IMAGE_TAG:-latest}
    container_name: work-zen-frontend
    expose:
      - "3000"
    environment:
      - NEXT_PUBLIC_API_URL=\${NEXT_PUBLIC_API_URL:-https://$DOMAIN/api}
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - work-zen-network

  certbot:
    image: certbot/certbot
    container_name: work-zen-certbot
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait \$\${!}; done;'"
    networks:
      - work-zen-network

networks:
  work-zen-network:
    driver: bridge
    name: work-zen-network
EOF

print_success "Created docker-compose.ssl.yml"

# =============================================================================
# Step 4: Start services
# =============================================================================
print_header "Step 4: Starting services"

# Stop existing containers
docker-compose -f docker-compose.nginx.yml down 2>/dev/null || true
docker-compose -f docker-compose.ssl.yml down 2>/dev/null || true

# Start with new config
docker-compose -f docker-compose.ssl.yml up -d nginx backend frontend

print_success "Services started"

echo "Waiting for NGINX to be ready..."
sleep 5

# =============================================================================
# Step 5: Obtain SSL certificate
# =============================================================================
print_header "Step 5: Obtaining SSL certificate"

echo "Requesting certificate for $DOMAIN..."

docker-compose -f docker-compose.ssl.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

if [ $? -eq 0 ]; then
    print_success "SSL certificate obtained successfully!"
else
    print_error "Failed to obtain SSL certificate."
    echo "Make sure your domain ($DOMAIN) points to this server's IP address."
    exit 1
fi

# =============================================================================
# Step 6: Update NGINX for HTTPS
# =============================================================================
print_header "Step 6: Configuring HTTPS"

cat > nginx/conf.d/default.conf << EOF
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # SSL configuration
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=general_limit:10m rate=30r/s;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static files
    location /_next/static/ {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_buffering off;
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    # API Documentation
    location /docs {
        proxy_pass http://backend/docs;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location /redoc {
        proxy_pass http://backend/redoc;
        proxy_set_header Host \$host;
    }

    location /openapi.json {
        proxy_pass http://backend/openapi.json;
        proxy_set_header Host \$host;
    }

    # Block sensitive files
    location ~ /\. {
        deny all;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
        internal;
    }
}
EOF

print_success "Updated NGINX configuration for HTTPS"

# =============================================================================
# Step 7: Restart services
# =============================================================================
print_header "Step 7: Restarting services"

docker-compose -f docker-compose.ssl.yml up -d

print_success "All services restarted"

# =============================================================================
# Summary
# =============================================================================
print_header "SSL Setup Complete!"

echo -e "${GREEN}Your Work-Zen application is now secured with HTTPS!${NC}"
echo ""
echo "Access your application at:"
echo -e "  ${BLUE}Frontend:${NC}  https://$DOMAIN"
echo -e "  ${BLUE}API:${NC}       https://$DOMAIN/api/"
echo -e "  ${BLUE}API Docs:${NC}  https://$DOMAIN/docs"
echo ""
echo "Don't forget to update your .env file:"
echo "  NEXT_PUBLIC_API_URL=https://$DOMAIN/api"
echo "  FRONTEND_URL=https://$DOMAIN"
echo ""
echo "SSL certificates will auto-renew via certbot container."
echo ""
