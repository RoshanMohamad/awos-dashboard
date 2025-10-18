import { NextRequest, NextResponse } from 'next/server'
import { LocalSensorReadingModel } from '@/models/localSensorReading'

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const stationId = searchParams.get('stationId')
        const startTime = searchParams.get('startTime')
        const endTime = searchParams.get('endTime')
        const limit = parseInt(searchParams.get('limit') || '100')
        const offset = parseInt(searchParams.get('offset') || '0')

        // Fetch readings from local database
        const data = await LocalSensorReadingModel.findMany({
            stationId: stationId || undefined,
            startTime: startTime ? new Date(startTime) : undefined,
            endTime: endTime ? new Date(endTime) : undefined,
            limit: limit,
            offset: offset,
            orderBy: 'desc'
        });

        // Get total count for pagination
        const allData = await LocalSensorReadingModel.findMany({
            stationId: stationId || undefined,
            startTime: startTime ? new Date(startTime) : undefined,
            endTime: endTime ? new Date(endTime) : undefined,
            limit: 10000, // Get all for count
            orderBy: 'desc'
        });
        
        const total = allData.length;

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
