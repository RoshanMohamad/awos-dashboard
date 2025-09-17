import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        
        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({
                status: 'error',
                message: 'Supabase configuration missing',
                timestamp: new Date().toISOString()
            }, { status: 500 })
        }

        const supabase = createClient(supabaseUrl, supabaseKey)

        // Test database connection with a simple query
        const startTime = Date.now()
        const { data, error } = await supabase
            .from('sensor_readings')
            .select('id')
            .limit(1)

        const responseTime = Date.now() - startTime

        if (error) {
            return NextResponse.json({
                status: 'error',
                message: 'Database connection failed',
                error: error.message,
                responseTime: `${responseTime}ms`,
                timestamp: new Date().toISOString()
            }, { status: 500 })
        }

        return NextResponse.json({
            status: 'healthy',
            message: 'Supabase connection successful',
            responseTime: `${responseTime}ms`,
            recordsFound: data?.length || 0,
            supabaseUrl,
            timestamp: new Date().toISOString()
        })

    } catch (error: any) {
        return NextResponse.json({
            status: 'error', 
            message: 'Health check failed',
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}