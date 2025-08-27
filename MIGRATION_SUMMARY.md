# PostgreSQL + TimescaleDB Migration Summary

## ✅ Completed Changes

### 1. Package Dependencies

- **Added**: PostgreSQL and TimescaleDB support
  - `pg` - PostgreSQL client
  - `drizzle-orm` - Modern TypeScript ORM
  - `drizzle-kit` - Database toolkit
  - `drizzle-zod` - Zod integration
  - `@auth/drizzle-adapter` - NextAuth adapter
  - `dotenv` - Environment variable support
- **Removed**: MongoDB dependencies (will need to be manually removed)
  - `mongodb`
  - `mongoose`
  - `@next-auth/mongodb-adapter`

### 2. Database Configuration

- **Created**: `lib/database.ts` - PostgreSQL connection with connection pooling
- **Created**: `lib/schema.ts` - Drizzle schema with TimescaleDB optimization
- **Created**: `drizzle.config.ts` - Drizzle configuration

### 3. API Routes Updated

All API routes have been converted to use PostgreSQL:

- ✅ `app/api/readings/current/route.ts`
- ✅ `app/api/ingest/route.ts`
- ✅ `app/api/aggregates/route.ts`
- ✅ `app/api/db/health/route.ts`
- ✅ `app/api/realtime/route.ts`

### 4. Database Schema

- **Hypertable ready**: Optimized for time-series data
- **Proper indexing**: Time-based and runway-based indexes
- **Type safety**: Full TypeScript support
- **JSON support**: Sensor status and metadata fields

### 5. Supporting Files

- **Created**: `sql/setup_timescaledb.sql` - TimescaleDB setup commands
- **Created**: `scripts/setup-database.ts` - Database setup script
- **Created**: `.env.example` - Environment configuration template
- **Created**: `MIGRATION_GUIDE.md` - Comprehensive migration guide
- **Updated**: `types/sensorReading.ts` - Type re-exports

## 🚀 Next Steps

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Set up Database

1. Install PostgreSQL + TimescaleDB
2. Create database: `CREATE DATABASE awos;`
3. Copy `.env.example` to `.env.local` and configure DATABASE_URL

### 3. Run Migrations

```bash
# Generate migrations
npm run db:generate

# Apply migrations
npm run db:push

# Set up TimescaleDB hypertable
psql -d awos -f sql/setup_timescaledb.sql
```

### 4. Test the Application

```bash
npm run dev
```

Test API endpoints:

- Health: `http://localhost:3000/api/db/health`
- Current readings: `http://localhost:3000/api/readings/current`

## 🔧 Key Improvements

### Performance

- **Hypertables**: Automatic time-based partitioning
- **Compression**: Up to 90% storage reduction
- **Optimized queries**: Better time-series performance
- **Connection pooling**: Better resource management

### Developer Experience

- **Type safety**: Full TypeScript support with Drizzle
- **Better tooling**: Drizzle Studio for database management
- **Modern ORM**: More intuitive than raw SQL
- **Migration system**: Version-controlled schema changes

### Scalability

- **Time-series optimization**: Built for sensor data
- **Automatic cleanup**: Optional data retention policies
- **Compression policies**: Automatic data compression
- **Query optimization**: Purpose-built indexes

## ⚠️ Important Notes

### Real-time Updates

The real-time API now uses polling instead of MongoDB change streams. For production:

1. Consider implementing PostgreSQL LISTEN/NOTIFY
2. Or use external message queues (Redis, Apache Kafka)
3. Current implementation polls every 5 seconds

### Data Migration

If you have existing MongoDB data:

1. Export from MongoDB: `mongoexport --db awos --collection sensorreadings --out data.json`
2. Create custom migration script to transform and import data
3. Validate data integrity after migration

### Environment Variables

Update your deployment environment to use:

```env
DATABASE_URL="postgresql://username:password@host:5432/dbname"
```

Remove old MongoDB environment variables:

- `MONGODB_URI`
- Any MongoDB-specific configuration

## 🛠️ Troubleshooting

### Common Issues

1. **Connection errors**: Verify DATABASE_URL format and PostgreSQL service
2. **Extension missing**: Ensure TimescaleDB extension is installed
3. **Permission errors**: Check database user permissions
4. **Type errors**: Run `npm install` to ensure all dependencies are installed

### Performance Tuning

After migration, consider:

1. Adjusting chunk intervals based on data ingestion rate
2. Setting up continuous aggregates for common queries
3. Configuring compression policies
4. Monitoring query performance

## 📚 Documentation

- Full migration guide: `MIGRATION_GUIDE.md`
- TimescaleDB setup: `sql/setup_timescaledb.sql`
- Environment example: `.env.example`

Your AWOS Dashboard is now ready for PostgreSQL + TimescaleDB! 🎉
