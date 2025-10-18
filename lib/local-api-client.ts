"use client"

import { localDB } from './local-database';
import type { Alert } from "./websocket"

export interface SensorData {
  runway: string;
  timestamp: string;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  temperature: number;
  humidity: number;
  dewPoint: number;
  batteryLevel?: number;
  cebPower?: boolean;
  batteryPower?: boolean;
}

/**
 * Local API Client for offline operation
 * Uses IndexedDB and local API endpoints
 */
export class LocalApiClient {
  constructor(
    private baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  ) { }

  async getCurrentData(runway: string): Promise<SensorData | null> {
    try {
      // Try local API endpoint first
      const response = await fetch(`${this.baseUrl}/api/esp32`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          return this.transformToSensorData(result.data);
        }
      }
    } catch (error) {
      console.error("Error fetching from API:", error);
    }

    // Fallback to IndexedDB
    try {
      await localDB.init();
      const readings = await localDB.getAll('sensor_readings');
      
      if (readings.length > 0) {
        // Sort by timestamp
        readings.sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        return this.transformToSensorData(readings[0]);
      }
    } catch (error) {
      console.error("Error fetching from database:", error);
    }

    return null;
  }

  async getHistoricalData(runway: string, days = 30): Promise<SensorData[]> {
    try {
      await localDB.init();
      
      // Get all readings from IndexedDB
      const allReadings = await localDB.getAll('sensor_readings');
      
      // Filter by date range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const filteredReadings = allReadings.filter((reading: any) => {
        const readingDate = new Date(reading.timestamp);
        return readingDate >= cutoffDate;
      });

      // Sort by timestamp (newest first)
      filteredReadings.sort((a: any, b: any) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Transform to SensorData format
      return filteredReadings.map((reading: any) => 
        this.transformToSensorData(reading)
      );
    } catch (error) {
      console.error("Error fetching historical data:", error);
      return [];
    }
  }

  async getAlerts(runway: string): Promise<Alert[]> {
    // Generate alerts based on latest data
    const currentData = await this.getCurrentData(runway);
    if (!currentData) return [];

    const alerts: Alert[] = [];
    const now = new Date().toISOString();

    // Temperature alerts
    if (currentData.temperature > 35) {
      alerts.push({
        id: `temp-high-${Date.now()}`,
        type: 'warning',
        message: `High temperature: ${currentData.temperature.toFixed(1)}°C`,
        timestamp: now,
        runway: currentData.runway,
        severity: 'medium'
      });
    }

    // Wind speed alerts
    if (currentData.windSpeed > 25) {
      alerts.push({
        id: `wind-high-${Date.now()}`,
        type: 'warning',
        message: `High wind speed: ${currentData.windSpeed.toFixed(1)} m/s`,
        timestamp: now,
        runway: currentData.runway,
        severity: 'high'
      });
    }

    // Battery alerts
    if (currentData.batteryLevel && currentData.batteryLevel < 20) {
      alerts.push({
        id: `battery-low-${Date.now()}`,
        type: 'error',
        message: `Low battery: ${currentData.batteryLevel.toFixed(0)}%`,
        timestamp: now,
        runway: currentData.runway,
        severity: 'high'
      });
    }

    // Pressure alerts
    if (currentData.pressure < 980 || currentData.pressure > 1040) {
      alerts.push({
        id: `pressure-${Date.now()}`,
        type: 'warning',
        message: `Unusual pressure: ${currentData.pressure.toFixed(1)} hPa`,
        timestamp: now,
        runway: currentData.runway,
        severity: 'medium'
      });
    }

    return alerts;
  }

  async exportData(runway: string, startDate: string, endDate: string, format: string = "csv"): Promise<Blob | null> {
    try {
      await localDB.init();
      
      // Get readings in date range
      const allReadings = await localDB.getAll('sensor_readings');
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const filteredReadings = allReadings.filter((reading: any) => {
        const readingDate = new Date(reading.timestamp);
        return readingDate >= start && readingDate <= end;
      });

      if (format === 'csv') {
        // Generate CSV
        const headers = [
          'Timestamp',
          'Station ID',
          'Temperature (°C)',
          'Humidity (%)',
          'Pressure (hPa)',
          'Wind Speed (m/s)',
          'Wind Direction (°)',
          'Dew Point (°C)'
        ];

        const rows = filteredReadings.map((reading: any) => [
          reading.timestamp,
          reading.station_id,
          reading.temperature,
          reading.humidity,
          reading.pressure,
          reading.wind_speed,
          reading.wind_direction,
          reading.dew_point
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');

        return new Blob([csvContent], { type: 'text/csv' });
      } else if (format === 'json') {
        // Generate JSON
        const jsonContent = JSON.stringify(filteredReadings, null, 2);
        return new Blob([jsonContent], { type: 'application/json' });
      }

      return null;
    } catch (error) {
      console.error("Error exporting data:", error);
      return null;
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
      // Check if we have recent data
      const currentData = await this.getCurrentData('VCBI-ESP32');
      
      if (currentData) {
        const lastUpdate = new Date(currentData.timestamp);
        const now = new Date();
        const timeDiff = now.getTime() - lastUpdate.getTime();
        const isConnected = timeDiff < 120000; // 2 minutes

        return {
          esp32Connected: isConnected,
          lastHeartbeat: currentData.timestamp,
          uptime: 0, // Not tracked in local mode
          freeMemory: 0, // Not tracked in local mode
          wifiSignal: 0 // Not tracked in local mode
        };
      }

      return null;
    } catch (error) {
      console.error("Error fetching system status:", error);
      return null;
    }
  }

  private transformToSensorData(reading: any): SensorData {
    return {
      runway: reading.station_id || 'VCBI-ESP32',
      timestamp: reading.timestamp,
      temperature: reading.temperature ?? 25,
      humidity: reading.humidity ?? 50,
      pressure: reading.pressure ?? 1013.25,
      windSpeed: reading.wind_speed ?? 0,
      windDirection: reading.wind_direction ?? 0,
      dewPoint: reading.dew_point ?? reading.dewPoint ?? 20,
      batteryLevel: reading.battery_voltage ? (reading.battery_voltage / 4.2) * 100 : 85,
      cebPower: true,
      batteryPower: (reading.battery_voltage ?? 3.7) > 3.3
    };
  }
}

// Export singleton instance
export const localApiClient = new LocalApiClient();
