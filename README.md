# AWOS Dashboard

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/RoshanMohamad/awos-dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licens## 🚀 Deployment

### Vercel (Recommended)MIT)

A comprehensive **Automated Weather Observation System (AWOS)** dashboard built with modern web technologies. This full-stack application collects, processes, and visualizes weather data from IoT sensors, providing real-time monitoring and historical analysis capabilities.

**🚀 Easy Deployment**: Deploy instantly to [Vercel](./VERCEL_DEPLOYMENT.md) with one-click serverless deployment.

## ?? Features

### Core Functionality

- **Real-time Data Collection**: Receive sensor data via HTTP API or MQTT
- **Live Dashboard**: Real-time weather monitoring with interactive charts
- **Historical Analysis**: Trend analysis and data visualization
- **Multi-station Support**: Handle multiple weather stations
- **Data Quality Management**: Sensor health monitoring and data validation
- **Offline Persistence**: SPIFFS-based queuing for ESP32 devices

### User Interface

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Mode**: Theme switching support
- **Interactive Charts**: Recharts-powered visualizations
- **Progressive Web App**: Installable PWA with offline capabilities
- **Real-time Updates**: Server-Sent Events (SSE) for live data

- **Next.js 15**: App Router with TypeScript
- **Supabase Integration**: PostgreSQL database with real-time subscriptions
- **API Routes**: RESTful endpoints for data ingestion and retrieval
- **MQTT Bridge**: Connect IoT devices via MQTT protocol

### IoT Integration

- **ESP32 Support**: Arduino sketch for sensor data collection
- **Sensor Compatibility**: DHT22, BMP280, wind sensors, battery monitoring
- **Network Resilience**: Offline queuing and retry mechanisms
- **NTP Time Sync**: Accurate timestamping with network time protocol
- **Database**: Supabase (PostgreSQL
- **ORM**: Prisma (optional, for complex queries)
- **Authentication**: Supabase Auth
- **Real-time**: Server-Sent Events (SSE)
- **Validation**: Zod schemas

- **MQTT**: Eclipse Mosquitto broker
- **HTTP Client**: Built-in fetch API
- **Device**: ESP32 with Arduino framework
- **Sensors**: DHT22, BMP280, analog sensors

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm, pnpm, or yarn
- Supabase account (for database)
- Git

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/RoshanMohamad/awos-dashboard.git
cd awos-dashboard

# Install dependencies
npm install
# or
pnpm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

Required environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Database Setup

```bash
# Generate Supabase types (optional)
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts

# Or use the provided setup script
node scripts/setup-database.ts
```

### 4. Development Server

```bash
# Start development server
npm run dev
# or
pnpm dev

# Open http://localhost:3000
```

### 5. Test Data (Optional)

```bash
# Generate sample weather data
npm run seed-data

# Or generate test data
node scripts/generate-test-data.js
```

## 📡 IoT Device Setup

### ESP32 Configuration

1. **Install Arduino IDE** or **PlatformIO**
2. **Install required libraries**:

   - WiFi
   - HTTPClient
   - ArduinoJson
   - DHT sensor library
   - Adafruit BMP280

3. **Configure the device**:

   ```cpp
   const char* WIFI_SSID = "YOUR_WIFI_SSID";
   const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
   const char* INGEST_URL = "http://localhost:3000/api/ingest";
   const char* STATION_ID = "VCBI";
   ```

4. **Flash and monitor**:
   ```bash
   # Monitor serial output
   # Check for successful HTTP POSTs and NTP sync
   ```

### MQTT Bridge (Alternative)

```bash
# Start MQTT broker and bridge
docker-compose up -d

# Test MQTT publishing
mosquitto_pub -h localhost -t "awos/readings/VCBI" -m '{
  "temperature": 28.5,
  "humidity": 65.2,
  "pressure": 1013.2,
  "windSpeed": 12.5,
  "stationId": "VCBI"
}'
```

## 🔧 Configuration

### Environment Variables

| Variable                        | Description                          | Required |
| ------------------------------- | ------------------------------------ | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                 | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key               | Yes      |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key            | Yes      |
| `NEXT_PUBLIC_BASE_URL`          | Application base URL                 | Yes      |
| `NODE_ENV`                      | Environment (development/production) | No       |
| `PORT`                          | Server port (default: 3000)          | No       |

### Sensor Configuration

Update sensor pin definitions in `scripts/esp32-server-example.ino`:

```cpp
#define DHT_PIN 4
#define DHT_TYPE DHT22
#define WIND_SPEED_PIN 2
#define WIND_DIRECTION_PIN A0
#define BATTERY_PIN A1
#define CEB_POWER_PIN 5
```

## 📊 API Documentation

### Data Ingestion

**POST** `/api/ingest`
Accepts sensor readings in JSON format:

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

### Data Retrieval

**GET** `/api/readings`
Retrieve sensor readings with optional filtering:

Query parameters:

- `stationId`: Filter by station
- `startTime`: Start timestamp (ISO format)
- `endTime`: End timestamp (ISO format)
- `limit`: Maximum number of records (default: 100)
- `offset`: Pagination offset (default: 0)

### Real-time Updates

**GET** `/api/realtime`
Server-Sent Events endpoint for real-time data:

```javascript
const eventSource = new EventSource("/api/realtime");
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("New reading:", data);
};
```

### Health Check

**GET** `/api/health`
Application health status:

```json
{
  "status": "healthy",
  "timestamp": "2025-08-26T12:00:00Z",
  "uptime": 3600,
  "memory": {
    "used": 45.2,
    "total": 128.0
  },
  "environment": "production"
}
```

## � Deployment Options

### Option 1: Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/RoshanMohamad/awos-dashboard)

**Simple, serverless deployment with automatic scaling:**

- ✅ One-click deployment
- ✅ Automatic deployments on push
- ✅ Preview deployments for PRs
- ✅ Global CDN & SSL included
- ✅ Serverless functions
- ✅ Custom domains

**Quick Setup**:

1. Click the deploy button above
2. Connect your GitHub account
3. **IMPORTANT**: Set environment variables in Vercel dashboard:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
   > ⚠️ **Build will fail without these variables**. Add them in Vercel Project Settings → Environment Variables
4. Deploy!

### Troubleshooting

**Build Error: "supabaseUrl is required"**

- Go to your Vercel project dashboard
- Navigate to Settings → Environment Variables
- Add the required Supabase environment variables
- Redeploy from the Deployments tab

📖 **Complete Guide**: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

## 🧪 Testing

### Unit Tests

```bash
# Run tests (when implemented)
npm run test
```

### Integration Tests

```bash
# Test API endpoints
curl -X POST -H "Content-Type: application/json" \
  -d '{"temperature":25}' http://localhost:3000/api/ingest

# Test health endpoint
curl http://localhost:3000/api/health
```

### ESP32 Testing

```bash
# Monitor serial output
# Check for WiFi connection, NTP sync, and HTTP POST success
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Add tests for new features
- Update documentation as needed
- Use conventional commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **Supabase** for the excellent backend-as-a-service
- **shadcn/ui** for the beautiful component library
- **Tailwind CSS** for the utility-first CSS framework
- **Arduino Community** for IoT development resources

## 📞 Support

If you have questions or need help:

- **Documentation**: Check the `docs/` directory
- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions for questions
- **ESP32 Setup**: See `scripts/README.md` for IoT integration

---

**Happy Weather Monitoring! 🌤️**
