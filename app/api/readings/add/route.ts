import { NextRequest, NextResponse } from 'next/server'
import { SensorReadingModel } from '@/models/sensorReading'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

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
            weatherDescription: body.weatherDescription,
            dataQuality: body.dataQuality || 'good',
            timestamp: body.timestamp || new Date().toISOString()
        })

        return NextResponse.json({
            ok: true,
            message: 'Reading added successfully',
            data: reading
        })

    } catch (error: any) {
        console.error('Error adding reading:', error)
        return NextResponse.json({
            ok: false,
            error: error.message || 'Failed to add reading'
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