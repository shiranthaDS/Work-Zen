# NGINX Setup Guide for Work-Zen on EC2

This guide explains how to set up NGINX as a reverse proxy for the Work-Zen application on AWS EC2.

## Architecture Overview

```
                    ┌─────────────────────────────────────────┐
                    │              EC2 Instance               │
                    │                                         │
Internet ──────────►│  ┌─────────┐    ┌─────────────────────┐│
       Port 80/443  │  │  NGINX  │───►│  Frontend (Next.js) ││
                    │  │         │    │      Port 3000      ││
                    │  │ Reverse │    └─────────────────────┘│
                    │  │  Proxy  │                           │
                    │  │         │    ┌─────────────────────┐│
                    │  │         │───►│  Backend (FastAPI)  ││
                    │  └─────────┘    │      Port 8000      ││
                    │                 └─────────────────────┘│
                    └─────────────────────────────────────────┘
```

## Benefits of Using NGINX

- **Single Entry Point**: All traffic goes through port 80/443
- **SSL Termination**: HTTPS handled by NGINX
- **Load Balancing Ready**: Easy to add more backend instances
- **Security**: Hide internal service ports
- **Caching**: Static file caching for better performance
- **Rate Limiting**: Protect against DDoS attacks

## Quick Start

### Prerequisites

1. EC2 instance with Docker and Docker Compose installed
2. Security Group allowing ports 80 and 443
3. Repository cloned to the EC2 instance

### Deploy with NGINX

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Navigate to project directory
cd Work-Zen

# Make the setup script executable
chmod +x scripts/setup-nginx-ec2.sh

# Run the setup script
./scripts/setup-nginx-ec2.sh
```

That's it! Your application will be accessible at `http://YOUR_EC2_IP`

## Manual Setup

If you prefer manual setup:

### Step 1: Create Required Directories

```bash
mkdir -p nginx/logs
mkdir -p certbot/conf
mkdir -p certbot/www
```

### Step 2: Configure Environment

Edit your `.env` file:

```env
# MongoDB Configuration
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
MONGO_DB_NAME=ems_database

# API Keys
OPENROUTER_API_KEY=your_key
HUGGINGFACE_API_KEY=your_key

# URLs - Use /api path since NGINX routes it
NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP/api
FRONTEND_URL=http://YOUR_EC2_IP
```

### Step 3: Deploy with Docker Compose

```bash
# Start all services
docker-compose -f docker-compose.nginx.yml up -d

# Check status
docker-compose -f docker-compose.nginx.yml ps

# View logs
docker-compose -f docker-compose.nginx.yml logs -f
```

## File Structure

```
Work-Zen/
├── nginx/
│   ├── nginx.conf              # Main NGINX configuration
│   ├── conf.d/
│   │   ├── default.conf        # HTTP server configuration
│   │   └── ssl.conf.template   # HTTPS template (for reference)
│   └── logs/                   # NGINX logs
├── certbot/
│   ├── conf/                   # SSL certificates
│   └── www/                    # ACME challenge files
├── docker-compose.nginx.yml    # Docker Compose with NGINX
├── docker-compose.ssl.yml      # Docker Compose with SSL (auto-generated)
└── scripts/
    ├── setup-nginx-ec2.sh      # NGINX setup script
    └── setup-ssl.sh            # SSL setup script
```

## URL Routing

| URL Path | Destination | Description |
|----------|-------------|-------------|
| `/` | Frontend (port 3000) | Next.js application |
| `/api/*` | Backend (port 8000) | FastAPI endpoints |
| `/docs` | Backend (port 8000) | Swagger documentation |
| `/redoc` | Backend (port 8000) | ReDoc documentation |
| `/health` | NGINX | Health check endpoint |

## Security Group Configuration

Update your EC2 Security Group to only expose necessary ports:

| Type | Port | Source | Description |
|------|------|--------|-------------|
| SSH | 22 | Your IP | SSH access |
| HTTP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | 443 | 0.0.0.0/0 | Secure web traffic |

**Note**: Ports 3000 and 8000 are no longer needed externally when using NGINX.

## Enable HTTPS with Let's Encrypt

If you have a domain name, you can enable HTTPS:

### Prerequisites

1. Domain name pointing to your EC2 IP address
2. Ports 80 and 443 open in Security Group

### Setup SSL

```bash
# Make the SSL script executable
chmod +x scripts/setup-ssl.sh

# Run with your domain
./scripts/setup-ssl.sh your-domain.com your-email@example.com
```

### What the SSL Script Does

1. Creates certbot directories
2. Updates NGINX configuration for your domain
3. Obtains SSL certificate from Let's Encrypt
4. Configures NGINX for HTTPS
5. Sets up automatic certificate renewal

### Update Environment for HTTPS

After SSL setup, update your `.env`:

```env
NEXT_PUBLIC_API_URL=https://your-domain.com/api
FRONTEND_URL=https://your-domain.com
```

## Useful Commands

### Service Management

```bash
# Start services
docker-compose -f docker-compose.nginx.yml up -d

# Stop services
docker-compose -f docker-compose.nginx.yml down

# Restart services
docker-compose -f docker-compose.nginx.yml restart

# Restart only NGINX
docker-compose -f docker-compose.nginx.yml restart nginx
```

### Viewing Logs

```bash
# All services
docker-compose -f docker-compose.nginx.yml logs -f

# NGINX only
docker-compose -f docker-compose.nginx.yml logs -f nginx

# Backend only
docker-compose -f docker-compose.nginx.yml logs -f backend

# NGINX access log
tail -f nginx/logs/access.log

# NGINX error log
tail -f nginx/logs/error.log
```

### Testing Configuration

```bash
# Test NGINX configuration
docker exec work-zen-nginx nginx -t

# Reload NGINX without downtime
docker exec work-zen-nginx nginx -s reload
```

## Troubleshooting

### 502 Bad Gateway

This usually means the upstream service (frontend or backend) is not running or not ready.

```bash
# Check if all containers are running
docker-compose -f docker-compose.nginx.yml ps

# Check backend logs
docker-compose -f docker-compose.nginx.yml logs backend

# Check frontend logs
docker-compose -f docker-compose.nginx.yml logs frontend
```

### 504 Gateway Timeout

The upstream service is taking too long to respond.

```bash
# Check backend health
curl http://localhost:8000/api/health

# Increase timeout in nginx/conf.d/default.conf if needed
```

### SSL Certificate Issues

```bash
# Check certificate status
docker-compose -f docker-compose.ssl.yml run --rm certbot certificates

# Force certificate renewal
docker-compose -f docker-compose.ssl.yml run --rm certbot renew --force-renewal

# Restart NGINX after renewal
docker-compose -f docker-compose.ssl.yml restart nginx
```

### Permission Issues

```bash
# Fix nginx logs permissions
sudo chown -R $USER:$USER nginx/logs

# Fix certbot permissions
sudo chown -R $USER:$USER certbot/
```

## Performance Tuning

The NGINX configuration includes several performance optimizations:

1. **Gzip Compression**: Reduces response size for text-based content
2. **Keep-alive Connections**: Maintains connections to upstream servers
3. **Static File Caching**: Long cache headers for Next.js static files
4. **Rate Limiting**: Protects against abuse (10 req/s for API, 30 req/s general)

### Adjusting Rate Limits

Edit `nginx/nginx.conf`:

```nginx
# Increase API rate limit
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;

# Increase general rate limit
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=50r/s;
```

## Scaling Considerations

When you need to scale:

1. **Add More Backend Instances**:
   ```nginx
   upstream backend {
       server backend1:8000;
       server backend2:8000;
       keepalive 32;
   }
   ```

2. **Use External Load Balancer**: Put an AWS ALB in front of multiple EC2 instances

3. **Separate Static Files**: Serve static files from S3/CloudFront

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review NGINX logs in `nginx/logs/`
3. Check Docker container logs
