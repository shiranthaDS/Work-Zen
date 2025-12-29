#!/bin/bash

# Build and Push Docker Images to Docker Hub
# This script builds images locally and pushes them to Docker Hub
# EC2 instance will pull these pre-built images instead of building

set -e

echo "🔨 Building Docker images locally..."

# Your Docker Hub username
DOCKER_USERNAME="shiranthadw"

# Build backend image
echo "📦 Building backend image..."
docker build -t ${DOCKER_USERNAME}/work-zen-backend:latest -f backend/Dockerfile .

# Build frontend image
echo "📦 Building frontend image..."
docker build -t ${DOCKER_USERNAME}/work-zen-frontend:latest \
  --build-arg NEXT_PUBLIC_API_URL=http://13.48.13.155:8000 \
  -f frontend/Dockerfile frontend/

echo "✅ Images built successfully!"
echo ""
echo "🔐 Logging in to Docker Hub..."
docker login

echo ""
echo "⬆️  Pushing images to Docker Hub..."
docker push ${DOCKER_USERNAME}/work-zen-backend:latest
docker push ${DOCKER_USERNAME}/work-zen-frontend:latest

echo ""
echo "✅ All images pushed successfully!"
echo ""
echo "📋 Next steps on EC2:"
echo "1. docker-compose -f docker-compose.prod.yml pull"
echo "2. docker-compose -f docker-compose.prod.yml up -d"
