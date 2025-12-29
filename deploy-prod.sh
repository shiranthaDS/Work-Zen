#!/bin/bash

# EC2 Deployment Script - Using Pre-built Images
# Run this on EC2 instance to pull and deploy pre-built Docker images

set -e

echo "🚀 Deploying Work-Zen using pre-built images..."

# Pull latest images from Docker Hub
echo "⬇️  Pulling latest images from Docker Hub..."
docker-compose -f docker-compose.prod.yml pull

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Start containers with new images
echo "▶️  Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Container status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://13.48.13.155:3000"
echo "   Backend:  http://13.48.13.155:8000"
echo "   API Docs: http://13.48.13.155:8000/docs"
