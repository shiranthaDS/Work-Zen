# =============================================================================
# Work-Zen Infrastructure - Variables
# =============================================================================

# -----------------------------------------------------------------------------
# General Configuration
# -----------------------------------------------------------------------------

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "work-zen"
}

variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string

  validation {
    condition     = contains(["staging", "production", "dev"], var.environment)
    error_message = "Environment must be one of: staging, production, dev"
  }
}

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "eu-north-1"
}

# -----------------------------------------------------------------------------
# VPC Configuration
# -----------------------------------------------------------------------------

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

# -----------------------------------------------------------------------------
# EC2 Configuration
# -----------------------------------------------------------------------------

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "key_pair_name" {
  description = "Name of the AWS key pair for SSH access"
  type        = string
}

variable "ssh_private_key_path" {
  description = "Path to SSH private key for Ansible inventory"
  type        = string
  default     = "~/.ssh/work-zen-key.pem"
}

variable "root_volume_size" {
  description = "Size of root EBS volume in GB"
  type        = number
  default     = 30
}

variable "create_elastic_ip" {
  description = "Whether to create and attach an Elastic IP"
  type        = bool
  default     = true
}

# -----------------------------------------------------------------------------
# Security Configuration
# -----------------------------------------------------------------------------

variable "allowed_ssh_cidrs" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["0.0.0.0/0"] # Restrict this in production!
}

# -----------------------------------------------------------------------------
# Application Configuration
# -----------------------------------------------------------------------------

variable "docker_image_backend" {
  description = "Docker image for backend"
  type        = string
  default     = "shiranthads/work-zen-backend:latest"
}

variable "docker_image_frontend" {
  description = "Docker image for frontend"
  type        = string
  default     = "shiranthads/work-zen-frontend:latest"
}
