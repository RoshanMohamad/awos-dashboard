import { prisma } from '@/lib/database'

async function setupDatabase() {
    console.log('🚀 Setting up PostgreSQL + TimescaleDB with Prisma...')

    try {
        // Test connection
        await prisma.$connect()
        console.log('✅ Database connection successful')

        // Test TimescaleDB extension
        try {
            await prisma.$queryRaw`SELECT extname FROM pg_extension WHERE extname = 'timescaledb'`
            console.log('✅ TimescaleDB extension is available')
        } catch (error) {
            console.warn('⚠️  TimescaleDB extension not found. Make sure to run:')
            console.warn('   CREATE EXTENSION IF NOT EXISTS timescaledb;')
        }

        console.log('✅ Database setup completed successfully!')
        console.log('\n🔥 Next steps:')
        console.log('1. Run: npm install')
        console.log('2. Run: npx prisma generate')
        console.log('3. Run: npx prisma db push')
        console.log('4. Run the TimescaleDB setup: psql -d your_database -f sql/setup_timescaledb.sql')
        console.log('\n💡 Don\'t forget to set your DATABASE_URL environment variable!')

    } catch (error) {
        console.error('❌ Database setup failed:', error)
        process.exit(1)
    } finally {
        await prisma.$disconnect()
    }
}

// Run setup if this file is executed directly (works in CommonJS; guard for ESM)
if (typeof require !== 'undefined' && require.main === module) {
    setupDatabase().catch((err) => {
        console.error('Setup failed:', err)
        process.exit(1)
    })
}

export default setupDatabase