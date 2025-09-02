# ESP32 AWOS Weather Station Setup Guide

## Overview

This guide explains how to set up and use the customized ESP32 Arduino code (`scripts/esp32-server-example.ino`) to collect weather data for your AWOS Dashboard.

## Hardware Requirements

### ESP32 Board

- ESP32 DevKit or similar
- USB cable for programming and power
- Breadboard or PCB for connections

### Sensors

1. **DHT22** - Temperature and Humidity sensor

   - Connect VCC to 3.3V
   - Connect GND to ground
   - Connect DATA to GPIO pin (defined as DHT_PIN in code)

2. **BMP280** - Pressure sensor (I2C)

   - Connect VCC to 3.3V
   - Connect GND to ground
   - Connect SDA to GPIO21 (ESP32 default)
   - Connect SCL to GPIO22 (ESP32 default)

3. **Wind Sensors** (Optional)

   - Wind speed sensor (pulse-based anemometer)
   - Wind direction sensor (analog voltage output)

4. **Power Monitoring**
   - Battery voltage divider circuit
   - CEB power status detection

## Software Requirements

### Arduino IDE Setup

1. Install Arduino IDE 2.0 or later
2. Add ESP32 board support:
   - Go to File > Preferences
   - Add this URL to Additional Board Manager URLs:
     ```
     https://espressif.github.io/arduino-esp32/package_esp32_dev_index.json
     ```
   - Go to Tools > Board > Board Manager
   - Search for "ESP32" and install the latest version

### Required Libraries

Install these libraries via Library Manager:

```
- WiFi (included with ESP32)
- HTTPClient (included with ESP32)
- ArduinoJson by Benoit Blanchon
- DHT sensor library by Adafruit
- Adafruit BMP280 Library
- PubSubClient (if using MQTT)
- SPIFFS (included with ESP32)
```

## Configuration

### 1. WiFi Settings

Edit these lines in the code:

```cpp
const char* WIFI_SSID = "YourWiFiNetwork";
const char* WIFI_PASSWORD = "YourWiFiPassword";
```

### 2. Dashboard URL ✅ CONFIGURED

Your dashboard URL is already configured:

```cpp
const char* DASHBOARD_URL = "https://awos-dashboard.vercel.app";
const char* API_ENDPOINT = "https://awos-dashboard.vercel.app/api/ingest";
```

### 3. Station ID

Set a unique identifier for your weather station:

```cpp
const char* STATION_ID = "AWOS-001";  // Change to your station ID
```

### 4. Pin Configuration

Adjust GPIO pin assignments for your hardware setup:

```cpp
#define DHT_PIN 4
#define WIND_SPEED_PIN 2
#define WIND_DIRECTION_PIN A0
#define POWER_STATUS_PIN 5
#define BATTERY_PIN A1
```

### 5. Sensor Intervals

Configure how often data is collected and sent:

```cpp
const unsigned long SENSOR_READ_INTERVAL_MS = 5000;   // Read every 5 seconds
const unsigned long DATA_SEND_INTERVAL_MS = 30000;    // Send every 30 seconds
const unsigned long HEARTBEAT_INTERVAL_MS = 300000;   // Status every 5 minutes
```

## Features

### Data Collection

The ESP32 automatically reads:

- Temperature (°C)
- Humidity (%)
- Atmospheric pressure (hPa)
- Wind speed (m/s)
- Wind direction (degrees)
- Wind gust (m/s)
- Battery voltage and level
- Power source status

### Data Transmission

- Sends data via HTTP POST to `/api/ingest` endpoint
- JSON format matching your dashboard's API schema
- Automatic retry logic with exponential backoff
- Client-side data validation

### Offline Storage

- Stores data locally when network is unavailable
- Automatic queue processing when connectivity is restored
- SPIFFS filesystem for persistent storage
- Configurable queue size limits

### Status Monitoring

- Serial console output with detailed status information
- WiFi connection monitoring with auto-reconnect
- Sensor health checks and validation
- System uptime and memory usage reporting

## Installation Steps

1. **Prepare Hardware**

   - Connect all sensors according to pin configuration
   - Ensure stable power supply (USB or external)
   - Test connections with multimeter if needed

2. **Upload Code**

   - Open `esp32-server-example.ino` in Arduino IDE
   - Select your ESP32 board (Tools > Board)
   - Select correct COM port (Tools > Port)
   - Configure settings in the code as described above
   - Click Upload button

3. **Monitor Operation**

   - Open Serial Monitor (Tools > Serial Monitor)
   - Set baud rate to 115200
   - Reset ESP32 to see startup sequence
   - Verify WiFi connection and sensor readings

4. **Verify Data Transmission**
   - Check serial output for successful HTTP POST messages
   - Monitor your AWOS dashboard for incoming data
   - Test offline storage by disconnecting WiFi temporarily

## Troubleshooting

### Common Issues

**WiFi Connection Failed**

- Check SSID and password spelling
- Verify WiFi network is 2.4GHz (ESP32 doesn't support 5GHz)
- Ensure ESP32 is within range of router

**Sensor Reading Errors**

- Check wiring connections
- Verify sensor power supply (3.3V, not 5V)
- Test I2C sensors with scanner sketch first

**HTTP POST Failures**

- Verify dashboard URL is correct and accessible
- Check if dashboard is running and API endpoint exists
- Monitor network firewall settings

**Time Sync Issues**

- Ensure internet connectivity
- NTP servers may be blocked by firewall
- Time sync is not critical for basic operation

### Serial Monitor Messages

- `✓` indicates successful operations
- `✗` indicates failures or errors
- `⚠` indicates warnings or validation issues
- Detailed status reports every 5 minutes

## Data Format

The ESP32 sends data in this JSON format:

```json
{
  "temperature": 25.6,
  "humidity": 65.2,
  "pressure": 1013.2,
  "windSpeed": 3.4,
  "windDirection": 245,
  "windGust": 5.2,
  "dewPoint": 18.7,
  "timestamp": "2025-01-15T10:30:00Z",
  "stationId": "AWOS-001",
  "dataQuality": 100,
  "batteryVoltage": 3.7,
  "batteryLevel": 85,
  "cebPower": true
}
```

## Maintenance

### Regular Tasks

- Monitor serial output for errors
- Check sensor calibration periodically
- Clean sensors from dust/debris
- Update firmware as needed

### Performance Optimization

- Adjust data transmission intervals based on needs
- Monitor memory usage and queue sizes
- Consider using deep sleep for battery operation
- Implement watchdog timer for reliability

## Advanced Features

### MQTT Support

Enable MQTT by setting `#define USE_MQTT 1` and configuring:

```cpp
const char* MQTT_BROKER = "your-mqtt-broker.com";
const int MQTT_PORT = 1883;
const char* MQTT_TOPIC = "weather/awos";
```

### Wind Sensor Calibration

Adjust wind sensor calibration factors:

```cpp
// In readWindSpeed() function
float windSpeed = (windPulses * 2.4) / (timeDiff / 1000.0);  // Adjust 2.4 factor
```

### Custom Sensor Integration

Add additional sensors by:

1. Including sensor library
2. Adding initialization in setup()
3. Adding readings in readAllSensors()
4. Updating JSON payload structure

## Support

For technical support:

1. Check serial monitor output for error messages
2. Verify all hardware connections
3. Test individual sensors separately
4. Review dashboard API logs for HTTP errors
5. Consult ESP32 and sensor documentation

The customized code provides a robust, feature-rich weather station that integrates seamlessly with your AWOS Dashboard deployment.
