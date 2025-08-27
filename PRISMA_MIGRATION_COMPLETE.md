# AWOS Dashboard - PostgreSQL + TimescaleDB with Prisma ORM

## ✅ Migration Complete!

Your AWOS Dashboard has been successfully migrated from MongoDB to PostgreSQL + TimescaleDB using Prisma ORM.

## 🚀 Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment:**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your DATABASE_URL
   ```

3. **Initialize Prisma:**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Set up TimescaleDB:**

   ```bash
   psql -d awos -f sql/setup_timescaledb.sql
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

## 🔧 Key Changes

- **ORM**: Replaced Mongoose with Prisma ORM
- **Database**: PostgreSQL + TimescaleDB for time-series optimization
- **Type Safety**: Auto-generated TypeScript types
- **API Routes**: Updated to use Prisma queries
- **Real-time**: Polling-based updates (upgradeable to LISTEN/NOTIFY)

## 🎯 Benefits

- **Performance**: TimescaleDB hypertables for time-series data
- **Type Safety**: Full TypeScript support with Prisma
- **Developer Experience**: Prisma Studio, IntelliSense, migrations
- **Scalability**: Built-in compression, retention policies
- **Maintainability**: Single source of truth for schema

## 📚 Documentation

- `MIGRATION_GUIDE.md` - Detailed migration instructions
- `prisma/schema.prisma` - Database schema definition
- `sql/setup_timescaledb.sql` - TimescaleDB configuration
- `.env.example` - Environment variables template

## 🛠️ Useful Commands

```bash
# Generate Prisma client
npx prisma generate

# View database in browser
npx prisma studio

# Apply schema changes
npx prisma db push

# Create migration
npx prisma migrate dev --name description
```

Happy coding! 🎉
