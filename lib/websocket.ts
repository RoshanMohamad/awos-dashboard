export interface SensorData {
  runway: string
  timestamp: string
  windSpeed: number
  windDirection: number
  pressure: number
  temperature: number
  humidity: number
  dewPoint: number
  batteryLevel: number
  cebPower: boolean
  batteryPower: boolean
  sensorStatus: {
    windSensor: boolean
    pressureSensor: boolean
    temperatureSensor: boolean
    humiditySensor: boolean
  }
}

export interface Alert {
  id: string
  type: "warning" | "info" | "error"
  message: string
  timestamp: string
  runway: string
  severity: "low" | "medium" | "high"
}

export class ESP32WebSocketClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000
  private onDataCallback?: (data: SensorData) => void
  private onAlertCallback?: (alert: Alert) => void
  private onConnectionCallback?: (connected: boolean) => void

  constructor(
    private url = "ws://192.168.1.100:81", // Replace with your ESP32 IP
  ) { }

  connect() {
    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log("Connected to ESP32 WebSocket")
        this.reconnectAttempts = 0
        this.onConnectionCallback?.(true)

        // Send initial configuration
        this.send({
          type: "config",
          sampleRate: 1000, // 1 second intervals
          runways: ["02", "04"],
        })
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (err) {
          try {
            console.warn("Error parsing WebSocket message:", String(err))
          } catch {
            console.warn("Error parsing WebSocket message")
          }
        }
      }

      this.ws.onclose = () => {
        console.log("WebSocket connection closed")
        this.onConnectionCallback?.(false)
        this.attemptReconnect()
      }

      this.ws.onerror = (ev) => {
        // Avoid logging raw event objects (Next.js treats them as unhandled errors).
        try {
          const info = ev && typeof ev === "object" && "type" in ev ? `event type=${(ev as Event).type}` : String(ev)
          console.warn("WebSocket encountered an error:", info)
        } catch {
          console.warn("WebSocket encountered an error")
        }

        this.onConnectionCallback?.(false)
        // attempt to reconnect
        this.attemptReconnect()
      }
    } catch (err) {
      try {
        console.warn("Failed to connect to WebSocket:", String(err))
      } catch {
        console.warn("Failed to connect to WebSocket")
      }
      this.attemptReconnect()
    }
  }

  private handleMessage(data: any) {
    switch (data.type) {
      case "sensor_data":
        this.onDataCallback?.(data.payload as SensorData)
        break
      case "alert":
        this.onAlertCallback?.(data.payload as Alert)
        break
      case "heartbeat":
        // ESP32 heartbeat - respond with pong
        this.send({ type: "pong" })
        break
      default:
        console.log("Unknown message type:", data.type)
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

      setTimeout(() => {
        this.connect()
      }, this.reconnectDelay * this.reconnectAttempts)
    } else {
      console.warn("Max reconnection attempts reached")
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  onData(callback: (data: SensorData) => void) {
    this.onDataCallback = callback
  }

  onAlert(callback: (alert: Alert) => void) {
    this.onAlertCallback = callback
  }

  onConnection(callback: (connected: boolean) => void) {
    this.onConnectionCallback = callback
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export class ESP32ApiClient {
  constructor(
    private baseUrl = "http://192.168.1.100", // Replace with your ESP32 IP
  ) { }

  async getCurrentData(runway: string): Promise<SensorData | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/current/${runway}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching current data:", error)
      return null
    }
  }

  async getHistoricalData(runway: string, days = 30): Promise<SensorData[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/history/${runway}?days=${days}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching historical data:", error)
      return []
    }
  }

  async getAlerts(runway: string): Promise<Alert[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/alerts/${runway}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching alerts:", error)
      return []
    }
  }

  async calibrateSensor(runway: string, sensorType: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/calibrate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runway,
          sensorType,
          timestamp: new Date().toISOString(),
        }),
      })

      return response.ok
    } catch (error) {
      console.error("Error calibrating sensor:", error)
      return false
    }
  }

  async exportData(runway: string, startDate: string, endDate: string): Promise<Blob | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/export/${runway}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          format: "csv",
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.blob()
    } catch (error) {
      console.error("Error exporting data:", error)
      return null
    }
  }

  async getSystemStatus(): Promise<{
    esp32Connected: boolean
    lastHeartbeat: string
    uptime: number
    freeMemory: number
    wifiSignal: number
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching system status:", error)
      return null
    }
  }
}

// --- Simulator (semulation) ---
export interface SimulatorOptions {
  sampleRate?: number // ms
  runways?: string[]
  alertChance?: number // 0..1 chance per sample to emit an alert
}

export class ESP32WebSocketSimulator {
  private sampleRate: number
  private runways: string[]
  private alertChance: number
  private intervalId: ReturnType<typeof setInterval> | null = null
  private alertIntervalId: ReturnType<typeof setInterval> | null = null
  private connected = false
  private onDataCallback?: (data: SensorData) => void
  private onAlertCallback?: (alert: Alert) => void
  private onConnectionCallback?: (connected: boolean) => void

  constructor(opts: SimulatorOptions = {}) {
    this.sampleRate = opts.sampleRate ?? 1000
    this.runways = opts.runways ?? ["02", "04"]
    this.alertChance = opts.alertChance ?? 0.01
  }

  connect() {
    if (this.connected) return
    this.connected = true
    this.onConnectionCallback?.(true)

    // emit sensor data at sampleRate for a randomly chosen runway each tick
    this.intervalId = setInterval(() => {
      const runway = this.runways[Math.floor(Math.random() * this.runways.length)]
      const now = new Date().toISOString()
      const baseTemp = 28
      const data: SensorData = {
        runway,
        timestamp: now,
        windSpeed: parseFloat((Math.random() * 20).toFixed(1)),
        windDirection: Math.floor(Math.random() * 360),
        pressure: parseFloat((1008 + Math.random() * 8).toFixed(1)),
        temperature: parseFloat((baseTemp + Math.random() * 6 - 2).toFixed(1)),
        humidity: parseFloat((50 + Math.random() * 50).toFixed(1)),
        dewPoint: parseFloat((18 + Math.random() * 6).toFixed(1)),
        batteryLevel: parseFloat((50 + Math.random() * 50).toFixed(1)),
        cebPower: Math.random() > 0.02,
        batteryPower: Math.random() > 0.1,
        sensorStatus: {
          windSensor: Math.random() > 0.01,
          pressureSensor: Math.random() > 0.01,
          temperatureSensor: Math.random() > 0.01,
          humiditySensor: Math.random() > 0.01,
        },
      }

      this.onDataCallback?.(data)

      // occasionally emit alerts based on alertChance
      if (Math.random() < this.alertChance) {
        const alert: Alert = {
          id: Math.random().toString(36).slice(2, 9),
          type: Math.random() > 0.5 ? "warning" : "info",
          message: "Simulated alert: parameter threshold exceeded",
          timestamp: now,
          runway,
          severity: Math.random() > 0.8 ? "high" : Math.random() > 0.5 ? "medium" : "low",
        }
        this.onAlertCallback?.(alert)
      }
    }, this.sampleRate)

    // emit a periodic heartbeat/alert summary every 30s
    this.alertIntervalId = setInterval(() => {
      const summary: Alert = {
        id: Math.random().toString(36).slice(2, 9),
        type: "info",
        message: "Simulated system heartbeat",
        timestamp: new Date().toISOString(),
        runway: this.runways[Math.floor(Math.random() * this.runways.length)],
        severity: "low",
      }
      this.onAlertCallback?.(summary)
    }, 30000)
  }

  send(data: any) {
    // Simulator accepts config messages to change behavior
    if (!data) return
    if (data.type === "config") {
      if (typeof data.sampleRate === "number") {
        this.sampleRate = data.sampleRate
        if (this.intervalId) {
          clearInterval(this.intervalId)
          this.intervalId = null
          // restart with new sample rate
          this.connect()
        }
      }
      if (Array.isArray(data.runways)) {
        this.runways = data.runways
      }
    }
    // respond to heartbeat pings
    if (data.type === "ping") {
      this.onAlertCallback?.({
        id: Math.random().toString(36).slice(2, 9),
        type: "info",
        message: "pong",
        timestamp: new Date().toISOString(),
        runway: this.runways[0],
        severity: "low",
      })
    }
  }

  onData(callback: (data: SensorData) => void) {
    this.onDataCallback = callback
  }

  onAlert(callback: (alert: Alert) => void) {
    this.onAlertCallback = callback
  }

  onConnection(callback: (connected: boolean) => void) {
    this.onConnectionCallback = callback
  }

  disconnect() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.alertIntervalId) {
      clearInterval(this.alertIntervalId)
      this.alertIntervalId = null
    }
    this.connected = false
    this.onConnectionCallback?.(false)
  }

  isConnected(): boolean {
    return this.connected
  }
}

export function createESP32Simulator(opts?: SimulatorOptions) {
  return new ESP32WebSocketSimulator(opts)
}
