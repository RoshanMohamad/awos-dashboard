import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SensorReadingModel } from '@/models/sensorReading';

// Validation schema for sensor readings using Zod
const SensorReadingSchema = z.object({
    // Core readings - all optional as sensors may fail
    temperature: z.number().optional(),
    humidity: z.number().min(0).max(100).optional(), // Percentage
    pressure: z.number().positive().optional(), // hPa
    windSpeed: z.number().min(0).optional(), // knots
    windDirection: z.number().min(0).max(360).optional(), // degrees
    windGust: z.number().min(0).optional(), // knots
    visibility: z.number().min(0).optional(), // meters

    // Precipitation data
    precipitation1h: z.number().min(0).optional(), // mm
    precipitation3h: z.number().min(0).optional(), // mm
    precipitation6h: z.number().min(0).optional(), // mm
    precipitation24h: z.number().min(0).optional(), // mm

    // Weather conditions
    weatherCode: z.number().int().optional(),
    weatherDescription: z.string().optional(),

    // Cloud data
    cloudCoverage: z.number().min(0).max(100).optional(), // percentage
    cloudBase: z.number().min(0).optional(), // feet

    // Additional meteorological data
    dewPoint: z.number().optional(), // Celsius
    seaLevelPressure: z.number().positive().optional(), // hPa
    altimeterSetting: z.number().positive().optional(), // inHg

    // System status
    batteryVoltage: z.number().min(0).optional(),
    solarPanelVoltage: z.number().min(0).optional(),
    signalStrength: z.number().optional(), // dBm (can be negative)

    // Optional metadata
    timestamp: z.coerce.date().optional(), // Coerce string/number to Date
    stationId: z.string().default('VCBI'),
    dataQuality: z.string().optional().default('good'),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate the incoming data
        const validatedData = SensorReadingSchema.parse(body);

        // Store in database using Supabase admin client (secure server-side)
        const sensorReading = await SensorReadingModel.createServerSide(validatedData);

        console.log('Successfully created sensor reading:', sensorReading.id);

        return NextResponse.json({
            success: true,
            data: sensorReading,
            message: 'Sensor reading stored successfully'
        }, { status: 201 });

    } catch (error) {
        console.error('Error in sensor data ingestion:', error);

        // Handle validation errors specifically
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

        // Handle database/Supabase errors
        if (error instanceof Error) {
            return NextResponse.json({
                success: false,
                error: 'Database error',
                message: error.message
            }, { status: 500 });
        }

        // Generic error fallback
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            message: 'An unexpected error occurred while processing the sensor data'
        }, { status: 500 });
    }
}

// Health check endpoint
export async function GET() {
    return NextResponse.json({
        status: 'healthy',
        service: 'AWOS Sensor Data Ingestion API',
        timestamp: new Date().toISOString(),
        message: 'API is running and ready to receive sensor data'
    });
}
