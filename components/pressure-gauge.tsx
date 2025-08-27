"use client"

interface PressureGaugeProps {
  pressure: number
}

export function PressureGauge({ pressure }: PressureGaugeProps) {
  const minPressure = 980
  const maxPressure = 1040
  const normalizedPressure = ((pressure - minPressure) / (maxPressure - minPressure)) * 180

  const gaugeSize = 200
  const center = gaugeSize / 2
  const radius = center - 20

  // Generate sparkline data (mock)
  const sparklineData = [1012.1, 1012.5, 1012.8, 1013.0, 1013.2, 1013.1, 1013.2]

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <svg width={gaugeSize} height={gaugeSize / 2 + 40}>
          {/* Background arc */}
          <path
            d={`M 20 ${center} A ${radius} ${radius} 0 0 1 ${gaugeSize - 20} ${center}`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />

          {/* Pressure zones */}
          <path
            d={`M 20 ${center} A ${radius} ${radius} 0 0 1 ${center} ${center - radius}`}
            fill="none"
            stroke="#fbbf24"
            strokeWidth="8"
          />
          <path
            d={`M ${center} ${center - radius} A ${radius} ${radius} 0 0 1 ${gaugeSize - 20} ${center}`}
            fill="none"
            stroke="#10b981"
            strokeWidth="8"
          />

          {/* Needle */}
          <g transform={`rotate(${normalizedPressure - 90} ${center} ${center})`}>
            <line x1={center} y1={center} x2={center} y2={center - radius + 10} stroke="#dc2626" strokeWidth="3" />
            <circle cx={center} cy={center} r="6" fill="#dc2626" />
          </g>

          {/* Scale marks */}
          {[0, 45, 90, 135, 180].map((angle, index) => (
            <g key={index} transform={`rotate(${angle - 90} ${center} ${center})`}>
              <line
                x1={center}
                y1={center - radius + 5}
                x2={center}
                y2={center - radius + 15}
                stroke="#6b7280"
                strokeWidth="2"
              />
            </g>
          ))}
        </svg>
      </div>

      <div className="text-center space-y-2">
        <div className="text-3xl font-bold text-blue-600">{pressure} hPa</div>
        <div className="text-sm text-gray-600">Barometric Pressure</div>

        {/* Mini sparkline */}
        <div className="flex items-center justify-center space-x-1">
          <span className="text-xs text-gray-500">Trend:</span>
          <svg width="60" height="20">
            <polyline
              points={sparklineData.map((value, index) => `${index * 10},${20 - (value - 1012) * 10}`).join(" ")}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
