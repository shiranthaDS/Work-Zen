#!/bin/bash

# AWS EC2 Deployment Script for Work-Zen
# Run this script on your EC2 instance after connecting via SSH

set -e

echo "=========================================="
echo "Work-Zen EC2 Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as ubuntu user
if [ "$USER" != "ubuntu" ]; then
    echo -e "${RED}Please run this script as ubuntu user${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1: Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

echo -e "${GREEN}Step 2: Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io
    sudo usermod -aG docker ubuntu
    echo -e "${GREEN}Docker installed successfully!${NC}"
else
    echo -e "${YELLOW}Docker already installed${NC}"
fi

echo -e "${GREEN}Step 3: Installing Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}Docker Compose installed successfully!${NC}"
else
    echo -e "${YELLOW}Docker Compose already installed${NC}"
fi

echo -e "${GREEN}Step 4: Installing Git...${NC}"
if ! command -v git &> /dev/null; then
    sudo apt install -y git
    echo -e "${GREEN}Git installed successfully!${NC}"
else
    echo -e "${YELLOW}Git already installed${NC}"
fi

echo -e "${GREEN}Step 5: Cloning repository...${NC}"
if [ ! -d "Work-Zen" ]; then
    git clone https://github.com/shiranthaDS/Work-Zen.git
    cd Work-Zen
    echo -e "${GREEN}Repository cloned successfully!${NC}"
else
    echo -e "${YELLOW}Repository already exists, updating...${NC}"
    cd Work-Zen
    git pull origin main
fi

echo -e "${GREEN}Step 6: Setting up environment...${NC}"
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${YELLOW}Please edit .env file with your credentials:${NC}"
        echo "  - MongoDB connection string"
        echo "  - OpenRouter API key (or HuggingFace)"
        echo "  - Update NEXT_PUBLIC_API_URL with your EC2 IP"
        echo ""
        echo -e "${RED}Press Enter after editing .env file...${NC}"
        nano .env
    else
        echo -e "${RED}.env.example not found!${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}.env file already exists${NC}"
fi

# Get EC2 public IP
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo -e "${GREEN}Your EC2 Public IP: ${EC2_IP}${NC}"

echo -e "${GREEN}Step 7: Building and starting Docker containers...${NC}"
# Ensure user is in docker group for this session
newgrp docker <<EONG
docker-compose up -d --build
EONG

echo ""
echo "=========================================="
echo -e "${GREEN}Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo -e "Access your application at:"
echo -e "  ${GREEN}Frontend:${NC} http://${EC2_IP}:3000"
echo -e "  ${GREEN}Backend:${NC}  http://${EC2_IP}:8000"
echo -e "  ${GREEN}API Docs:${NC} http://${EC2_IP}:8000/docs"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "  1. Configure EC2 Security Group to allow ports 3000, 8000"
echo "  2. Set up Nginx reverse proxy (optional)"
echo "  3. Configure SSL with Let's Encrypt (if using domain)"
echo "  4. Set up automatic restart: sudo systemctl enable work-zen"
echo ""
echo -e "${GREEN}Check container status:${NC} docker-compose ps"
echo -e "${GREEN}View logs:${NC} docker-compose logs -f"
echo ""
