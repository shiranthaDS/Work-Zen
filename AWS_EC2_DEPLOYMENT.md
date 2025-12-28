# AWS EC2 Deployment Guide

## Server Details
- **Public IPv4**: 13.48.13.155
- **Instance Type**: t2.micro
- **OS**: Ubuntu 22.04 LTS
- **Region**: eu-north-1 (Stockholm)

## Prerequisites
- SSH access to EC2 instance
- EC2 Security Group configured for ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 8000 (Backend), 3000 (Frontend)
- Domain name (optional)

## Step 1: Connect to EC2 Instance

```bash
# Replace 'your-key.pem' with your actual key file
ssh -i your-key.pem ubuntu@13.48.13.155
```

## Step 2: Install Docker and Docker Compose

```bash
# Update package index
sudo apt update
sudo apt upgrade -y

# Install required packages
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add ubuntu user to docker group (avoid using sudo)
sudo usermod -aG docker ubuntu

# Verify installations
docker --version
docker-compose --version

# Logout and login again for group changes to take effect
exit
```

## Step 3: Configure Security Group

In AWS Console, configure your EC2 Security Group:

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| SSH | TCP | 22 | Your IP | SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | HTTP traffic |
| HTTPS | TCP | 443 | 0.0.0.0/0 | HTTPS traffic |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 | Frontend |
| Custom TCP | TCP | 8000 | 0.0.0.0/0 | Backend API |

## Step 4: Clone and Setup Project

```bash
# Reconnect to EC2
ssh -i your-key.pem ubuntu@13.48.13.155

# Install Git if not installed
sudo apt install -y git

# Clone repository
git clone https://github.com/shiranthaDS/Work-Zen.git
cd Work-Zen

# Create environment file
cp .env.example .env
nano .env
```

**Edit `.env` with your credentials:**
```env
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/
MONGO_DB_NAME=ems_database
OPENROUTER_API_KEY=sk-or-v1-<your_api_key>
HUGGINGFACE_API_KEY=hf_<your_api_key>
NEXT_PUBLIC_API_URL=http://13.48.13.155:8000
```

**Important**: Update `NEXT_PUBLIC_API_URL` to use your EC2 public IP!

## Step 5: Build and Deploy with Docker

```bash
# Build and start all services
docker-compose up -d --build

# Check if containers are running
docker-compose ps

# View logs
docker-compose logs -f

# Stop logs with Ctrl+C
```

## Step 6: Access Your Application

- **Frontend**: http://13.48.13.155:3000
- **Backend API**: http://13.48.13.155:8000
- **API Docs**: http://13.48.13.155:8000/docs

## Step 7: Set Up Reverse Proxy with Nginx (Production)

For production, use Nginx as a reverse proxy:

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/work-zen
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name 13.48.13.155;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Docs
    location /docs {
        proxy_pass http://localhost:8000/docs;
        proxy_set_header Host $host;
    }
}
```

**Enable and start Nginx:**
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/work-zen /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

**After Nginx setup, access via:**
- **Frontend**: http://13.48.13.155
- **Backend API**: http://13.48.13.155/api/
- **API Docs**: http://13.48.13.155/docs

## Step 8: Set Up SSL with Let's Encrypt (Optional - Requires Domain)

If you have a domain name:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace yourdomain.com)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
# Test renewal
sudo certbot renew --dry-run
```

## Step 9: Monitor and Manage

### Check Container Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Stop Services
```bash
docker-compose down
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## Step 10: Set Up Automatic Restart on Reboot

Create a systemd service:

```bash
sudo nano /etc/systemd/system/work-zen.service
```

**Service file content:**
```ini
[Unit]
Description=Work-Zen Docker Compose Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/Work-Zen
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0
User=ubuntu

[Install]
WantedBy=multi-user.target
```

**Enable and start service:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable work-zen.service
sudo systemctl start work-zen.service

# Check status
sudo systemctl status work-zen.service
```

## Monitoring and Maintenance

### Check System Resources
```bash
# CPU and Memory usage
htop

# Disk space
df -h

# Docker stats
docker stats
```

### View Container Logs
```bash
# Backend logs
docker logs ems-backend --tail 100 -f

# Frontend logs
docker logs ems-frontend --tail 100 -f
```

### Backup MongoDB Data
Since you're using MongoDB Atlas, backups are handled automatically.

### Clean Up Docker Resources
```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Clean everything (careful!)
docker system prune -a --volumes
```

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs backend

# Check if ports are in use
sudo netstat -tlnp | grep -E '3000|8000'

# Restart Docker service
sudo systemctl restart docker
```

### Out of Memory
```bash
# Check memory
free -h

# Add swap space (if needed)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Port Already in Use
```bash
# Find process using port
sudo lsof -i :8000
sudo lsof -i :3000

# Kill process if needed
sudo kill -9 <PID>
```

### SSL Certificate Issues
```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

## Security Best Practices

1. **Firewall Configuration**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 8000/tcp
   sudo ufw allow 3000/tcp
   sudo ufw enable
   ```

2. **Keep System Updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

3. **Secure SSH**
   - Disable password authentication
   - Use SSH keys only
   - Change default SSH port

4. **Environment Variables**
   - Never commit `.env` to Git
   - Use strong passwords for MongoDB
   - Rotate API keys regularly

5. **Monitor Logs**
   ```bash
   # Set up log rotation
   sudo nano /etc/docker/daemon.json
   ```
   
   Add:
   ```json
   {
     "log-driver": "json-file",
     "log-opts": {
       "max-size": "10m",
       "max-file": "3"
     }
   }
   ```
   
   Restart Docker:
   ```bash
   sudo systemctl restart docker
   ```

## Production Checklist

- [ ] EC2 Security Group configured
- [ ] Docker and Docker Compose installed
- [ ] Application cloned and configured
- [ ] Environment variables set correctly
- [ ] Containers running successfully
- [ ] Nginx reverse proxy configured (optional)
- [ ] SSL certificate installed (if using domain)
- [ ] Automatic restart on reboot configured
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Firewall configured

## Cost Optimization

### t2.micro Instance Limits
- **RAM**: 1 GB (may be tight for all services)
- **CPU**: 1 vCPU

If you experience performance issues:
1. Upgrade to t2.small (2 GB RAM)
2. Use Amazon RDS for MongoDB instead of Atlas (better network performance)
3. Use Amazon CloudFront for static assets
4. Consider using AWS ECS or EKS for container orchestration

## Useful Commands

```bash
# Quick deployment update
cd Work-Zen && git pull && docker-compose up -d --build

# View all container logs
docker-compose logs --tail=50

# Restart everything
docker-compose restart

# Check resource usage
docker stats --no-stream

# Clean up
docker-compose down && docker system prune -f

# Backup docker-compose logs
docker-compose logs > logs-$(date +%Y%m%d-%H%M%S).txt
```

## Support

If you encounter issues:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables: `cat .env`
3. Check container status: `docker-compose ps`
4. Check EC2 Security Group settings
5. Verify MongoDB Atlas IP whitelist includes EC2 IP

## Next Steps

1. **Set up monitoring**: Use AWS CloudWatch or install Prometheus/Grafana
2. **Configure backups**: Automated backups of configurations
3. **Set up CI/CD**: Use GitHub Actions to auto-deploy on push
4. **Load balancing**: If scaling, use AWS ALB
5. **Domain configuration**: Point your domain to 13.48.13.155

---

**Deployment completed successfully!** 🎉

Access your application at:
- http://13.48.13.155:3000 (Frontend)
- http://13.48.13.155:8000 (Backend)
