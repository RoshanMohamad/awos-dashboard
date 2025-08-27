"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Mock 30-day historical data
const generateHistoricalData = (days: number) => {
  const data = []
  const now = new Date()

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    data.push({
      date: date.toISOString().split("T")[0],
      pressure: 1013 + Math.sin(i * 0.1) * 5 + Math.random() * 2,
      temperature: 28 + Math.sin(i * 0.2) * 3 + Math.random() * 2,
      humidity: 75 + Math.sin(i * 0.15) * 10 + Math.random() * 5,
      windSpeed: 12 + Math.sin(i * 0.3) * 4 + Math.random() * 3,
      windDirection: 180 + Math.sin(i * 0.1) * 60 + Math.random() * 20,
    })
  }

  return data
}

const historicalData = generateHistoricalData(30)

export function HistoricalTrends() {
  const charts = [
    {
      title: "Pressure Trend",
      dataKey: "pressure",
      color: "#3b82f6",
      unit: "hPa",
    },
    {
      title: "Temperature Trend",
      dataKey: "temperature",
      color: "#f59e0b",
      unit: "°C",
    },
    {
      title: "Humidity Trend",
      dataKey: "humidity",
      color: "#10b981",
      unit: "%",
    },
    {
      title: "Wind Speed Trend",
      dataKey: "windSpeed",
      color: "#8b5cf6",
      unit: "m/s",
    },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {charts.map((chart, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-lg">{chart.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    }
                  />
                  <YAxis label={{ value: chart.unit, angle: -90, position: "insideLeft" }} />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number) => [`${value.toFixed(1)} ${chart.unit}`, chart.title]}
                  />
                  <Line type="monotone" dataKey={chart.dataKey} stroke={chart.color} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
