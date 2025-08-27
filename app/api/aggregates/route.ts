import { NextResponse } from 'next/server'
import { SensorReadingModel } from '@/models/sensorReading'

// Query params: stationId (or runway for legacy), span=minute|hour|day, start, end
export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const stationId = url.searchParams.get('stationId') || url.searchParams.get('runway') // Support both new and legacy parameter names
        const span = (url.searchParams.get('span') || 'hour') as 'minute' | 'hour' | 'day'
        const start = url.searchParams.get('start')
        const end = url.searchParams.get('end')

        if (!start || !end) {
            return NextResponse.json({
                ok: false,
                error: 'start and end parameters are required'
            }, { status: 400 })
        }

        const startTime = new Date(start)
        const endTime = new Date(end)

        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            return NextResponse.json({
                ok: false,
                error: 'Invalid date format for start or end parameter'
            }, { status: 400 })
        }

        // Get aggregated data for the time period
        const aggregatedData = await SensorReadingModel.getAggregatedData({
            stationId: stationId || undefined,
            startTime,
            endTime
        });

        // For now, return simple aggregated data
        // TODO: Implement time-series aggregation based on span
        const results = [{
            _id: `${startTime.toISOString()}_${endTime.toISOString()}`,
            avgWindSpeed: aggregatedData.avgWindSpeed,
            avgTemperature: aggregatedData.avgTemperature,
            avgHumidity: aggregatedData.avgHumidity,
            avgPressure: aggregatedData.avgPressure,
            maxWindGust: aggregatedData.maxWindGust,
            totalPrecipitation: aggregatedData.totalPrecipitation,
            count: aggregatedData.count
        }];

        return NextResponse.json({
            ok: true,
            span,
            results,
            metadata: {
                stationId: stationId || 'all',
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                totalReadings: aggregatedData.count
            }
        })
    } catch (err: any) {
        console.error('Aggregates error', err)
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
    }
}
