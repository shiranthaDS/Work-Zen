# Quick Deployment Reference

## AWS EC2 Details
- **IP Address**: 13.48.13.155
- **Instance**: t2.micro, Ubuntu 22.04 LTS
- **Region**: eu-north-1 (Stockholm)

## 🚀 Quick Deploy (2 Methods)

### Method 1: Automated Script (Easiest)
```bash
# 1. Connect to EC2
ssh -i your-key.pem ubuntu@13.48.13.155

# 2. Download and run deployment script
curl -fsSL https://raw.githubusercontent.com/shiranthaDS/Work-Zen/main/deploy-ec2.sh -o deploy.sh
chmod +x deploy.sh
./deploy.sh
```

### Method 2: Manual Steps
```bash
# 1. Connect to EC2
ssh -i your-key.pem ubuntu@13.48.13.155

# 2. Install Docker & Docker Compose
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Clone and setup
git clone https://github.com/shiranthaDS/Work-Zen.git
cd Work-Zen
cp .env.example .env
nano .env  # Edit with your credentials

# 4. Deploy
docker-compose up -d --build
```

## 🔐 Security Group Ports

Configure in AWS Console → EC2 → Security Groups:

| Port | Service | Access |
|------|---------|--------|
| 22 | SSH | Your IP only |
| 80 | HTTP | 0.0.0.0/0 |
| 443 | HTTPS | 0.0.0.0/0 |
| 3000 | Frontend | 0.0.0.0/0 |
| 8000 | Backend | 0.0.0.0/0 |

## 📝 Environment Variables (.env)

```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
MONGO_DB_NAME=ems_database
OPENROUTER_API_KEY=sk-or-v1-your_key
HUGGINGFACE_API_KEY=hf_your_key
NEXT_PUBLIC_API_URL=http://13.48.13.155:8000
```

## 🌐 Access URLs

After deployment:
- **Frontend**: http://13.48.13.155:3000
- **Backend API**: http://13.48.13.155:8000
- **API Docs**: http://13.48.13.155:8000/docs

## 📊 Useful Commands

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Update application
git pull && docker-compose up -d --build

# System resources
docker stats
htop
df -h

# Clean up
docker system prune -a
```

## 🔧 Troubleshooting

### Containers won't start
```bash
docker-compose logs backend
docker-compose logs frontend
```

### Port already in use
```bash
sudo lsof -i :3000
sudo lsof -i :8000
sudo kill -9 <PID>
```

### Out of memory (t2.micro only has 1GB)
```bash
# Add swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Frontend can't connect to backend
- Check `NEXT_PUBLIC_API_URL` in `.env`
- Should be: `http://13.48.13.155:8000`
- Restart frontend: `docker-compose restart frontend`

## 📱 Production Setup (Optional)

### 1. Nginx Reverse Proxy
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/work-zen
```

Configuration:
```nginx
server {
    listen 80;
    server_name 13.48.13.155;
    
    location / {
        proxy_pass http://localhost:3000;
    }
    
    location /api/ {
        proxy_pass http://localhost:8000/api/;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/work-zen /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

### 2. Auto-start on Reboot
```bash
sudo nano /etc/systemd/system/work-zen.service
```

Add service file, then:
```bash
sudo systemctl enable work-zen.service
sudo systemctl start work-zen.service
```

### 3. SSL with Let's Encrypt (requires domain)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 📚 Full Documentation

- **Detailed AWS Guide**: [AWS_EC2_DEPLOYMENT.md](AWS_EC2_DEPLOYMENT.md)
- **Docker Guide**: [DOCKER_SETUP.md](DOCKER_SETUP.md)
- **Main README**: [README.md](README.md)

## 🆘 Support

1. Check logs: `docker-compose logs -f`
2. Verify .env file: `cat .env`
3. Check Security Group in AWS Console
4. Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0 or EC2 IP

## ✅ Deployment Checklist

- [ ] EC2 instance running
- [ ] Security Group configured (ports 22, 80, 443, 3000, 8000)
- [ ] SSH access working
- [ ] Docker installed
- [ ] Docker Compose installed
- [ ] Repository cloned
- [ ] .env configured with correct values
- [ ] NEXT_PUBLIC_API_URL updated with EC2 IP
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Containers running: `docker-compose ps`
- [ ] Frontend accessible: http://13.48.13.155:3000
- [ ] Backend accessible: http://13.48.13.155:8000
- [ ] Nginx configured (optional)
- [ ] SSL certificate installed (optional)
- [ ] Auto-restart on reboot configured (optional)

---

**Need help?** See full documentation or check logs with `docker-compose logs -f`
