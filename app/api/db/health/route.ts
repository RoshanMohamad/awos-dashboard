import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
    try {
        const supabase = createClient()

        // Test connection and get basic stats
        const { data: readings, error: readingsError } = await supabase
            .from('sensor_readings')
            .select('id, timestamp, station_id')
            .limit(1)

        if (readingsError) {
            return NextResponse.json({
                ok: false,
                status: 'disconnected',
                error: `Database connection failed: ${readingsError.message}`
            }, { status: 500 })
        }

        // Get total count
        const { count: totalReadings, error: countError } = await supabase
            .from('sensor_readings')
            .select('*', { count: 'exact', head: true })

        // Get oldest and newest readings
        const [
            { data: oldestReading },
            { data: latestReading },
            { data: stationIds }
        ] = await Promise.all([
            supabase
                .from('sensor_readings')
                .select('timestamp')
                .order('timestamp', { ascending: true })
                .limit(1),
            supabase
                .from('sensor_readings')
                .select('timestamp')
                .order('timestamp', { ascending: false })
                .limit(1),
            supabase
                .from('sensor_readings')
                .select('station_id')
                .order('station_id')
        ]) as [
            { data: { timestamp: string }[] },
            { data: { timestamp: string }[] },
            { data: { station_id: string }[] }
        ]

        // Get unique station IDs
        const uniqueStations = [...new Set(stationIds?.map(s => s.station_id) || [])]

        return NextResponse.json({
            ok: true,
            status: 'connected',
            database: 'PostgreSQL (Supabase)',
            platform: 'Supabase',
            stats: {
                totalReadings: totalReadings || 0,
                totalStations: uniqueStations.length,
                stations: uniqueStations,
                earliestReading: oldestReading?.[0]?.timestamp || null,
                latestReading: latestReading?.[0]?.timestamp || null
            }
        })
    } catch (err: any) {
        console.error('Database health check failed', err)
        return NextResponse.json({
            ok: false,
            status: 'error',
            error: String(err)
        }, { status: 500 })
    }
}