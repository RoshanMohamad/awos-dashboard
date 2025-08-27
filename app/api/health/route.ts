import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Basic health check - you can add more checks here
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: {
                used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
                total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100
            },
            environment: process.env.NODE_ENV || 'development'
        };

        // Optional: Add database connectivity check
        // You can uncomment and modify this if you want to test DB connection
        /*
        try {
          // Example: Test Supabase connection
          const { createAdminClient } = await import('@/lib/supabase');
          const supabase = createAdminClient();
          const { error } = await supabase.from('sensor_readings').select('count').limit(1);
          healthData.database = error ? 'unhealthy' : 'healthy';
        } catch (dbError) {
          healthData.database = 'unhealthy';
          healthData.databaseError = dbError.message;
        }
        */

        return NextResponse.json(healthData, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
