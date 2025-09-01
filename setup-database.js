import { createAdminClient } from '../lib/supabase'

async function setupDatabase() {
    console.log('🚀 Setting up database schema...')
    
    const supabase = createAdminClient()
    if (!supabase) {
        console.error('❌ Could not create Supabase admin client')
        return
    }

    try {
        // Test connection first
        console.log('🔗 Testing database connection...')
        const { data: testData, error: testError } = await supabase
            .from('sensor_readings')
            .select('id')
            .limit(1)

        if (testError) {
            if (testError.code === 'PGRST205') {
                console.log('📋 Table not found - this is expected for initial setup')
            } else {
                console.log('⚠️ Database connection issue:', testError.message)
            }
        } else {
            console.log('✅ Database connection successful!')
            console.log('📊 Found existing data:', testData?.length || 0, 'records')
        }

        // Insert sample data if table exists
        if (!testError || testError.code !== 'PGRST205') {
            console.log('📝 Adding sample sensor readings...')
            const { data: insertData, error: insertError } = await supabase
                .from('sensor_readings')
                .insert([
                    {
                        station_id: 'VCBI',
                        timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                        temperature: 28.5,
                        humidity: 65.2,
                        pressure: 1013.25,
                        wind_speed: 12.5,
                        wind_direction: 270,
                        data_quality: 'good'
                    },
                    {
                        station_id: 'VCBI',
                        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                        temperature: 29.1,
                        humidity: 63.8,
                        pressure: 1012.8,
                        wind_speed: 15.2,
                        wind_direction: 275,
                        data_quality: 'good'
                    },
                    {
                        station_id: 'VCBI',
                        timestamp: new Date().toISOString(),
                        temperature: 29.8,
                        humidity: 62.1,
                        pressure: 1012.3,
                        wind_speed: 18.7,
                        wind_direction: 280,
                        data_quality: 'good'
                    }
                ])
                .select()

            if (insertError) {
                console.log('⚠️ Could not insert sample data:', insertError.message)
            } else {
                console.log('✅ Sample data inserted successfully:', insertData?.length || 0, 'records')
            }
        }

    } catch (error) {
        console.error('❌ Database setup failed:', error)
    }
}

// Run the setup
setupDatabase()
    .then(() => {
        console.log('🎉 Database setup complete!')
        process.exit(0)
    })
    .catch((error) => {
        console.error('💥 Setup failed:', error)
        process.exit(1)
    })
