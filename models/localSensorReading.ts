import { localDB } from '@/lib/local-database';
import { ISensorReading, SensorReadingInput } from '@/types/sensorReading';

/**
 * Local Sensor Reading Model
 * Uses IndexedDB for offline operation - no internet required
 */
export class LocalSensorReadingModel {
    /**
     * Create a new sensor reading in IndexedDB
     */
    static async create(data: SensorReadingInput): Promise<ISensorReading> {
        try {
            await localDB.init();

            const id = `reading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const timestamp = data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString();

            const sensorReading = {
                id,
                timestamp,
                station_id: data.stationId || 'VCBI-ESP32',
                temperature: data.temperature ?? null,
                humidity: data.humidity ?? null,
                pressure: data.pressure ?? null,
                wind_speed: data.windSpeed ?? null,
                wind_direction: data.windDirection ?? null,
                wind_gust: data.windGust ?? null,
                visibility: data.visibility ?? null,
                precipitation_1h: data.precipitation1h ?? null,
                precipitation_3h: data.precipitation3h ?? null,
                precipitation_6h: data.precipitation6h ?? null,
                precipitation_24h: data.precipitation24h ?? null,
                weather_code: data.weatherCode ?? null,
                weather_description: data.weatherDescription ?? null,
                cloud_coverage: data.cloudCoverage ?? null,
                cloud_base: data.cloudBase ?? null,
                dew_point: data.dewPoint ?? null,
                sea_level_pressure: data.seaLevelPressure ?? null,
                altimeter_setting: data.altimeterSetting ?? null,
                battery_voltage: data.batteryVoltage ?? null,
                solar_panel_voltage: data.solarPanelVoltage ?? null,
                signal_strength: data.signalStrength ?? null,
                data_quality: data.dataQuality || 'good',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            await localDB.add('sensor_readings', sensorReading);

            return this.transformToISensorReading(sensorReading);
        } catch (error) {
            console.error('Error creating sensor reading:', error);
            throw error instanceof Error ? error : new Error('Failed to create sensor reading');
        }
    }

    /**
     * Server-side create (same as create for local mode)
     */
    static async createServerSide(data: SensorReadingInput | any): Promise<ISensorReading> {
        return this.create(data);
    }

    /**
     * Get sensor readings with optional filtering and pagination
     */
    static async findMany(options: {
        stationId?: string;
        startTime?: Date;
        endTime?: Date;
        limit?: number;
        offset?: number;
        orderBy?: 'asc' | 'desc';
    } = {}): Promise<ISensorReading[]> {
        try {
            await localDB.init();

            const {
                stationId,
                startTime,
                endTime,
                limit = 100,
                offset = 0,
                orderBy = 'desc'
            } = options;

            // Get all readings from IndexedDB
            let readings = await localDB.getAll('sensor_readings');

            // Filter by station ID
            if (stationId) {
                readings = readings.filter((r: any) => r.station_id === stationId);
            }

            // Filter by time range
            if (startTime) {
                readings = readings.filter((r: any) => 
                    new Date(r.timestamp) >= startTime
                );
            }

            if (endTime) {
                readings = readings.filter((r: any) => 
                    new Date(r.timestamp) <= endTime
                );
            }

            // Sort by timestamp
            readings.sort((a: any, b: any) => {
                const timeA = new Date(a.timestamp).getTime();
                const timeB = new Date(b.timestamp).getTime();
                return orderBy === 'asc' ? timeA - timeB : timeB - timeA;
            });

            // Apply pagination
            const paginatedReadings = readings.slice(offset, offset + limit);

            return paginatedReadings.map((reading: any) => 
                this.transformToISensorReading(reading)
            );
        } catch (error) {
            console.error('Error fetching sensor readings:', error);
            return [];
        }
    }

    /**
     * Get a single sensor reading by ID
     */
    static async findById(id: string): Promise<ISensorReading | null> {
        try {
            await localDB.init();
            const reading = await localDB.get('sensor_readings', id);
            
            if (!reading) {
                return null;
            }

            return this.transformToISensorReading(reading);
        } catch (error) {
            console.error('Error fetching sensor reading by ID:', error);
            return null;
        }
    }

    /**
     * Get the latest sensor reading for a station
     */
    static async findLatest(stationId?: string): Promise<ISensorReading | null> {
        try {
            const readings = await this.findMany({
                stationId,
                limit: 1,
                orderBy: 'desc'
            });

            return readings.length > 0 ? readings[0] : null;
        } catch (error) {
            console.error('Error fetching latest sensor reading:', error);
            return null;
        }
    }

    /**
     * Get aggregated data for a time period
     */
    static async getAggregatedData(options: {
        stationId?: string;
        startTime: Date;
        endTime: Date;
    }): Promise<{
        count: number;
        avgTemperature?: number;
        avgHumidity?: number;
        avgPressure?: number;
        avgWindSpeed?: number;
        maxWindGust?: number;
        totalPrecipitation?: number;
    }> {
        try {
            const readings = await this.findMany({
                stationId: options.stationId,
                startTime: options.startTime,
                endTime: options.endTime,
                limit: 10000,
            });

            if (readings.length === 0) {
                return {
                    count: 0,
                    avgTemperature: undefined,
                    avgHumidity: undefined,
                    avgPressure: undefined,
                    avgWindSpeed: undefined,
                    maxWindGust: undefined,
                    totalPrecipitation: undefined,
                };
            }

            const validTemperatures = readings.filter(r => r.temperature != null).map(r => r.temperature!);
            const validHumidities = readings.filter(r => r.humidity != null).map(r => r.humidity!);
            const validPressures = readings.filter(r => r.pressure != null).map(r => r.pressure!);
            const validWindSpeeds = readings.filter(r => r.windSpeed != null).map(r => r.windSpeed!);
            const validWindGusts = readings.filter(r => r.windGust != null).map(r => r.windGust!);
            const validPrecipitations = readings.filter(r => r.precipitation1h != null).map(r => r.precipitation1h!);

            return {
                count: readings.length,
                avgTemperature: validTemperatures.length > 0
                    ? validTemperatures.reduce((a, b) => a + b, 0) / validTemperatures.length
                    : undefined,
                avgHumidity: validHumidities.length > 0
                    ? validHumidities.reduce((a, b) => a + b, 0) / validHumidities.length
                    : undefined,
                avgPressure: validPressures.length > 0
                    ? validPressures.reduce((a, b) => a + b, 0) / validPressures.length
                    : undefined,
                avgWindSpeed: validWindSpeeds.length > 0
                    ? validWindSpeeds.reduce((a, b) => a + b, 0) / validWindSpeeds.length
                    : undefined,
                maxWindGust: validWindGusts.length > 0
                    ? Math.max(...validWindGusts)
                    : undefined,
                totalPrecipitation: validPrecipitations.length > 0
                    ? validPrecipitations.reduce((a, b) => a + b, 0)
                    : undefined,
            };
        } catch (error) {
            console.error('Error getting aggregated data:', error);
            throw new Error('Failed to get aggregated data');
        }
    }

    /**
     * Transform database record to ISensorReading
     */
    private static transformToISensorReading(reading: any): ISensorReading {
        return {
            id: reading.id,
            timestamp: new Date(reading.timestamp),
            stationId: reading.station_id,
            temperature: reading.temperature ?? undefined,
            humidity: reading.humidity ?? undefined,
            pressure: reading.pressure ?? undefined,
            windSpeed: reading.wind_speed ?? undefined,
            windDirection: reading.wind_direction ?? undefined,
            windGust: reading.wind_gust ?? undefined,
            visibility: reading.visibility ?? undefined,
            precipitation1h: reading.precipitation_1h ?? undefined,
            precipitation3h: reading.precipitation_3h ?? undefined,
            precipitation6h: reading.precipitation_6h ?? undefined,
            precipitation24h: reading.precipitation_24h ?? undefined,
            weatherCode: reading.weather_code ?? undefined,
            weatherDescription: reading.weather_description ?? undefined,
            cloudCoverage: reading.cloud_coverage ?? undefined,
            cloudBase: reading.cloud_base ?? undefined,
            dewPoint: reading.dew_point ?? undefined,
            seaLevelPressure: reading.sea_level_pressure ?? undefined,
            altimeterSetting: reading.altimeter_setting ?? undefined,
            batteryVoltage: reading.battery_voltage ?? undefined,
            solarPanelVoltage: reading.solar_panel_voltage ?? undefined,
            signalStrength: reading.signal_strength ?? undefined,
            dataQuality: reading.data_quality ?? undefined,
        };
    }

    /**
     * Backward compatibility methods
     */
    static async insertMany(data: any[]): Promise<any> {
        const results = await Promise.allSettled(
            data.map(item => this.create(item))
        );

        return {
            insertedCount: results.filter(r => r.status === 'fulfilled').length,
            errors: results.filter(r => r.status === 'rejected').length,
        };
    }

    static async findMany_legacy(options?: any): Promise<any[]> {
        const transformedOptions = {
            limit: options?.take,
            offset: options?.skip,
            orderBy: (options?.orderBy?.timestamp === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc',
            startTime: options?.where?.timestamp?.gte,
            endTime: options?.where?.timestamp?.lte,
            stationId: options?.where?.stationId,
        };

        return this.findMany(transformedOptions);
    }
}

// Export singleton
export const localSensorReadingModel = LocalSensorReadingModel;
