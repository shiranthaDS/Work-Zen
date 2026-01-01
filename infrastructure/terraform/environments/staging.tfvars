# =============================================================================
# Work-Zen - Staging Environment Configuration
# =============================================================================
# Usage: terraform apply -var-file="environments/staging.tfvars"
# =============================================================================

# General
environment   = "staging"
project_name  = "work-zen"
aws_region    = "eu-north-1"

# VPC
vpc_cidr            = "10.1.0.0/16"
public_subnet_cidrs = ["10.1.1.0/24", "10.1.2.0/24"]

# EC2
instance_type        = "t3.small"
key_pair_name        = "EMSkey"  # Your existing key pair
ssh_private_key_path = "~/Downloads/EMSkey.pem"
root_volume_size     = 20
create_elastic_ip    = true

# Security - Restrict SSH in staging
allowed_ssh_cidrs = ["0.0.0.0/0"]  # Consider restricting to your IP

# Docker Images
docker_image_backend  = "shiranthads/work-zen-backend:latest"
docker_image_frontend = "shiranthads/work-zen-frontend:latest"
