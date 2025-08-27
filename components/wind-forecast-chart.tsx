"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const forecastData = [
  { time: "14:00", forecasted: 12.5, actual: 12.2 },
  { time: "14:15", forecasted: 13.2, actual: 13.0 },
  { time: "14:30", forecasted: 14.8, actual: 14.5 },
  { time: "14:45", forecasted: 16.2, actual: null },
  { time: "15:00", forecasted: 18.5, actual: null },
  { time: "15:15", forecasted: 20.1, actual: null },
  { time: "15:30", forecasted: 22.3, actual: null },
  { time: "15:45", forecasted: 19.8, actual: null },
]

export function WindForecastChart() {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={forecastData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis label={{ value: "Wind Speed (m/s)", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#3b82f6"
            strokeWidth={2}
            name="Actual Gusts"
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="forecasted"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Forecasted Gusts"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
