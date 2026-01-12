# 🚀 Work-Zen: Cloud-Native Employee Management System

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com/)
[![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=for-the-badge&logo=terraform&logoColor=white)](https://www.terraform.io/)
[![Ansible](https://img.shields.io/badge/Ansible-EE0000?style=for-the-badge&logo=ansible&logoColor=white)](https://www.ansible.com/)
[![Jenkins](https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge&logo=jenkins&logoColor=white)](https://www.jenkins.io/)
[![Grafana](https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white)](https://grafana.com/)
![HuggingFace](https://img.shields.io/badge/HuggingFace-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)
![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-7B61FF?style=for-the-badge)

> **A production-grade, cloud-native Employee Management System with an AI-powered chat interface that integrates the Model Context Protocol (MCP) with a dual-LLM architecture, demonstrating enterprise DevOps practices through Jenkins-based CI/CD automation, Infrastructure as Code (IaC), Dockerized services deployed on AWS EC2, and end-to-end monitoring.**

---

## 🎯 Project Overview


- 👥 **Employee Management**: Complete CRUD operations for employee data
- 💬 **Chat interface**: Natural language queries to database
- 🧠 **Dual LLM System**: OpenRouter (Primary) & HuggingFace (Backup) for Intent Detection + Response Generation 
- 🔄 **MCP Server**:Real-time data retrieval via MCP
- 🔄 **CI/CD Automation** (Jenkins)
- 🐳 **Containerization** (Docker + Docker Compose)
- ☁️ **Cloud Deployment** (AWS EC2)
- 🏗️ **Infrastructure as Code** (Terraform)
- 🤖 **Configuration Management** (Ansible)
- 📊 **Monitoring & Observability** (Prometheus + Grafana)


---
### 🔄 Application Architecture Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
│   User   │────────►│ Next.js  │────────►│ FastAPI  │────────►│   MCP    │────────►│ MongoDB  │
│ Browser  │◄────────│ Frontend │◄────────│ Backend  │◄────────│  Server  │◄────────│  Atlas   │
└──────────┘         └──────────┘         └──────────┘         └──────────┘         └──────────┘
                          │                     │                     │
                          │                     │                     │
                          ▼                     ▼                     ▼
                      React UI             LLM Intent Detection       MCP Tools
                   chat interface         (OpenRouter/HF)        (16 operations)
                                         Response Generation        JSON-RPC stdio
```

### 🏗️ DevOps Architecture

### DevOps Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DEVELOPER WORKFLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                          Git Push to GitHub
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CI/CD PIPELINE (Jenkins)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Source Code Checkout (GitHub Webhook)                                    │
│  2. Unit & Integration Tests (Backend / Frontend)                            │
│  3. Docker Image Build (Multi-stage builds)                                  │
│  4. Image Scan / Best Practices                                              │
│  5. Push Images to Docker Hub                                                │
│  6. Deploy to EXISTING EC2                                                   │
│  7. Health Checks & Smoke Tests                                              │
│  8. Notifications (Success / Failure)                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     RUNNING APPLICATION (PRODUCTION) On EC2                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                        ┌──────────────────────┐                             │
│     Internet (HTTPS)──►│  NGINX Reverse Proxy │                             │
│     Port 443/80        │  Let's Encrypt SSL   │                             │
│                        └──────────────────────┘                             │
│                                 │                                            │
│                    ┌────────────┴─────────────┐                             │
│                    │                          │                             │
│                    ▼                          ▼                             │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐     │
│  │   Frontend       │    │    Backend       │    │   MCP Server     │     │
│  │   (Next.js)      │◄──►│   (FastAPI)      │◄──►│   (Node.js)      │     │
│  │   Port: 3000     │    │   Port: 8000     │    │   stdio          │     │
│  │   Docker Image   │    │   Docker Image   │    │   Subprocess     │     │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘     │
│                                   │                                         │
│                         work-zen-docker-network                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                ┌───────────────────┴────────────────────┐
                │                                        │
                ▼                                        ▼
┌──────────────────────────────────┐   ┌────────────────────────────────────┐
│     DATABASE (MongoDB Atlas)     │   │        MONITORING STACK              │
├──────────────────────────────────┤   ├────────────────────────────────────┤
│  Cloud-hosted NoSQL Database     │   │  Prometheus (9090)                   │
│  - employees                     │   │  Grafana (3001)                     │
│  - attendance                    │   │  Node Exporter (9100)               │
│  - payroll                       │   │  cAdvisor (8081)                    │
└──────────────────────────────────┘   └────────────────────────────────────┘
```

### 🎯 Key DevOps Features

| Feature | Technology | Purpose |
|---------|-----------|---------|
| 🏗️ **IaC** | Terraform | Provision AWS infrastructure (VPC, EC2, Security Groups) |
| 🤖 **Config Mgmt** | Ansible | Server setup, app deployment, monitoring stack |
| 🔄 **CI/CD** | Jenkins | Automated build, test, deploy pipeline with webhooks |
| 📊 **Monitoring** | Prometheus + Grafana | System & container metrics, custom dashboards |
| 🐳 **Containers** | Docker + Compose | Multi-stage builds, optimized images, orchestration |
| ☁️ **Cloud** | AWS EC2 | Production deployment with t3.micro optimization |
| 🔒 **Security** | UFW + Security Groups | Firewall rules, minimal port exposure |
| 🌐 **Reverse Proxy** | NGINX + Let's Encrypt | SSL/TLS termination, HTTPS, load balancing |
| 📈 **Scalability** | Resource limits | Memory/CPU constraints, horizontal scaling ready |

---

## ⚙️ Technology Stack

### 🎨 Frontend Technologies
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

- **Next.js** 14.0.4 - React framework with server-side rendering
- **React** 18.2.0 - UI component library
- **TypeScript** 5 - Type-safe JavaScript
- **TailwindCSS** 3.4.1 - Utility-first CSS framework

### ⚙️ Backend Technologies
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

- **FastAPI** 0.109.0 - High-performance Python REST API
- **Motor** 3.3.2 - Async MongoDB driver
- **PyMongo** 4.6.1 - MongoDB Python driver
- **Python** 3.9+ - Backend programming language
- **Node.js** 18+ - MCP server runtime

### 🤖 AI/ML Technologies
![OpenRouter](https://img.shields.io/badge/OpenRouter-412991?style=for-the-badge&logo=openai&logoColor=white)
![HuggingFace](https://img.shields.io/badge/HuggingFace-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)

- **OpenRouter API** - Primary LLM provider (Mistral-7B-Instruct-v0.2)
- **HuggingFace API** - Backup LLM provider
- **Dual LLM System** - Intent detection + Response generation
- **Model Context Protocol (MCP)** - Anthropic's standard for AI-DB communication

### 🚀 DevOps & Cloud Technologies
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Jenkins](https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge&logo=jenkins&logoColor=white)
![Terraform](https://img.shields.io/badge/Terraform-7B42BC?style=for-the-badge&logo=terraform&logoColor=white)
![Ansible](https://img.shields.io/badge/Ansible-EE0000?style=for-the-badge&logo=ansible&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)
![NGINX](https://img.shields.io/badge/NGINX-009639?style=for-the-badge&logo=nginx&logoColor=white)
![Prometheus](https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white)
![Grafana](https://img.shields.io/badge/Grafana-F46800?style=for-the-badge&logo=grafana&logoColor=white)

- **Docker** - Container runtime and image building
- **Docker Compose** - Multi-container orchestration
- **Jenkins** 2.528.3 - CI/CD automation server
- **Terraform** - Infrastructure as Code for AWS
- **Ansible** - Configuration management and deployment automation
- **AWS EC2** - Cloud compute (t3.micro optimized)
- **NGINX** - High-performance reverse proxy and SSL termination
- **Let's Encrypt** - Free SSL/TLS certificates with auto-renewal
- **Prometheus** v2.47.0 - Metrics collection and alerting
- **Grafana** 10.2.0 - Metrics visualization and dashboards
- **Node Exporter** v1.6.1 - System metrics exporter
- **cAdvisor** v0.49.1 - Container metrics exporter

---

## 🔄 CI/CD Pipeline

### 📋 Jenkins Pipeline Overview

The project uses a comprehensive Jenkins pipeline with the following stages:

```groovy
pipeline {
  agent any
  
  stages {
    1️⃣ Checkout        → Pull latest code from GitHub
    2️⃣ Test Backend    → Python unit tests (optimized)
    3️⃣ Test Frontend   → Node.js unit tests (optimized)
    4️⃣ Build Images    → Docker multi-stage builds
    5️⃣ Push to Hub     → Docker Hub image registry
    6️⃣ Deploy to EC2   → SSH deployment with retry logic
    7️⃣ Health Check    → Verify deployment success
  }
}
```

### 🎯 Pipeline Features

✅ **Automated Testing**
✅ **Docker Image Management**
- Automated push to Docker Hub registry
✅ **Deployment Automation**
- SSH-based deployment to EC2
- Force pull latest images (--pull always)
- Automatic container restart
- Zero-downtime deployment strategy
✅ **Health Checks**
✅ **Notifications**

### Infrastructure Operations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE & OPERATIONS (ON DEMAND)                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TERRAFORM (IaC)                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  • Create EC2 instances                                                      │
│  • Create Security Groups                                                    │
│  • Allocate Elastic IP                                                       │
│  • Define VPC / Subnets                                                      │
│  • Create NEW environments (dev/staging/prod)                               │
│                                                                              │
│  Executed ONLY when:                                                         │
│  ✓ New environment needed                                                    │
│  ✓ Instance type change                                                      │
│  ✓ Infrastructure scaling                                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ANSIBLE (CONFIG MGMT)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  • Install Docker & Docker Compose                                           │
│  • Create /home/ubuntu/Work-Zen                                              │
│  • Configure OS, users, permissions                                          │
│  • Install monitoring stack                                                  │
│  • Bootstrap server to be CI/CD-ready                                       │
│                                                                              │
│  Executed ONLY when:                                                         │
│  ✓ New EC2 created                                                           │
│  ✓ Base config changes                                                       │
│  ✓ Disaster recovery                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 NGINX + SSL Configuration

### 🌐 Production Setup with HTTPS

Work-Zen uses **NGINX as a reverse proxy** with **Let's Encrypt SSL certificates** for secure HTTPS communication in production.

**Live Production URL:** [https://workzen.duckdns.org](https://workzen.duckdns.org)

### 📋 NGINX Configuration Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NGINX Reverse Proxy Architecture                     │
└─────────────────────────────────────────────────────────────────────────────┘

        Internet (Port 443/80)
                │
                ▼
        ┌───────────────┐
        │  NGINX Server │ ← Let's Encrypt SSL Certificate
        │  Port 80/443  │    (Auto-renewal via certbot)
        └───────────────┘
                │
        ┌───────┴────────┐
        │                │
        ▼                ▼
┌──────────────┐  ┌──────────────┐
│  Frontend    │  │  Backend     │
│  :3000       │  │  :8000/api/  │
│  (Next.js)   │  │  (FastAPI)   │
└──────────────┘  └──────────────┘
```

### 🔐 SSL/TLS Features

✅ **Automatic HTTPS Redirect** - HTTP (80) → HTTPS (443)  
✅ **Let's Encrypt Certificate** - Free, auto-renewing SSL/TLS  
✅ **TLS 1.2 & 1.3 Support** - Modern encryption protocols  
✅ **A+ SSL Rating** - Strong cipher configuration  
✅ **HSTS Enabled** - HTTP Strict Transport Security  
✅ **Certificate Auto-Renewal** - Automated via certbot cron job




### 📚 Related Documentation

- **NGINX_SETUP.md** - Detailed NGINX configuration guide
- **AWS_EC2_DEPLOYMENT.md** - EC2 deployment with NGINX
- **DEPLOYMENT_QUICK_START.md** - Quick deployment guide

---

### 🗄️ Database Features
- 🔗 **Foreign Key Relationships**: Proper indexes on `employee_id` linking all collections
- ⚡ **Optimized MongoDB Queries**: Efficient aggregation pipelines
- 🎯 **62+ Filter Parameters**: Comprehensive filtering across all collections



## 🚀 Quick Start

### Prerequisites 📋

| Tool | Version | Purpose |
|------|---------|---------|
| 🐳 Docker | 20.10+ | Container runtime |
| 🎵 Docker Compose | 2.0+ | Multi-container orchestration |
| ☁️ AWS Account | - | Cloud infrastructure (optional) |
| 🔧 Terraform | 1.0+ | Infrastructure provisioning (optional) |
| 🤖 Ansible | 2.9+ | Configuration management (optional) |
| 🚀 Jenkins | 2.5+ | CI/CD automation (optional) |

---

### Option 1: 🐳 Docker Deployment (Recommended)

**Fastest way to get started - production-ready in 3 minutes!**

```bash
# 1️⃣ Clone the repository
git clone https://github.com/shiranthaDS/Work-Zen.git
cd Work-Zen

# 2️⃣ Configure environment
cp .env.example .env
# Edit .env and add your MongoDB URL and API keys

# 3️⃣ Start all services
docker-compose up -d --build

# 4️⃣ Check container status
docker-compose ps

# 5️⃣ View logs
docker-compose logs -f              # All containers
docker-compose logs -f backend      # Backend only
docker-compose logs -f frontend     # Frontend only

# 6️⃣ Access the application
# 🌐 Frontend: http://localhost:3000
# ⚙️ Backend API: http://localhost:8000
# 📚 API Docs: http://localhost:8000/docs
# 📊 Prometheus: http://localhost:9090
# 📈 Grafana: http://localhost:3001

# 🌍 Production URL (when deployed):
# 🔒 Production: https://workzen.duckdns.org
# 🔒 API: https://workzen.duckdns.org/api/
# 📚 API Docs: https://workzen.duckdns.org/api/docs
```

### Common Docker Commands 🛠️

```bash
# Start containers
docker-compose up -d                # 🚀 Start in background
docker-compose up                   # 📋 Start with logs in foreground

# Stop containers
docker-compose stop                 # ⏸️ Stop containers
docker-compose down                 # 🗑️ Stop and remove containers

# Restart containers
docker-compose restart              # 🔄 Restart all
docker-compose restart backend      # 🔄 Restart backend only

# View logs
docker-compose logs -f backend      # 📋 Follow backend logs
docker-compose logs --tail=100 backend  # 📄 Last 100 lines
docker-compose logs --since 30m     # ⏰ Last 30 minutes

# Check container status
docker-compose ps                   # 📊 List all containers
docker ps                          # 🐳 List running containers

# Execute commands in container
docker-compose exec backend bash    # 💻 Access backend shell
docker-compose exec frontend sh     # 💻 Access frontend shell

# Rebuild specific service
docker-compose up -d --build backend

# Clean restart (remove volumes)
docker-compose down -v
docker-compose up -d --build
```


### 🔍 Verifying Your Setup

**Backend Startup Messages:**
```
✅ Connected to MongoDB: ems_database
✅ OpenRouter API configured (Primary LLM)
🚀 Starting MCP Server from: /app/mcp-server
✅ MCP Server started successfully
INFO: Application startup complete.
```

**MCP Server Startup:**
```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB database: ems_database
✅ Database indexes created successfully
EMS MCP Server running on stdio
```

**Container Status (Docker):**
```bash
$ docker-compose ps
NAME                  STATUS          PORTS
work-zen-backend      Up 5 minutes    0.0.0.0:8000->8000/tcp
work-zen-frontend     Up 5 minutes    0.0.0.0:3000->3000/tcp
work-zen-prometheus   Up 5 minutes    0.0.0.0:9090->9090/tcp
work-zen-grafana      Up 5 minutes    0.0.0.0:3001->3001/tcp
work-zen-node-exporter Up 5 minutes   0.0.0.0:9100->9100/tcp
work-zen-cadvisor     Up 5 minutes    0.0.0.0:8081->8081/tcp
```

---

## 📁 Project Structure

```
work-zen/
├── 🔧 infrastructure/           # DevOps & Infrastructure
│   ├── terraform/              # Infrastructure as Code
│   │   ├── main.tf            # AWS resource definitions
│   │   ├── variables.tf       # Input variables
│   │   ├── outputs.tf         # Output values
│   │   └── README.md          # Terraform documentation
│   └── ansible/               # Configuration Management
│       ├── inventory/         # Dynamic inventory
│       ├── playbooks/         # Automation playbooks
│       │   ├── setup.yml     # Server provisioning
│       │   ├── deploy.yml    # App deployment
│       │   ├── monitoring.yml # Monitoring setup
│       │   └── rollback.yml  # Rollback procedures
│       └── README.md          # Ansible documentation
│
├── 📊 monitoring/              # Observability Stack
│   ├── prometheus/
│   │   └── prometheus.yml     # Prometheus configuration
│   ├── grafana/
│   │   └── provisioning/
│   │       ├── datasources/   # Auto-provisioned datasources
│   │       └── dashboards/    # Pre-configured dashboards
│   └── docker-compose.monitoring.yml
│
├── ⚙️ backend/                 # FastAPI Backend
│   ├── app/
│   │   ├── database.py        # MongoDB connection
│   │   ├── main.py            # FastAPI app
│   │   ├── mcp_client.py      # MCP Client (stdio)
│   │   ├── models/            # Pydantic models
│   │   └── routes/            # API endpoints
│   │       ├── employees.py
│   │       ├── job_data.py
│   │       ├── attendance.py
│   │       ├── leaves.py
│   │       ├── payroll.py
│   │       └── chat.py        # AI chat endpoint
│   ├── Dockerfile             # Multi-stage build
│   ├── requirements.txt
│   └── .env
│
├── 🔌 mcp-server/              # MCP Server (Node.js)
│   ├── index.js              # MCP server with 16 MongoDB tools
│   ├── database.js           # MongoDB connection
│   ├── package.json
│   └── .env
│
├── 🎨 frontend/                # Next.js Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx              # Dashboard
│   │   │   ├── employees/            # Employee pages
│   │   │   ├── job-data/             # Job data pages
│   │   │   ├── attendance/           # Attendance pages
│   │   │   ├── leaves/               # Leave pages
│   │   │   ├── payroll/              # Payroll pages
│   │   │   ├── salary-structures/    # Salary pages
│   │   │   └── chat/                 # AI chat page
│   │   ├── components/               # Reusable components
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   └── services/                 # API services
│   ├── Dockerfile             # Multi-stage build
│   ├── package.json
│   └── .env.local
│
├── 🔄 Jenkinsfile              # CI/CD Pipeline Definition
├── 🐳 docker-compose.yml       # Application orchestration
├── 📊 docker-compose.monitoring.yml  # Monitoring stack
├── 📚 Documentation/
│   ├── README.md              # This file
│   ├── ARCHITECTURE.md        # System architecture
│   ├── DOCKER_SETUP.md        # Docker guide
│   ├── AWS_EC2_DEPLOYMENT.md  # AWS deployment
│   ├── JENKINS_SETUP.md       # CI/CD setup
│   └── DEPLOYMENT_QUICK_START.md
└── .env.example               # Environment template
```

---

### 🔑 MCP Tools Available

The MCP Server provides **16 specialized tools** for database operations:

| Tool | Description |
|------|-------------|
| `list_employees` | Get all employees |
| `get_employee` | Get employee by ID |
| `search_employees` | Advanced employee search |
| `list_job_data` | Get all job data |
| `get_job_data` | Get job data by employee |
| `list_attendance` | Get attendance records |
| `get_attendance` | Get attendance by employee |
| `list_leaves` | Get leave requests |
| `get_leave` | Get specific leave |
| `pending_leaves` | Get pending approvals |
| `get_leave_balance` | Calculate leave balance |
| `list_payroll` | Get payroll records |
| `get_payroll` | Get payroll by employee |
| `department_employees` | Get employees by dept |
| `stats_summary` | System statistics |
| `search` | General search |

---

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 👥 Contributors

**Shirantha Dissanayake**
- 📧 Email: shiranthadw@gmail.com
- 🐙 GitHub: [@shiranthaDS](https://github.com/shiranthaDS)

---

## 📧 Support & Contact

For issues, questions, or contributions:

- 🐛 **Issues**: [GitHub Issues](https://github.com/shiranthaDS/Work-Zen/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/shiranthaDS/Work-Zen/discussions)


---

<div align="center">

## ⭐ Star This Repository!

If you find this project helpful, please consider giving it a star on GitHub!

[![GitHub stars](https://img.shields.io/github/stars/shiranthaDS/Work-Zen?style=social)](https://github.com/shiranthaDS/Work-Zen/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/shiranthaDS/Work-Zen?style=social)](https://github.com/shiranthaDS/Work-Zen/network/members)
[![GitHub issues](https://img.shields.io/github/issues/shiranthaDS/Work-Zen)](https://github.com/shiranthaDS/Work-Zen/issues)
[![GitHub license](https://img.shields.io/github/license/shiranthaDS/Work-Zen)](https://github.com/shiranthaDS/Work-Zen/blob/main/LICENSE)

---

**Built with ❤️ using FastAPI, Next.js, Model Context Protocol, and Enterprise DevOps Practices**

🚀 **Showcasing:** Docker • Kubernetes • Terraform • Ansible • Jenkins • Prometheus • Grafana • AWS • CI/CD

---

*This project demonstrates production-grade DevOps practices and cloud-native architecture suitable for enterprise environments.*

</div>
