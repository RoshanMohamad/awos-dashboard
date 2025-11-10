import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

/**
 * Debug endpoint to check what data exists in the database
 * GET /api/debug/check-data
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = createSupabaseAdminClient();
        
        // Get all recent readings (last 24 hours)
        const { data: allReadings, error: allError } = await supabase
            .from('sensor_readings')
            .select('station_id, timestamp, temperature, humidity, pressure')
            .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order('timestamp', { ascending: false })
            .limit(50);

        if (allError) {
            return NextResponse.json({
                success: false,
                error: allError.message
            }, { status: 500 });
        }

        // Group by station_id
        const byStation: Record<string, any[]> = {};
        (allReadings || []).forEach((reading: any) => {
            const stationId = reading.station_id;
            if (!byStation[stationId]) {
                byStation[stationId] = [];
            }
            byStation[stationId].push(reading);
        });

        // Get summary stats
        const summary = Object.entries(byStation).map(([stationId, readings]) => ({
            stationId,
            count: readings.length,
            latest: readings[0]?.timestamp,
            oldestInLast24h: readings[readings.length - 1]?.timestamp,
            latestData: readings[0]
        }));

        return NextResponse.json({
            success: true,
            totalReadings: allReadings?.length || 0,
            stations: summary,
            recentReadings: allReadings?.slice(0, 10), // Latest 10
            note: 'This shows all data from the last 24 hours'
        });

    } catch (error) {
        console.error('Error checking data:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
