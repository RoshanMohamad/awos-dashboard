import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const envVars = {
            supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
            supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
            supabaseServiceRole: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT_SET',
        }

        return NextResponse.json({
            success: true,
            message: 'Environment check endpoint',
            environment: envVars,
            nodeEnv: process.env.NODE_ENV,
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
