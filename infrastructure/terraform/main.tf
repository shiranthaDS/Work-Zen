# =============================================================================
# Work-Zen Infrastructure - Terraform Configuration
# =============================================================================
# Purpose: Provision AWS infrastructure for Work-Zen application
# Usage: Manual execution for creating staging/production environments
# NOT part of CI/CD pipeline - for infrastructure provisioning only
# =============================================================================

terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration for state management
  # Uncomment and configure for team collaboration
  # backend "s3" {
  #   bucket         = "work-zen-terraform-state"
  #   key            = "terraform.tfstate"
  #   region         = "eu-north-1"
  #   encrypt        = true
  #   dynamodb_table = "work-zen-terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Work-Zen"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Owner       = "DevOps"
    }
  }
}

# =============================================================================
# Data Sources
# =============================================================================

# Get latest Ubuntu 22.04 AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Get availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# =============================================================================
# VPC Configuration
# =============================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-${var.environment}-vpc"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.project_name}-${var.environment}-igw"
  }
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-${var.environment}-public-subnet-${count.index + 1}"
    Type = "Public"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# =============================================================================
# Security Groups
# =============================================================================

resource "aws_security_group" "app" {
  name        = "${var.project_name}-${var.environment}-app-sg"
  description = "Security group for Work-Zen application servers"
  vpc_id      = aws_vpc.main.id

  # SSH access
  ingress {
    description = "SSH from anywhere"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_ssh_cidrs
  }

  # HTTP access
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS access
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Frontend (Next.js)
  ingress {
    description = "Frontend Next.js"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Backend (FastAPI)
  ingress {
    description = "Backend FastAPI"
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic
  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-app-sg"
  }
}

# =============================================================================
# EC2 Instance
# =============================================================================

resource "aws_instance" "app" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.app.id]
  subnet_id              = aws_subnet.public[0].id

  root_block_device {
    volume_size           = var.root_volume_size
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true

    tags = {
      Name = "${var.project_name}-${var.environment}-root-volume"
    }
  }

  user_data = <<-EOF
    #!/bin/bash
    # Basic setup - Ansible will handle detailed configuration
    apt-get update
    apt-get install -y python3 python3-pip
    
    # Create deployment directory
    mkdir -p /home/ubuntu/Work-Zen
    chown ubuntu:ubuntu /home/ubuntu/Work-Zen
    
    echo "Instance initialized - Ready for Ansible configuration"
  EOF

  tags = {
    Name        = "${var.project_name}-${var.environment}-app-server"
    Role        = "Application Server"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}

# =============================================================================
# Elastic IP (Optional - for static IP)
# =============================================================================

resource "aws_eip" "app" {
  count    = var.create_elastic_ip ? 1 : 0
  instance = aws_instance.app.id
  domain   = "vpc"

  tags = {
    Name = "${var.project_name}-${var.environment}-eip"
  }
}

# =============================================================================
# Generate Ansible Inventory
# =============================================================================

resource "local_file" "ansible_inventory" {
  content = templatefile("${path.module}/templates/inventory.tpl", {
    environment     = var.environment
    app_server_ip   = var.create_elastic_ip ? aws_eip.app[0].public_ip : aws_instance.app.public_ip
    app_server_id   = aws_instance.app.id
    ssh_user        = "ubuntu"
    ssh_key_path    = var.ssh_private_key_path
  })
  filename = "${path.module}/../ansible/inventory/${var.environment}.ini"

  depends_on = [aws_instance.app]
}
