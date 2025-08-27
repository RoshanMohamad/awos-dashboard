#!/bin/bash
# Quick test script for MQTT bridge functionality

set -e

echo "🚀 Testing MQTT Bridge Setup"
echo "=============================="

# Check if mosquitto_pub is available
if ! command -v mosquitto_pub &> /dev/null; then
    echo "⚠️  mosquitto_pub not found. Install mosquitto clients:"
    echo "   Windows: choco install mosquitto"
    echo "   Ubuntu:  sudo apt install mosquitto-clients" 
    echo "   macOS:   brew install mosquitto"
    exit 1
fi

# Default values
MQTT_HOST=${MQTT_HOST:-localhost}
MQTT_PORT=${MQTT_PORT:-1883}
MQTT_TOPIC=${MQTT_TOPIC:-awos/readings/VCBI}

echo "📡 Publishing test messages to MQTT broker"
echo "   Host: $MQTT_HOST:$MQTT_PORT"
echo "   Topic: $MQTT_TOPIC"
echo ""

# Test message 1: Complete weather reading
echo "1. Publishing complete weather reading..."
mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" -t "$MQTT_TOPIC" -m '{
  "temperature": 28.5,
  "humidity": 65.2,
  "pressure": 1013.2,
  "windSpeed": 12.5,
  "windDirection": 180,
  "windGust": 15.0,
  "visibility": 10000,
  "precipitation1h": 0.0,
  "weatherCode": 800,
  "weatherDescription": "Clear sky",
  "stationId": "VCBI",
  "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
  "dataQuality": "good"
}'

sleep 2

# Test message 2: Minimal reading
echo "2. Publishing minimal reading..."
mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" -t "$MQTT_TOPIC" -m '{
  "temperature": 30.1,
  "humidity": 58.0,
  "stationId": "VCBI",
  "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
}'

sleep 2

# Test message 3: Invalid JSON (should be wrapped)
echo "3. Publishing invalid JSON (should be wrapped)..."
mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" -t "$MQTT_TOPIC" -m 'raw_sensor_data_string'

sleep 2

# Test message 4: Different station
echo "4. Publishing data for different station..."
mosquitto_pub -h "$MQTT_HOST" -p "$MQTT_PORT" -t "awos/readings/VCCT" -m '{
  "temperature": 26.8,
  "humidity": 72.5,
  "pressure": 1008.7,
  "stationId": "VCCT",
  "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
}'

echo ""
echo "✅ Test messages published successfully!"
echo ""
echo "Next steps:"
echo "1. Check bridge logs for 'Forwarded message to ingest endpoint'"
echo "2. Check your AWOS dashboard for new data"
echo "3. Verify backend API logs show successful ingestion"
