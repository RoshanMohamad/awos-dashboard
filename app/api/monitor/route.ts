import { NextRequest, NextResponse } from 'next/server'
import { getStats } from '@/lib/monitorStats'

export async function GET() {
    const uptime = process.uptime()
    const memory = process.memoryUsage()
    const esp32Stats = getStats()
    
    return NextResponse.json({
        status: 'running',
        uptime: `${Math.round(uptime)}s`,
        memory: {
            used: `${Math.round(memory.heapUsed / 1024 / 1024)}MB`,
            total: `${Math.round(memory.heapTotal / 1024 / 1024)}MB`
        },
        esp32Stats,
        timestamp: new Date().toISOString()
    })
}