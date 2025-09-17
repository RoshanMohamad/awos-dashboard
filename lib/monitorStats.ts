// Simple in-memory stats (reset on server restart)
let stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    lastRequest: null as string | null,
    averageResponseTime: 0,
    responseTimes: [] as number[],
    errors: [] as Array<{timestamp: string, error: string}>
}

export function recordStats(success: boolean, responseTime: number, error?: string) {
    stats.totalRequests++
    stats.lastRequest = new Date().toISOString()
    
    if (success) {
        stats.successfulRequests++
    } else {
        stats.failedRequests++
        if (error) {
            stats.errors.push({
                timestamp: new Date().toISOString(),
                error: error.substring(0, 200) // Truncate long errors
            })
            // Keep only last 10 errors
            if (stats.errors.length > 10) {
                stats.errors = stats.errors.slice(-10)
            }
        }
    }
    
    // Track response times
    stats.responseTimes.push(responseTime)
    if (stats.responseTimes.length > 100) {
        stats.responseTimes = stats.responseTimes.slice(-100) // Keep last 100
    }
    
    // Calculate average
    stats.averageResponseTime = Math.round(
        stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length
    )
}

export function getStats() {
    return {
        ...stats,
        successRate: stats.totalRequests > 0 
            ? `${Math.round((stats.successfulRequests / stats.totalRequests) * 100)}%` 
            : '0%',
        recentErrors: stats.errors.slice(-3) // Show last 3 errors
    };
}