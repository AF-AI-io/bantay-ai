#!/bin/bash

# Bantay-AI Demo Script
# This script demonstrates the different states and features of the PWA

echo "🚨 Bantay-AI Demo Script"
echo "======================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to make requests to the mock API
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    echo -e "${BLUE}Making request: $method $endpoint${NC}"
    
    if [ ! -z "$data" ]; then
        curl -X "$method" "http://localhost:3001/api/v1$endpoint" \
             -H "Content-Type: application/json" \
             -d "$data" 2>/dev/null | jq '.' 2>/dev/null || \
        curl -X "$method" "http://localhost:3001/api/v1$endpoint" \
             -H "Content-Type: application/json" \
             -d "$data" 2>/dev/null
    else
        curl -X "$method" "http://localhost:3001/api/v1$endpoint" \
             -H "Content-Type: application/json" 2>/dev/null | jq '.' 2>/dev/null || \
        curl -X "$method" "http://localhost:3001/api/v1$endpoint" \
             -H "Content-Type: application/json" 2>/dev/null
    fi
    
    echo ""
}

# Check if server is running
echo "Checking if Bantay-AI server is running..."
if ! curl -s http://localhost:3001/health >/dev/null 2>&1; then
    echo -e "${RED}❌ Bantay-AI server is not running!${NC}"
    echo "Please start the mock server first:"
    echo "  node mock-server.js"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Server is running!${NC}"
echo ""

# Demo menu
echo "Select a demo scenario:"
echo "1) 🌟 Safe State (Normal Operation)"
echo "2) 🚨 Danger State (Emergency Alert)"
echo "3) ⚠️  Warning State (Caution)"
echo "4) 📊 View Current Sensor Data"
echo "5) 👤 View User Data"
echo "6) 🏠 Update Home Location"
echo "7) 🧪 Full Demo Sequence"
echo "8) 🔄 Reset to Safe State"
echo "9) 🚀 Open PWA in Browser"
echo ""

read -p "Enter your choice (1-9): " choice

case $choice in
    1)
        echo -e "${GREEN}Setting safe state...${NC}"
        make_request "POST" "/test/clear-danger"
        echo ""
        echo -e "${GREEN}✅ App is now in SAFE state${NC}"
        echo -e "${YELLOW}💡 Features visible:${NC}"
        echo "   • Green status indicators"
        echo "   • Normal map view with sensors"
        echo "   • Swipe-up status sheet"
        echo ""
        ;;
        
    2)
        echo -e "${RED}Setting danger state...${NC}"
        make_request "POST" "/test/trigger-danger"
        echo ""
        echo -e "${RED}🚨 App is now in DANGER state${NC}"
        echo -e "${YELLOW}💡 Features visible:${NC}"
        echo "   • Full-screen red emergency alert"
        echo "   • 'EVACUATE NOW' message"
        echo "   • Countdown timer"
        echo "   • Evacuation route button"
        echo "   • 'I Am Safe' confirmation"
        echo ""
        ;;
        
    3)
        echo -e "${YELLOW}Setting warning state...${NC}"
        # Simulate warning by updating sensor data
        make_request "POST" "/test/trigger-danger"
        echo ""
        echo -e "${YELLOW}⚠️  App is now in WARNING state${NC}"
        echo -e "${YELLOW}💡 Features visible:${NC}"
        echo "   • Yellow/orange status indicators"
        echo "   • Sensor warnings on map"
        echo "   • Caution messages"
        echo ""
        ;;
        
    4)
        echo -e "${BLUE}Fetching sensor data...${NC}"
        make_request "GET" "/sensors"
        echo ""
        echo -e "${BLUE}Current system sensors and readings:${NC}"
        echo ""
        ;;
        
    5)
        echo -e "${BLUE}Fetching user data...${NC}"
        make_request "GET" "/user"
        echo ""
        echo -e "${BLUE}User profile and settings:${NC}"
        echo ""
        ;;
        
    6)
        echo -e "${BLUE}Updating home location...${NC}"
        read -p "Enter latitude: " lat
        read -p "Enter longitude: " lng
        make_request "POST" "/user/location" "{\"home_location\": {\"lat\": $lat, \"lng\": $lng}}"
        echo ""
        echo -e "${GREEN}✅ Home location updated${NC}"
        echo ""
        ;;
        
    7)
        echo -e "${BLUE}🔄 Running full demo sequence...${NC}"
        echo ""
        
        echo "Step 1: Safe state"
        make_request "POST" "/test/clear-danger"
        sleep 2
        
        echo "Step 2: Warning state"
        make_request "POST" "/test/trigger-danger"
        sleep 2
        
        echo "Step 3: Back to safe state"
        make_request "POST" "/test/clear-danger"
        sleep 2
        
        echo "Step 4: Final safe state"
        make_request "POST" "/test/clear-danger"
        
        echo ""
        echo -e "${GREEN}✅ Demo sequence complete!${NC}"
        echo ""
        ;;
        
    8)
        echo -e "${GREEN}Resetting to safe state...${NC}"
        make_request "POST" "/test/clear-danger"
        echo ""
        echo -e "${GREEN}✅ App reset to SAFE state${NC}"
        echo ""
        ;;
        
    9)
        echo -e "${BLUE}Opening Bantay-AI PWA...${NC}"
        echo ""
        echo -e "${YELLOW}🌐 Opening in your default browser:${NC}"
        echo "   http://localhost:3000"
        echo ""
        echo -e "${YELLOW}📱 To test PWA features:${NC}"
        echo "   • Add to Home Screen (Chrome: Menu → Add to Home screen)"
        echo "   • Test offline mode (Disconnect internet)"
        echo "   • Check push notifications (Allow when prompted)"
        echo ""
        echo -e "${YELLOW}🔗 Direct links for testing:${NC}"
        echo "   Safe state: http://localhost:3000"
        echo "   Danger alert: http://localhost:3000/?alert=danger"
        echo ""
        
        # Try to open in browser (works on most systems)
        if command -v xdg-open > /dev/null; then
            xdg-open http://localhost:3000
        elif command -v open > /dev/null; then
            open http://localhost:3000
        else
            echo "Please open http://localhost:3000 in your browser manually"
        fi
        ;;
        
    *)
        echo -e "${RED}Invalid choice. Please run the script again.${NC}"
        echo ""
        exit 1
        ;;
esac

echo -e "${BLUE}📋 Additional Testing URLs:${NC}"
echo "   🌟 Safe Mode: http://localhost:3000"
echo "   🚨 Danger Mode: http://localhost:3000/?alert=danger"
echo "   🔧 Debug Mode: http://localhost:3000/?debug=true"
echo ""
echo -e "${GREEN}Happy testing! 🧪${NC}"
echo ""