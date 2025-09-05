#!/usr/bin/env node

/**
 * AWOS Dashboard - Standalone MQTT Bridge
 * 
 * This bridge connects to an MQTT broker and forwards messages to the Vercel API.
 * It works with both local and cloud MQTT brokers.
 * 
 * Usage:
 *   node scripts/mqtt-bridge-standalone.js
 *   npm run mqtt-bridge
 */

const mqtt = require('mqtt');
const https = require('https');
const http = require('http');
const { URL } = require('url');

class MQTTBridge {
    constructor() {
        this.config = {
            mqtt: {
                host: process.env.MQTT_HOST || 'localhost',
                port: parseInt(process.env.MQTT_PORT) || 1883,
                username: process.env.MQTT_USERNAME || null,
                password: process.env.MQTT_PASSWORD || null,
                protocol: process.env.MQTT_PROTOCOL || 'mqtt'
            },
            api: {
                baseUrl: process.env.API_BASE_URL || 'https://your-app.vercel.app',
                timeout: parseInt(process.env.API_TIMEOUT) || 10000
            },
            logging: {
                level: process.env.LOG_LEVEL || 'info',
                verbose: process.env.VERBOSE === 'true'
            }
        };
        
        this.client = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.stats = {
            messagesReceived: 0,
            messagesForwarded: 0,
            errors: 0,
            startTime: new Date()
        };
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] ${level.toUpperCase()}:`;
        
        if (level === 'error') {
            console.error(`${prefix} ${message}`);
        } else if (this.config.logging.verbose || level === 'info') {
            console.log(`${prefix} ${message}`);
        }
    }

    async connect() {
        try {
            const mqttUrl = `${this.config.mqtt.protocol}://${this.config.mqtt.host}:${this.config.mqtt.port}`;
            
            const options = {
                clientId: `awos-bridge-${Math.random().toString(16).substr(2, 8)}`,
                keepalive: 60,
                clean: true,
                reconnectPeriod: 5000,
                connectTimeout: 30000,
                will: {
                    topic: 'awos/bridge/status',
                    payload: JSON.stringify({
                        status: 'offline',
                        timestamp: new Date().toISOString()
                    }),
                    qos: 1,
                    retain: true
                }
            };

            if (this.config.mqtt.username) {
                options.username = this.config.mqtt.username;
                options.password = this.config.mqtt.password;
            }

            this.log(`🔌 Connecting to MQTT broker: ${mqttUrl}`);
            this.client = mqtt.connect(mqttUrl, options);

            this.setupEventHandlers();

        } catch (error) {
            this.log(`❌ MQTT connection failed: ${error.message}`, 'error');
            this.scheduleReconnect();
        }
    }

    setupEventHandlers() {
        this.client.on('connect', () => {
            this.log('✅ Connected to MQTT broker');
            this.reconnectAttempts = 0;
            this.subscribeToTopics();
            this.publishBridgeStatus('online');
        });

        this.client.on('message', this.handleMessage.bind(this));
        this.client.on('error', this.handleError.bind(this));
        this.client.on('close', this.handleClose.bind(this));
        this.client.on('reconnect', this.handleReconnect.bind(this));
        this.client.on('offline', () => {
            this.log('📡 MQTT client offline');
        });
    }

    subscribeToTopics() {
        const topics = [
            'awos/+/sensor/data',      // Station sensor data
            'awos/+/status',           // Station status updates
            'awos/+/battery',          // Battery status
            'awos/sensor/+',           // General sensor topics
            'weather/+/data',          // Alternative weather topics
            'sensors/+/readings'       // Alternative sensor topics
        ];

        const subscriptionPromises = topics.map(topic => {
            return new Promise((resolve, reject) => {
                this.client.subscribe(topic, { qos: 1 }, (err) => {
                    if (err) {
                        this.log(`❌ Failed to subscribe to ${topic}: ${err.message}`, 'error');
                        reject(err);
                    } else {
                        this.log(`📡 Subscribed to: ${topic}`);
                        resolve(topic);
                    }
                });
            });
        });

        Promise.allSettled(subscriptionPromises).then((results) => {
            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;
            this.log(`📊 Subscriptions: ${successful} successful, ${failed} failed`);
        });
    }

    async handleMessage(topic, message) {
        try {
            this.stats.messagesReceived++;
            this.log(`📨 Received message on ${topic}`, 'debug');
            
            // Skip bridge status messages to avoid loops
            if (topic.includes('/bridge/')) {
                return;
            }

            let data;
            try {
                data = JSON.parse(message.toString());
            } catch (parseError) {
                this.log(`❌ Invalid JSON message on ${topic}: ${parseError.message}`, 'error');
                this.stats.errors++;
                return;
            }

            // Validate and enhance the message
            const enhancedData = this.enhanceMessage(data, topic);
            
            if (!enhancedData) {
                this.log(`❌ Message validation failed for topic: ${topic}`, 'error');
                this.stats.errors++;
                return;
            }

            // Send to Vercel API
            await this.sendToAPI(enhancedData);
            this.stats.messagesForwarded++;

        } catch (error) {
            this.log(`❌ Error handling message: ${error.message}`, 'error');
            this.stats.errors++;
        }
    }

    enhanceMessage(data, topic) {
        try {
            // Add metadata
            data.mqttTopic = topic;
            data.receivedAt = new Date().toISOString();
            data.bridgeId = process.env.BRIDGE_ID || 'default';
            
            // Extract station ID from topic if not provided
            if (!data.stationId) {
                const topicParts = topic.split('/');
                if (topicParts.length >= 2) {
                    data.stationId = topicParts[1];
                } else {
                    data.stationId = 'UNKNOWN';
                }
            }

            // Ensure required fields
            if (!data.timestamp) {
                data.timestamp = new Date().toISOString();
            }

            // Validate sensor data structure
            if (topic.includes('/sensor/data') || topic.includes('/readings')) {
                const requiredFields = ['stationId', 'timestamp'];
                for (const field of requiredFields) {
                    if (!data[field]) {
                        this.log(`❌ Missing required field: ${field}`, 'error');
                        return null;
                    }
                }
            }

            return data;

        } catch (error) {
            this.log(`❌ Error enhancing message: ${error.message}`, 'error');
            return null;
        }
    }

    async sendToAPI(data) {
        return new Promise((resolve, reject) => {
            const url = new URL('/api/ingest', this.config.api.baseUrl);
            const isHttps = url.protocol === 'https:';
            const httpModule = isHttps ? https : http;

            const postData = JSON.stringify(data);
            
            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                    'User-Agent': 'AWOS-MQTT-Bridge/1.0',
                    'X-MQTT-Topic': data.mqttTopic || 'unknown',
                    'X-Bridge-ID': data.bridgeId || 'default'
                },
                timeout: this.config.api.timeout
            };

            const req = httpModule.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        this.log(`✅ Data forwarded (${res.statusCode}): ${data.stationId}`, 'debug');
                        resolve({ success: true, statusCode: res.statusCode });
                    } else {
                        this.log(`❌ API error (${res.statusCode}): ${responseData}`, 'error');
                        reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                    }
                });
            });

            req.on('error', (error) => {
                this.log(`❌ API request failed: ${error.message}`, 'error');
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                this.log(`❌ API request timeout for station: ${data.stationId}`, 'error');
                reject(new Error('Request timeout'));
            });

            req.write(postData);
            req.end();
        });
    }

    publishBridgeStatus(status) {
        if (!this.client || !this.client.connected) return;

        const statusMessage = {
            status: status,
            timestamp: new Date().toISOString(),
            stats: this.stats,
            config: {
                mqttHost: this.config.mqtt.host,
                apiBaseUrl: this.config.api.baseUrl
            }
        };

        this.client.publish('awos/bridge/status', JSON.stringify(statusMessage), { 
            qos: 1, 
            retain: true 
        });
    }

    printStats() {
        const uptime = Math.floor((new Date() - this.stats.startTime) / 1000);
        const rate = this.stats.messagesReceived > 0 ? 
            (this.stats.messagesForwarded / this.stats.messagesReceived * 100).toFixed(1) : 0;

        console.log('\n📊 MQTT Bridge Statistics');
        console.log('═'.repeat(40));
        console.log(`Uptime: ${uptime}s`);
        console.log(`Messages Received: ${this.stats.messagesReceived}`);
        console.log(`Messages Forwarded: ${this.stats.messagesForwarded}`);
        console.log(`Errors: ${this.stats.errors}`);
        console.log(`Success Rate: ${rate}%`);
        console.log(`MQTT: ${this.config.mqtt.host}:${this.config.mqtt.port}`);
        console.log(`API: ${this.config.api.baseUrl}`);
        console.log('═'.repeat(40));
    }

    handleError(error) {
        this.log(`❌ MQTT error: ${error.message}`, 'error');
        this.stats.errors++;
    }

    handleClose() {
        this.log('🔌 MQTT connection closed');
        this.publishBridgeStatus('offline');
    }

    handleReconnect() {
        this.reconnectAttempts++;
        this.log(`🔄 Reconnecting to MQTT (attempt ${this.reconnectAttempts})`);
        
        if (this.reconnectAttempts > this.maxReconnectAttempts) {
            this.log('❌ Max reconnect attempts reached', 'error');
            process.exit(1);
        }
    }

    scheduleReconnect() {
        setTimeout(() => {
            this.connect();
        }, 5000);
    }

    async gracefulShutdown() {
        this.log('🛑 Shutting down MQTT bridge...');
        
        if (this.client && this.client.connected) {
            this.publishBridgeStatus('offline');
            this.client.end(true);
        }
        
        this.printStats();
        process.exit(0);
    }
}

// Command line interface
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
AWOS MQTT Bridge

Usage: node scripts/mqtt-bridge-standalone.js [options]

Options:
  --help, -h        Show this help message
  --verbose         Enable verbose logging
  --stats          Show statistics every 30 seconds

Environment Variables:
  MQTT_HOST         MQTT broker hostname (default: localhost)
  MQTT_PORT         MQTT broker port (default: 1883)
  MQTT_USERNAME     MQTT username (optional)
  MQTT_PASSWORD     MQTT password (optional)
  MQTT_PROTOCOL     MQTT protocol: mqtt/mqtts (default: mqtt)
  API_BASE_URL      Vercel API base URL
  LOG_LEVEL         Logging level: debug/info/error (default: info)
  VERBOSE           Enable verbose logging (true/false)
`);
    process.exit(0);
}

// Parse command line arguments
if (process.argv.includes('--verbose')) {
    process.env.VERBOSE = 'true';
}

const showStats = process.argv.includes('--stats');

// Start the bridge
const bridge = new MQTTBridge();

// Show periodic statistics
if (showStats) {
    setInterval(() => {
        bridge.printStats();
    }, 30000);
}

// Graceful shutdown handlers
process.on('SIGINT', () => bridge.gracefulShutdown());
process.on('SIGTERM', () => bridge.gracefulShutdown());

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught exception:', error);
    bridge.gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
    bridge.gracefulShutdown();
});

// Start the bridge
console.log('🚀 Starting AWOS MQTT Bridge...');
console.log(`📡 MQTT: ${bridge.config.mqtt.protocol}://${bridge.config.mqtt.host}:${bridge.config.mqtt.port}`);
console.log(`🌐 API: ${bridge.config.api.baseUrl}`);
bridge.connect();
