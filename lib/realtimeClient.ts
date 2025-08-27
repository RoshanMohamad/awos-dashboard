type MessageHandler = (data: any) => void
type OpenHandler = () => void
type ErrorHandler = (err: any) => void

export function createRealtimeEventSource(
    url = '/api/realtime',
    handlers: { onMessage?: MessageHandler; onOpen?: OpenHandler; onError?: ErrorHandler } = {}
) {
    const { onMessage, onOpen, onError } = handlers

    const es = new EventSource(url)

    es.onopen = () => {
        try {
            onOpen?.()
        } catch { }
    }

    es.onmessage = (ev) => {
        try {
            const data = JSON.parse(ev.data)
            onMessage?.(data)
        } catch (err) {
            try {
                console.warn('Failed to parse SSE message', err)
            } catch { }
        }
    }

    es.onerror = (err) => {
        try {
            onError?.(err)
        } catch { }
        // Note: EventSource will automatically try to reconnect.
    }

    return () => {
        try {
            es.close()
        } catch { }
    }
}
