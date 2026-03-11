#!/bin/bash

# Quick Dashboard Test Script
# Tests database connection and basic functionality

echo "=========================================="
echo "Dashboard Connection Test"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check .env.local
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ .env.local not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} .env.local found"

# Extract database credentials
DB_HOST=$(grep DB_HOST .env.local | cut -d '=' -f2)
DB_USER=$(grep DB_USER .env.local | cut -d '=' -f2)
DB_NAME=$(grep DB_NAME .env.local | cut -d '=' -f2)

echo "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Test if mysql client is available
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠${NC} MySQL client not installed - skipping database test"
    echo "Install with: brew install mysql-client (macOS) or apt-get install mysql-client (Linux)"
else
    echo "Testing database connection..."
    read -sp "Enter database password: " DB_PASSWORD
    echo ""
    
    # Test connection
    if mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" -e "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}✓${NC} Database connection successful"
        
        # Count calls
        CALL_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" -se "SELECT COUNT(*) FROM calls WHERE organization_id = 1;")
        echo -e "${GREEN}✓${NC} Found $CALL_COUNT calls in database"
        
        # Count contacts
        CONTACT_COUNT=$(mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -D "$DB_NAME" -se "SELECT COUNT(*) FROM contacts WHERE organization_id = 1;")
        echo -e "${GREEN}✓${NC} Found $CONTACT_COUNT contacts in database"
        
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        echo "Please check your credentials in .env.local"
        exit 1
    fi
fi

echo ""
echo "=========================================="
echo "Testing Dashboard Endpoints"
echo "=========================================="
echo ""

# Check if dashboard is running
if curl -s http://localhost:3001 > /dev/null; then
    echo -e "${GREEN}✓${NC} Dashboard is running on http://localhost:3001"
    
    # Test API endpoints
    echo "Testing API endpoints..."
    
    if curl -s http://localhost:3001/api/health > /dev/null; then
        echo -e "${GREEN}✓${NC} /api/health - OK"
    else
        echo -e "${RED}❌${NC} /api/health - Failed"
    fi
    
    if curl -s http://localhost:3001/api/dashboard/stats > /dev/null; then
        echo -e "${GREEN}✓${NC} /api/dashboard/stats - OK"
    else
        echo -e "${RED}❌${NC} /api/dashboard/stats - Failed"
    fi
    
else
    echo -e "${YELLOW}⚠${NC} Dashboard is not running"
    echo "Start it with: ./deploy.sh"
fi

echo ""
echo "=========================================="
echo "Test Complete"
echo "=========================================="
echo ""
