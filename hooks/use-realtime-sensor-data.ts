import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ISensorReading } from '@/types/sensorReading';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
 * Real-time hook using Supabase Realtime subscriptions
 * Replaces polling-based useESP32Data with true real-time updates
 */
export function useRealtimeSensorData(runway: string) {
    const { supabase } = useAuth();
    const [sensorData, setSensorData] = useState<SensorData | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const [pollingActive, setPollingActive] = useState(false);
    const periodicRefreshRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [reconnectAttempts, setReconnectAttempts] = useState(0);

    // Transform Supabase reading to SensorData format
    const transformReading = useCallback((reading: ISensorReading): SensorData => ({
        runway: reading.stationId,
        timestamp: reading.timestamp.toISOString(),
        windSpeed: reading.windSpeed ?? 0,
        windDirection: reading.windDirection ?? 0,
        pressure: reading.pressure ?? 1013.25,
        temperature: reading.temperature ?? 25,
        humidity: reading.humidity ?? 50,
        dewPoint: reading.dewPoint ?? 20,
        batteryLevel: reading.batteryVoltage ? (reading.batteryVoltage / 4.2) * 100 : 85,
        cebPower: true, // Assume power is on if we're getting data
        batteryPower: (reading.batteryVoltage ?? 3.7) > 3.3,
        sensorStatus: {
            windSensor: reading.windSpeed !== null,
            pressureSensor: reading.pressure !== null,
            temperatureSensor: reading.temperature !== null,
            humiditySensor: reading.humidity !== null,
        }
    }), []);

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

    // Manual refresh function (fallback)
    const refreshData = useCallback(async () => {
        if (!supabase) return;

        try {
            console.log('🔄 Refreshing data for runway:', runway);
            
            // Try exact match first
            let { data: readings, error } = await supabase
                .from('sensor_readings')
                .select('*')
                .eq('station_id', runway)
                .order('timestamp', { ascending: false })
                .limit(1);

            // If no data found, try common variations
            if (!readings || readings.length === 0) {
                console.log('⚠️ No data for exact runway match, trying variations...');
                const variations = [
                    `${runway}-ESP32`,
                    runway.replace('-ESP32', ''),
                    'VCBI',
                    'VCBI-ESP32'
                ];
                
                for (const variation of variations) {
                    if (variation !== runway) {
                        console.log(`🔍 Trying station ID: ${variation}`);
                        const { data: varData, error: varError } = await supabase
                            .from('sensor_readings')
                            .select('*')
                            .eq('station_id', variation)
                            .order('timestamp', { ascending: false })
                            .limit(1);
                        
                        if (varData && varData.length > 0) {
                            console.log(`✅ Found data with station ID: ${variation}`);
                            readings = varData;
                            error = varError;
                            break;
                        }
                    }
                }
            }

            if (error) {
                setConnectionError(`Refresh failed: ${error.message}`);
                return;
            }

            if (readings && readings.length > 0) {
                const reading = readings[0] as any;
                const sensorReading: ISensorReading = {
                    id: reading.id,
                    timestamp: new Date(reading.timestamp),
                    stationId: reading.station_id,
                    temperature: reading.temperature,
                    humidity: reading.humidity,
                    pressure: reading.pressure,
                    windSpeed: reading.wind_speed,
                    windDirection: reading.wind_direction,
                    windGust: reading.wind_gust,
                    visibility: reading.visibility,
                    precipitation1h: reading.precipitation_1h,
                    precipitation3h: reading.precipitation_3h,
                    precipitation6h: reading.precipitation_6h,
                    precipitation24h: reading.precipitation_24h,
                    weatherCode: reading.weather_code,
                    weatherDescription: reading.weather_description,
                    cloudCoverage: reading.cloud_coverage,
                    cloudBase: reading.cloud_base,
                    dewPoint: reading.dew_point,
                    seaLevelPressure: reading.sea_level_pressure,
                    altimeterSetting: reading.altimeter_setting,
                    batteryVoltage: reading.battery_voltage,
                    solarPanelVoltage: reading.solar_panel_voltage,
                    signalStrength: reading.signal_strength,
                    dataQuality: reading.data_quality
                };

                const transformedData = transformReading(sensorReading);
                setSensorData(transformedData);
                setLastUpdate(new Date());
                setConnectionError(null);
            }
        } catch (err) {
            console.error('Error refreshing data:', err);
            setConnectionError('Manual refresh failed');
        }
    }, [supabase, runway, transformReading]);

    // Start automatic polling as fallback when realtime fails
    const startPolling = useCallback(() => {
        if (pollingRef.current) return; // Already polling

        console.log('🔄 Starting automatic polling for', runway);
        setPollingActive(true);
        
        pollingRef.current = setInterval(() => {
            refreshData();
        }, 5000); // Poll every 5 seconds
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

    // Periodic refresh as safety net (every 30 seconds)
    useEffect(() => {
        const startPeriodicRefresh = () => {
            if (periodicRefreshRef.current) return;
            
            console.log('🔄 Starting periodic safety refresh for', runway);
            periodicRefreshRef.current = setInterval(() => {
                // Only refresh if we haven't received updates in the last 10 seconds
                if (!lastUpdate || (Date.now() - lastUpdate.getTime()) > 10000) {
                    console.log('⚠️ No updates received recently, forcing refresh...');
                    refreshData();
                }
            }, 15000); // Check every 15 seconds
        };

        startPeriodicRefresh();

        return () => {
            if (periodicRefreshRef.current) {
                console.log('🛑 Cleaning up periodic refresh for', runway);
                clearInterval(periodicRefreshRef.current);
                periodicRefreshRef.current = null;
            }
        };
    }, [runway, lastUpdate, refreshData]);

    // Automatic reconnection logic
    const attemptReconnect = useCallback(() => {
        if (!supabase || reconnectAttempts >= 5) return;

        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000); // Exponential backoff, max 30s
        console.log(`🔄 Attempting to reconnect in ${delay / 1000}s (attempt ${reconnectAttempts + 1}/5)`);

        reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            
            // Try to re-establish the realtime connection
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }

            // The useEffect will create a new connection automatically
        }, delay);
    }, [supabase, reconnectAttempts]);

    // Reset reconnect attempts on successful connection
    useEffect(() => {
        if (isConnected) {
            setReconnectAttempts(0);
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        }
    }, [isConnected]);

    // Get initial data
    useEffect(() => {
        if (!supabase) {
            setConnectionError('Supabase not configured');
            return;
        }

        const fetchInitialData = async () => {
            try {
                console.log('🔍 Fetching initial data for runway:', runway);
                
                // Try exact match first
                let { data: readings, error } = await supabase
                    .from('sensor_readings')
                    .select('*')
                    .eq('station_id', runway)
                    .order('timestamp', { ascending: false })
                    .limit(1);

                // If no data found, try common variations
                if (!readings || readings.length === 0) {
                    console.log('⚠️ No initial data for exact runway match, trying variations...');
                    const variations = [
                        `${runway}-ESP32`,
                        runway.replace('-ESP32', ''),
                        'VCBI',
                        'VCBI-ESP32'
                    ];
                    
                    for (const variation of variations) {
                        if (variation !== runway) {
                            console.log(`🔍 Trying initial data for station ID: ${variation}`);
                            const { data: varData, error: varError } = await supabase
                                .from('sensor_readings')
                                .select('*')
                                .eq('station_id', variation)
                                .order('timestamp', { ascending: false })
                                .limit(1);
                            
                            if (varData && varData.length > 0) {
                                console.log(`✅ Found initial data with station ID: ${variation}`);
                                readings = varData;
                                error = varError;
                                break;
                            }
                        }
                    }
                }

                if (error) {
                    console.error('Error fetching initial data:', error);
                    setConnectionError(`Database error: ${error.message}`);
                    return;
                }

                if (readings && readings.length > 0) {
                    const reading = readings[0] as any;
                    const sensorReading: ISensorReading = {
                        id: reading.id,
                        timestamp: new Date(reading.timestamp),
                        stationId: reading.station_id,
                        temperature: reading.temperature,
                        humidity: reading.humidity,
                        pressure: reading.pressure,
                        windSpeed: reading.wind_speed,
                        windDirection: reading.wind_direction,
                        windGust: reading.wind_gust,
                        visibility: reading.visibility,
                        precipitation1h: reading.precipitation_1h,
                        precipitation3h: reading.precipitation_3h,
                        precipitation6h: reading.precipitation_6h,
                        precipitation24h: reading.precipitation_24h,
                        weatherCode: reading.weather_code,
                        weatherDescription: reading.weather_description,
                        cloudCoverage: reading.cloud_coverage,
                        cloudBase: reading.cloud_base,
                        dewPoint: reading.dew_point,
                        seaLevelPressure: reading.sea_level_pressure,
                        altimeterSetting: reading.altimeter_setting,
                        batteryVoltage: reading.battery_voltage,
                        solarPanelVoltage: reading.solar_panel_voltage,
                        signalStrength: reading.signal_strength,
                        dataQuality: reading.data_quality
                    };

                    const transformedData = transformReading(sensorReading);
                    setSensorData(transformedData);
                    setLastUpdate(new Date());

                    // Generate initial alerts
                    const newAlerts = checkForAlerts(transformedData);
                    if (newAlerts.length > 0) {
                        setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
                    }
                }

                setConnectionError(null);
            } catch (err) {
                console.error('Error in fetchInitialData:', err);
                setConnectionError('Failed to load initial data');
            }
        };

        fetchInitialData();
    }, [supabase, runway, transformReading, checkForAlerts]);

    // Setup real-time subscription
    useEffect(() => {
        if (!supabase) {
            setIsConnected(false);
            return;
        }

        console.log('🔄 Setting up real-time subscription for runway:', runway);

        // Create channel for real-time updates
        const channel = supabase
            .channel(`sensor-readings-${runway}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'sensor_readings',
                    filter: `station_id=eq.${runway}`
                },
                (payload) => {
                    console.log('🔴 REALTIME UPDATE RECEIVED for', runway, ':', payload);
                    console.log('🔴 Payload new data:', payload.new);

                    if (payload.new) {
                        const reading = payload.new as any;
                        const sensorReading: ISensorReading = {
                            id: reading.id,
                            timestamp: new Date(reading.timestamp),
                            stationId: reading.station_id,
                            temperature: reading.temperature,
                            humidity: reading.humidity,
                            pressure: reading.pressure,
                            windSpeed: reading.wind_speed,
                            windDirection: reading.wind_direction,
                            windGust: reading.wind_gust,
                            visibility: reading.visibility,
                            precipitation1h: reading.precipitation_1h,
                            precipitation3h: reading.precipitation_3h,
                            precipitation6h: reading.precipitation_6h,
                            precipitation24h: reading.precipitation_24h,
                            weatherCode: reading.weather_code,
                            weatherDescription: reading.weather_description,
                            cloudCoverage: reading.cloud_coverage,
                            cloudBase: reading.cloud_base,
                            dewPoint: reading.dew_point,
                            seaLevelPressure: reading.sea_level_pressure,
                            altimeterSetting: reading.altimeter_setting,
                            batteryVoltage: reading.battery_voltage,
                            solarPanelVoltage: reading.solar_panel_voltage,
                            signalStrength: reading.signal_strength,
                            dataQuality: reading.data_quality
                        };

                        const transformedData = transformReading(sensorReading);
                        setSensorData(transformedData);
                        setLastUpdate(new Date());

                        // 🚨 TEMPORARY: Debug realtime update
                        console.log('🟢 DASHBOARD REALTIME UPDATE:', {
                            temp: transformedData.temperature,
                            humidity: transformedData.humidity,
                            pressure: transformedData.pressure,
                            time: transformedData.timestamp
                        });

                        // Generate alerts for new data
                        const newAlerts = checkForAlerts(transformedData);
                        if (newAlerts.length > 0) {
                            setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
                        }

                        setConnectionError(null);
                    }
                }
            )
            .subscribe((status) => {
                console.log('🔵 Realtime subscription status for', runway, ':', status);

                if (status === 'SUBSCRIBED') {
                    setIsConnected(true);
                    setConnectionError(null);
                    stopPolling(); // Stop polling since realtime is working
                    console.log('✅ Successfully subscribed to real-time updates for', runway);
                } else if (status === 'CHANNEL_ERROR') {
                    setIsConnected(false);
                    setConnectionError('Real-time subscription failed - Using polling fallback');
                    startPolling(); // Start polling as fallback
                    attemptReconnect(); // Try to reconnect
                    console.log('❌ Channel error for', runway, '- Starting polling fallback and reconnection');
                } else if (status === 'TIMED_OUT') {
                    setIsConnected(false);
                    setConnectionError('Real-time connection timed out - Using polling fallback');
                    startPolling(); // Start polling as fallback
                    attemptReconnect(); // Try to reconnect
                    console.log('⏰ Connection timed out for', runway, '- Starting polling fallback and reconnection');
                } else if (status === 'CLOSED') {
                    setIsConnected(false);
                    setConnectionError('Real-time connection closed - Using polling fallback');
                    startPolling(); // Start polling as fallback
                    attemptReconnect(); // Try to reconnect
                    console.log('🔒 Connection closed for', runway, '- Starting polling fallback and reconnection');
                }
            });

        channelRef.current = channel;

        // Cleanup subscription
        return () => {
            if (channelRef.current) {
                console.log('Cleaning up real-time subscription');
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
            stopPolling(); // Clean up polling on unmount
            
            // Clean up reconnect timeout
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };
    }, [supabase, runway, startPolling, stopPolling, transformReading, checkForAlerts, attemptReconnect]);

    return {
        sensorData,
        alerts,
        isConnected,
        connectionSource: isConnected ? 'realtime' : pollingActive ? 'polling' : 'none',
        connectionError,
        lastUpdate,
        refreshData,
        pollingActive
    };
}
