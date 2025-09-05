import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const stationId = searchParams.get('stationId')
        const startTime = searchParams.get('startTime')
        const endTime = searchParams.get('endTime')
        const limit = parseInt(searchParams.get('limit') || '100')
        const offset = parseInt(searchParams.get('offset') || '0')

        const supabase = createClient()
        
        if (!supabase) {
            return NextResponse.json({
                ok: false,
                error: 'Database connection not available'
            }, { status: 503 })
        }

        // Build query
        let query = supabase
            .from('sensor_readings')
            .select('*')
            .order('timestamp', { ascending: false })
            .range(offset, offset + limit - 1)

        // Apply filters
        if (stationId) {
            query = query.eq('station_id', stationId)
        }

        if (startTime) {
            query = query.gte('timestamp', startTime)
        }

        if (endTime) {
            query = query.lte('timestamp', endTime)
        }

        const { data, error, count } = await query

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({
                ok: false,
                error: 'Failed to fetch readings'
            }, { status: 500 })
        }

        // Get total count for pagination
        let totalQuery = supabase
            .from('sensor_readings')
            .select('id', { count: 'exact', head: true })

        if (stationId) {
            totalQuery = totalQuery.eq('station_id', stationId)
        }
        if (startTime) {
            totalQuery = totalQuery.gte('timestamp', startTime)
        }
        if (endTime) {
            totalQuery = totalQuery.lte('timestamp', endTime)
        }

        const { count: total } = await totalQuery

        return NextResponse.json({
            ok: true,
            data: data || [],
            pagination: {
                offset,
                limit,
                total: total || 0,
                hasMore: (offset + limit) < (total || 0)
            },
            filters: {
                stationId,
                startTime,
                endTime
            }
        })

    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json({
            ok: false,
            error: 'Internal server error'
        }, { status: 500 })
    }
}

// Handle CORS for cross-origin requests
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    })
}
