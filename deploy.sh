#!/bin/bash

# Call Center Dashboard - Quick Deployment Script
# This script automates the deployment process

set -e  # Exit on any error

echo "=========================================="
echo "Call Center Dashboard - Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: .env.local file not found${NC}"
    echo "Please create .env.local with your database credentials"
    echo "Copy from .env.example: cp .env.example .env.local"
    exit 1
fi

echo -e "${GREEN}✓${NC} Found .env.local"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Error: Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓${NC} Node.js version: $NODE_VERSION"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} npm is installed"
echo ""

# Ask deployment type
echo "Select deployment type:"
echo "1) Development (npm run dev)"
echo "2) Production Build & Start (npm run build && npm start)"
echo "3) Production with PM2"
read -p "Enter choice [1-3]: " DEPLOY_TYPE

case $DEPLOY_TYPE in
    1)
        echo ""
        echo "=========================================="
        echo "Starting Development Server"
        echo "=========================================="
        echo ""
        
        # Install dependencies if node_modules doesn't exist
        if [ ! -d "node_modules" ]; then
            echo "Installing dependencies..."
            npm install
        fi
        
        echo ""
        echo -e "${GREEN}✓${NC} Starting development server on http://localhost:3001"
        echo "Press Ctrl+C to stop"
        echo ""
        npm run dev
        ;;
        
    2)
        echo ""
        echo "=========================================="
        echo "Building for Production"
        echo "=========================================="
        echo ""
        
        # Install dependencies
        echo "Installing dependencies..."
        npm install
        
        echo ""
        echo "Building production bundle..."
        npm run build
        
        echo ""
        echo -e "${GREEN}✓${NC} Build complete!"
        echo ""
        echo "Starting production server on http://localhost:3001"
        echo "Press Ctrl+C to stop"
        echo ""
        npm start
        ;;
        
    3)
        echo ""
        echo "=========================================="
        echo "Deploying with PM2"
        echo "=========================================="
        echo ""
        
        # Check if PM2 is installed
        if ! command -v pm2 &> /dev/null; then
            echo -e "${YELLOW}⚠${NC} PM2 is not installed"
            read -p "Install PM2 globally? (y/n): " INSTALL_PM2
            if [ "$INSTALL_PM2" = "y" ]; then
                echo "Installing PM2..."
                npm install -g pm2
            else
                echo -e "${RED}❌ PM2 is required for this deployment type${NC}"
                exit 1
            fi
        fi
        
        echo -e "${GREEN}✓${NC} PM2 is installed"
        
        # Install dependencies
        echo "Installing dependencies..."
        npm install
        
        echo ""
        echo "Building production bundle..."
        npm run build
        
        echo ""
        echo "Starting with PM2..."
        
        # Stop existing instance if running
        pm2 delete dashboard 2>/dev/null || true
        
        # Start new instance
        pm2 start npm --name "dashboard" -- start
        
        # Save PM2 configuration
        pm2 save
        
        echo ""
        echo -e "${GREEN}✓${NC} Dashboard deployed with PM2!"
        echo ""
        echo "Useful PM2 commands:"
        echo "  pm2 status          - Check status"
        echo "  pm2 logs dashboard  - View logs"
        echo "  pm2 monit           - Monitor in real-time"
        echo "  pm2 restart dashboard - Restart"
        echo "  pm2 stop dashboard  - Stop"
        echo ""
        
        # Show status
        pm2 status
        ;;
        
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Access your dashboard at:"
echo "  http://localhost:3001"
echo ""
echo "For remote access, set up a reverse proxy or use:"
echo "  http://YOUR_SERVER_IP:3001"
echo ""
