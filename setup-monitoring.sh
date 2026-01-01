#!/bin/bash
# =============================================================================
# Work-Zen Monitoring Setup Script
# =============================================================================
# Usage: ./setup-monitoring.sh [start|stop|restart|status]
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get EC2 public IP
get_ec2_ip() {
    # Try to get from metadata service
    EC2_IP=$(curl -s --connect-timeout 2 http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "")
    if [ -z "$EC2_IP" ]; then
        # Fallback to hostname
        EC2_IP=$(hostname -I | awk '{print $1}')
    fi
    echo "$EC2_IP"
}

start_monitoring() {
    print_status "Starting Work-Zen Monitoring Stack..."
    
    # Create network if not exists
    docker network create work-zen-network 2>/dev/null || true
    
    # Export EC2 host for Grafana
    export EC2_HOST=$(get_ec2_ip)
    print_status "EC2 Host: $EC2_HOST"
    
    # Start monitoring stack
    docker compose -f docker-compose.monitoring.yml up -d
    
    # Wait for services
    print_status "Waiting for services to start..."
    sleep 10
    
    # Check services
    echo ""
    print_success "Monitoring Stack Started!"
    echo "=============================================="
    echo -e "📊 ${GREEN}Prometheus${NC}:  http://$EC2_HOST:9090"
    echo -e "📈 ${GREEN}Grafana${NC}:     http://$EC2_HOST:3001"
    echo -e "   Username: admin"
    echo -e "   Password: WorkZen@2024"
    echo -e "🖥️  ${GREEN}Node Exporter${NC}: http://$EC2_HOST:9100/metrics"
    echo -e "🐳 ${GREEN}cAdvisor${NC}:    http://$EC2_HOST:8081"
    echo "=============================================="
}

stop_monitoring() {
    print_status "Stopping Work-Zen Monitoring Stack..."
    docker compose -f docker-compose.monitoring.yml down
    print_success "Monitoring Stack Stopped!"
}

restart_monitoring() {
    stop_monitoring
    sleep 2
    start_monitoring
}

status_monitoring() {
    print_status "Monitoring Stack Status:"
    echo ""
    docker compose -f docker-compose.monitoring.yml ps
    echo ""
    
    # Check resource usage
    print_status "Resource Usage:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" \
        work-zen-prometheus work-zen-grafana work-zen-node-exporter work-zen-cadvisor 2>/dev/null || \
        print_warning "Some monitoring containers may not be running"
}

show_help() {
    echo "Work-Zen Monitoring Setup Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start     Start the monitoring stack"
    echo "  stop      Stop the monitoring stack"
    echo "  restart   Restart the monitoring stack"
    echo "  status    Show status and resource usage"
    echo "  help      Show this help message"
    echo ""
}

# Main
case "${1:-start}" in
    start)
        start_monitoring
        ;;
    stop)
        stop_monitoring
        ;;
    restart)
        restart_monitoring
        ;;
    status)
        status_monitoring
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
