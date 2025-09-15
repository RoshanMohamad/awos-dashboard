"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ESP32WebSocketClient, ESP32ApiClient, type SensorData, type Alert } from "@/lib/websocket"
import { createRealtimeEventSource } from "@/lib/realtimeClient"

// Direct ESP32 data fetching function
async function fetchDirectESP32Data(): Promise<SensorData | null> {
  try {
    const response = await fetch('/api/esp32', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) return null;

    const result = await response.json();
    if (!result.success) return null;

    const esp32Data = result.data;
    
    // Convert ESP32 format to our SensorData format
    const sensorData: SensorData & { isDataFresh: boolean; connectionStatus: string } = {
      temperature: esp32Data.temperature,
      humidity: esp32Data.humidity,
      pressure: esp32Data.pressure,
      dewPoint: esp32Data.dewPoint,
      windSpeed: esp32Data.windSpeed,
      windDirection: esp32Data.windDirection,
      batteryLevel: 85, // Default values for ESP32
      cebPower: true,
      batteryPower: true,
      runway: 'ESP32',
      timestamp: esp32Data.timestamp,
      sensorStatus: {
        windSensor: true,
        pressureSensor: true,
        temperatureSensor: true,
        humiditySensor: true,
      },
      isDataFresh: esp32Data.isDataFresh,
      connectionStatus: esp32Data.connectionStatus,
    };
    return sensorData;
  } catch (error) {
    console.error('Failed to fetch ESP32 data:', error);
    return null;
  }
}

export function useESP32Data(runway: string) {
  const [sensorData, setSensorData] = useState<SensorData | null>(null)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [connectionSource, setConnectionSource] = useState<'sse' | 'ws' | 'poll' | 'esp32-direct' | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const wsClient = useRef<ESP32WebSocketClient | null>(null)
  const apiClient = useRef<ESP32ApiClient | null>(null)
  const fallbackInterval = useRef<NodeJS.Timeout | null>(null)

  // Initialize clients - DISABLED for cloud deployment
  useEffect(() => {
    // wsClient.current = new ESP32WebSocketClient()
    // apiClient.current = new ESP32ApiClient()

    return () => {
      // wsClient.current?.disconnect()
      if (fallbackInterval.current) {
        clearInterval(fallbackInterval.current)
      }
    }
  }, [])

  // Prefer server-sent events (SSE) from our backend realtime endpoint. If SSE active, it will drive sensor updates.
  useEffect(() => {
    let closeSSE: (() => void) | null = null
    try {
      if (typeof window !== 'undefined' && 'EventSource' in window) {
        closeSSE = createRealtimeEventSource('/api/realtime', {
          onOpen: () => {
            setIsConnected(true)
            setConnectionError(null)
            setConnectionSource('sse')
          },
          onMessage: (data) => {
            if (data?.type === 'sensor_data' && data.payload) {
              const payload = data.payload as SensorData
              if (payload.runway === runway) {
                setSensorData(payload)
                setLastUpdate(new Date())
              }
            }
            if (data?.type === 'alert' && data.payload) {
              const a = data.payload as Alert
              if (a.runway === runway) {
                setAlerts((prev) => [a, ...prev].slice(0, 10))
              }
            }
          },
          onError: (err) => {
            console.warn('SSE error', err)
            setConnectionError('Realtime stream error (SSE)')
            setIsConnected(false)
            // fallback to WebSocket / polling will be handled by existing logic
          }
        })
      }
    } catch (e) { }

    return () => {
      try {
        closeSSE?.()
      } catch { }
    }
  }, [runway])

  // On mount or runway change, fetch latest reading from DB or ESP32 directly
  useEffect(() => {
    let mounted = true
      ; (async () => {
        try {
          // Try ESP32 direct data first
          const esp32Data = await fetchDirectESP32Data();
          if (mounted && esp32Data) {
            const extendedData = esp32Data as SensorData & { isDataFresh: boolean; connectionStatus: string };
            setSensorData(esp32Data);
            setLastUpdate(new Date(esp32Data.timestamp));
            setIsConnected(extendedData.connectionStatus === 'connected');
            setConnectionSource('esp32-direct');
            setConnectionError(extendedData.connectionStatus !== 'connected' 
              ? 'ESP32 data is stale' : null);
            return;
          }

          // Fallback to database readings
          const res = await fetch(`/api/readings/current?runway=${encodeURIComponent(runway)}`)
          if (!mounted) return
          if (!res.ok) return
          const body = await res.json()
          if (body?.ok && body.reading) {
            setSensorData(body.reading as SensorData)
            setLastUpdate(new Date(body.reading.timestamp))
          }
        } catch (e) {
          // ignore
        }
      })()

    return () => {
      mounted = false
    }
  }, [runway])

  // Fallback API polling when WebSocket is unavailable
  const startFallbackPolling = useCallback(() => {
    if (fallbackInterval.current) return

    fallbackInterval.current = setInterval(async () => {
      if (!apiClient.current) return

      try {
        const data = await apiClient.current.getCurrentData(runway)
        if (data) {
          setSensorData(data)
          setLastUpdate(new Date())
          setConnectionError("Using API fallback (WebSocket unavailable)")
        }

        const alertsData = await apiClient.current.getAlerts(runway)
        if (alertsData.length > 0) {
          setAlerts((prev) => {
            const newAlerts = alertsData.filter((alert) => !prev.some((existing) => existing.id === alert.id))
            return [...newAlerts, ...prev].slice(0, 10)
          })
        }
      } catch (err) {
        try {
          console.warn("API polling error:", String(err))
        } catch {
          console.warn("API polling error")
        }
        setConnectionError("Failed to connect to ESP32 (WebSocket and API unavailable)")
      }
    }, 5000) // Poll every 5 seconds
  }, [runway])

  // WebSocket event handlers
  const handleSensorData = useCallback(
    (data: SensorData) => {
      if (data.runway === runway) {
        setSensorData(data)
        setLastUpdate(new Date())
        setConnectionError(null)
      }
    },
    [runway],
  )

  const handleAlert = useCallback(
    (alert: Alert) => {
      if (alert.runway === runway) {
        setAlerts((prev) => [alert, ...prev.slice(0, 9)]) // Keep last 10 alerts
      }
    },
    [runway],
  )

  const handleConnection = useCallback((connected: boolean) => {
    setIsConnected(connected)

    if (connected) {
      setConnectionError(null)
      setConnectionSource('ws')
      // Clear fallback polling when WebSocket connects
      if (fallbackInterval.current) {
        clearInterval(fallbackInterval.current)
        fallbackInterval.current = null
      }
    } else {
      setConnectionError("WebSocket disconnected, falling back to API polling")
      setConnectionSource('poll')
      // Start fallback API polling
      startFallbackPolling()
    }
  }, [startFallbackPolling])

  // Setup WebSocket connection - DISABLED for cloud deployment
  useEffect(() => {
    // if (!wsClient.current) return

    // wsClient.current.onData(handleSensorData)
    // wsClient.current.onAlert(handleAlert)
    // wsClient.current.onConnection(handleConnection)

    // // Attempt WebSocket connection
    // wsClient.current.connect()

    // return () => {
    //   wsClient.current?.disconnect()
    // }
  }, [handleSensorData, handleAlert, handleConnection])

  // Manual data refresh
  const refreshData = useCallback(async () => {
    if (!apiClient.current) return

    try {
      const data = await apiClient.current.getCurrentData(runway)
      if (data) {
        setSensorData(data)
        setLastUpdate(new Date())
      }
    } catch (err) {
      try {
        console.warn("Manual refresh error:", String(err))
      } catch {
        console.warn("Manual refresh error")
      }
    }
  }, [runway])

  // Calibrate sensor
  const calibrateSensor = useCallback(
    async (sensorType: string) => {
      if (!apiClient.current) return false

      try {
        const success = await apiClient.current.calibrateSensor(runway, sensorType)
        if (success) {
          // Refresh data after calibration
          await refreshData()
        }
        return success
      } catch (err) {
        try {
          console.warn("Calibration error:", String(err))
        } catch {
          console.warn("Calibration error")
        }
        return false
      }
    },
    [runway, refreshData],
  )

  return {
    sensorData,
    alerts,
    isConnected,
    connectionError,
    connectionSource,
    lastUpdate,
    refreshData,
    calibrateSensor,
  }
}
