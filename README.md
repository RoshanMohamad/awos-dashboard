# AWOS Dashboard

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/RoshanMohamad/awos-dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive **Automated Weather Observation System (AWOS)** dashboard built with modern web technologies. This full-stack application collects, processes, and visualizes weather data from IoT sensors, providing real-time monitoring and historical analysis capabilities.

**🚀 Easy Deployment**: Deploy instantly to Vercel with one-click serverless deployment.

## ✨ Features

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

### Technology Stack

#### Frontend
- **Next.js 15**: App Router with TypeScript
- **Supabase Integration**: PostgreSQL database with real-time subscriptions
- **API Routes**: RESTful endpoints for data ingestion and retrieval
- **MQTT Bridge**: Connect IoT devices via MQTT protocol

#### Backend
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma (optional, for complex queries)
- **Authentication**: Supabase Auth
- **Real-time**: Server-Sent Events (SSE)
- **Validation**: Zod schemas

#### IoT Integration
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

## 🚀 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/RoshanMohamad/awos-dashboard)

**Simple, serverless deployment with automatic scaling:**

- ✅ One-click deployment
- ✅ Automatic deployments on push
- ✅ Preview deployments for PRs
- ✅ Global CDN & SSL included
- ✅ Serverless functions
- ✅ Custom domains

### Troubleshooting

**Build Error: "supabaseUrl is required"**
- Go to your Vercel project dashboard
- Navigate to Settings → Environment Variables
- Add the required Supabase environment variables
- Redeploy from the Deployments tab

## 🧪 Testing

### Unit Tests

```bash
# Run tests (when implemented)
npm run test
```

### Integration Tests

```bash
# Test API endpoints
npm run test-api

# Test health endpoint
curl http://localhost:3000/api/health
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and test thoroughly
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

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
  
  ```sh
  brew install supabase/tap/supabase-beta
  brew link --overwrite supabase-beta
  ```
  
  To upgrade:

  ```sh
  brew upgrade supabase
  ```
</details>

<details>
  <summary><b>Windows</b></summary>

  Available via [Scoop](https://scoop.sh). To install:

  ```powershell
  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
  scoop install supabase
  ```

  To upgrade:

  ```powershell
  scoop update supabase
  ```
</details>

<details>
  <summary><b>Linux</b></summary>

  Available via [Homebrew](https://brew.sh) and Linux packages.

  #### via Homebrew

  To install:

  ```sh
  brew install supabase/tap/supabase
  ```

  To upgrade:

  ```sh
  brew upgrade supabase
  ```

  #### via Linux packages

  Linux packages are provided in [Releases](https://github.com/supabase/cli/releases). To install, download the `.apk`/`.deb`/`.rpm`/`.pkg.tar.zst` file depending on your package manager and run the respective commands.

  ```sh
  sudo apk add --allow-untrusted <...>.apk
  ```

  ```sh
  sudo dpkg -i <...>.deb
  ```

  ```sh
  sudo rpm -i <...>.rpm
  ```

  ```sh
  sudo pacman -U <...>.pkg.tar.zst
  ```
</details>

<details>
  <summary><b>Other Platforms</b></summary>

  You can also install the CLI via [go modules](https://go.dev/ref/mod#go-install) without the help of package managers.

  ```sh
  go install github.com/supabase/cli@latest
  ```

  Add a symlink to the binary in `$PATH` for easier access:

  ```sh
  ln -s "$(go env GOPATH)/bin/cli" /usr/bin/supabase
  ```

  This works on other non-standard Linux distros.
</details>

<details>
  <summary><b>Community Maintained Packages</b></summary>

  Available via [pkgx](https://pkgx.sh/). Package script [here](https://github.com/pkgxdev/pantry/blob/main/projects/supabase.com/cli/package.yml).
  To install in your working directory:

  ```bash
  pkgx install supabase
  ```

  Available via [Nixpkgs](https://nixos.org/). Package script [here](https://github.com/NixOS/nixpkgs/blob/master/pkgs/development/tools/supabase-cli/default.nix).
</details>

### Run the CLI

```bash
supabase bootstrap
```

Or using npx:

```bash
npx supabase bootstrap
```

The bootstrap command will guide you through the process of setting up a Supabase project using one of the [starter](https://github.com/supabase-community/supabase-samples/blob/main/samples.json) templates.

## Docs

Command & config reference can be found [here](https://supabase.com/docs/reference/cli/about).

## Breaking changes

We follow semantic versioning for changes that directly impact CLI commands, flags, and configurations.

However, due to dependencies on other service images, we cannot guarantee that schema migrations, seed.sql, and generated types will always work for the same CLI major version. If you need such guarantees, we encourage you to pin a specific version of CLI in package.json.

## Developing

To run from source:

```sh
# Go >= 1.22
go run . help
```
