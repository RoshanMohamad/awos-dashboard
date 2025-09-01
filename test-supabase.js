const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

console.log('Environment variables:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length : 'undefined')
console.log('SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 'undefined')

if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  console.log('\nTesting Supabase connection...')
  
  // Test connection
  supabase
    .from('sensor_readings')
    .select('id')
    .limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.log('Connection test result: Error -', error.message)
        if (error.message.includes('relation "sensor_readings" does not exist')) {
          console.log('✅ Database connected! (Table not found is expected for new setup)')
        }
      } else {
        console.log('✅ Connection successful, found data:', data)
      }
    })
    .catch(err => {
      console.log('❌ Connection failed:', err.message)
    })
} else {
  console.log('❌ Missing environment variables')
}
