# Docker Setup Guide

## Prerequisites
- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))
- Docker Compose (included with Docker Desktop)

## Quick Start

### 1. Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
```env
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/
MONGO_DB_NAME=ems_database
OPENROUTER_API_KEY=sk-or-v1-<your_api_key>
HUGGINGFACE_API_KEY=hf_<your_api_key>
```

### 2. Build and Start All Services

```bash
docker-compose up --build
```

Or run in detached mode:
```bash
docker-compose up -d --build
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## Docker Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mcp-server
```

### Rebuild Services
```bash
# Rebuild all
docker-compose up --build

# Rebuild specific service
docker-compose up --build backend
```

### Restart a Service
```bash
docker-compose restart backend
```

### Remove All Containers and Volumes
```bash
docker-compose down -v
```

## Service Architecture

```
┌─────────────────┐
│   Frontend      │
│  (Port 3000)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌─────────────────┐
│   Backend       │─────▶│   MCP Server    │
│  (Port 8000)    │      │   (stdio)       │
└────────┬────────┘      └────────┬────────┘
         │                        │
         └────────────────────────┘
                  │
                  ▼
         ┌──────────────┐
         │   MongoDB    │
         │   (Atlas)    │
         └──────────────┘
```

## Container Details

### Backend Container
- **Base Image**: python:3.9-slim
- **Port**: 8000
- **Environment**: 
  - MONGO_URL
  - OPENROUTER_API_KEY
  - HUGGINGFACE_API_KEY

### Frontend Container
- **Base Image**: node:18-alpine
- **Port**: 3000
- **Optimized**: Multi-stage build with standalone output

### MCP Server Container
- **Base Image**: node:18-alpine
- **Communication**: stdio (accessed by backend)
- **Purpose**: MongoDB operations via MCP protocol

## Development with Docker

### Hot Reload
The docker-compose.yml includes volume mounts for development:
- Backend: `./backend/app:/app/app`
- MCP Server: `./mcp-server:/app`

Changes to these directories will be reflected in the containers.

### Install Dependencies in Container
```bash
# Backend
docker-compose exec backend pip install <package>

# Frontend
docker-compose exec frontend npm install <package>

# MCP Server
docker-compose exec mcp-server npm install <package>
```

### Execute Commands in Container
```bash
# Backend shell
docker-compose exec backend bash

# Frontend shell
docker-compose exec frontend sh

# MCP Server shell
docker-compose exec mcp-server sh
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 8000
lsof -ti:8000 | xargs kill -9

# Find process using port 3000
lsof -ti:3000 | xargs kill -9
```

### Container Won't Start
```bash
# Check logs
docker-compose logs backend

# Remove and rebuild
docker-compose down
docker-compose up --build
```

### Database Connection Issues
- Verify MongoDB Atlas connection string in `.env`
- Ensure IP whitelist includes 0.0.0.0/0 or your IP
- Check network connectivity

### Permission Issues
```bash
# Reset permissions
sudo chown -R $(whoami) .
```

## Production Deployment

### Build Production Images
```bash
docker-compose -f docker-compose.prod.yml build
```

### Push to Registry
```bash
# Tag images
docker tag work-zen-backend:latest your-registry/ems-backend:latest
docker tag work-zen-frontend:latest your-registry/ems-frontend:latest

# Push images
docker push your-registry/ems-backend:latest
docker push your-registry/ems-frontend:latest
```

### Deploy to Cloud

**AWS ECS / Azure Container Instances / Google Cloud Run:**
1. Push images to registry (ECR, ACR, GCR)
2. Create service definitions
3. Configure environment variables
4. Deploy

## Resource Limits

Add resource limits to docker-compose.yml:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
```

## Health Checks

The backend includes a health endpoint:
```bash
curl http://localhost:8000/health
```

## Security Notes

- Never commit `.env` file
- Use Docker secrets in production
- Scan images for vulnerabilities:
  ```bash
  docker scan work-zen-backend
  ```
- Use non-root users in containers (already configured)

## Clean Up

Remove all Docker resources:
```bash
# Remove containers
docker-compose down

# Remove images
docker-compose down --rmi all

# Remove volumes
docker-compose down -v

# Remove everything
docker system prune -a --volumes
```
