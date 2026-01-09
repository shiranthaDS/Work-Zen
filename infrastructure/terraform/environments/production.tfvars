# =============================================================================
# Work-Zen - Production Environment Configuration
# =============================================================================
# Usage: terraform apply -var-file="environments/production.tfvars"
# =============================================================================

# General
environment   = "production"
project_name  = "work-zen"
aws_region    = "eu-north-1"

# VPC
vpc_cidr            = "10.0.0.0/16"
public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]

# EC2
instance_type        = "t3.micro"
key_pair_name        = "EMSkey"  # Your existing key pair
ssh_private_key_path = "~/Downloads/EMSkey.pem"
root_volume_size     = 30
create_elastic_ip    = true

# Security - Restrict SSH in production
allowed_ssh_cidrs = ["0.0.0.0/0"]  # IMPORTANT: Restrict to your IP in production!

# Docker Images
docker_image_backend  = "shiranthads/work-zen-backend:latest"
docker_image_frontend = "shiranthads/work-zen-frontend:latest"
