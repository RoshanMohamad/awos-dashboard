# Migration Guide: MongoDB to PostgreSQL + TimescaleDB

This guide will help you migrate your AWOS Dashboard from MongoDB to PostgreSQL with TimescaleDB for better time-series data handling.

## Prerequisites

1. **PostgreSQL 12+** with **TimescaleDB extension** installed
2. **Node.js** and **npm/pnpm**
3. Access to your existing MongoDB data (optional, for data migration)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 2. Database Setup

#### Option A: Local PostgreSQL + TimescaleDB

1. Install PostgreSQL and TimescaleDB:

   - **Windows**: Download from [PostgreSQL](https://www.postgresql.org/download/windows/) and [TimescaleDB](https://docs.timescale.com/install/latest/self-hosted/installation-windows/)
   - **macOS**: `brew install postgresql timescaledb-tools`
   - **Ubuntu**: Follow [TimescaleDB installation guide](https://docs.timescale.com/install/latest/self-hosted/installation-ubuntu/)

2. Create a database:

```sql
CREATE DATABASE awos;
```

3. Connect to the database and enable TimescaleDB:

```sql
\c awos
CREATE EXTENSION IF NOT EXISTS timescaledb;
```

#### Option B: Cloud Database (Recommended)

Use a managed PostgreSQL service with TimescaleDB:

- **Timescale Cloud** (native TimescaleDB)
- **AWS RDS** with TimescaleDB extension
- **Google Cloud SQL** with TimescaleDB extension
- **Azure Database for PostgreSQL** with TimescaleDB extension

### 3. Environment Configuration

1. Copy the example environment file:

```bash
cp .env.example .env.local
```

2. Update `.env.local` with your database credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/awos"
```

### 4. Generate and Run Migrations

1. Generate Drizzle migrations:

```bash
npm run db:generate
```

2. Push schema to database:

```bash
npm run db:push
```

3. Set up TimescaleDB hypertable (run this SQL in your PostgreSQL database):

```bash
psql -d awos -f sql/setup_timescaledb.sql
```

Or manually run the commands from `sql/setup_timescaledb.sql` in your database client.

## What Changed

### Dependencies

- ✅ Added: `pg`, `drizzle-orm`, `drizzle-kit`, `drizzle-zod`
- ✅ Added: `@auth/drizzle-adapter` (for NextAuth compatibility)
- ❌ Removed: `mongodb`, `mongoose`, `@next-auth/mongodb-adapter`

### Database Layer

- **Old**: `lib/mongodb.ts` with Mongoose
- **New**: `lib/database.ts` with Drizzle ORM
- **New**: `lib/schema.ts` with PostgreSQL schema definition

### API Routes Updated

- `app/api/readings/current/route.ts` - Current sensor readings
- `app/api/ingest/route.ts` - Data ingestion with upsert logic
- `app/api/aggregates/route.ts` - Time-series aggregations
- `app/api/db/health/route.ts` - Database health checks
- `app/api/realtime/route.ts` - Real-time data streaming (polling-based)

### New Features

- **TimescaleDB Hypertables**: Optimized for time-series data
- **Automatic Compression**: Configurable data compression policies
- **Data Retention**: Optional automatic data cleanup
- **Better Indexing**: Optimized indexes for time-series queries
- **Type Safety**: Full TypeScript support with Drizzle

## Performance Improvements

### TimescaleDB Benefits

1. **Hypertables**: Automatic partitioning by time
2. **Compression**: Reduces storage by up to 90%
3. **Continuous Aggregates**: Pre-computed aggregations
4. **Parallel Queries**: Better performance for analytics
5. **SQL Compatibility**: Standard PostgreSQL queries

### Query Performance

- **Time-range queries**: Significantly faster with native time partitioning
- **Aggregations**: Optimized for sensor data analysis
- **Indexes**: Purpose-built for time-series data patterns

## Data Migration (Optional)

If you have existing MongoDB data, you can migrate it:

1. Export data from MongoDB:

```bash
mongoexport --db awos --collection sensorreadings --out sensor_data.json
```

2. Create a migration script to transform and import data:

```typescript
// scripts/migrate-from-mongodb.ts
// (Implementation would depend on your specific data structure)
```

## Real-time Updates

### MongoDB Change Streams → PostgreSQL LISTEN/NOTIFY

The real-time API route now uses polling instead of MongoDB change streams. For production applications, consider implementing PostgreSQL LISTEN/NOTIFY:

```sql
-- Create notification trigger
CREATE OR REPLACE FUNCTION notify_sensor_changes()
RETURNS trigger AS $$
BEGIN
    PERFORM pg_notify('sensor_data_changes', json_build_object(
        'action', TG_OP,
        'id', NEW.id,
        'runway', NEW.runway,
        'timestamp', NEW.timestamp
    )::text);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sensor_data_notify
    AFTER INSERT ON sensor_readings
    FOR EACH ROW
    EXECUTE FUNCTION notify_sensor_changes();
```

## Testing the Migration

1. Start the development server:

```bash
npm run dev
```

2. Test the API endpoints:

```bash
# Health check
curl http://localhost:3000/api/db/health

# Current readings
curl http://localhost:3000/api/readings/current

# Ingest test data
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '[{
    "runway": "test",
    "timestamp": "2024-01-01T12:00:00Z",
    "temperature": 25.5,
    "humidity": 60,
    "windSpeed": 15,
    "windDirection": 180,
    "pressure": 1013.25
  }]'
```

3. Check the Drizzle Studio:

```bash
npm run db:studio
```

## Troubleshooting

### Common Issues

1. **Connection Errors**:

   - Verify DATABASE_URL format
   - Check PostgreSQL service is running
   - Ensure database exists and user has permissions

2. **TimescaleDB Extension Missing**:

   ```sql
   CREATE EXTENSION IF NOT EXISTS timescaledb;
   ```

3. **Type Errors**:

   - Run `npm install` to ensure all dependencies are installed
   - Check TypeScript configuration

4. **Migration Failures**:
   - Verify PostgreSQL version (12+ required)
   - Check database permissions
   - Review migration logs

### Performance Tuning

1. **Adjust chunk intervals** based on your data ingestion rate:

```sql
SELECT set_chunk_time_interval('sensor_readings', INTERVAL '1 hour');
```

2. **Configure compression policies**:

```sql
SELECT add_compression_policy('sensor_readings', INTERVAL '24 hours');
```

3. **Set up continuous aggregates** for frequently accessed data:

```sql
CREATE MATERIALIZED VIEW hourly_averages
WITH (timescaledb.continuous) AS
SELECT time_bucket('1 hour', timestamp) AS hour,
       runway,
       AVG(temperature) AS avg_temp,
       AVG(wind_speed) AS avg_wind
FROM sensor_readings
GROUP BY hour, runway;
```

## Next Steps

1. **Monitor Performance**: Use PostgreSQL's built-in monitoring tools
2. **Set Up Backups**: Configure regular database backups
3. **Scale**: Consider read replicas for high-traffic applications
4. **Optimize**: Fine-tune TimescaleDB settings based on your usage patterns

## Support

For issues related to:

- **Drizzle ORM**: [Drizzle Documentation](https://orm.drizzle.team/)
- **TimescaleDB**: [Timescale Documentation](https://docs.timescale.com/)
- **PostgreSQL**: [PostgreSQL Documentation](https://www.postgresql.org/docs/)
