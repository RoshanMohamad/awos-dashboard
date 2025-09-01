import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET() {
    try {
        // Check if environment variables are available
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            return NextResponse.json({
                ok: false,
                status: 'not-configured',
                error: 'Supabase environment variables not configured'
            }, { status: 503 })
        }

        const supabase = createClient()

        // Handle case where createClient returns null
        if (!supabase) {
            return NextResponse.json({
                ok: false,
                status: 'client-error',
                error: 'Failed to create Supabase client'
            }, { status: 503 })
        }

        // Simple connection test first - check if sensor_readings table exists
        const { data: testData, error: testError } = await supabase
            .from('sensor_readings')
            .select('id')
            .limit(1)

        if (testError) {
            // If sensor_readings table doesn't exist, that's expected for initial setup
            if (testError.message.includes('relation "sensor_readings" does not exist') ||
                testError.message.includes('table') ||
                testError.code === 'PGRST116') {
                return NextResponse.json({
                    ok: true,
                    status: 'connected-no-tables',
                    database: 'PostgreSQL (Supabase)',
                    platform: 'Supabase',
                    message: 'Database connected but sensor_readings table not found. This is normal for initial setup.',
                    stats: {
                        totalReadings: 0,
                        totalStations: 0,
                        stations: [],
                        earliestReading: null,
                        latestReading: null
                    }
                })
            }

            // Other database errors
            return NextResponse.json({
                ok: false,
                status: 'disconnected',
                error: `Database connection failed: ${testError.message}`
            }, { status: 500 })
        }

        // If table exists, get detailed stats
        const { count: totalReadings, error: countError } = await supabase
            .from('sensor_readings')
            .select('*', { count: 'exact', head: true })

        // Get oldest and newest readings safely
        const [
            { data: oldestReading, error: oldestError },
            { data: latestReading, error: latestError },
            { data: stationIds, error: stationsError }
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
                .limit(100) // Limit to avoid too much data
        ])

        // Handle any sub-query errors gracefully
        const uniqueStations = stationsError ? [] :
            [...new Set((stationIds as any[])?.map((s: any) => s.station_id).filter(Boolean) || [])]

        return NextResponse.json({
            ok: true,
            status: 'connected',
            database: 'PostgreSQL (Supabase)',
            platform: 'Supabase',
            stats: {
                totalReadings: totalReadings || 0,
                totalStations: uniqueStations.length,
                stations: uniqueStations,
                earliestReading: oldestError ? null : (oldestReading as any)?.[0]?.timestamp || null,
                latestReading: latestError ? null : (latestReading as any)?.[0]?.timestamp || null
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