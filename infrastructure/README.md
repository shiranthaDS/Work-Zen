# 🏗️ Work-Zen Infrastructure

Infrastructure as Code (IaC) for Work-Zen application using **Terraform** and **Ansible**.

> ⚠️ **Note**: These tools are for **manual operations only** and are NOT executed by CI/CD pipeline.

## 📁 Directory Structure

```
infrastructure/
├── terraform/                    # Infrastructure provisioning
│   ├── main.tf                   # Main Terraform configuration
│   ├── variables.tf              # Variable definitions
│   ├── outputs.tf                # Output values
│   ├── environments/             # Environment-specific configs
│   │   ├── staging.tfvars
│   │   └── production.tfvars
│   └── templates/
│       └── inventory.tpl         # Ansible inventory template
│
├── ansible/                      # Configuration management
│   ├── ansible.cfg               # Ansible configuration
│   ├── requirements.yml          # Galaxy dependencies
│   ├── inventory/                # Host inventories
│   │   ├── staging.ini
│   │   └── production.ini
│   └── playbooks/
│       ├── setup.yml             # Initial server setup
│       ├── deploy.yml            # Application deployment
│       └── rollback.yml          # Rollback to previous version
│
└── README.md                     # This file
```

---

## 🚀 Use Cases

### Scenario 1: Create Staging Environment Identical to Production

> "I needed to create a second Work-Zen environment (staging) identical to production."

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Plan staging infrastructure
terraform plan -var-file="environments/staging.tfvars"

# Create staging environment
terraform apply -var-file="environments/staging.tfvars"
```

### Scenario 2: Configure EC2 After Terraform Provisioning

> "After creating EC2 with Terraform, I needed to configure it consistently."

```bash
cd infrastructure/ansible

# Install Ansible dependencies
ansible-galaxy install -r requirements.yml

# Configure the server (install Docker, setup firewall, etc.)
ansible-playbook -i inventory/staging.ini playbooks/setup.yml

# Deploy the application
ansible-playbook -i inventory/staging.ini playbooks/deploy.yml
```

---

## 📋 Prerequisites

### Install Required Tools

```bash
# macOS
brew install terraform ansible

# Verify installations
terraform version    # Should be >= 1.0.0
ansible --version    # Should be >= 2.12
```

### AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Or export environment variables
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="eu-north-1"
```

---

## 🔧 Terraform Commands

### Initialize

```bash
cd infrastructure/terraform
terraform init
```

### Plan Changes

```bash
# Staging
terraform plan -var-file="environments/staging.tfvars"

# Production
terraform plan -var-file="environments/production.tfvars"
```

### Apply Changes

```bash
# Staging
terraform apply -var-file="environments/staging.tfvars"

# Production (use with caution!)
terraform apply -var-file="environments/production.tfvars"
```

### Destroy Infrastructure

```bash
# Staging only - Never destroy production!
terraform destroy -var-file="environments/staging.tfvars"
```

### View Outputs

```bash
terraform output

# Specific output
terraform output instance_public_ip
terraform output ssh_connection_string
```

---

## 🎭 Ansible Commands

### Install Dependencies

```bash
cd infrastructure/ansible
ansible-galaxy install -r requirements.yml
```

### Test Connection

```bash
# Test connectivity
ansible -i inventory/staging.ini all -m ping

# Test with verbose output
ansible -i inventory/staging.ini all -m ping -vvv
```

### Run Playbooks

```bash
# Initial server setup (Docker, firewall, packages)
ansible-playbook -i inventory/staging.ini playbooks/setup.yml

# Deploy application
ansible-playbook -i inventory/staging.ini playbooks/deploy.yml

# Rollback to specific version
ansible-playbook -i inventory/staging.ini playbooks/rollback.yml -e "rollback_version=v1.0.0"
```

### Dry Run (Check Mode)

```bash
ansible-playbook -i inventory/staging.ini playbooks/deploy.yml --check
```

---

## 🔄 Complete Workflow

### New Environment Setup

```bash
# 1. Provision infrastructure with Terraform
cd infrastructure/terraform
terraform init
terraform apply -var-file="environments/staging.tfvars"

# 2. Note the outputs
terraform output

# 3. Configure server with Ansible
cd ../ansible
ansible-galaxy install -r requirements.yml
ansible-playbook -i inventory/staging.ini playbooks/setup.yml

# 4. Copy .env file to server
scp .env ubuntu@<STAGING_IP>:/home/ubuntu/Work-Zen/.env

# 5. Deploy application
ansible-playbook -i inventory/staging.ini playbooks/deploy.yml
```

### Manual Deployment (Without CI/CD)

```bash
cd infrastructure/ansible

# Deploy latest version
ansible-playbook -i inventory/production.ini playbooks/deploy.yml
```

### Rollback

```bash
cd infrastructure/ansible

# Rollback to specific version
ansible-playbook -i inventory/production.ini playbooks/rollback.yml \
  -e "rollback_version=v1.0.0" \
  -e "confirm_rollback=false"
```

---

## 📊 Environment Comparison

| Aspect | Staging | Production |
|--------|---------|------------|
| Instance Type | t3.small | t3.medium |
| VPC CIDR | 10.1.0.0/16 | 10.0.0.0/16 |
| Volume Size | 20 GB | 30 GB |
| Elastic IP | Yes | Yes |

---

## 🔒 Security Best Practices

1. **SSH Access**: Restrict `allowed_ssh_cidrs` to your IP in production
2. **State File**: Use S3 backend with encryption for team collaboration
3. **Secrets**: Never commit `.env` files or credentials
4. **Key Pairs**: Store SSH keys securely, never in repository

---

## 🐛 Troubleshooting

### Terraform State Lock

```bash
# If state is locked
terraform force-unlock <LOCK_ID>
```

### Ansible SSH Issues

```bash
# Test SSH connection directly
ssh -i ~/Downloads/EMSkey.pem ubuntu@<IP>

# Check key permissions
chmod 400 ~/Downloads/EMSkey.pem
```

### Docker Issues on EC2

```bash
# Check Docker status
ansible -i inventory/staging.ini all -m shell -a "systemctl status docker"

# View Docker logs
ansible -i inventory/staging.ini all -m shell -a "docker logs work-zen-backend"
```

---

## 📚 Resources

- [Terraform AWS Provider Docs](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Ansible Docker Collection](https://docs.ansible.com/ansible/latest/collections/community/docker/index.html)
- [AWS Best Practices](https://aws.amazon.com/architecture/well-architected/)
