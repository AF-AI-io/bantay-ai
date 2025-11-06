#!/bin/bash

# Bantay-AI Startup Script
echo "🇵🇭 Bantay-AI - Philippines Flood Warning System"
echo "=============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ $NODE_VERSION -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm run install:all
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

echo "🚀 Starting Bantay-AI development server..."
echo ""
echo "📋 Available URLs:"
echo "   🌐 PWA: http://localhost:3000"
echo "   🔌 API: http://localhost:3001"
echo ""
echo "🧪 Quick Demo Commands:"
echo "   npm run test:danger   # Trigger emergency alert"
echo "   npm run test:safe     # Return to safe state"
echo "   npm run demo          # Interactive demo menu"
echo ""
echo "📱 PWA Features to Test:"
echo "   • Add to Home Screen"
echo "   • Offline functionality"
echo "   • Push notifications"
echo "   • Location permissions"
echo ""

# Start both servers
npm run dev:full