# AWOS Dashboard Scripts

This directory contains utility scripts for the AWOS Dashboard project.

## MQTT Bridge (`mqtt-bridge.js`)

The MQTT bridge connects to an MQTT broker, subscribes to sensor data topics, and forwards messages to the backend ingest API.

### Features

- **Robust Connection**: Auto-reconnect to MQTT broker on connection loss
- **Retry Logic**: Configurable retries for HTTP POST failures
- **Queue Management**: Prevents flooding the ingest endpoint
- **Graceful Shutdown**: Handles SIGINT/SIGTERM for clean exit
- **Flexible Configuration**: Environment variable based setup

### Prerequisites

```bash
# Install dependencies
npm install mqtt

# For Node.js < 18, also install:
npm install node-fetch@2
```

### Configuration

Configure via environment variables:

| Variable                     | Default                            | Description                        |
| ---------------------------- | ---------------------------------- | ---------------------------------- |
| `MQTT_BROKER_URL`            | `mqtt://localhost:1883`            | MQTT broker connection URL         |
| `MQTT_TOPIC`                 | `awos/readings/#`                  | MQTT topic pattern to subscribe to |
| `INGEST_URL`                 | `http://localhost:3000/api/ingest` | Backend ingest endpoint URL        |
| `MQTT_CLIENT_ID`             | `awos-bridge-{random}`             | MQTT client identifier             |
| `MQTT_BRIDGE_CONCURRENCY`    | `1`                                | Max concurrent HTTP requests       |
| `MQTT_BRIDGE_RETRY`          | `3`                                | Number of retry attempts           |
| `MQTT_BRIDGE_RETRY_DELAY_MS` | `2000`                             | Delay between retries (ms)         |

### Usage

#### Basic Usage

```bash
# Run with defaults
node scripts/mqtt-bridge.js

# Run with custom configuration
MQTT_BROKER_URL=mqtt://mosquitto.example.com:1883 \
MQTT_TOPIC=sensors/weather/+ \
INGEST_URL=https://your-app.com/api/ingest \
node scripts/mqtt-bridge.js
```

#### Docker Compose Setup

Use the provided `docker-compose.yml` to run an MQTT broker and bridge together:

```bash
# Start MQTT broker + bridge
docker-compose up -d

# View logs
docker-compose logs -f bridge

# Stop services
docker-compose down
```

#### Testing the Bridge

1. **Start the AWOS dashboard**:

   ```bash
   npm run dev
   ```

2. **Start the MQTT bridge** (in another terminal):

   ```bash
   node scripts/mqtt-bridge.js
   ```

3. **Publish a test message** to MQTT:

   ```bash
   # Install mosquitto clients
   # Windows: choco install mosquitto
   # Ubuntu: sudo apt install mosquitto-clients
   # macOS: brew install mosquitto

   # Publish sensor data
   mosquitto_pub -h localhost -t "awos/readings/VCBI" -m '{
     "temperature": 28.5,
     "humidity": 65.2,
     "pressure": 1013.2,
     "windSpeed": 12.5,
     "windDirection": 180,
     "stationId": "VCBI",
     "timestamp": "2025-08-26T12:00:00Z"
   }'
   ```

4. **Verify data arrival**:
   - Check bridge logs for "Forwarded message to ingest endpoint"
   - Check backend logs for successful ingestion
   - View data in dashboard UI

### Message Format

The bridge expects JSON payloads matching the ingest API schema:

```json
{
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
  "timestamp": "2025-08-26T12:00:00Z",
  "dataQuality": "good"
}
```

Non-JSON messages are wrapped as `{ "raw": "original_message" }`.

### Troubleshooting

#### Connection Issues

- Verify MQTT broker is running and accessible
- Check firewall settings for MQTT port (default: 1883)
- Ensure credentials are correct if using authenticated broker

#### HTTP Post Failures

- Verify the AWOS backend is running on the specified port
- Check network connectivity between bridge and backend
- Review backend logs for validation errors

#### Performance Tuning

- Increase `MQTT_BRIDGE_CONCURRENCY` for high-throughput scenarios
- Adjust `MQTT_BRIDGE_RETRY_DELAY_MS` based on network latency
- Monitor memory usage if processing large message volumes

### Production Deployment

For production use:

1. **Use external MQTT broker** (AWS IoT Core, Azure IoT Hub, etc.)
2. **Enable TLS/SSL**: Use `mqtts://` URLs
3. **Add authentication**: Configure broker credentials
4. **Monitor health**: Add health check endpoints
5. **Scale horizontally**: Run multiple bridge instances with load balancing
6. **Implement persistent queues**: Use Redis or similar for message durability

## Other Scripts

### ESP32 Server Example (`esp32-server-example.ino`)

Arduino sketch for ESP32 that creates a WebSocket server broadcasting sensor readings.

### Database Setup (`setup-database.ts`)

Script to initialize PostgreSQL/TimescaleDB with Prisma schema.

### Sample Data Scripts

- `seed-sample-data.js`: Populate database with test data
- `generate-test-data.js`: Generate realistic weather data for testing

## Development

```bash
# Install all dependencies
npm install

# Run type checking
npx tsc --noEmit

# Start development server
npm run dev
```
