import { NextResponse } from 'next/server'
import { localDB } from '@/lib/local-database'

export async function GET() {
    try {
        // Initialize local database
        await localDB.init();

        // Get readings from local database
        const allReadings = await localDB.getAll('sensor_readings')

        // Get unique station IDs
        const uniqueStations = [...new Set(allReadings.map((r: any) => r.station_id))];

        // Get oldest and newest readings
        const sortedReadings = [...allReadings].sort((a: any, b: any) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        const earliestReading = sortedReadings.length > 0 ? (sortedReadings[0] as any).timestamp : null;
        const latestReading = sortedReadings.length > 0 ? (sortedReadings[sortedReadings.length - 1] as any).timestamp : null;

        return NextResponse.json({
            ok: true,
            status: 'connected',
            database: 'IndexedDB (Local Browser Storage)',
            platform: 'Local',
            stats: {
                totalReadings: allReadings.length,
                totalStations: uniqueStations.length,
                stations: uniqueStations,
                earliestReading,
                latestReading
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