import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { runway: string } }
) {
  try {
    const { runway } = params
    const searchParams = request.nextUrl.searchParams
    const days = parseFloat(searchParams.get('days') || '30')

    const supabase = createClient()
    
    if (!supabase) {
      return NextResponse.json({
        ok: false,
        error: 'Database connection not available'
      }, { status: 503 })
    }

    // Calculate start date - handle fractional days (hours)
    const startDate = new Date()
    const millisecondsToSubtract = days * 24 * 60 * 60 * 1000
    startDate.setTime(startDate.getTime() - millisecondsToSubtract)

    // Adjust limit based on time range (more points for hourly data)
    const limit = days < 2 ? 500 : 1000

    // Fix station_id - if runway already contains VCBI, don't double it
    const stationId = runway.includes('VCBI') ? runway : `VCBI-${runway}`

    // Query historical data for the specified runway
    const { data, error } = await supabase
      .from('sensor_readings')
      .select('*')
      .eq('station_id', stationId)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Database error fetching history:', error)
      return NextResponse.json({
        ok: false,
        error: 'Failed to fetch historical data'
      }, { status: 500 })
    }

    // Transform data to match expected format
    const transformedData = (data || []).map((reading: any) => ({
      id: reading.id,
      timestamp: reading.timestamp,
      temperature: reading.temperature,
      humidity: reading.humidity,
      pressure: reading.pressure,
      dewPoint: reading.dew_point,
      windSpeed: reading.wind_speed,
      windDirection: reading.wind_direction,
      batteryVoltage: reading.battery_voltage,
      solarVoltage: reading.solar_voltage,
      stationId: reading.station_id,
      dataQuality: reading.data_quality,
      qcFlags: reading.qc_flags
    }))

    return NextResponse.json(transformedData, { status: 200 })

  } catch (error) {
    console.error('Error fetching historical data:', error)
    return NextResponse.json({
      ok: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}
