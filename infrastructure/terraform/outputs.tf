# =============================================================================
# Work-Zen Infrastructure - Outputs
# =============================================================================

# -----------------------------------------------------------------------------
# VPC Outputs
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

# -----------------------------------------------------------------------------
# EC2 Outputs
# -----------------------------------------------------------------------------

output "instance_id" {
  description = "ID of the EC2 instance"
  value       = aws_instance.app.id
}

output "instance_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = var.create_elastic_ip ? aws_eip.app[0].public_ip : aws_instance.app.public_ip
}

output "instance_public_dns" {
  description = "Public DNS of the EC2 instance"
  value       = aws_instance.app.public_dns
}

output "instance_private_ip" {
  description = "Private IP of the EC2 instance"
  value       = aws_instance.app.private_ip
}

# -----------------------------------------------------------------------------
# Security Group Outputs
# -----------------------------------------------------------------------------

output "app_security_group_id" {
  description = "ID of the application security group"
  value       = aws_security_group.app.id
}

# -----------------------------------------------------------------------------
# Connection Information
# -----------------------------------------------------------------------------

output "ssh_connection_string" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ${var.ssh_private_key_path} ubuntu@${var.create_elastic_ip ? aws_eip.app[0].public_ip : aws_instance.app.public_ip}"
}

output "frontend_url" {
  description = "URL to access the frontend"
  value       = "http://${var.create_elastic_ip ? aws_eip.app[0].public_ip : aws_instance.app.public_ip}:3000"
}

output "backend_url" {
  description = "URL to access the backend API"
  value       = "http://${var.create_elastic_ip ? aws_eip.app[0].public_ip : aws_instance.app.public_ip}:8000"
}

output "backend_health_check" {
  description = "Backend health check URL"
  value       = "http://${var.create_elastic_ip ? aws_eip.app[0].public_ip : aws_instance.app.public_ip}:8000/health"
}

# -----------------------------------------------------------------------------
# Ansible Integration
# -----------------------------------------------------------------------------

output "ansible_inventory_path" {
  description = "Path to generated Ansible inventory file"
  value       = "${path.module}/../ansible/inventory/${var.environment}.ini"
}

output "ansible_command" {
  description = "Command to run Ansible playbook after Terraform"
  value       = "cd ../ansible && ansible-playbook -i inventory/${var.environment}.ini playbooks/setup.yml"
}
