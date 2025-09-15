/*
 * -----------------------------------------------------------------------------
 * ESP32 Weather Station Receiver & Next.js Dashboard Integration
 * -----------------------------------------------------------------------------
 * This enhanced version sends data to both the local web server AND your
 * Next.js dashboard running on Vercel/localhost.
 *
 * Key Changes:
 * 1. Dual data posting: Local web server + Next.js API
 * 2. Improved error handling and retry logic
 * 3. Connection status monitoring
 * 4. JSON data format for better integration
 * 
 * Libraries Needed (Install from Arduino IDE Library Manager):
 * - "LoRa" by Sandeep Mistry
 * - "WiFi" (comes with ESP32 core)
 * - "WebServer" (comes with ESP32 core)
 * - "ArduinoJson" by Benoit Blanchon
 * - "HTTPClient" (comes with ESP32 core)
 * -----------------------------------------------------------------------------
 */

// LIBRARIES
#include <SPI.h>
#include <LoRa.h>
#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WIFI CREDENTIALS - REPLACE WITH YOUR NETWORK INFO
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// NEXT.JS DASHBOARD ENDPOINTS
const char* NEXTJS_BASE_URL = "https://your-app.vercel.app"; // Replace with your Vercel URL
// For local development, use: "http://192.168.1.100:3000" (replace with your computer's IP)
const char* NEXTJS_ESP32_ENDPOINT = "/api/esp32";

// LORA PIN DEFINITIONS
#define LORA_SS    5
#define LORA_RST   4
#define LORA_DIO0  2

// WEB SERVER
WebServer server(80);
HTTPClient http;

// DATA STRUCTURE TO HOLD WEATHER INFO
struct WeatherData {
  float temperature = 0.0;
  float humidity = 0.0;
  float pressure = 0.0;
  float dewPoint = 0.0;
  float windSpeed = 0.0;
  int   windDirection = 0;
  float lat = 0.0;
  float lng = 0.0;
  String utcTime = "00:00:00";
  long lastPacketTime = 0;
  bool dataValid = false;
};

WeatherData weatherData;

// Connection tracking
unsigned long lastNextJSPost = 0;
const unsigned long NEXTJS_POST_INTERVAL = 10000; // Post to Next.js every 10 seconds
int nextJSPostErrors = 0;
const int MAX_NEXTJS_ERRORS = 5;

// HTML content (same as before but with enhanced status indicators)
const char* HTML_CONTENT = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AWOS Live Dashboard - ESP32 Receiver</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f0f4f8; }
        .card { background-color: white; border-radius: 0.75rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); transition: all 0.3s ease-in-out; }
        .card-title { color: #4a5568; font-weight: 600; }
        .data-value { color: #1a202c; font-weight: 700; }
        .status-dot { width: 12px; height: 12px; border-radius: 50%; }
        .online { background-color: #48bb78; }
        .offline { background-color: #f56565; }
        .warning { background-color: #ed8936; }
    </style>
</head>
<body class="p-4 md:p-8">
    <div class="max-w-7xl mx-auto">
        <header class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-3xl font-bold text-gray-800">AWOS Live Weather Dashboard</h1>
                <p class="text-gray-500">ESP32 Receiver Station - Real-time LoRa Data</p>
            </div>
            <div class="space-y-2">
                <div class="flex items-center space-x-3">
                    <div id="lora-status-dot" class="status-dot offline"></div>
                    <span id="lora-status-text" class="text-gray-600 font-semibold">LoRa: Offline</span>
                </div>
                <div class="flex items-center space-x-3">
                    <div id="nextjs-status-dot" class="status-dot offline"></div>
                    <span id="nextjs-status-text" class="text-gray-600 font-semibold">Next.js: Offline</span>
                </div>
            </div>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <!-- Temperature Card -->
            <div class="card p-6">
                <h2 class="card-title text-lg">Temperature</h2>
                <p class="data-value text-5xl mt-2"><span id="temp">--</span> &deg;C</p>
            </div>
            <!-- Humidity Card -->
            <div class="card p-6">
                <h2 class="card-title text-lg">Humidity</h2>
                <p class="data-value text-5xl mt-2"><span id="humidity">--</span> %</p>
            </div>
            <!-- Pressure Card -->
            <div class="card p-6">
                <h2 class="card-title text-lg">Barometric Pressure</h2>
                <p class="data-value text-5xl mt-2"><span id="pressure">--</span> <span class="text-3xl">hPa</span></p>
            </div>
            <!-- Dew Point Card -->
            <div class="card p-6">
                <h2 class="card-title text-lg">Dew Point</h2>
                <p class="data-value text-5xl mt-2"><span id="dewpoint">--</span> &deg;C</p>
            </div>
            <!-- Wind Speed Card -->
            <div class="card p-6">
                <h2 class="card-title text-lg">Wind Speed</h2>
                <p class="data-value text-5xl mt-2"><span id="windspeed">--</span> <span class="text-3xl">m/s</span></p>
            </div>
            <!-- Wind Direction Card -->
            <div class="card p-6">
                <h2 class="card-title text-lg">Wind Direction</h2>
                <p class="data-value text-5xl mt-2"><span id="winddir">--</span>&deg;</p>
            </div>
            <!-- GPS Info Card -->
            <div class="card p-6 col-span-1 md:col-span-2">
                <h2 class="card-title text-lg">GPS Information</h2>
                <p class="text-gray-700 mt-2">Lat: <span id="lat" class="font-semibold">--</span></p>
                <p class="text-gray-700">Lon: <span id="lon" class="font-semibold">--</span></p>
                <p class="text-gray-700 mt-2">UTC Time: <span id="time" class="font-semibold">--</span></p>
            </div>
        </div>
    </div>

    <script>
        const loraDot = document.getElementById('lora-status-dot');
        const loraText = document.getElementById('lora-status-text');
        const nextjsDot = document.getElementById('nextjs-status-dot');
        const nextjsText = document.getElementById('nextjs-status-text');

        function updateDashboard() {
            fetch('/data')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('temp').textContent = data.temperature.toFixed(2);
                    document.getElementById('humidity').textContent = data.humidity.toFixed(2);
                    document.getElementById('pressure').textContent = data.pressure.toFixed(2);
                    document.getElementById('dewpoint').textContent = data.dewPoint.toFixed(2);
                    document.getElementById('windspeed').textContent = data.windSpeed.toFixed(2);
                    document.getElementById('winddir').textContent = data.windDirection;
                    document.getElementById('lat').textContent = data.lat.toFixed(6);
                    document.getElementById('lon').textContent = data.lng.toFixed(6);
                    document.getElementById('time').textContent = data.utcTime;

                    // Update LoRa status
                    const timeSinceLastPacket = (new Date().getTime() / 1000) - data.lastPacketTime;
                    if (timeSinceLastPacket < 60) {
                        loraDot.classList.remove('offline', 'warning');
                        loraDot.classList.add('online');
                        loraText.textContent = 'LoRa: Online';
                    } else if (timeSinceLastPacket < 120) {
                        loraDot.classList.remove('offline', 'online');
                        loraDot.classList.add('warning');
                        loraText.textContent = 'LoRa: Warning';
                    } else {
                        loraDot.classList.remove('online', 'warning');
                        loraDot.classList.add('offline');
                        loraText.textContent = 'LoRa: Offline';
                    }

                    // Update Next.js status
                    if (data.nextJSStatus === 'connected') {
                        nextjsDot.classList.remove('offline', 'warning');
                        nextjsDot.classList.add('online');
                        nextjsText.textContent = 'Next.js: Connected';
                    } else if (data.nextJSStatus === 'error') {
                        nextjsDot.classList.remove('offline', 'online');
                        nextjsDot.classList.add('warning'); 
                        nextjsText.textContent = 'Next.js: Error';
                    } else {
                        nextjsDot.classList.remove('online', 'warning');
                        nextjsDot.classList.add('offline');
                        nextjsText.textContent = 'Next.js: Offline';
                    }
                })
                .catch(error => {
                    console.error('Error fetching data:', error);
                    loraDot.classList.remove('online', 'warning');
                    loraDot.classList.add('offline');
                    loraText.textContent = 'LoRa: Error';
                });
        }

        // Fetch data every 5 seconds
        setInterval(updateDashboard, 5000);
        // Initial call
        window.onload = updateDashboard;
    </script>
</body>
</html>
)rawliteral";

void setup() {
  Serial.begin(115200);
  while (!Serial);
  Serial.println("ESP32 AWOS Receiver with Next.js Integration Starting...");

  // Setup LoRa
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(433E6)) {
    Serial.println("Starting LoRa failed!");
    while (1);
  }
  LoRa.onReceive(onReceive);
  LoRa.receive();
  Serial.println("LoRa Initialized and listening...");

  // Setup WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("WiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.print("Will post data to Next.js at: ");
  Serial.print(NEXTJS_BASE_URL);
  Serial.println(NEXTJS_ESP32_ENDPOINT);

  // Setup Web Server
  server.on("/", handleRoot);
  server.on("/data", handleData);
  server.on("/status", handleStatus);
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
  
  // Post to Next.js dashboard periodically
  if (millis() - lastNextJSPost > NEXTJS_POST_INTERVAL && weatherData.dataValid) {
    postToNextJS();
    lastNextJSPost = millis();
  }
}

void onReceive(int packetSize) {
  if (packetSize == 0) return;

  String receivedText = "";
  while (LoRa.available()) {
    receivedText += (char)LoRa.read();
  }

  Serial.println("Received LoRa packet: " + receivedText);
  parseData(receivedText);
  weatherData.lastPacketTime = millis() / 1000;
  weatherData.dataValid = true;

  // Immediately try to post to Next.js on new data
  if (millis() - lastNextJSPost > 5000) { // Don't spam, minimum 5 second interval
    postToNextJS();
    lastNextJSPost = millis();
  }
}

void parseData(String data) {
  // Parse CSV format: temp,humidity,pressure,dewPoint,windSpeed,windDirection,lat,lng,time
  int indices[8];
  int index = 0;
  
  for (int i = 0; i < 8 && index < data.length(); i++) {
    indices[i] = data.indexOf(',', index);
    if (indices[i] == -1) indices[i] = data.length();
    index = indices[i] + 1;
  }

  if (indices[0] > 0) {
    weatherData.temperature = data.substring(0, indices[0]).toFloat();
    weatherData.humidity = data.substring(indices[0] + 1, indices[1]).toFloat();
    weatherData.pressure = data.substring(indices[1] + 1, indices[2]).toFloat();
    weatherData.dewPoint = data.substring(indices[2] + 1, indices[3]).toFloat();
    weatherData.windSpeed = data.substring(indices[3] + 1, indices[4]).toFloat();
    weatherData.windDirection = data.substring(indices[4] + 1, indices[5]).toInt();
    weatherData.lat = data.substring(indices[5] + 1, indices[6]).toFloat();
    weatherData.lng = data.substring(indices[6] + 1, indices[7]).toFloat();
    weatherData.utcTime = data.substring(indices[7] + 1);
  }
}

void postToNextJS() {
  if (nextJSPostErrors >= MAX_NEXTJS_ERRORS) {
    Serial.println("Too many Next.js errors, skipping post");
    return;
  }

  http.begin(String(NEXTJS_BASE_URL) + String(NEXTJS_ESP32_ENDPOINT));
  http.addHeader("Content-Type", "application/json");

  // Create JSON payload
  DynamicJsonDocument doc(1024);
  doc["temperature"] = weatherData.temperature;
  doc["humidity"] = weatherData.humidity;
  doc["pressure"] = weatherData.pressure;
  doc["dewPoint"] = weatherData.dewPoint;
  doc["windSpeed"] = weatherData.windSpeed;
  doc["windDirection"] = weatherData.windDirection;
  doc["lat"] = weatherData.lat;
  doc["lng"] = weatherData.lng;
  doc["utcTime"] = weatherData.utcTime;
  doc["lastPacketTime"] = weatherData.lastPacketTime;
  doc["stationId"] = "VCBI-ESP32";

  String jsonString;
  serializeJson(doc, jsonString);

  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Next.js POST Response Code: " + String(httpResponseCode));
    Serial.println("Next.js Response: " + response);
    
    if (httpResponseCode == 200 || httpResponseCode == 201) {
      nextJSPostErrors = 0; // Reset error counter on success
      Serial.println("Successfully posted data to Next.js dashboard!");
    } else {
      nextJSPostErrors++;
      Serial.println("Next.js POST failed with code: " + String(httpResponseCode));
    }
  } else {
    nextJSPostErrors++;
    Serial.println("Next.js POST Error: " + String(httpResponseCode));
  }

  http.end();
}

// WEB SERVER HANDLERS
void handleRoot() {
  server.send(200, "text/html", HTML_CONTENT);
}

void handleData() {
  DynamicJsonDocument json(1024);
  json["temperature"] = weatherData.temperature;
  json["humidity"] = weatherData.humidity;
  json["pressure"] = weatherData.pressure;
  json["dewPoint"] = weatherData.dewPoint;
  json["windSpeed"] = weatherData.windSpeed;
  json["windDirection"] = weatherData.windDirection;
  json["lat"] = weatherData.lat;
  json["lng"] = weatherData.lng;
  json["utcTime"] = weatherData.utcTime;
  json["lastPacketTime"] = weatherData.lastPacketTime;
  json["dataValid"] = weatherData.dataValid;
  
  // Add Next.js connection status
  if (nextJSPostErrors == 0) {
    json["nextJSStatus"] = "connected";
  } else if (nextJSPostErrors < MAX_NEXTJS_ERRORS) {
    json["nextJSStatus"] = "error";
  } else {
    json["nextJSStatus"] = "offline";
  }

  String jsonString;
  serializeJson(json, jsonString);
  
  server.send(200, "application/json", jsonString);
}

void handleStatus() {
  DynamicJsonDocument json(512);
  json["device"] = "ESP32-AWOS-Receiver";
  json["version"] = "2.0";
  json["uptime"] = millis();
  json["freeHeap"] = ESP.getFreeHeap();
  json["wifiRSSI"] = WiFi.RSSI();
  json["nextJSErrors"] = nextJSPostErrors;
  json["nextJSEndpoint"] = String(NEXTJS_BASE_URL) + String(NEXTJS_ESP32_ENDPOINT);
  
  String jsonString;
  serializeJson(json, jsonString);
  
  server.send(200, "application/json", jsonString);
}
