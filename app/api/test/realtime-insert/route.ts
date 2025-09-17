import { NextRequest, NextResponse } from 'next/server'
import { SensorReadingModel } from '@/models/sensorReading'

export async function POST(request: NextRequest) {
    try {
        const { stationId = 'VCBI' } = await request.json()
        
        // Generate random sensor data
        const testData = {
            stationId,
            temperature: parseFloat((25 + Math.random() * 10).toFixed(1)),
            humidity: parseFloat((50 + Math.random() * 40).toFixed(1)), 
            pressure: parseFloat((1010 + Math.random() * 20).toFixed(1)),
            windSpeed: parseFloat((Math.random() * 20).toFixed(1)),
            windDirection: Math.floor(Math.random() * 360),
            windGust: parseFloat((Math.random() * 25).toFixed(1)),
            weatherDescription: ['Clear', 'Partly Cloudy', 'Cloudy', 'Windy'][Math.floor(Math.random() * 4)],
            dataQuality: 'good',
            timestamp: new Date().toISOString()
        }

        console.log('🧪 Inserting test sensor reading:', testData)

        // Insert using the working model
        const reading = await SensorReadingModel.createServerSide(testData)

        return NextResponse.json({
            success: true,
            message: 'Test sensor reading inserted - check dashboard for realtime update!',
            data: {
                id: reading.id,
                stationId: reading.stationId,
                temperature: reading.temperature,
                humidity: reading.humidity,
                pressure: reading.pressure,
                timestamp: reading.timestamp
            }
        })

    } catch (error: any) {
        console.error('❌ Test insert failed:', error)
        return NextResponse.json({
            success: false,
            error: error.message,
            message: 'Test insert failed'
        }, { status: 500 })
    }
}