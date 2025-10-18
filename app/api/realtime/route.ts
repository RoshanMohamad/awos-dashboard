import { NextResponse } from 'next/server'
import { LocalSensorReadingModel } from '@/models/localSensorReading'

// Using Server-Sent Events (SSE) with polling for local IndexedDB realtime updates
export async function GET(req: Request) {
    const headers = new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
    })

    const url = new URL(req.url)
    const stationId = url.searchParams.get('stationId') || url.searchParams.get('runway') // Support legacy parameter

    const stream = new ReadableStream({
        async start(controller) {
            let lastTimestamp = new Date()
            let closed = false

            // Send initial connection message
            controller.enqueue(`data: ${JSON.stringify({ type: 'connected', message: 'Real-time connection established' })}\n\n`)

            // Get initial data
            try {
                const initialData = await LocalSensorReadingModel.findMany({
                    stationId: stationId || undefined,
                    orderBy: 'desc',
                    limit: 10
                })

                if (initialData.length > 0) {
                    lastTimestamp = initialData[0].timestamp
                    const payload = JSON.stringify({
                        type: 'initial_data',
                        payload: initialData
                    })
                    controller.enqueue(`data: ${payload}\n\n`)
                }
            } catch (err) {
                console.error('Error fetching initial data:', err)
            }

            const pollForUpdates = async (): Promise<void> => {
                if (closed) return

                try {
                    // Get new readings since last timestamp
                    const newReadings = await LocalSensorReadingModel.findMany({
                        stationId: stationId || undefined,
                        startTime: lastTimestamp,
                        orderBy: 'desc',
                        limit: 10
                    })

                    if (newReadings.length > 0) {
                        // Filter only readings that are actually newer
                        const actuallyNewReadings = newReadings.filter(reading =>
                            reading.timestamp > lastTimestamp
                        )

                        if (actuallyNewReadings.length > 0) {
                            lastTimestamp = actuallyNewReadings[0].timestamp

                            for (const reading of actuallyNewReadings.reverse()) {
                                const payload = JSON.stringify({
                                    type: 'sensor_data',
                                    payload: reading
                                })
                                controller.enqueue(`data: ${payload}\n\n`)
                            }
                        }
                    }

                    // Send heartbeat to keep connection alive
                    controller.enqueue(`data: ${JSON.stringify({
                        type: 'heartbeat',
                        timestamp: new Date().toISOString(),
                        stationId: stationId || 'all'
                    })}\n\n`)

                } catch (error) {
                    console.error('Error polling for updates:', error)
                    if (!closed) {
                        controller.enqueue(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`)
                    }
                }

                // Poll every 5 seconds
                if (!closed) {
                    setTimeout(() => {
                        void pollForUpdates()
                    }, 5000)
                }
            }

            // Start polling
            void pollForUpdates()

                // Store cleanup function
                ; (controller as any)._cleanup = () => {
                    closed = true
                }
        },
        async cancel() {
            try {
                if ((this as any)._cleanup) {
                    (this as any)._cleanup()
                }
            } catch (e) {
                console.error('Error during stream cleanup:', e)
            }
        },
    })

    return new NextResponse(stream, { headers })
}
