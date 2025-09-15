import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, serviceKey);

export async function GET() {
    try {
        // Test basic connection
        const { data: connectionTest, error: connectionError } = await supabase
            .from('sensor_readings')
            .select('*')
            .limit(1);

        if (connectionError) {
            return NextResponse.json({
                status: 'error',
                message: 'Database schema not set up',
                error: connectionError.message,
                instructions: [
                    '1. Go to your Supabase dashboard: https://supabase.com/dashboard',
                    '2. Navigate to your project and select "SQL Editor"',
                    '3. Copy the contents of sql/supabase-setup.sql from your project',
                    '4. Paste and run the SQL script',
                    '5. Refresh this page to test again'
                ]
            }, { status: 500 });
        }

        return NextResponse.json({
            status: 'healthy',
            message: 'Database connection successful',
            tableExists: true,
            recordCount: Array.isArray(connectionTest) ? connectionTest.length : 0
        });

    } catch (error) {
        return NextResponse.json({
            status: 'error',
            message: 'Database connection failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST() {
    return NextResponse.json({
        message: 'Database setup instructions',
        instructions: [
            'This endpoint provides database setup instructions.',
            'Manual setup required through Supabase dashboard.',
            'Run the sql/supabase-setup.sql script in your Supabase SQL Editor.'
        ]
    });
}
