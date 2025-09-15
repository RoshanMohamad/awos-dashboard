import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SensorReadingModel } from '@/models/sensorReading';

// ESP32 data validation schema - matches your ESP32 data format
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

// Store the latest ESP32 data in memory for real-time dashboard
let latestESP32Data: any = null;
let lastUpdateTime = 0;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('Received ESP32 data:', body);

        // Validate the incoming ESP32 data
        const validatedData = ESP32DataSchema.parse(body);

        // Store latest data in memory for real-time access
        latestESP32Data = {
            ...validatedData,
            timestamp: new Date().toISOString(),
            receivedAt: Date.now()
        };
        lastUpdateTime = Date.now();

        // Convert ESP32 data format to match your database schema
        const sensorReading = {
            temperature: validatedData.temperature,
            humidity: validatedData.humidity,
            pressure: validatedData.pressure,
            dewPoint: validatedData.dewPoint,
            windSpeed: validatedData.windSpeed, // ESP32 sends m/s, convert to knots if needed
            windDirection: validatedData.windDirection,
            stationId: validatedData.stationId,
            timestamp: new Date(),
            dataQuality: 'good',
            // Add GPS coordinates if available
            ...(validatedData.lat && validatedData.lng && {
                latitude: validatedData.lat,
                longitude: validatedData.lng
            })
        };

        // Store in database
        const savedReading = await SensorReadingModel.createServerSide(sensorReading);

        console.log('Successfully stored ESP32 reading:', savedReading.id);

        return NextResponse.json({
            success: true,
            data: savedReading,
            message: 'ESP32 data received and stored successfully'
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

// GET endpoint for real-time data (used by your dashboard)
export async function GET() {
    try {
        // Check if data is fresh (within last 2 minutes)
        const dataAge = Date.now() - lastUpdateTime;
        const isDataFresh = dataAge < 120000; // 2 minutes

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

// OPTIONS for CORS (allows your ESP32 to send data)
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
