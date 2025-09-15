/*
 * -----------------------------------------------------------------------------
 * ESP32 Weather Station Transmitter Sketch
 * -----------------------------------------------------------------------------
 * This code runs on the ESP32 located at the runway (Far End).
 *
 * It performs the following tasks:
 * 1.  Initializes communication with various sensors:
 * - AHT20 + BMP280 (Temperature, Humidity, Pressure) via I2C.
 * - NEO-M8N GPS module for time and location via a hardware serial port.
 * - Wind Speed and Wind Direction sensors via RS485 (using a Software
 * Serial port and a TTL-to-RS485 converter).
 * 2.  Reads data from all sensors periodically.
 * 3.  Calculates the dew point based on temperature and humidity.
 * 4.  Packages all the collected data into a single string.
 * 5.  Transmits this data packet using a LoRa module (SX1278).
 * 6.  Enters a delay of 30 seconds before the next reading, as specified
 * in the project report to prevent data overflow issues.
 *
 * Libraries Needed (Install from Arduino IDE Library Manager):
 * - "LoRa" by Sandeep Mistry
 * - "Adafruit AHTX0" by Adafruit
 * - "Adafruit BMP280 Library" by Adafruit
 * - "TinyGPSPlus" by Mikal Hart
 *
 * Connections:
 * LoRa Module (SX1278/Ra-02):
 * - NSS/CS:  GPIO 5
 * - DIO0:    GPIO 2
 * - RESET:   GPIO 4
 * - MOSI:    GPIO 23
 * - MISO:    GPIO 19
 * - SCK:     GPIO 18
 *
 * AHT20/BMP280 Sensor (I2C):
 * - SCL:     GPIO 22
 * - SDA:     GPIO 21
 *
 * GPS Module (NEO-M8N):
 * - Connect to a hardware serial port (e.g., Serial2)
 * - GPS TX -> ESP32 RX2 (GPIO 16)
 * - GPS RX -> ESP32 TX2 (GPIO 17)
 *
 * Wind Sensors (RS485):
 * - Connect both wind sensors to an RS485 bus.
 * - Connect the bus to a TTL-to-RS485 converter.
 * - RS485 Converter RX -> ESP32 TX (e.g., GPIO 26 - Software Serial)
 * - RS485 Converter TX -> ESP32 RX (e.g., GPIO 25 - Software Serial)
 * - RS485 Converter DE/RE -> Connect to a GPIO to control send/receive, or
 * if it's an auto-direction module, leave it. This code assumes auto-direction.
 * -----------------------------------------------------------------------------
 */

// LIBRARIES
#include <SPI.h>
#include <LoRa.h>
#include <Wire.h>
#include <Adafruit_AHTX0.h>
#include <Adafruit_BMP280.h>
#include <TinyGPSPlus.h>
#include <SoftwareSerial.h> // For Modbus communication with wind sensors

// LORA PIN DEFINITIONS
#define LORA_SS    5
#define LORA_RST   4
#define LORA_DIO0  2

// GPS HARDWARE SERIAL
#define GPS_SERIAL Serial2

// WIND SENSOR SOFTWARE SERIAL (for RS485 communication)
#define RS485_RX_PIN 25
#define RS485_TX_PIN 26
SoftwareSerial rs485Serial(RS485_RX_PIN, RS485_TX_PIN);

// SENSOR OBJECTS
Adafruit_AHTX0 aht;
Adafruit_BMP280 bmp;
TinyGPSPlus gps;

// MODBUS COMMANDS FOR WIND SENSORS (EXAMPLE)
// These are placeholder commands. You MUST replace them with the actual
// Modbus commands specified in your wind sensor datasheets.
// Format: {Slave ID, Function Code, Start Address HI, Start Address LO, Num Registers HI, Num Registers LO, CRC LO, CRC HI}
const byte windSpeedCmd[] = {0x01, 0x03, 0x00, 0x00, 0x00, 0x01, 0x84, 0x0A};
const byte windDirCmd[]   = {0x02, 0x03, 0x00, 0x00, 0x00, 0x01, 0x84, 0x0A}; // Assuming wind direction sensor has slave ID 2

// GLOBAL VARIABLES
float temperature = 0.0;
float humidity = 0.0;
float pressure = 0.0;
float dewPoint = 0.0;
float windSpeed = 0.0;
int   windDirection = 0;

void setup() {
  // Start serial for debugging
  Serial.begin(115200);
  while (!Serial);
  Serial.println("Transmitter Booting...");

  // Initialize I2C sensors
  setupSensors();

  // Initialize GPS
  GPS_SERIAL.begin(9600);

  // Initialize RS485 Serial for wind sensors
  rs485Serial.begin(4800); // Default baud rate from the document

  // Initialize LoRa module
  setupLoRa();
}

void loop() {
  // 1. Read all sensor data
  readI2CSensors();
  readGpsData();
  windSpeed = readWindSensor(windSpeedCmd, sizeof(windSpeedCmd));
  windDirection = (int)readWindSensor(windDirCmd, sizeof(windDirCmd));

  // 2. Calculate dew point
  dewPoint = calculateDewPoint(temperature, humidity);
  
  // 3. Create data packet string (CSV format for easy parsing)
  String dataPacket = String(temperature) + "," +
                      String(humidity) + "," +
                      String(pressure) + "," +
                      String(dewPoint) + "," +
                      String(windSpeed) + "," +
                      String(windDirection) + "," +
                      String(gps.location.lat(), 6) + "," +
                      String(gps.location.lng(), 6) + "," +
                      String(gps.time.hour()) + ":" +
                      String(gps.time.minute()) + ":" +
                      String(gps.time.second());

  // 4. Print to serial for debugging
  Serial.println("Sending Packet: " + dataPacket);

  // 5. Send packet via LoRa
  LoRa.beginPacket();
  LoRa.print(dataPacket);
  LoRa.endPacket();

  // 6. Wait for 30 seconds before next cycle (as per report)
  delay(30000);
}

void setupSensors() {
  Wire.begin();
  if (!aht.begin()) {
    Serial.println("Could not find AHT20 sensor!");
    while (1) delay(10);
  }
  Serial.println("AHT20 Found!");

  if (!bmp.begin(0x76)) { // I2C address can be 0x77 or 0x76
    Serial.println("Could not find BMP280 sensor!");
    while (1) delay(10);
  }
  Serial.println("BMP280 Found!");
  // BMP280 default settings from library are fine for this application
}

void setupLoRa() {
  LoRa.setPins(LORA_SS, LORA_RST, LORA_DIO0);
  if (!LoRa.begin(433E6)) { // 433 MHz frequency
    Serial.println("Starting LoRa failed!");
    while (1);
  }
  Serial.println("LoRa Initialized OK!");
}

void readI2CSensors() {
  sensors_event_t humidity_event, temp_event;
  aht.getEvent(&humidity_event, &temp_event);
  
  temperature = temp_event.temperature;
  humidity = humidity_event.relative_humidity;
  pressure = bmp.readPressure() / 100.0F; // Read in hPa
}

void readGpsData() {
  // This function should be called repeatedly to process GPS data.
  // We'll give it 1 second to get a fix.
  unsigned long start = millis();
  while (millis() - start < 1000) {
    if (GPS_SERIAL.available() > 0) {
      gps.encode(GPS_SERIAL.read());
    }
  }

  if (gps.location.isValid()) {
     Serial.print("GPS Location: ");
     Serial.print(gps.location.lat(), 6);
     Serial.print(", ");
     Serial.println(gps.location.lng(), 6);
  } else {
    Serial.println("GPS location not valid.");
  }
}


float readWindSensor(const byte command[], int cmd_len) {
    byte buffer[8];
    
    // Send Modbus command
    rs485Serial.write(command, cmd_len);
    
    // Wait for a response (e.g., 100ms timeout)
    unsigned long startTime = millis();
    while (rs485Serial.available() < 7 && millis() - startTime < 100) {
      // Wait for enough bytes
    }

    if (rs485Serial.available() >= 7) {
        rs485Serial.readBytes(buffer, 7);
        // Assuming the data is in the 4th and 5th bytes (index 3 and 4)
        // and needs to be divided by 10 or 100 based on the sensor's datasheet.
        // This is a common format.
        int value = (buffer[3] << 8) | buffer[4];
        return value / 10.0; // EXAMPLE: divide by 10, adjust as needed
    }
    
    return -1.0; // Return -1 on error
}


float calculateDewPoint(float temp, float hum) {
  // Magnus-Tetens formula (simplified)
  // a = 17.27, b = 237.7 for temp > 0
  float alpha = ((17.27 * temp) / (237.7 + temp)) + log(hum / 100.0);
  float dewPoint = (237.7 * alpha) / (17.27 - alpha);
  return dewPoint;
}
