#!/bin/bash

# AWOS Dashboard - Remove MQTT Components Script
# This script removes MQTT-related files to simplify the project

echo "🧹 Cleaning up MQTT components from AWOS Dashboard..."

# Remove Docker-related files
echo "Removing Docker files..."
if [ -f "docker-compose.yml" ]; then
    mv docker-compose.yml docker-compose.yml.backup
    echo "✅ Moved docker-compose.yml to backup"
fi

if [ -f "Dockerfile.mqtt-bridge" ]; then
    rm -f Dockerfile.mqtt-bridge
    echo "✅ Removed Dockerfile.mqtt-bridge"
fi

# Remove MQTT configuration
echo "Removing MQTT configuration..."
if [ -f "mosquitto.conf" ]; then
    mv mosquitto.conf mosquitto.conf.backup
    echo "✅ Moved mosquitto.conf to backup"
fi

# Remove MQTT bridge script
echo "Removing MQTT bridge..."
if [ -f "scripts/mqtt-bridge.js" ]; then
    mv scripts/mqtt-bridge.js scripts/mqtt-bridge.js.backup
    echo "✅ Moved mqtt-bridge.js to backup"
fi

# Update package.json to remove MQTT-related scripts
echo "Updating package.json..."
if [ -f "package.json" ]; then
    # Create backup
    cp package.json package.json.backup
    
    # Remove MQTT-related scripts (you can do this manually)
    echo "📝 Manually remove these scripts from package.json:"
    echo "   - mqtt-bridge"
    echo "   - docker-up"
    echo "   - docker-down"
    echo "   - docker-logs"
fi

# Remove MQTT dependencies
echo "Removing MQTT dependencies..."
npm uninstall mqtt 2>/dev/null || echo "mqtt package not found"

echo ""
echo "🎉 MQTT cleanup complete!"
echo ""
echo "Your simplified project structure:"
echo "✅ app/ (Next.js application)"
echo "✅ components/ (React components)" 
echo "✅ lib/ (API clients)"
echo "✅ scripts/esp32-weather-station.ino (HTTP-based ESP32 code)"
echo "✅ API routes (HTTP endpoints)"
echo ""
echo "❌ Removed:"
echo "   - Docker compose setup"
echo "   - MQTT broker configuration"
echo "   - MQTT bridge service"
echo ""
echo "🚀 You can now deploy directly to Vercel with:"
echo "   npm run build"
echo "   vercel --prod"
echo ""
echo "💡 Your ESP32 will connect directly via HTTP to Vercel!"
