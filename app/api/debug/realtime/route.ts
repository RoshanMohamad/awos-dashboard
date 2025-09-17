import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        
        const supabase = createClient(supabaseUrl, supabaseKey)

        console.log('🔍 Testing realtime capabilities...')

        // 1. Test basic connection
        const { data: testData, error: testError } = await supabase
            .from('sensor_readings')
            .select('id, station_id, temperature, timestamp')
            .eq('station_id', 'VCBI')
            .order('timestamp', { ascending: false })
            .limit(3)

        if (testError) {
            return NextResponse.json({
                status: 'error',
                message: 'Database query failed',
                error: testError.message
            }, { status: 500 })
        }

        // 2. Test realtime channel creation
        const channel = supabase
            .channel('test-realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public', 
                table: 'sensor_readings'
            }, (payload) => {
                console.log('Realtime test received:', payload)
            })

        const subscriptionStatus = await new Promise((resolve) => {
            channel.subscribe((status) => {
                console.log('Subscription status:', status)
                resolve(status)
            })
        })

        // Clean up test channel
        supabase.removeChannel(channel)

        return NextResponse.json({
            status: 'success',
            message: 'Realtime diagnostics completed',
            results: {
                databaseConnection: 'working',
                latestRecords: testData?.length || 0,
                realtimeSubscription: subscriptionStatus,
                latestData: testData?.[0] || null
            },
            timestamp: new Date().toISOString()
        })

    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: 'Realtime diagnostics failed', 
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}