const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
)

// Helper function to generate realistic weather data
function generateWeatherData(baseTime, stationId) {
  // Base values for different stations
  const stationConfigs = {
    'VCBI': { // Colombo/Bandaranaike
      baseTemp: 28,
      basePressure: 1012,
      baseHumidity: 75,
      baseWindSpeed: 8
    },
    'VCRI': { // Ratmalana
      baseTemp: 29,
      basePressure: 1013,
      baseHumidity: 72,
      baseWindSpeed: 6
    },
    'TEST': { // Test station
      baseTemp: 26,
      basePressure: 1015,
      baseHumidity: 65,
      baseWindSpeed: 12
    }
  }

  const config = stationConfigs[stationId] || stationConfigs['VCBI']
  
  // Add some realistic variance
  const tempVariance = (Math.random() - 0.5) * 6 // ±3°C
  const pressureVariance = (Math.random() - 0.5) * 20 // ±10hPa
  const humidityVariance = (Math.random() - 0.5) * 30 // ±15%
  const windVariance = (Math.random() - 0.5) * 10 // ±5 knots

  const temperature = config.baseTemp + tempVariance
  const humidity = Math.max(30, Math.min(100, config.baseHumidity + humidityVariance))
  const pressure = config.basePressure + pressureVariance
  const windSpeed = Math.max(0, config.baseWindSpeed + windVariance)
  const windDirection = Math.floor(Math.random() * 360)
  const windGust = windSpeed + Math.random() * 5

  // Calculate dew point
  const dewPoint = temperature - ((100 - humidity) / 5)

  // Generate some weather conditions
  const weatherCodes = [
    { code: 800, description: 'Clear sky' },
    { code: 801, description: 'Few clouds' },
    { code: 802, description: 'Scattered clouds' },
    { code: 803, description: 'Broken clouds' },
    { code: 804, description: 'Overcast clouds' },
    { code: 500, description: 'Light rain' },
    { code: 501, description: 'Moderate rain' },
  ]
  const weather = weatherCodes[Math.floor(Math.random() * weatherCodes.length)]

  // Cloud coverage based on weather
  let cloudCoverage = 0
  if (weather.code === 800) cloudCoverage = Math.random() * 10
  else if (weather.code === 801) cloudCoverage = 10 + Math.random() * 15
  else if (weather.code === 802) cloudCoverage = 25 + Math.random() * 25
  else if (weather.code === 803) cloudCoverage = 50 + Math.random() * 25
  else if (weather.code === 804) cloudCoverage = 75 + Math.random() * 25
  else cloudCoverage = 80 + Math.random() * 20

  // Visibility (meters)
  const visibility = weather.code >= 500 ? 5000 + Math.random() * 5000 : 8000 + Math.random() * 7000

  // Precipitation (only if rainy weather)
  const precipitation1h = weather.code >= 500 ? Math.random() * 5 : 0
  const precipitation3h = precipitation1h > 0 ? precipitation1h * (2 + Math.random()) : 0
  const precipitation6h = precipitation3h > 0 ? precipitation3h * (1.5 + Math.random() * 0.5) : 0
  const precipitation24h = precipitation6h > 0 ? precipitation6h * (2 + Math.random() * 2) : 0

  return {
    timestamp: baseTime.toISOString(),
    station_id: stationId,
    temperature: Math.round(temperature * 10) / 10,
    humidity: Math.round(humidity * 10) / 10,
    pressure: Math.round(pressure * 100) / 100,
    wind_speed: Math.round(windSpeed * 10) / 10,
    wind_direction: Math.round(windDirection),
    wind_gust: Math.round(windGust * 10) / 10,
    visibility: Math.round(visibility),
    precipitation_1h: Math.round(precipitation1h * 100) / 100,
    precipitation_3h: Math.round(precipitation3h * 100) / 100,
    precipitation_6h: Math.round(precipitation6h * 100) / 100,
    precipitation_24h: Math.round(precipitation24h * 100) / 100,
    weather_code: weather.code,
    weather_description: weather.description,
    cloud_coverage: Math.round(cloudCoverage),
    cloud_base: weather.code >= 500 ? 800 + Math.random() * 1200 : 1500 + Math.random() * 2000,
    dew_point: Math.round(dewPoint * 10) / 10,
    sea_level_pressure: Math.round((pressure + Math.random() * 2) * 100) / 100,
    altimeter_setting: Math.round((pressure * 0.02953) * 100) / 100, // Convert hPa to inHg
    battery_voltage: Math.round((12 + Math.random() * 2) * 100) / 100,
    solar_panel_voltage: Math.round((18 + Math.random() * 4) * 100) / 100,
    signal_strength: Math.floor(-60 + Math.random() * 20), // -60 to -40 dBm
    data_quality: Math.random() > 0.05 ? 'good' : (Math.random() > 0.5 ? 'fair' : 'poor')
  }
}

async function seedSampleData() {
  console.log('🌱 Starting to seed sample weather data...')

  try {
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('sensor_readings')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('❌ Database connection failed:', testError.message)
      return
    }

    console.log('✅ Database connection successful')

    // Clear existing test data
    console.log('🧹 Clearing existing sample data...')
    const { error: deleteError } = await supabase
      .from('sensor_readings')
      .delete()
      .neq('station_id', 'KEEP_THIS') // This will delete all records

    if (deleteError && deleteError.code !== 'PGRST116') { // PGRST116 is "not found" which is OK
      console.warn('⚠️ Could not clear existing data:', deleteError.message)
    }

    // Generate sample data for the last 7 days
    const stations = ['VCBI', 'VCRI', 'TEST']
    const sampleData = []
    const now = new Date()
    const daysToGenerate = 7
    const hoursToGenerate = daysToGenerate * 24
    const recordsPerHour = 12 // Every 5 minutes

    console.log(`📊 Generating ${hoursToGenerate * recordsPerHour * stations.length} sample records...`)

    for (let station of stations) {
      for (let hour = 0; hour < hoursToGenerate; hour++) {
        for (let record = 0; record < recordsPerHour; record++) {
          const timestamp = new Date(now.getTime() - (hour * 60 + record * 5) * 60 * 1000)
          const weatherData = generateWeatherData(timestamp, station)
          sampleData.push(weatherData)
        }
      }
    }

    // Insert data in batches to avoid timeout
    const batchSize = 100
    let insertedCount = 0

    for (let i = 0; i < sampleData.length; i += batchSize) {
      const batch = sampleData.slice(i, i + batchSize)
      
      console.log(`📤 Inserting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(sampleData.length/batchSize)} (${batch.length} records)...`)
      
      const { error: insertError } = await supabase
        .from('sensor_readings')
        .insert(batch)

      if (insertError) {
        console.error(`❌ Failed to insert batch ${Math.floor(i/batchSize) + 1}:`, insertError.message)
        console.error('Sample record:', JSON.stringify(batch[0], null, 2))
        break
      }

      insertedCount += batch.length
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`✅ Successfully inserted ${insertedCount} sample records`)

    // Verify the data
    const { data: verifyData, error: verifyError } = await supabase
      .from('sensor_readings')
      .select('station_id, timestamp')
      .order('timestamp', { ascending: false })
      .limit(5)

    if (!verifyError && verifyData) {
      console.log('🔍 Sample of latest records:')
      verifyData.forEach(record => {
        console.log(`   ${record.station_id}: ${record.timestamp}`)
      })
    }

    // Get statistics
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_station_stats')
      .single()

    if (!statsError && statsData) {
      console.log('📈 Database statistics:')
      console.log(`   Total records: ${statsData.total_records}`)
      console.log(`   Stations: ${statsData.station_count}`)
      console.log(`   Date range: ${statsData.earliest_date} to ${statsData.latest_date}`)
    } else {
      // Alternative stats query
      const { count, error: countError } = await supabase
        .from('sensor_readings')
        .select('*', { count: 'exact', head: true })

      if (!countError) {
        console.log(`📈 Total records in database: ${count}`)
      }
    }

    console.log('🎉 Sample data seeding completed!')
    console.log('\n🚀 You can now:')
    console.log('   1. Visit http://localhost:3001/api/db/health to check database status')
    console.log('   2. Visit http://localhost:3001/api/readings/current to see latest readings')
    console.log('   3. Visit http://localhost:3001 to view the dashboard with real data')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedSampleData()
    .then(() => {
      console.log('✨ Seeding process completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error)
      process.exit(1)
    })
}

module.exports = { seedSampleData, generateWeatherData }
