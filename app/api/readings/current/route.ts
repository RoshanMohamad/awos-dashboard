import { NextResponse } from 'next/server'
import { SensorReadingModel } from '@/models/sensorReading'

export async function GET(req: Request) {
    try {
        const url = new URL(req.url)
        const stationId = url.searchParams.get('stationId') || url.searchParams.get('runway') // Support both new and legacy parameter names

        const reading = await SensorReadingModel.findLatest(stationId || undefined)

        return NextResponse.json({ ok: true, reading })
    } catch (err: any) {
        console.error('Error fetching current reading', err)
        return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
    }
}
