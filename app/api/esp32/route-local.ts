import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ESP32 data validation schema
const ESP32DataSchema = z.object({
    temperature: z.number(),
    humidity: z.number().min(0).max(100),
    pressure: z.number().positive(),
    dewPoint: z.number(),
    windSpeed: z.number().min(0),
    windDirection: z.number().min(0).max(360),
    lat: z.number().optional(),
    lng: z.number().optional(),
    utcTime: z.string().optional(),
    lastPacketTime: z.number().optional(),
    stationId: z.string().default('VCBI-ESP32'),
});

// In-memory storage for latest data (for quick access)
let latestESP32Data: any = null;
let lastUpdateTime = 0;

// Import local database (will be used on client side through API)
// For server-side, we'll use a simple file-based storage as backup
const fs = require('fs').promises;
const path = require('path');
const DATA_DIR = path.join(process.cwd(), 'data');
const READINGS_FILE = path.join(DATA_DIR, 'sensor_readings.json');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
        // Directory already exists
    }
}

// Save reading to JSON file (server-side backup)
async function saveReadingToFile(reading: any) {
    try {
        await ensureDataDir();
        
        // Read existing data
        let readings = [];
        try {
            const data = await fs.readFile(READINGS_FILE, 'utf-8');
            readings = JSON.parse(data);
        } catch (error) {
            // File doesn't exist yet
        }

        // Add new reading
        readings.unshift(reading);

        // Keep only last 10000 readings
        if (readings.length > 10000) {
            readings = readings.slice(0, 10000);
        }

        // Save back to file
        await fs.writeFile(READINGS_FILE, JSON.stringify(readings, null, 2));
    } catch (error) {
        console.error('Error saving to file:', error);
    }
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    
    try {
        const body = await request.json();
        
        console.log('📡 Received ESP32 data:', {
            stationId: body.stationId,
            temperature: `${body.temperature}°C`,
            humidity: `${body.humidity}%`,
            pressure: `${body.pressure} hPa`,
            windSpeed: `${body.windSpeed} m/s`,
            windDirection: `${body.windDirection}°`
        });

        // Validate the incoming ESP32 data
        const validatedData = ESP32DataSchema.parse(body);

        // Create sensor reading object
        const sensorReading = {
            id: `reading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            station_id: validatedData.stationId,
            temperature: validatedData.temperature,
            humidity: validatedData.humidity,
            pressure: validatedData.pressure,
            dew_point: validatedData.dewPoint,
            wind_speed: validatedData.windSpeed,
            wind_direction: validatedData.windDirection,
            wind_gust: null,
            visibility: null,
            precipitation_1h: null,
            precipitation_3h: null,
            precipitation_6h: null,
            precipitation_24h: null,
            weather_code: null,
            weather_description: null,
            cloud_coverage: null,
            cloud_base: null,
            sea_level_pressure: null,
            altimeter_setting: null,
            battery_voltage: null,
            solar_panel_voltage: null,
            signal_strength: null,
            data_quality: 'good',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        // Store in memory for quick access
        latestESP32Data = {
            ...validatedData,
            timestamp: sensorReading.timestamp,
            receivedAt: Date.now()
        };
        lastUpdateTime = Date.now();

        // Save to file (server-side storage)
        await saveReadingToFile(sensorReading);

        const responseTime = Date.now() - startTime;
        console.log(`✅ ESP32 data stored successfully in ${responseTime}ms`);

        return NextResponse.json({
            success: true,
            data: sensorReading,
            message: 'ESP32 data received and stored successfully',
            responseTime: `${responseTime}ms`
        }, { status: 201 });

    } catch (error) {
        console.error('Error processing ESP32 data:', error);

        if (error instanceof z.ZodError) {
            return NextResponse.json({
                success: false,
                error: 'Validation failed',
                details: error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }))
            }, { status: 400 });
        }

        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// GET endpoint for real-time data
export async function GET() {
    try {
        // Check if data is fresh (within last 2 minutes)
        const dataAge = Date.now() - lastUpdateTime;
        const isDataFresh = dataAge < 120000; // 2 minutes

        if (!latestESP32Data) {
            // Try to load from file
            try {
                const data = await fs.readFile(READINGS_FILE, 'utf-8');
                const readings = JSON.parse(data);
                if (readings.length > 0) {
                    latestESP32Data = readings[0];
                    lastUpdateTime = new Date(latestESP32Data.timestamp).getTime();
                }
            } catch (error) {
                // No file data available
            }
        }

        if (!latestESP32Data) {
            return NextResponse.json({
                success: false,
                error: 'No ESP32 data available',
                message: 'No data has been received from ESP32 yet'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                ...latestESP32Data,
                dataAge: dataAge,
                isDataFresh: isDataFresh,
                connectionStatus: isDataFresh ? 'connected' : 'stale'
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error retrieving ESP32 data:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}

// OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}
