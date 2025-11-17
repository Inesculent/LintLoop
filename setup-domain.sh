#!/bin/bash
# LintLoop Domain Setup Script
# This script configures Nginx with SSL for www.inesculent.dev
# Run this on your DigitalOcean server as root or with sudo

set -e  # Exit on any error

echo "========================================="
echo "LintLoop Domain Setup"
echo "Setting up: www.inesculent.dev"
echo "========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

echo -e "${GREEN}Step 1:${NC} Updating system packages..."
apt update -qq

echo -e "${GREEN}Step 2:${NC} Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install nginx -y
    echo "Nginx installed successfully"
else
    echo "Nginx already installed"
fi

echo -e "${GREEN}Step 3:${NC} Installing Certbot for SSL..."
if ! command -v certbot &> /dev/null; then
    apt install certbot python3-certbot-nginx -y
    echo "Certbot installed successfully"
else
    echo "Certbot already installed"
fi

echo -e "${GREEN}Step 4:${NC} Configuring firewall..."
ufw allow 'Nginx Full'
ufw allow OpenSSH
echo "Firewall configured"

echo -e "${GREEN}Step 5:${NC} Copying Nginx configuration..."
# Copy the nginx config from the repo
cd ~/linterloop
if [ -f "nginx-linterloop.conf" ]; then
    cp nginx-linterloop.conf /etc/nginx/sites-available/linterloop
    echo "Nginx config copied"
else
    echo -e "${RED}Error: nginx-linterloop.conf not found in ~/linterloop${NC}"
    exit 1
fi

echo -e "${GREEN}Step 6:${NC} Obtaining SSL certificate..."
echo -e "${YELLOW}Note: You'll need to provide an email address for Let's Encrypt${NC}"
echo ""

# Get SSL certificate
certbot --nginx -d www.inesculent.dev -d inesculent.dev --non-interactive --agree-tos --redirect --email root@inesculent.dev || {
    echo -e "${YELLOW}Automated SSL failed. Running interactive mode...${NC}"
    certbot --nginx -d www.inesculent.dev -d inesculent.dev
}

echo -e "${GREEN}Step 7:${NC} Enabling site..."
# Remove default site if it exists
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    rm /etc/nginx/sites-enabled/default
    echo "Removed default site"
fi

# Create symlink
ln -sf /etc/nginx/sites-available/linterloop /etc/nginx/sites-enabled/
echo "Site enabled"

echo -e "${GREEN}Step 8:${NC} Testing Nginx configuration..."
if nginx -t; then
    echo -e "${GREEN}Nginx configuration is valid${NC}"
else
    echo -e "${RED}Nginx configuration has errors. Please check.${NC}"
    exit 1
fi

echo -e "${GREEN}Step 9:${NC} Restarting Nginx..."
systemctl restart nginx
systemctl enable nginx
echo "Nginx restarted and enabled"

echo -e "${GREEN}Step 10:${NC} Setting up SSL auto-renewal..."
# Test renewal
certbot renew --dry-run
echo "SSL auto-renewal configured"

echo ""
echo "========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "========================================="
echo ""
echo "Your LintLoop instance is now accessible at:"
echo -e "${GREEN}https://www.inesculent.dev${NC}"
echo ""
echo "Next steps:"
echo "1. Update GitHub secret NEXT_PUBLIC_API_URL to: https://www.inesculent.dev"
echo "2. Push your changes to trigger a new deployment"
echo "3. Verify the site loads at https://www.inesculent.dev"
echo ""
echo "Useful commands:"
echo "  - Check Nginx status: systemctl status nginx"
echo "  - View Nginx logs: tail -f /var/log/nginx/linterloop_error.log"
echo "  - Test SSL: curl -I https://www.inesculent.dev"
echo "  - Renew SSL: certbot renew"
echo ""

