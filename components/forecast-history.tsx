"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WindForecastChart } from "@/components/wind-forecast-chart"
import { Download, AlertTriangle, TrendingUp, Calendar } from "lucide-react"
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

// Add the ESP32 data hook import
import { useESP32Data } from "@/hooks/use-esp32-data"
import { ESP32ApiClient } from "@/lib/esp32ApiClient"

interface ForecastHistoryProps {
  runway: string
}

export function ForecastHistory({ runway }: ForecastHistoryProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { alerts } = useESP32Data(runway)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Load historical data
  useEffect(() => {
    const loadHistoricalData = async () => {
      setLoading(true)
      try {
        const apiClient = new ESP32ApiClient()
        const data = await apiClient.getHistoricalData(runway, 30)

        // Transform ESP32 data format to chart format
        const chartData = data.map((item) => ({
          date: new Date(item.timestamp).toISOString().split("T")[0],
          pressure: item.pressure,
          temperature: item.temperature,
          humidity: item.humidity,
          windSpeed: item.windSpeed,
          windDirection: item.windDirection,
        }))

        setHistoricalData(chartData)
      } catch (error) {
        console.error("Error loading historical data:", error)
        // Mock data for demonstration
        const mockData = Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          pressure: 1013 + Math.sin(i * 0.1) * 5 + Math.random() * 2,
          temperature: 28 + Math.sin(i * 0.2) * 3 + Math.random() * 2,
          humidity: 75 + Math.sin(i * 0.15) * 10 + Math.random() * 5,
          windSpeed: 12 + Math.sin(i * 0.3) * 4 + Math.random() * 3,
          windDirection: 180 + Math.sin(i * 0.1) * 60 + Math.random() * 20,
        }))
        setHistoricalData(mockData)
      } finally {
        setLoading(false)
      }
    }

    loadHistoricalData()
  }, [runway])

  const handleExportCSV = async () => {
    try {
      const apiClient = new ESP32ApiClient()
      const endDate = new Date().toISOString()
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const blob = await apiClient.exportData(runway, startDate, endDate)
      if (blob) {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `awos_data_runway_${runway}_${new Date().toISOString().split("T")[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Export error:", error)
    }
  }

  // Use real alerts from ESP32
  const forecastAlerts = alerts.filter((alert) => alert.type === "warning").slice(0, 5)

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Main Content - Fixed Height Layout with Flexbox */}
      <div className="flex-1 p-4 bg-gray-50">
        <div className="flex-1 space-y-4">
          {/* Top Row - 42% of available height */}
          <div className="grid grid-cols-12 gap-4 min-h-[300px]">
            {/* Short-Term Wind Forecast */}
            <div className="col-span-7">
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span>Short-Term Wind Forecast</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[calc(100%-70px)]">
                  <WindForecastChart />
                </CardContent>
              </Card>
            </div>

            {/* Right Side Panels */}
            <div className="col-span-5 grid grid-rows-2 gap-4">
              {/* History Access */}
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span>History Access</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col justify-center h-[calc(100%-50px)] space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">30</div>
                      <div className="text-xs text-gray-600">Days Available</div>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">24/7</div>
                      <div className="text-xs text-gray-600">Monitoring</div>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleExportCSV} className="w-full bg-transparent text-sm py-2">
                    <Download className="h-4 w-4 mr-2" />
                    CSV Export
                  </Button>
                </CardContent>
              </Card>

              {/* Forecast Alerts */}
              <Card className="h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span>Forecast Alerts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 h-[calc(100%-50px)] overflow-y-auto">
                  <div className="p-2 bg-amber-50 border-l-4 border-amber-400 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                      <span className="font-semibold text-amber-800 text-xs">Wind gust warning</span>
                    </div>
                    <p className="text-xs text-amber-700">Expected: 22 m/s at 16:30 UTC</p>
                  </div>
                  <div className="p-2 bg-orange-50 border-l-4 border-orange-400 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <AlertTriangle className="h-3 w-3 text-orange-600" />
                      <span className="font-semibold text-orange-800 text-xs">Wind shift alerts</span>
                    </div>
                    <p className="text-xs text-orange-700">Direction change to 180° expected</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom Row - 54% of available height for Historical Trends */}
          <div className="flex-1">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <span>30-Day Historical Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-50px)] p-3">
                <div className="grid grid-cols-5 gap-3 h-full">
                  {/* Pressure */}
                  <div className="bg-white border-2 border-blue-200 rounded-lg p-2 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-blue-700">Pressure</h4>
                      <div className="text-xs text-blue-600 bg-blue-50 px-1 py-0.5 rounded">hPa</div>
                    </div>
                    <div className="h-[calc(100%-70px)]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalData.slice(-30)}>
                          <Line type="monotone" dataKey="pressure" stroke="#3b82f6" strokeWidth={2} dot={false} />
                          <YAxis hide />
                          <XAxis hide />
                          <Tooltip
                            formatter={(value: number) => [`${value.toFixed(1)} hPa`, "Pressure"]}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-1">
                      <span className="text-xs font-medium text-blue-600">
                        Avg:{" "}
                        {historicalData.length > 0
                          ? (
                              historicalData.reduce((sum, item) => sum + item.pressure, 0) / historicalData.length
                            ).toFixed(1)
                          : "0"}{" "}
                        hPa
                      </span>
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="bg-white border-2 border-orange-200 rounded-lg p-2 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-orange-700">Temperature</h4>
                      <div className="text-xs text-orange-600 bg-orange-50 px-1 py-0.5 rounded">°C</div>
                    </div>
                    <div className="h-[calc(100%-70px)]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalData.slice(-30)}>
                          <Line type="monotone" dataKey="temperature" stroke="#f59e0b" strokeWidth={2} dot={false} />
                          <YAxis hide />
                          <XAxis hide />
                          <Tooltip
                            formatter={(value: number) => [`${value.toFixed(1)}°C`, "Temperature"]}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-1">
                      <span className="text-xs font-medium text-orange-600">
                        Avg:{" "}
                        {historicalData.length > 0
                          ? (
                              historicalData.reduce((sum, item) => sum + item.temperature, 0) / historicalData.length
                            ).toFixed(1)
                          : "0"}
                        °C
                      </span>
                    </div>
                  </div>

                  {/* Humidity */}
                  <div className="bg-white border-2 border-green-200 rounded-lg p-2 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-green-700">Humidity</h4>
                      <div className="text-xs text-green-600 bg-green-50 px-1 py-0.5 rounded">%</div>
                    </div>
                    <div className="h-[calc(100%-70px)]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalData.slice(-30)}>
                          <Line type="monotone" dataKey="humidity" stroke="#10b981" strokeWidth={2} dot={false} />
                          <YAxis hide />
                          <XAxis hide />
                          <Tooltip
                            formatter={(value: number) => [`${value.toFixed(1)}%`, "Humidity"]}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-1">
                      <span className="text-xs font-medium text-green-600">
                        Avg:{" "}
                        {historicalData.length > 0
                          ? (
                              historicalData.reduce((sum, item) => sum + item.humidity, 0) / historicalData.length
                            ).toFixed(1)
                          : "0"}
                        %
                      </span>
                    </div>
                  </div>

                  {/* Wind Speed */}
                  <div className="bg-white border-2 border-purple-200 rounded-lg p-2 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-purple-700">Wind Speed</h4>
                      <div className="text-xs text-purple-600 bg-purple-50 px-1 py-0.5 rounded">m/s</div>
                    </div>
                    <div className="h-[calc(100%-70px)]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalData.slice(-30)}>
                          <Line type="monotone" dataKey="windSpeed" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                          <YAxis hide />
                          <XAxis hide />
                          <Tooltip
                            formatter={(value: number) => [`${value.toFixed(1)} m/s`, "Wind Speed"]}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-1">
                      <span className="text-xs font-medium text-purple-600">
                        Avg:{" "}
                        {historicalData.length > 0
                          ? (
                              historicalData.reduce((sum, item) => sum + item.windSpeed, 0) / historicalData.length
                            ).toFixed(1)
                          : "0"}{" "}
                        m/s
                      </span>
                    </div>
                  </div>

                  {/* Wind Direction */}
                  <div className="bg-white border-2 border-red-200 rounded-lg p-2 hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-red-700">Wind Direction</h4>
                      <div className="text-xs text-red-600 bg-red-50 px-1 py-0.5 rounded">°</div>
                    </div>
                    <div className="h-[calc(100%-70px)]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historicalData.slice(-30)}>
                          <Line type="monotone" dataKey="windDirection" stroke="#ef4444" strokeWidth={2} dot={false} />
                          <YAxis hide />
                          <XAxis hide />
                          <Tooltip
                            formatter={(value: number) => [`${value.toFixed(0)}°`, "Wind Direction"]}
                            labelFormatter={(label) => `Date: ${label}`}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-1">
                      <span className="text-xs font-medium text-red-600">
                        Avg:{" "}
                        {historicalData.length > 0
                          ? (
                              historicalData.reduce((sum, item) => sum + item.windDirection, 0) / historicalData.length
                            ).toFixed(0)
                          : "0"}
                        °
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}                                                                 