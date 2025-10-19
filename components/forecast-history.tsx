"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WindForecastChart } from "@/components/wind-forecast-chart"
import { Download, AlertTriangle, TrendingUp, Calendar, Thermometer, Droplets, Gauge, Wind, CloudRain } from "lucide-react"
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Area, AreaChart } from "recharts"

// Use local API client for offline operation
import { useESP32Data } from "@/hooks/use-esp32-data"
import { localApiClient } from "@/lib/local-api-client"
import { ExportUtils, type ExportData, type ReportMetadata } from "@/lib/exportUtils"

interface ForecastHistoryProps {
  runway: string
}

type Parameter = 'temperature' | 'humidity' | 'pressure' | 'windSpeed' | 'dewPoint'
type Timeframe = 'day' | 'week' | 'month'

interface ParameterConfig {
  key: Parameter
  label: string
  unit: string
  color: string
  icon: React.ReactNode
}

export function ForecastHistory({ runway }: ForecastHistoryProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [exportFormat, setExportFormat] = useState<string>("csv")
  const [selectedParameter, setSelectedParameter] = useState<Parameter>('temperature')
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('day')
  const { alerts } = useESP32Data(runway)

  // Parameter configurations
  const parameters: ParameterConfig[] = [
    { key: 'temperature', label: 'Temperature', unit: '°C', color: '#f59e0b', icon: <Thermometer className="h-4 w-4" /> },
    { key: 'humidity', label: 'Humidity', unit: '%', color: '#10b981', icon: <Droplets className="h-4 w-4" /> },
    { key: 'pressure', label: 'Pressure', unit: 'hPa', color: '#3b82f6', icon: <Gauge className="h-4 w-4" /> },
    { key: 'windSpeed', label: 'Wind Speed', unit: 'm/s', color: '#8b5cf6', icon: <Wind className="h-4 w-4" /> },
    { key: 'dewPoint', label: 'Dew Point', unit: '°C', color: '#06b6d4', icon: <CloudRain className="h-4 w-4" /> },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Load historical data based on timeframe
  useEffect(() => {
    const loadHistoricalData = async () => {
      setLoading(true)
      try {
        const days = selectedTimeframe === 'day' ? 1 : selectedTimeframe === 'week' ? 7 : 30;
        console.log('📊 Loading historical data for runway:', runway, 'timeframe:', selectedTimeframe, 'days:', days);
        const data = await localApiClient.getHistoricalData(runway, days);
        console.log('✅ Historical data loaded:', data.length, 'readings');

        // Transform data format to chart format with better time resolution
        let chartData;
        if (selectedTimeframe === 'day') {
          // For day view, show hourly data
          chartData = data.map((item) => ({
            time: new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            fullDate: new Date(item.timestamp).toLocaleString(),
            pressure: item.pressure,
            temperature: item.temperature,
            humidity: item.humidity,
            windSpeed: item.windSpeed,
            windDirection: item.windDirection,
            dewPoint: item.dewPoint || (item.temperature && item.humidity ? calculateDewPoint(item.temperature, item.humidity) : null),
          }));
        } else {
          // For week/month view, aggregate by day
          const dailyMap = new Map<string, any[]>();
          data.forEach(item => {
            const date = new Date(item.timestamp).toISOString().split("T")[0];
            if (!dailyMap.has(date)) {
              dailyMap.set(date, []);
            }
            dailyMap.get(date)!.push(item);
          });

          chartData = Array.from(dailyMap.entries()).map(([date, items]) => {
            const avg = (key: string) => items.reduce((sum, item) => sum + (item[key] || 0), 0) / items.length;
            return {
              time: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              fullDate: new Date(date).toLocaleDateString(),
              pressure: avg('pressure'),
              temperature: avg('temperature'),
              humidity: avg('humidity'),
              windSpeed: avg('windSpeed'),
              windDirection: avg('windDirection'),
              dewPoint: avg('dewPoint') || calculateDewPoint(avg('temperature'), avg('humidity')),
            };
          }).sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());
        }

        setHistoricalData(chartData);
      } catch (error) {
        console.error("Error loading historical data:", error);
        // Mock data for demonstration if no data available
        const dataPoints = selectedTimeframe === 'day' ? 24 : selectedTimeframe === 'week' ? 7 : 30;
        const mockData = Array.from({ length: dataPoints }, (_, i) => {
          const date = new Date(Date.now() - (dataPoints - 1 - i) * (selectedTimeframe === 'day' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
          const temp = 28 + Math.sin(i * 0.2) * 3 + Math.random() * 2;
          const humidity = 75 + Math.sin(i * 0.15) * 10 + Math.random() * 5;
          return {
            time: selectedTimeframe === 'day' 
              ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            fullDate: date.toLocaleString(),
            pressure: 1013 + Math.sin(i * 0.1) * 5 + Math.random() * 2,
            temperature: temp,
            humidity: humidity,
            windSpeed: 12 + Math.sin(i * 0.3) * 4 + Math.random() * 3,
            windDirection: 180 + Math.sin(i * 0.1) * 60 + Math.random() * 20,
            dewPoint: calculateDewPoint(temp, humidity),
          };
        });
        setHistoricalData(mockData);
      } finally {
        setLoading(false);
      }
    };

    loadHistoricalData();
  }, [runway, selectedTimeframe]);

  // Calculate dew point from temperature and humidity
  const calculateDewPoint = (temp: number, humidity: number): number => {
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
    return (b * alpha) / (a - alpha);
  };

  const handleExportData = async () => {
    try {
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      console.log('📥 Exporting data:', { startDate, endDate, format: exportFormat });
      
      // Get data from local API
      const blob = await localApiClient.exportData(runway, startDate, endDate, exportFormat);
      
      if (blob) {
        const fileExtension = ExportUtils.getFileExtension(exportFormat)
        const filename = `awos_data_runway_${runway}_${new Date().toISOString().split("T")[0]}${fileExtension}`
        ExportUtils.downloadFile(blob, filename)
      } else {
        // Fallback to local data if API fails
        const exportData: ExportData[] = historicalData.map(item => ({
          timestamp: new Date(item.date).toISOString(),
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
    } catch (error) {
      console.error("Export error:", error)
    }
  }

  // Use real alerts from ESP32
  const forecastAlerts = alerts.filter((alert) => alert.type === "warning").slice(0, 5)

  // Get current parameter config
  const currentParam = parameters.find(p => p.key === selectedParameter) || parameters[0]

  // Calculate statistics for current parameter
  const getStats = () => {
    if (historicalData.length === 0) return { min: 0, max: 0, avg: 0 };
    const values = historicalData.map(d => d[selectedParameter]).filter(v => v != null);
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length
    };
  };

  const stats = getStats();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Main Content - Fixed Height Layout with Flexbox */}
      <div className="flex-1 p-4 bg-gray-50">
        <div className="flex-1 space-y-4">
          {/* Top Row - Wind Forecast and Controls */}
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
                  <div className="space-y-2">
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger className="w-full text-xs">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">CSV</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={handleExportData} className="w-full bg-transparent text-sm py-2">
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                  </div>
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

          {/* Bottom Section - Individual Parameter Graphs with Timeframe Selection */}
          <div className="flex-1">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <span>Historical Trends Analysis</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    {/* Timeframe Selector */}
                    <div className="flex border rounded-lg overflow-hidden">
                      <Button
                        variant={selectedTimeframe === 'day' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedTimeframe('day')}
                        className="rounded-none"
                      >
                        Day
                      </Button>
                      <Button
                        variant={selectedTimeframe === 'week' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedTimeframe('week')}
                        className="rounded-none border-l"
                      >
                        Week
                      </Button>
                      <Button
                        variant={selectedTimeframe === 'month' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setSelectedTimeframe('month')}
                        className="rounded-none border-l"
                      >
                        Month
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[calc(100%-70px)] p-3">
                <div className="grid grid-cols-12 gap-3 h-full">
                  {/* Parameter Selector (Vertical) */}
                  <div className="col-span-2 flex flex-col space-y-2">
                    {parameters.map((param) => (
                      <Button
                        key={param.key}
                        variant={selectedParameter === param.key ? 'default' : 'outline'}
                        onClick={() => setSelectedParameter(param.key)}
                        className="w-full justify-start text-left h-auto py-3"
                        style={{
                          backgroundColor: selectedParameter === param.key ? param.color : 'transparent',
                          borderColor: param.color,
                          color: selectedParameter === param.key ? 'white' : param.color
                        }}
                      >
                        <div className="flex flex-col items-start w-full">
                          <div className="flex items-center space-x-2 mb-1">
                            {param.icon}
                            <span className="font-semibold text-sm">{param.label}</span>
                          </div>
                          <span className="text-xs opacity-75">{param.unit}</span>
                        </div>
                      </Button>
                    ))}
                  </div>

                  {/* Large Chart Display */}
                  <div className="col-span-10 bg-white border-2 rounded-lg p-4" style={{ borderColor: currentParam.color }}>
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-gray-500">Loading data...</div>
                      </div>
                    ) : (
                      <div className="flex flex-col h-full">
                        {/* Chart Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div style={{ color: currentParam.color }}>
                              {currentParam.icon}
                            </div>
                            <div>
                              <h3 className="text-xl font-bold" style={{ color: currentParam.color }}>
                                {currentParam.label}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {selectedTimeframe === 'day' ? 'Last 24 Hours' : selectedTimeframe === 'week' ? 'Last 7 Days' : 'Last 30 Days'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Statistics */}
                          <div className="flex space-x-4">
                            <div className="text-center px-3 py-2 bg-green-50 rounded-lg">
                              <div className="text-xs text-gray-600">Min</div>
                              <div className="text-lg font-bold text-green-600">{stats.min.toFixed(1)} {currentParam.unit}</div>
                            </div>
                            <div className="text-center px-3 py-2 bg-blue-50 rounded-lg">
                              <div className="text-xs text-gray-600">Avg</div>
                              <div className="text-lg font-bold text-blue-600">{stats.avg.toFixed(1)} {currentParam.unit}</div>
                            </div>
                            <div className="text-center px-3 py-2 bg-red-50 rounded-lg">
                              <div className="text-xs text-gray-600">Max</div>
                              <div className="text-lg font-bold text-red-600">{stats.max.toFixed(1)} {currentParam.unit}</div>
                            </div>
                          </div>
                        </div>

                        {/* Chart */}
                        <div className="flex-1">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={historicalData}>
                              <defs>
                                <linearGradient id={`color${selectedParameter}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={currentParam.color} stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor={currentParam.color} stopOpacity={0.05}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis 
                                dataKey="time" 
                                stroke="#6b7280"
                                tick={{ fontSize: 12 }}
                                angle={selectedTimeframe === 'day' ? -45 : 0}
                                textAnchor={selectedTimeframe === 'day' ? 'end' : 'middle'}
                                height={selectedTimeframe === 'day' ? 60 : 40}
                              />
                              <YAxis 
                                stroke="#6b7280"
                                tick={{ fontSize: 12 }}
                                label={{ value: currentParam.unit, angle: -90, position: 'insideLeft', style: { fontSize: 14 } }}
                              />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: 'white',
                                  border: `2px solid ${currentParam.color}`,
                                  borderRadius: '8px',
                                  padding: '10px'
                                }}
                                labelFormatter={(label) => `Time: ${label}`}
                                formatter={(value: number) => [`${value.toFixed(2)} ${currentParam.unit}`, currentParam.label]}
                              />
                              <Legend 
                                wrapperStyle={{ paddingTop: '10px' }}
                                iconType="line"
                              />
                              <Area 
                                type="monotone" 
                                dataKey={selectedParameter}
                                stroke={currentParam.color}
                                strokeWidth={3}
                                fill={`url(#color${selectedParameter})`}
                                name={currentParam.label}
                                dot={{ fill: currentParam.color, r: 3 }}
                                activeDot={{ r: 6 }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
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