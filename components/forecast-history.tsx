"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Wind, Droplets, Thermometer, Battery, Gauge, Activity, TrendingUp } from "lucide-react"
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { ESP32ApiClient } from "@/lib/esp32ApiClient"
import { ExportUtils, type ExportData, type ReportMetadata } from "@/lib/exportUtils"
import { cn } from "@/lib/utils"

interface ForecastHistoryProps {
  runway: string
}

export function ForecastHistory({ runway }: ForecastHistoryProps) {
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [exportFormat, setExportFormat] = useState<string>("csv")
  const [timeRange, setTimeRange] = useState("30")
  const [selectedParam, setSelectedParam] = useState<string>("windSpeed")

  // Load historical data
  useEffect(() => {
    const loadHistoricalData = async () => {
      setLoading(true)
      try {
        const apiClient = new ESP32ApiClient()
        const data = await apiClient.getHistoricalData(runway, parseFloat(timeRange))

        const chartData = data.map((item) => {
          const timestamp = new Date(item.timestamp)
          // For hourly data, show time; for daily, show date
          const isHourly = parseFloat(timeRange) < 2
          const displayLabel = isHourly 
            ? timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            : timestamp.toISOString().split("T")[0]
          
          return {
            originalTimestamp: item.timestamp,
            date: displayLabel,
            fullDate: timestamp.toUTCString(),
            pressure: item.pressure,
            temperature: item.temperature,
            humidity: item.humidity,
            windSpeed: item.windSpeed,
            windDirection: item.windDirection,
            dewPoint: item.dewPoint || (item.temperature - ((100 - item.humidity) / 5)),
            batteryLevel: item.batteryLevel || 100
          }
        })

        // Sort by date
        chartData.sort((a, b) => new Date(a.originalTimestamp).getTime() - new Date(b.originalTimestamp).getTime())
        
        // If no data from API, use mock data
        if (chartData.length === 0) {
          console.warn('No data available from API, using mock data')
          throw new Error('No data available')
        }
        
        setHistoricalData(chartData)
      } catch (error) {
        console.log("Using mock data:", error.message)
        // Mock data - adjusted for hourly/daily ranges
        const days = parseFloat(timeRange)
        const isHourly = days < 2
        const points = isHourly ? Math.floor(days * 24) : Math.floor(days) // hourly points or daily points
        
        const mockData = Array.from({ length: points }, (_, i) => {
            const millisecondsPerPoint = isHourly 
              ? 60 * 60 * 1000 // 1 hour
              : 24 * 60 * 60 * 1000 // 1 day
            const dateObj = new Date(Date.now() - (points - 1 - i) * millisecondsPerPoint)
            const isoString = dateObj.toISOString()
            const displayLabel = isHourly
              ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : isoString.split("T")[0]
            
            return {
                originalTimestamp: isoString,
                date: displayLabel,
                fullDate: dateObj.toUTCString(),
                pressure: 1013 + Math.sin(i * 0.1) * 5 + Math.random() * 2,
                temperature: 28 + Math.sin(i * 0.2) * 3 + Math.random() * 2,
                humidity: 75 + Math.sin(i * 0.15) * 10 + Math.random() * 5,
                windSpeed: 12 + Math.sin(i * 0.3) * 4 + Math.random() * 3,
                windDirection: 180 + Math.sin(i * 0.1) * 60 + Math.random() * 20,
                dewPoint: 24 + Math.sin(i * 0.2) * 2 + Math.random(),
                batteryLevel: Math.max(0, 100 - (i * 0.2) - (Math.random() * 5))
            }
        })
        setHistoricalData(mockData)
      } finally {
        setLoading(false)
      }
    }

    loadHistoricalData()
  }, [runway, timeRange])

  const handleExportData = async () => {
      // Export logic remains the same
      try {
        const days = parseInt(timeRange)
        const endDate = new Date().toISOString()
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  
        const apiClient = new ESP32ApiClient()
        const blob = await apiClient.exportData(runway, startDate, endDate, exportFormat)
        
        if (blob) {
          const fileExtension = ExportUtils.getFileExtension(exportFormat)
          const filename = `awos_data_runway_${runway}_${new Date().toISOString().split("T")[0]}${fileExtension}`
          ExportUtils.downloadFile(blob, filename)
        } else {
          // Fallback
          const exportData: ExportData[] = historicalData.map(item => ({
            timestamp: new Date(item.originalTimestamp).toISOString(),
            temperature: item.temperature,
            humidity: item.humidity,
            pressure: item.pressure,
            windSpeed: item.windSpeed,
            windDirection: item.windDirection,
          }))
          const metadata: ReportMetadata = {
            type: "Historical Data Export",
            runway: runway,
            dateFrom: startDate,
            dateTo: endDate,
            generated: new Date().toISOString(),
          }
          const generatedBlob = ExportUtils.generateExport(exportData, metadata, exportFormat)
          const fileExtension = ExportUtils.getFileExtension(exportFormat)
          const filename = `awos_data_runway_${runway}_${new Date().toISOString().split("T")[0]}${fileExtension}`
          ExportUtils.downloadFile(generatedBlob, filename)
        }
      } catch (error) { console.error("Export error:", error) }
  }

  // Define parameters configuration
  const parameters = [
    { id: "windSpeed", label: "Wind Speed", icon: Wind, color: "text-purple-600", stroke: "#8b5cf6", unit: "m/s" },
    { id: "windDirection", label: "Wind Direction", icon: Wind, color: "text-red-600", stroke: "#ef4444", unit: "°" },
    { id: "temperature", label: "Temperature", icon: Thermometer, color: "text-orange-600", stroke: "#f97316", unit: "°C" },
    { id: "dewPoint", label: "Dew Point", icon: Droplets, color: "text-cyan-600", stroke: "#06b6d4", unit: "°C" },
    { id: "humidity", label: "Humidity", icon: Droplets, color: "text-emerald-600", stroke: "#10b981", unit: "%" },
    { id: "pressure", label: "Pressure", icon: Gauge, color: "text-blue-700", stroke: "#1d4ed8", unit: "hPa" },
  ]

  const activeParam = parameters.find(p => p.id === selectedParam) || parameters[0]

  return (
    <div className="flex flex-col h-screen mb-32 bg-gray-50/50 p-4 space-y-4 overflow-y-auto">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <Activity className="h-6 w-6 text-blue-600" />
                Historical Analysis
              </h1>
              <p className="text-gray-500 text-sm mt-1">Select a parameter below to view detailed historical trends.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
               <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[160px] bg-gray-50 border-gray-200">
                      <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="0.04">Last Hour</SelectItem>
                      <SelectItem value="0.25">Last 6 Hours</SelectItem>
                      <SelectItem value="0.5">Last 12 Hours</SelectItem>
                      <SelectItem value="1">Last 24 Hours</SelectItem>
                      <SelectItem value="7">Last 7 Days</SelectItem>
                      <SelectItem value="15">Last 15 Days</SelectItem>
                      <SelectItem value="30">Last 30 Days</SelectItem>
                      <SelectItem value="60">Last 60 Days</SelectItem>
                      <SelectItem value="90">Last 90 Days</SelectItem>
                  </SelectContent>
              </Select>

              <div className="flex gap-2">
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger className="w-[110px] bg-gray-50 border-gray-200">
                           <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent>
                           <SelectItem value="csv">CSV</SelectItem>
                           <SelectItem value="excel">Excel</SelectItem>
                           <SelectItem value="pdf">PDF</SelectItem>
                           <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                  </Select>
                  <Button onClick={handleExportData} variant="default" className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                  </Button>
              </div>
          </div>
      </div>

      {/* Parameter Selection Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {parameters.map((param) => {
           const Icon = param.icon
           const isActive = selectedParam === param.id
           // Calculate quick stats
           const avg = historicalData.length > 0 
           ? (historicalData.reduce((sum, item) => sum + (Number(item[param.id]) || 0), 0) / historicalData.length).toFixed(1)
           : "--"

           return (
             <Card 
               key={param.id}
               onClick={() => setSelectedParam(param.id)}
               className={cn(
                 "cursor-pointer transition-all duration-200 hover:shadow-md border-2",
                 isActive 
                  ? `border-${param.color.split('-')[1]}-500 bg-${param.color.split('-')[1]}-50` // simpler approach below
                  : "border-transparent hover:border-gray-200"
               )}
               style={{ borderColor: isActive ? param.stroke : undefined, backgroundColor: isActive ? `${param.stroke}10` : undefined }}
             >
               <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-2">
                  <div className={cn("p-2 rounded-full bg-white shadow-sm", param.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{param.label}</p>
                    <p className="text-xl font-bold text-gray-900">{avg} <span className="text-xs font-normal text-gray-400">{param.unit}</span></p>
                  </div>
               </CardContent>
             </Card>
           )
        })}
      </div>

      {/* Main Graph Area */}
      <Card className="flex-1 shadow-md border-gray-100 overflow-hidden">
        <CardHeader className="border-b border-gray-100 bg-gray-50/30 pb-4">
             <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-xl">
                   <TrendingUp className={cn("h-6 w-6", activeParam.color)} />
                   {activeParam.label} History
                </CardTitle>
                <div className="text-sm text-gray-500">
                  Showing data for the last {timeRange} days
                </div>
             </div>
        </CardHeader>
        <CardContent className="p-6 h-[500px]">
           <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                  <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={activeParam.stroke} stopOpacity={0.3}/>
                          <stop offset="95%" stopColor={activeParam.stroke} stopOpacity={0}/>
                      </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{fontSize: 12, fill: '#9ca3af'}} 
                    minTickGap={50}
                    allowDataOverflow={false}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{fontSize: 12, fill: '#9ca3af'}} 
                    unit={` ${activeParam.unit}`}
                    domain={['dataMin - 5', 'dataMax + 5']}
                    allowDataOverflow={false}
                  />
                  <Tooltip
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'}}
                    labelStyle={{color: '#6b7280', marginBottom: '0.5rem'}}
                    formatter={(value: number) => [<span key={activeParam.id} className="font-bold" style={{color: activeParam.stroke}}>{Number(value).toFixed(2)} {activeParam.unit}</span>, activeParam.label]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={activeParam.id} 
                    stroke={activeParam.stroke} 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorGradient)" 
                    animationDuration={1000}
                  />
              </AreaChart>
           </ResponsiveContainer>
        </CardContent>
      </Card>
      
    </div>
  )
}
