"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ESP32ApiClient } from "@/lib/esp32ApiClient"
import { Wifi, WifiOff, Server, Battery, Signal } from "lucide-react"

export function ConnectionStatus() {
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const loadSystemStatus = async () => {
    setLoading(true)
    try {
      const apiClient = new ESP32ApiClient()
      const status = await apiClient.getSystemStatus()
      setSystemStatus(status)
    } catch (error) {
      console.error("Error loading system status:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSystemStatus()
    const interval = setInterval(loadSystemStatus, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [])

  if (!systemStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>ESP32 System Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-gray-500">Loading system status...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Server className="h-5 w-5" />
          <span>ESP32 System Status</span>
        </CardTitle>
        <Button variant="outline" size="sm" onClick={loadSystemStatus} disabled={loading}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            {systemStatus.esp32Connected ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className="text-sm">ESP32 Connection</span>
            <Badge variant={systemStatus.esp32Connected ? "default" : "destructive"}>
              {systemStatus.esp32Connected ? "ONLINE" : "OFFLINE"}
            </Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Signal className="h-4 w-4 text-blue-600" />
            <span className="text-sm">WiFi Signal</span>
            <Badge variant="secondary">{systemStatus.wifiSignal} dBm</Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Battery className="h-4 w-4 text-green-600" />
            <span className="text-sm">Free Memory</span>
            <Badge variant="secondary">{Math.round(systemStatus.freeMemory / 1024)} KB</Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Server className="h-4 w-4 text-purple-600" />
            <span className="text-sm">Uptime</span>
            <Badge variant="secondary">{Math.round(systemStatus.uptime / 3600)} hrs</Badge>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Last heartbeat: {new Date(systemStatus.lastHeartbeat).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  )
}
