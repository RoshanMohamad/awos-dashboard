// ESP32 AWOS Receiver with Ethernet - Local Network Configuration
// This version connects to a local PC server via Ethernet (no internet required)

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <SPI.h>
#include <Ethernet.h>
#include <EthernetClient.h>
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

// Ethernet W5500 Pin Definitions
#define ETH_CS    5   // Chip Select
#define ETH_RST   26  // Reset pin (optional)
#define ETH_MOSI  23  // SPI MOSI
#define ETH_MISO  19  // SPI MISO
#define ETH_SCK   18  // SPI Clock

// Network Configuration - LOCAL NETWORK ONLY
byte mac[] = {0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0xED};  // MAC address

// IMPORTANT: Set these to match your local network configuration
IPAddress serverIP(192, 168, 1, 100);   // IP of PC running the dashboard server
IPAddress esp32IP(192, 168, 1, 177);    // Static IP for this ESP32
IPAddress gateway(192, 168, 1, 1);       // Your router's gateway
IPAddress subnet(255, 255, 255, 0);      // Subnet mask
IPAddress dns(192, 168, 1, 1);           // DNS (use router IP for local network)

const int SERVER_PORT = 3000;            // Next.js development server port
const char* API_ENDPOINT = "/api/esp32"; // API endpoint path

// Ethernet Client
EthernetClient client;

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
unsigned long lastLoRaPacket = 0;

// Timing Constants
const unsigned long OLED_UPDATE_INTERVAL = 1000;   // 1 second
const unsigned long DATA_SEND_INTERVAL = 10000;    // 10 seconds to server
const unsigned long LORA_TIMEOUT = 60000;          // 1 minute LoRa timeout

// Connection Status
bool ethernetConnected = false;
bool loraConnected = false;
int postErrors = 0;
const int MAX_POST_ERRORS = 5;

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, RXD2, TXD2);
  
  Serial.println("\\n=== ESP32 AWOS Receiver (Local Ethernet) ===");
  
  // Initialize I2C for OLED
  I2COLED.begin(21, 22, 100000);
  
  // Initialize OLED Display
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("❌ SSD1306 allocation failed");
    delay(1000);
  }
  
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("AWOS Receiver");
  display.println("Local Ethernet");
  display.display();
  
  // Rotary Encoder Setup
  pinMode(CLK, INPUT);
  pinMode(DT, INPUT);
  pinMode(SW, INPUT_PULLUP);
  lastClkState = digitalRead(CLK);
  
  // Initialize Ethernet
  Serial.println("\\n📡 Initializing Ethernet...");
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Connecting...");
  display.display();
  
  // Configure SPI pins for W5500
  SPI.begin(ETH_SCK, ETH_MISO, ETH_MOSI, ETH_CS);
  
  // Reset Ethernet module (optional)
  if (ETH_RST > 0) {
    pinMode(ETH_RST, OUTPUT);
    digitalWrite(ETH_RST, LOW);
    delay(50);
    digitalWrite(ETH_RST, HIGH);
    delay(200);
  }
  
  // Start Ethernet with static IP
  Ethernet.init(ETH_CS);
  Ethernet.begin(mac, esp32IP, dns, gateway, subnet);
  
  // Give Ethernet module time to initialize
  delay(2000);
  
  // Check connection
  if (Ethernet.linkStatus() == LinkOFF) {
    Serial.println("❌ Ethernet cable not connected!");
    ethernetConnected = false;
  } else {
    ethernetConnected = true;
    Serial.println("✅ Ethernet connected!");
    Serial.print("   ESP32 IP: ");
    Serial.println(Ethernet.localIP());
    Serial.print("   Server IP: ");
    Serial.print(serverIP);
    Serial.print(":");
    Serial.println(SERVER_PORT);
    
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("Connected!");
    display.print("IP: ");
    display.println(Ethernet.localIP());
    display.display();
    delay(2000);
  }
  
  Serial.println("\\n✅ System Ready");
  Serial.println("Waiting for LoRa data...");
}

void loop() {
  // Maintain Ethernet connection
  Ethernet.maintain();
  
  // Read LoRa data from Serial2
  if (Serial2.available()) {
    String loraData = Serial2.readStringUntil('\\n');
    parseLoRaData(loraData);
  }
  
  // Handle rotary encoder
  handleRotaryEncoder();
  
  // Update OLED display
  if (millis() - lastOLEDUpdate >= OLED_UPDATE_INTERVAL) {
    updateDisplay();
    lastOLEDUpdate = millis();
  }
  
  // Send data to server periodically
  if (weatherData.dataValid && ethernetConnected) {
    if (millis() - lastDataSend >= DATA_SEND_INTERVAL) {
      sendDataToServer();
      lastDataSend = millis();
    }
  }
  
  // Check LoRa connection timeout
  if (millis() - lastLoRaPacket > LORA_TIMEOUT && weatherData.dataValid) {
    loraConnected = false;
    Serial.println("⚠️ LoRa connection lost");
  }
}

void parseLoRaData(String data) {
  // Example format: "T:25.5,H:65.2,P:1013.25,DP:18.3,WS:3.5,WD:270"
  
  if (data.length() < 10) return;
  
  Serial.println("📡 LoRa: " + data);
  
  // Parse comma-separated values
  int idx = 0;
  while (idx < data.length()) {
    int colonPos = data.indexOf(':', idx);
    int commaPos = data.indexOf(',', idx);
    
    if (colonPos == -1) break;
    if (commaPos == -1) commaPos = data.length();
    
    String key = data.substring(idx, colonPos);
    String value = data.substring(colonPos + 1, commaPos);
    
    // Parse values
    if (key == "T") weatherData.temperature = value.toFloat();
    else if (key == "H") weatherData.humidity = value.toFloat();
    else if (key == "P") weatherData.pressure = value.toFloat();
    else if (key == "DP") weatherData.dewPoint = value.toFloat();
    else if (key == "WS") weatherData.windSpeed = value.toFloat();
    else if (key == "WD") weatherData.windDirection = value.toInt();
    else if (key == "LAT") weatherData.latitude = value.toFloat();
    else if (key == "LNG") weatherData.longitude = value.toFloat();
    
    idx = commaPos + 1;
  }
  
  weatherData.dataValid = true;
  weatherData.lastPacketTime = millis();
  lastLoRaPacket = millis();
  loraConnected = true;
}

void sendDataToServer() {
  if (!ethernetConnected) {
    Serial.println("❌ Cannot send: Ethernet not connected");
    return;
  }
  
  Serial.println("\\n📤 Sending data to server...");
  
  // Connect to server
  if (client.connect(serverIP, SERVER_PORT)) {
    Serial.println("✅ Connected to server");
    
    // Create JSON payload
    StaticJsonDocument<512> doc;
    doc["stationId"] = "VCBI-ESP32";
    doc["temperature"] = weatherData.temperature;
    doc["humidity"] = weatherData.humidity;
    doc["pressure"] = weatherData.pressure;
    doc["dewPoint"] = weatherData.dewPoint;
    doc["windSpeed"] = weatherData.windSpeed;
    doc["windDirection"] = weatherData.windDirection;
    
    if (weatherData.latitude != 0.0) {
      doc["lat"] = weatherData.latitude;
      doc["lng"] = weatherData.longitude;
    }
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Send HTTP POST request
    client.print("POST ");
    client.print(API_ENDPOINT);
    client.println(" HTTP/1.1");
    client.print("Host: ");
    client.print(serverIP);
    client.print(":");
    client.println(SERVER_PORT);
    client.println("Content-Type: application/json");
    client.println("Connection: close");
    client.print("Content-Length: ");
    client.println(jsonString.length());
    client.println();
    client.println(jsonString);
    
    Serial.println("📊 Sent: " + jsonString);
    
    // Wait for response
    unsigned long timeout = millis();
    while (client.available() == 0) {
      if (millis() - timeout > 5000) {
        Serial.println("⏱️ Server response timeout!");
        client.stop();
        postErrors++;
        return;
      }
    }
    
    // Read response
    String response = "";
    while (client.available()) {
      response += (char)client.read();
    }
    
    Serial.println("📥 Response: " + response.substring(0, 200));
    
    client.stop();
    postErrors = 0;
    Serial.println("✅ Data sent successfully");
    
  } else {
    Serial.println("❌ Connection to server failed!");
    postErrors++;
    
    if (postErrors >= MAX_POST_ERRORS) {
      Serial.println("⚠️ Too many errors, checking Ethernet connection...");
      ethernetConnected = (Ethernet.linkStatus() != LinkOFF);
    }
  }
}

void handleRotaryEncoder() {
  int clkState = digitalRead(CLK);
  
  if (clkState != lastClkState && clkState == LOW) {
    if (digitalRead(DT) == HIGH) {
      page = (page + 1) % 3;  // 3 pages total
    } else {
      page = (page - 1 + 3) % 3;
    }
  }
  
  lastClkState = clkState;
  
  // Button press
  if (digitalRead(SW) == LOW && !buttonPressed) {
    buttonPressed = true;
    collecting = !collecting;
    delay(200);
  } else if (digitalRead(SW) == HIGH) {
    buttonPressed = false;
  }
}

void updateDisplay() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  
  // Header
  display.println("AWOS LOCAL");
  display.drawLine(0, 9, 128, 9, SSD1306_WHITE);
  
  // Connection status
  display.setCursor(0, 12);
  display.print("ETH:");
  display.print(ethernetConnected ? "OK" : "NO");
  display.print(" LoRa:");
  display.println(loraConnected ? "OK" : "NO");
  
  display.drawLine(0, 21, 128, 21, SSD1306_WHITE);
  
  // Display different pages
  display.setCursor(0, 24);
  
  if (!weatherData.dataValid) {
    display.println("Waiting for");
    display.println("LoRa data...");
  } else {
    switch (page) {
      case 0:  // Temperature & Humidity
        display.setTextSize(2);
        display.print(weatherData.temperature, 1);
        display.println("C");
        display.print(weatherData.humidity, 0);
        display.println("%");
        break;
        
      case 1:  // Pressure & Wind
        display.setTextSize(1);
        display.print("Pres:");
        display.print(weatherData.pressure, 1);
        display.println("hPa");
        display.print("Wind:");
        display.print(weatherData.windSpeed, 1);
        display.println("m/s");
        display.print("Dir:");
        display.print(weatherData.windDirection);
        display.println("deg");
        break;
        
      case 2:  // Network Info
        display.setTextSize(1);
        display.print("IP:");
        display.println(Ethernet.localIP());
        display.print("Server:");
        display.println(serverIP);
        display.print("Errors:");
        display.println(postErrors);
        break;
    }
  }
  
  display.display();
}
