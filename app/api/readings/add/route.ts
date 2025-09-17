import { NextRequest, NextResponse } from 'next/server'
import { SensorReadingModel } from '@/models/sensorReading'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        
        // Log ESP32 data reception
        console.log(`📡 ESP32 Data Received from ${body.stationId || 'VCBI'}:`, {
            temperature: body.temperature,
            humidity: body.humidity,
            pressure: body.pressure,
            windSpeed: body.windSpeed,
            windDirection: body.windDirection,
            timestamp: new Date().toISOString()
        })

        // Create new sensor reading
        const reading = await SensorReadingModel.createServerSide({
            stationId: body.stationId || 'VCBI',
            temperature: body.temperature,
            humidity: body.humidity,
            pressure: body.pressure,
            windSpeed: body.windSpeed,
            windDirection: body.windDirection,
            windGust: body.windGust,
            visibility: body.visibility,
            weatherDescription: body.weatherDescription || 'Clear',
            dataQuality: body.dataQuality || 'good',
            timestamp: body.timestamp || new Date().toISOString()
        })

        // Success response for ESP32
        return NextResponse.json({
            ok: true,
            message: 'Reading added successfully',
            stationId: body.stationId || 'VCBI',
            timestamp: new Date().toISOString(),
            data: {
                id: reading.id,
                temperature: reading.temperature,
                humidity: reading.humidity,
                pressure: reading.pressure
            }
        })

    } catch (error: any) {
        console.error('❌ Error processing ESP32 data:', error)
        return NextResponse.json({
            ok: false,
            error: error.message || 'Failed to add reading',
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}

// Handle CORS for cross-origin requests
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
}