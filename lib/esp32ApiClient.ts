"use client"

import type { SensorData, Alert } from "./websocket"

export class ESP32ApiClient {
  private esp32BaseUrl: string
  private serverBaseUrl: string

  constructor(
    esp32Url = "http://192.168.4.177", // ESP32 IP Address
    serverUrl = typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000" // Next.js server
  ) {
    this.esp32BaseUrl = esp32Url
    this.serverBaseUrl = serverUrl
  }

  async getCurrentData(runway: string): Promise<SensorData | null> {
    try {
      const response = await fetch(`${this.serverBaseUrl}/api/current/${runway}`)
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error("Error fetching current data:", error)
      return null
    }
  }

  async getHistoricalData(runway: string, days = 30): Promise<SensorData[]> {
    try {
      const response = await fetch(`${this.serverBaseUrl}/api/history/${runway}?days=${days}`)
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error("Error fetching historical data:", error)
      return []
    }
  }

  async getAlerts(runway: string): Promise<Alert[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/alerts/${runway}`)
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)
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

  async exportData(runway: string, startDate: string, endDate: string, format: string = "csv"): Promise<Blob | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/export/${runway}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          format,
        }),
      })
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)
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
      const response = await fetch(`${this.baseUrl}/api/status`)
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error("Error fetching system status:", error)
      return null
    }
  }
}
