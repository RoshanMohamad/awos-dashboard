import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        
        // Test with ANON key (what the dashboard uses)
        const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)

        console.log('🔍 Testing realtime with anon key (dashboard perspective)...')

        // Test if anon can read sensor_readings
        const { data: readTest, error: readError } = await supabaseAnon
            .from('sensor_readings')
            .select('id, station_id, temperature')
            .eq('station_id', 'VCBI')
            .limit(1)

        if (readError) {
            return NextResponse.json({
                status: 'error',
                issue: 'ANON_READ_BLOCKED',
                message: 'Anonymous user cannot read sensor_readings',
                error: readError.message,
                solution: 'Check Row Level Security (RLS) policies'
            }, { status: 500 })
        }

        // Test realtime subscription with anon key
        let subscriptionResult = 'pending'
        const channel = supabaseAnon
            .channel('test-anon-realtime')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'sensor_readings',
                filter: 'station_id=eq.VCBI'
            }, (payload) => {
                console.log('Anon realtime received:', payload)
            })

        const subscriptionPromise = new Promise<string>((resolve) => {
            channel.subscribe((status) => {
                console.log('Anon subscription status:', status)
                resolve(status)
                if (status === 'SUBSCRIBED') {
                    subscriptionResult = 'SUBSCRIBED'
                } else if (status === 'CHANNEL_ERROR') {
                    subscriptionResult = 'CHANNEL_ERROR'
                }
            })
        })

        // Wait for subscription or timeout
        const timeoutPromise = new Promise<string>((resolve) => {
            setTimeout(() => resolve('TIMEOUT'), 5000)
        })

        subscriptionResult = await Promise.race([subscriptionPromise, timeoutPromise])

        // Clean up
        supabaseAnon.removeChannel(channel)

        return NextResponse.json({
            status: 'success',
            message: 'Realtime test with anon key completed',
            results: {
                anonCanRead: !readError,
                recordsFound: readTest?.length || 0,
                subscriptionStatus: subscriptionResult,
                latestRecord: readTest?.[0] || null
            },
            recommendations: subscriptionResult !== 'SUBSCRIBED' ? [
                'Check if Realtime is enabled in Supabase project settings',
                'Verify RLS policies allow anonymous users to read sensor_readings',
                'Check if realtime is enabled for sensor_readings table'
            ] : ['Realtime working correctly!'],
            timestamp: new Date().toISOString()
        })

    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: 'Anon realtime test failed',
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}