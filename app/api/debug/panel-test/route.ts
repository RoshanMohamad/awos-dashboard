import { NextResponse } from 'next/server'

export async function GET() {
    try {
        return NextResponse.json({
            status: "success",
            message: "Debug panel endpoint working",
            timestamp: new Date().toISOString(),
            server: "Next.js API Route"
        })
    } catch (error) {
        return NextResponse.json({
            status: "error",
            message: "Debug panel endpoint failed",
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}