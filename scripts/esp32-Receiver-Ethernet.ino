

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <SPI.h>
#include <Ethernet.h>
#include <EthernetClient.h>
#include <EthernetServer.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// OLED Display Configuration
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
TwoWire I2COLED = TwoWire(0);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &I2COLED, -1);

// Pin Definitions
#define CLK 13        // Rotary encoder CLK
#define DT 14         // Rotary encoder DT
#define SW 25         // Rotary encoder switch
#define RXD2 16       // Serial2 RX (from Nano)
#define TXD2 17       // Serial2 TX (to Nano)
#define RXD1 33       // Serial1 RX
#define TXD1 32       // Serial1 TX

// Ethernet W5500 Pin Definitions
#define ETH_CS    5   // Chip Select
#define ETH_RST   26  // Reset pin (optional)
#define ETH_MOSI  23  // SPI MOSI
#define ETH_MISO  19  // SPI MISO
#define ETH_SCK   18  // SPI Clock



// Ethernet Configuration
byte mac[] = {0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED};  // MAC address for Ethernet
IPAddress ip(192, 168, 1, 177);                       // Static IP (optional)
IPAddress dns(8, 8, 8, 8);                            // DNS server
IPAddress gateway(192, 168, 1, 1);                    // Gateway
IPAddress subnet(255, 255, 255, 0);                   // Subnet mask

const char* NEXTJS_BASE_URL = "https://awos-dashboard.vercel.app";  // Your deployed Vercel app
const char* NEXTJS_ESP32_ENDPOINT = "/api/esp32";

// Web Server
EthernetServer server(80);
EthernetClient client;
HTTPClient http;

// Weather Data Structure
struct WeatherData {
  float temperature = 0.0;
  float humidity = 0.0;
  float pressure = 0.0;
  float dewPoint = 0.0;
  float windSpeed = 0.0;
  int windDirection = 0;
  float latitude = 0.0;
  float longitude = 0.0;
  String utcDate = "";
  String utcTime = "";
  String voltage = "";
  String current = "";
  String power = "";
  String powerStatus = "";
  String commMode = "";
  unsigned long lastPacketTime = 0;
  bool dataValid = false;
};

WeatherData weatherData;

// System Control Variables
bool collecting = false;
int page = 0;
int lastClkState;
bool buttonPressed = false;
unsigned long lastOLEDUpdate = 0;
unsigned long lastDataSend = 0;
unsigned long lastNextJSPost = 0;
unsigned long lastLoRaPacket = 0;

// Timing Constants
const unsigned long OLED_UPDATE_INTERVAL = 1000;      // 1 second
const unsigned long DATA_SEND_INTERVAL = 30000;       // 30 seconds to Nano
const unsigned long NEXTJS_POST_INTERVAL = 10000;     // 10 seconds to Next.js
const unsigned long LORA_TIMEOUT = 60000;             // 1 minute LoRa timeout

// Connection Status
bool ethernetConnected = false;
bool nanoConnected = false;
bool loraConnected = false;
int nextJSPostErrors = 0;
const int MAX_NEXTJS_ERRORS = 5;

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);
  Serial1.begin(9600, SERIAL_8N1, RXD1, TXD1);

  Serial.println("ESP32 AWOS Receiver with Next.js Integration Starting...");

  // Initialize I2C for OLED
  I2COLED.begin(4, 15);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED initialization failed!");
  } else {
    Serial.println("OLED initialized successfully");
    displayStartupMessage();
  }

  // Initialize Rotary Encoder
  pinMode(CLK, INPUT_PULLUP);
  pinMode(DT, INPUT_PULLUP);
  pinMode(SW, INPUT_PULLUP);
  lastClkState = digitalRead(CLK);

  
  

  // Initialize Ethernet
  setupEthernet();

  // Initialize Web Server
  setupWebServer();

  Serial.println("System initialization complete");
  Serial.println("=================================");
  displaySystemStatus();
}

void loop() {
  handleEncoder();
  handleLoRaReceive();
  handleSerialInput();
  serveWebRequests();
  updateOLEDDisplay();
  
  // Send data to Nano for SD card logging
  if (shouldSendToNano()) {
    sendDataToNano();
    lastDataSend = millis();
  }
  
  // Send data to Next.js dashboard
  if (shouldPostToNextJS()) {
    postToNextJS();
    lastNextJSPost = millis();
  }
  
  // Update connection status
  updateConnectionStatus();
}



void setupEthernet() {
  Serial.println("Initializing Ethernet...");
  
  // Initialize SPI for Ethernet
  SPI.begin(ETH_SCK, ETH_MISO, ETH_MOSI);
  
  // Reset Ethernet module (if reset pin is connected)
  if (ETH_RST != -1) {
    pinMode(ETH_RST, OUTPUT);
    digitalWrite(ETH_RST, LOW);
    delay(100);
    digitalWrite(ETH_RST, HIGH);
    delay(500);
  }
  
  // Set Ethernet CS pin
  Ethernet.init(ETH_CS);
  
  // Try DHCP first, then fall back to static IP
  Serial.println("Attempting DHCP...");
  if (Ethernet.begin(mac) == 0) {
    Serial.println("DHCP failed, using static IP");
    Ethernet.begin(mac, ip, dns, gateway, subnet);
  }
  
  delay(2000); // Give Ethernet time to initialize
  
  if (Ethernet.hardwareStatus() == EthernetNoHardware) {
    Serial.println("Ethernet hardware not found!");
    ethernetConnected = false;
  } else if (Ethernet.linkStatus() == LinkOFF) {
    Serial.println("Ethernet cable not connected!");
    ethernetConnected = false;
  } else {
    Serial.println("Ethernet Connected!");
    Serial.print("ESP32 IP Address: ");
    Serial.println(Ethernet.localIP());
    Serial.print("Posting data to PRODUCTION: ");
    Serial.print(NEXTJS_BASE_URL);
    Serial.println(NEXTJS_ESP32_ENDPOINT);
    Serial.println("Connected to deployed AWOS Dashboard on Vercel!");
    ethernetConnected = true;
  }
}

void setupWebServer() {
  server.begin();
  Serial.println("Ethernet web server started on port 80");
}



void parseLoRaData(String data) {
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
    weatherData.latitude = data.substring(indices[5] + 1, indices[6]).toFloat();
    weatherData.longitude = data.substring(indices[6] + 1, indices[7]).toFloat();
    weatherData.utcTime = data.substring(indices[7] + 1);
    
    Serial.printf("Parsed LoRa data: %.1f°C, %.1f%%, %.1fhPa, Wind: %.1fm/s %d°\n", 
                  weatherData.temperature, weatherData.humidity, weatherData.pressure,
                  weatherData.windSpeed, weatherData.windDirection);
  }
}

void postToNextJS() {
  if (!ethernetConnected || nextJSPostErrors >= MAX_NEXTJS_ERRORS) {
    return;
  }

  // Configure for HTTPS connection to Vercel using Ethernet client
  http.begin(client, String(NEXTJS_BASE_URL) + String(NEXTJS_ESP32_ENDPOINT));
  http.addHeader("Content-Type", "application/json");
  http.addHeader("User-Agent", "ESP32-AWOS-Station/2.1");
  http.setTimeout(15000);  // 15 second timeout for HTTPS
  
  // Create JSON payload matching your Next.js API format
  DynamicJsonDocument doc(1024);
  doc["temperature"] = weatherData.temperature;
  doc["humidity"] = weatherData.humidity;
  doc["pressure"] = weatherData.pressure;
  doc["dewPoint"] = weatherData.dewPoint;
  doc["windSpeed"] = weatherData.windSpeed;
  doc["windDirection"] = weatherData.windDirection;
  doc["lat"] = weatherData.latitude;
  doc["lng"] = weatherData.longitude;
  doc["utcTime"] = weatherData.utcTime;
  doc["lastPacketTime"] = weatherData.lastPacketTime;
  doc["stationId"] = "VCBI-ESP32";

  String jsonString;
  serializeJson(doc, jsonString);

  int httpResponseCode = http.POST(jsonString);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Next.js POST Response: " + String(httpResponseCode));
    
    if (httpResponseCode == 200 || httpResponseCode == 201) {
      nextJSPostErrors = 0;
      Serial.println("✅ Successfully posted to Next.js dashboard!");
    } else {
      nextJSPostErrors++;
      Serial.println("⚠️ Next.js POST failed: " + String(httpResponseCode));
    }
  } else {
    nextJSPostErrors++;
    Serial.println("❌ Next.js POST Error: " + String(httpResponseCode));
  }

  http.end();
}

void handleLoRaReceive() {
  // This is called automatically by onLoRaReceive callback
  // But we can add manual parsing here if needed
}

void updateConnectionStatus() {
  // Update LoRa connection status
  if (millis() - lastLoRaPacket > LORA_TIMEOUT) {
    loraConnected = false;
  } else {
    loraConnected = true;
  }
  
  // Update Ethernet connection status
  ethernetConnected = (Ethernet.linkStatus() == LinkON);
}

bool shouldSendToNano() {
  return (weatherData.dataValid && 
          millis() - lastDataSend > DATA_SEND_INTERVAL);
}

bool shouldPostToNextJS() {
  return (weatherData.dataValid && 
          ethernetConnected && 
          millis() - lastNextJSPost > NEXTJS_POST_INTERVAL &&
          nextJSPostErrors < MAX_NEXTJS_ERRORS);
}

void displayStartupMessage() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("AWOS Starting...");
  display.println("Production Mode");
  display.println("Vercel Deploy");
  display.println("Initializing...");
  display.display();
  delay(2000);
}

void displaySystemStatus() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("=== STATUS ===");
  display.println("Eth: " + String(ethernetConnected ? "OK" : "ERR"));
  display.println("LoRa: " + String(loraConnected ? "OK" : "ERR"));  
  display.println("Nano: " + String(nanoConnected ? "OK" : "ERR"));
  display.println("NextJS: " + String(nextJSPostErrors == 0 ? "OK" : "ERR"));
  display.println("");
  display.println("Ready for data...");
  display.display();
  delay(3000);
}

void handleEncoder() {
  int currentClk = digitalRead(CLK);
  if (currentClk != lastClkState) {
    if (digitalRead(DT) != currentClk) {
      page++;
    } else {
      page--;
    }
    
    if (page < 0) page = 6;
    if (page > 6) page = 0;
    
    lastClkState = currentClk;
  }
  
  if (digitalRead(SW) == LOW && !buttonPressed) {
    buttonPressed = true;
    page = 0;
  } else if (digitalRead(SW) == HIGH) {
    buttonPressed = false;
  }
}

void updateOLEDDisplay() {
  if (millis() - lastOLEDUpdate < OLED_UPDATE_INTERVAL) return;
  lastOLEDUpdate = millis();

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);

  switch (page) {
    case 0:  // System Status
      display.println("=== SYSTEM ===");
      display.println("Eth:" + String(ethernetConnected ? "OK" : "ERR") + 
                       " LoRa:" + String(loraConnected ? "OK" : "ERR"));
      display.println("Nano:" + String(nanoConnected ? "OK" : "ERR") + 
                       " NextJS:" + String(nextJSPostErrors == 0 ? "OK" : "ERR"));
      display.println("IP:" + (ethernetConnected ? Ethernet.localIP().toString() : "N/A"));
      display.println("Packets: " + String(weatherData.dataValid ? "✓" : "✗"));
      display.println("Errors: " + String(nextJSPostErrors));
      display.println("Page 1/7");
      break;
      
    case 1:  // Temperature & Humidity
      display.println("=== TEMP & RH ===");
      display.println("Temperature:");
      display.println("  " + String(weatherData.temperature, 1) + " °C");
      display.println("Humidity:");
      display.println("  " + String(weatherData.humidity, 1) + " %");
      display.println("Dew Point:");
      display.println("  " + String(weatherData.dewPoint, 1) + " °C");
      display.println("Page 2/7");
      break;
      
    case 2:  // Pressure
      display.println("=== PRESSURE ===");
      display.println("Barometric:");
      display.println("  " + String(weatherData.pressure, 1) + " hPa");
      display.println("");
      display.println("Sea Level:");
      display.println("  Calculating...");
      display.println("Page 3/7");
      break;
      
    case 3:  // Wind Data
      display.println("=== WIND ===");
      display.println("Speed:");
      display.println("  " + String(weatherData.windSpeed, 1) + " m/s");
      display.println("Direction:");
      display.println("  " + String(weatherData.windDirection) + "°");
      display.println("Page 4/7");
      break;
      
    case 4:  // Location
      display.println("=== LOCATION ===");
      display.println("Latitude:");
      display.println("  " + String(weatherData.latitude, 6));
      display.println("Longitude:");
      display.println("  " + String(weatherData.longitude, 6));
      display.println("Page 5/7");
      break;
      
    case 5:  // Time Data
      display.println("=== TIME ===");
      display.println("UTC Time:");
      display.println("  " + weatherData.utcTime);
      display.println("Local Time:");
      display.println("  " + getLocalTime());
      display.println("Page 6/7");
      break;
      
    case 6:  // Communication Status
      display.println("=== COMM ===");
      display.println("LoRa Packets:");
      display.println("  " + String((millis() - weatherData.lastPacketTime) / 1000) + "s ago");
      display.println("Next.js Posts:");
      display.println("  " + String(nextJSPostErrors) + " errors");
      display.println("Page 7/7");
      break;
  }

  display.display();
}

String getLocalTime() {
  if (weatherData.utcTime.length() < 5) return "N/A";
  
  int colonIndex = weatherData.utcTime.indexOf(':');
  if (colonIndex == -1) return weatherData.utcTime;
  
  int h = weatherData.utcTime.substring(0, colonIndex).toInt();
  int m = weatherData.utcTime.substring(colonIndex + 1).toInt();
  
  // Convert UTC to local time (UTC+5:30 for Sri Lanka)
  h += 5;
  m += 30;
  
  if (m >= 60) {
    m -= 60;
    h++;
  }
  if (h >= 24) {
    h -= 24;
  }
  
  char buf[8];
  sprintf(buf, "%02d:%02d", h, m);
  return String(buf);
}

void handleSerialInput() {
  while (Serial2.available()) {
    String line = Serial2.readStringUntil('\n');
    line.trim();

    if (line.length() > 0) {
      if (line.startsWith("------")) {
        nanoConnected = true;
      }

      // ✅ same role as onLoRaReceive
      parseLoRaData(line);
      weatherData.lastPacketTime = millis();
      weatherData.dataValid = true;

      // ✅ optional: post immediately like old function
      if (millis() - lastNextJSPost > 5000) {
        postToNextJS();
        lastNextJSPost = millis();
      }
    }
  }
}

void sendDataToNano() {
  // Send data to Nano for SD card logging
  String csv = String(weatherData.temperature) + "," + String(weatherData.humidity) + "," +
               String(weatherData.pressure) + "," + String(weatherData.dewPoint) + "," +
               String(weatherData.windSpeed) + "," + String(weatherData.windDirection) + "," +
               String(weatherData.latitude, 6) + "," + String(weatherData.longitude, 6) + "," +
               weatherData.utcTime;
  
  Serial1.println(csv);
  Serial.println("CSV data sent to Nano for SD storage");
}

void serveWebRequests() {
  EthernetClient client = server.available();
  if (client) {
    String request = "";
    bool currentLineIsBlank = true;
    
    while (client.connected()) {
      if (client.available()) {
        char c = client.read();
        request += c;
        
        if (c == '\n' && currentLineIsBlank) {
          // Parse the request
          if (request.indexOf("GET / ") >= 0) {
            handleRoot(client);
          } else if (request.indexOf("GET /data") >= 0) {
            handleDataAPI(client);
          } else if (request.indexOf("GET /status") >= 0) {
            handleStatusAPI(client);
          } else {
            // 404 Not Found
            client.println("HTTP/1.1 404 Not Found");
            client.println("Content-Type: text/html");
            client.println("Connection: close");
            client.println();
            client.println("<!DOCTYPE HTML><html><body><h1>404 Not Found</h1></body></html>");
          }
          break;
        }
        
        if (c == '\n') {
          currentLineIsBlank = true;
        } else if (c != '\r') {
          currentLineIsBlank = false;
        }
      }
    }
    
    delay(10);
    client.stop();
  }
}

void handleRoot(EthernetClient client) {
  String html = generateWebPage();
  
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: text/html");
  client.println("Connection: close");
  client.print("Content-Length: ");
  client.println(html.length());
  client.println();
  client.print(html);
}

void sendJSONResponse(EthernetClient client, String jsonString) {
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: application/json");
  client.println("Access-Control-Allow-Origin: *");
  client.println("Connection: close");
  client.print("Content-Length: ");
  client.println(jsonString.length());
  client.println();
  client.print(jsonString);
}

void handleDataAPI(EthernetClient client) {
  DynamicJsonDocument json(1024);
  json["temperature"] = weatherData.temperature;
  json["humidity"] = weatherData.humidity;
  json["pressure"] = weatherData.pressure;
  json["dewPoint"] = weatherData.dewPoint;
  json["windSpeed"] = weatherData.windSpeed;
  json["windDirection"] = weatherData.windDirection;
  json["latitude"] = weatherData.latitude;
  json["longitude"] = weatherData.longitude;
  json["utcTime"] = weatherData.utcTime;
  json["lastPacketTime"] = weatherData.lastPacketTime;
  json["dataValid"] = weatherData.dataValid;
  json["ethernetConnected"] = ethernetConnected;
  json["loraConnected"] = loraConnected;
  json["nextJSStatus"] = (nextJSPostErrors == 0) ? "connected" : "error";

  String jsonString;
  serializeJson(json, jsonString);
  
  sendJSONResponse(client, jsonString);
}

void handleStatusAPI(EthernetClient client) {
  DynamicJsonDocument json(512);
  json["device"] = "ESP32-AWOS-Receiver-Ethernet";
  json["version"] = "2.2";
  json["uptime"] = millis();
  json["freeHeap"] = ESP.getFreeHeap();
  json["ethernetStatus"] = Ethernet.linkStatus();
  json["ethernetConnected"] = ethernetConnected;
  json["loraConnected"] = loraConnected;
  json["nextJSErrors"] = nextJSPostErrors;
  json["nextJSEndpoint"] = String(NEXTJS_BASE_URL) + String(NEXTJS_ESP32_ENDPOINT);
  json["ipAddress"] = Ethernet.localIP().toString();
  
  String jsonString;
  serializeJson(json, jsonString);
  
  sendJSONResponse(client, jsonString);
}

String generateWebPage() {
  String html = R"rawliteral(
<!DOCTYPE html>
<html><head>
<title>AWOS Receiver - Ethernet Integration</title>
<meta name='viewport' content='width=device-width, initial-scale=1.0'>
<style>
body{font-family:Arial,sans-serif;margin:20px;background:#f5f5f5;}
.container{max-width:1200px;margin:0 auto;background:white;padding:20px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1);}
h1{color:#2c3e50;text-align:center;margin-bottom:30px;}
.status{padding:15px;margin:20px 0;border-radius:5px;}
.status.ok{background:#e8f5e8;color:#2e7d2e;}
.status.error{background:#ffe8e8;color:#d63031;}
table{border-collapse:collapse;width:100%;margin:20px 0;}
th,td{border:1px solid #ddd;padding:12px;text-align:left;}
th{background:#3498db;color:white;}
tr:nth-child(even){background:#f2f2f2;}
</style>
<script>
function updateData(){
  fetch('/data').then(r=>r.json()).then(data=>{
    document.getElementById('temp').textContent = data.temperature.toFixed(1);
    document.getElementById('humidity').textContent = data.humidity.toFixed(1);
    document.getElementById('pressure').textContent = data.pressure.toFixed(1);
    document.getElementById('dewpoint').textContent = data.dewPoint.toFixed(1);
    document.getElementById('windspeed').textContent = data.windSpeed.toFixed(1);
    document.getElementById('winddir').textContent = data.windDirection;
    document.getElementById('lat').textContent = data.latitude.toFixed(6);
    document.getElementById('lng').textContent = data.longitude.toFixed(6);
    document.getElementById('time').textContent = data.utcTime;
    
    const statusDiv = document.getElementById('status');
    if(data.ethernetConnected && data.loraConnected && data.nextJSStatus === 'connected'){
      statusDiv.className = 'status ok';
      statusDiv.innerHTML = '✅ All systems operational - Data flowing via Ethernet to Next.js dashboard!';
    } else {
      statusDiv.className = 'status error';
      statusDiv.innerHTML = '⚠️ System issues detected - Check Ethernet/LoRa connections';
    }
  });
}
setInterval(updateData, 5000);
window.onload = updateData;
</script>
</head>
<body>
<div class='container'>
<h1>� AWOS Receiver → Ethernet → Production Dashboard</h1>
<p style='text-align:center;color:#666;margin-bottom:20px;'>
� Connected via Ethernet to: <strong>https://awos-dashboard.vercel.app</strong>
</p>
<div id='status' class='status'>Checking status...</div>
<table>
<tr><th>Parameter</th><th>Value</th></tr>
<tr><td>Temperature</td><td><span id='temp'>--</span> °C</td></tr>
<tr><td>Humidity</td><td><span id='humidity'>--</span> %</td></tr>
<tr><td>Pressure</td><td><span id='pressure'>--</span> hPa</td></tr>
<tr><td>Dew Point</td><td><span id='dewpoint'>--</span> °C</td></tr>
<tr><td>Wind Speed</td><td><span id='windspeed'>--</span> m/s</td></tr>
<tr><td>Wind Direction</td><td><span id='winddir'>--</span>°</td></tr>
<tr><td>Latitude</td><td><span id='lat'>--</span></td></tr>
<tr><td>Longitude</td><td><span id='lng'>--</span></td></tr>
<tr><td>UTC Time</td><td><span id='time'>--</span></td></tr>
</table>
<p style='text-align:center;color:#666;'>
� Data updates every 5 seconds via Ethernet | 🔄 Sends to Next.js every 10 seconds
</p>
</div>
</body></html>
)rawliteral";
  return html;
}