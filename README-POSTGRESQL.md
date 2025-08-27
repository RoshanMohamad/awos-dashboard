# PostgreSQL Setup Guide

## 1. Install PostgreSQL

### Windows

- Download PostgreSQL from: https://www.postgresql.org/download/windows/
- Follow the installer and remember your password for the `postgres` user
- Default port: 5432

### macOS

```bash
brew install postgresql
brew services start postgresql
```

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## 2. Create Database

```sql
-- Connect to PostgreSQL as postgres user
psql -U postgres

-- Create database
CREATE DATABASE awos_dashboard;

-- Create a user (optional)
CREATE USER awos_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE awos_dashboard TO awos_user;
```

## 3. Update Environment Variables

Update your `.env.local` file:

```bash
# Replace with your actual database credentials
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/awos_dashboard?schema=public"

# Or if you created a separate user:
DATABASE_URL="postgresql://awos_user:your_password@localhost:5432/awos_dashboard?schema=public"
```

## 4. Run Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Create and run migration
npx prisma migrate dev --name init

# Optional: View your database
npx prisma studio
```

## 5. Key Differences from MongoDB

### Data Types

- `String` → `VARCHAR` or `TEXT`
- `Number` → `FLOAT`, `INT`, or `DECIMAL`
- `Date` → `TIMESTAMP`
- `Boolean` → `BOOLEAN`
- `Object/Mixed` → `JSONB`

### Queries

- Prisma provides type-safe queries
- No need for `.lean()` - Prisma returns plain objects
- Relationships are handled through foreign keys
- Indexing is defined in schema.prisma

### Performance

- Better for relational data and complex queries
- ACID compliance
- Better concurrent write performance
- Built-in full-text search

## 6. Migration from MongoDB

If you have existing MongoDB data, you can:

1. Export data from MongoDB:

```bash
mongoexport --db awos --collection sensorreadings --out sensor_readings.json
```

2. Transform and import to PostgreSQL:

```javascript
// Use a script to transform MongoDB documents to PostgreSQL format
// Handle ObjectId → UUID conversion
// Transform nested objects to JSON fields
```

## 7. Troubleshooting

### Connection Issues

- Check if PostgreSQL is running: `brew services list` (macOS) or `systemctl status postgresql` (Linux)
- Verify port 5432 is not blocked
- Check `pg_hba.conf` for authentication settings

### Migration Errors

- Ensure database exists before running migrations
- Check DATABASE_URL format
- Verify user permissions

### Prisma Issues

- Run `npx prisma generate` after schema changes
- Use `npx prisma db push` for development (skips migrations)
- Use `npx prisma migrate deploy` for production
