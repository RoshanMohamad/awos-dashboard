import { useState, useEffect, useRef, useCallback } from 'react';
import { localDB } from '@/lib/local-database';

export interface Alert {
    id: string;
    type: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
    runway: string;
    severity?: 'low' | 'medium' | 'high';
}

export interface SensorData {
    runway: string;
    timestamp: string;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    temperature: number;
    humidity: number;
    dewPoint: number;
    batteryLevel: number;
    cebPower: boolean;
    batteryPower: boolean;
    sensorStatus?: {
        windSensor: boolean;
        pressureSensor: boolean;
        temperatureSensor: boolean;
        humiditySensor: boolean;
    };
}

/**
 * Local real-time hook using IndexedDB and polling
 * Works completely offline - no internet required
 */
export function useLocalRealtimeSensorData(runway: string) {
    const [sensorData, setSensorData] = useState<SensorData | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const [pollingActive, setPollingActive] = useState(false);

    // Transform database reading to SensorData format
    const transformReading = useCallback((reading: any): SensorData => ({
        runway: reading.station_id || runway,
        timestamp: reading.timestamp,
        windSpeed: reading.wind_speed ?? 0,
        windDirection: reading.wind_direction ?? 0,
        pressure: reading.pressure ?? 1013.25,
        temperature: reading.temperature ?? 25,
        humidity: reading.humidity ?? 50,
        dewPoint: reading.dew_point ?? 20,
        batteryLevel: reading.battery_voltage ? (reading.battery_voltage / 4.2) * 100 : 85,
        cebPower: true, // Assume power is on if we're getting data
        batteryPower: (reading.battery_voltage ?? 3.7) > 3.3,
        sensorStatus: {
            windSensor: reading.wind_speed !== null,
            pressureSensor: reading.pressure !== null,
            temperatureSensor: reading.temperature !== null,
            humiditySensor: reading.humidity !== null,
        }
    }), [runway]);

    // Create alerts based on sensor data
    const checkForAlerts = useCallback((data: SensorData): Alert[] => {
        const alerts: Alert[] = [];
        const now = new Date().toISOString();

        // Temperature alerts
        if (data.temperature > 35) {
            alerts.push({
                id: `temp-high-${Date.now()}`,
                type: 'warning',
                message: `High temperature: ${data.temperature.toFixed(1)}°C`,
                timestamp: now,
                runway: data.runway,
                severity: 'medium'
            });
        }

        // Wind speed alerts
        if (data.windSpeed > 25) {
            alerts.push({
                id: `wind-high-${Date.now()}`,
                type: 'warning',
                message: `High wind speed: ${data.windSpeed.toFixed(1)} m/s`,
                timestamp: now,
                runway: data.runway,
                severity: 'high'
            });
        }

        // Battery alerts
        if (data.batteryLevel < 20) {
            alerts.push({
                id: `battery-low-${Date.now()}`,
                type: 'error',
                message: `Low battery: ${data.batteryLevel.toFixed(0)}%`,
                timestamp: now,
                runway: data.runway,
                severity: 'high'
            });
        }

        // Pressure alerts
        if (data.pressure < 980 || data.pressure > 1040) {
            alerts.push({
                id: `pressure-${Date.now()}`,
                type: 'warning',
                message: `Unusual pressure: ${data.pressure.toFixed(1)} hPa`,
                timestamp: now,
                runway: data.runway,
                severity: 'medium'
            });
        }

        return alerts;
    }, []);

    // Fetch data from local API endpoint
    const fetchFromAPI = useCallback(async () => {
        try {
            const response = await fetch('/api/esp32');
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    return result.data;
                }
            }
        } catch (error) {
            console.error('Error fetching from API:', error);
        }
        return null;
    }, []);

    // Fetch data from local IndexedDB
    const fetchFromDatabase = useCallback(async () => {
        try {
            await localDB.init();
            
            // Get all readings, then filter by station_id
            const allReadings = await localDB.getAll('sensor_readings');
            
            // Try to find readings for this runway
            let readings = allReadings.filter((r: any) => r.station_id === runway);
            
            // If no exact match, try variations
            if (readings.length === 0) {
                const variations = [
                    `${runway}-ESP32`,
                    runway.replace('-ESP32', ''),
                    'VCBI',
                    'VCBI-ESP32'
                ];
                
                for (const variation of variations) {
                    readings = allReadings.filter((r: any) => r.station_id === variation);
                    if (readings.length > 0) {
                        console.log(`✅ Found data for variation: ${variation}`);
                        break;
                    }
                }
            }

            // Sort by timestamp (newest first)
            readings.sort((a: any, b: any) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );

            return readings.length > 0 ? readings[0] : null;
        } catch (error) {
            console.error('Error fetching from IndexedDB:', error);
            return null;
        }
    }, [runway]);

    // Manual refresh function
    const refreshData = useCallback(async () => {
        try {
            console.log('🔄 Refreshing data for runway:', runway);
            
            // Try API first (latest data)
            let latestData = await fetchFromAPI();
            
            // Fall back to IndexedDB if API fails
            if (!latestData) {
                latestData = await fetchFromDatabase();
            }

            if (latestData) {
                const transformedData = transformReading(latestData);
                setSensorData(transformedData);
                setLastUpdate(new Date());
                setIsConnected(true);
                setConnectionError(null);

                // Generate alerts
                const newAlerts = checkForAlerts(transformedData);
                if (newAlerts.length > 0) {
                    setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
                }

                console.log('✅ Data refreshed:', {
                    temp: transformedData.temperature,
                    humidity: transformedData.humidity,
                    pressure: transformedData.pressure
                });
            } else {
                setConnectionError('No data available');
                setIsConnected(false);
            }
        } catch (err) {
            console.error('Error refreshing data:', err);
            setConnectionError('Refresh failed');
            setIsConnected(false);
        }
    }, [runway, fetchFromAPI, fetchFromDatabase, transformReading, checkForAlerts]);

    // Start automatic polling
    const startPolling = useCallback(() => {
        if (pollingRef.current) return; // Already polling

        console.log('🔄 Starting automatic polling for', runway);
        setPollingActive(true);
        
        // Initial refresh
        refreshData();
        
        // Poll every 2 seconds for real-time updates
        pollingRef.current = setInterval(() => {
            refreshData();
        }, 2000);
    }, [runway, refreshData]);

    // Stop automatic polling
    const stopPolling = useCallback(() => {
        if (pollingRef.current) {
            console.log('⏹️ Stopping automatic polling for', runway);
            clearInterval(pollingRef.current);
            pollingRef.current = null;
            setPollingActive(false);
        }
    }, [runway]);

    // Auto-start polling on mount
    useEffect(() => {
        startPolling();
        
        return () => {
            stopPolling();
        };
    }, [startPolling, stopPolling]);

    return {
        sensorData,
        alerts,
        isConnected,
        connectionSource: pollingActive ? 'local-polling' : 'none',
        connectionError,
        lastUpdate,
        refreshData,
        pollingActive
    };
}
