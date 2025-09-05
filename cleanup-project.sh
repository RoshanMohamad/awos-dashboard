#!/bin/bash

# 🧹 AWOS Dashboard Cleanup Script
# Removes unwanted Docker components and keeps only essential MQTT bridge

echo "🧹 Cleaning up AWOS Dashboard project..."
echo "Removing unwanted Docker and old MQTT files..."

# Create backup directory
mkdir -p .backup
echo "📁 Created backup directory for removed files"

# Remove Docker files
if [ -f "docker-compose.yml" ]; then
    mv docker-compose.yml .backup/
    echo "✅ Moved docker-compose.yml to backup"
fi

if [ -f "Dockerfile.mqtt-bridge" ]; then
    mv Dockerfile.mqtt-bridge .backup/
    echo "✅ Moved Dockerfile.mqtt-bridge to backup"
fi

# Remove old MQTT bridge (keep the new standalone one)
if [ -f "scripts/mqtt-bridge.js" ]; then
    mv scripts/mqtt-bridge.js .backup/
    echo "✅ Moved old mqtt-bridge.js to backup"
fi

# Remove mosquitto config (not needed for cloud MQTT)
if [ -f "mosquitto.conf" ]; then
    mv mosquitto.conf .backup/
    echo "✅ Moved mosquitto.conf to backup"
fi

# Remove test scripts we don't need
if [ -f "scripts/test-mqtt-bridge.sh" ]; then
    mv scripts/test-mqtt-bridge.sh .backup/
    echo "✅ Moved test-mqtt-bridge.sh to backup"
fi

# Keep these important files:
echo ""
echo "✅ Keeping essential files:"
echo "   - scripts/mqtt-bridge-standalone.js (MQTT → Vercel bridge)"
echo "   - scripts/esp32-weather-station.ino (ESP32 code)"
echo "   - All Next.js app files"
echo "   - API routes"

# Update package.json to remove Docker scripts
echo ""
echo "🔧 Cleaning up package.json scripts..."

# Create a backup of package.json
cp package.json .backup/package.json.backup

# Remove Docker-related scripts from package.json
cat package.json | \
  grep -v '"docker-up"' | \
  grep -v '"docker-down"' | \
  grep -v '"docker-logs"' > package.json.tmp && \
  mv package.json.tmp package.json

echo "✅ Removed Docker scripts from package.json"

# Update gitignore to ignore backup folder
if ! grep -q ".backup/" .gitignore 2>/dev/null; then
    echo ".backup/" >> .gitignore
    echo "✅ Added .backup/ to .gitignore"
fi

# Clean up node_modules from removed packages (optional)
echo ""
echo "🔧 Cleaning up unused dependencies..."

# Remove Docker-related dependencies (if any)
npm uninstall docker 2>/dev/null || true
npm uninstall docker-compose 2>/dev/null || true

echo ""
echo "🎉 Cleanup complete!"
echo ""
echo "📊 Your simplified project structure:"
echo "✅ Essential Files Kept:"
echo "   📁 app/ (Next.js application)"
echo "   📁 components/ (React components)"
echo "   📁 lib/ (API clients & utilities)"
echo "   📁 public/ (Static assets)"
echo "   📄 scripts/mqtt-bridge-standalone.js (MQTT bridge)"
echo "   📄 scripts/esp32-weather-station.ino (ESP32 code)"
echo "   📄 scripts/test-api.js (API testing)"
echo ""
echo "🗑️ Removed Files (backed up in .backup/):"
echo "   📄 docker-compose.yml"
echo "   📄 Dockerfile.mqtt-bridge"
echo "   📄 mosquitto.conf"
echo "   📄 scripts/mqtt-bridge.js (old version)"
echo ""
echo "🚀 Ready for deployment:"
echo "   1. Local development: npm run dev"
echo "   2. MQTT bridge: npm run mqtt-bridge:dev"
echo "   3. Deploy to Vercel: vercel --prod"
echo ""
echo "💡 Your project is now optimized for Vercel deployment!"
