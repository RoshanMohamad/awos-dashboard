import { createClient, createAdminClient, Database } from '@/lib/supabase';
import { ISensorReading, SensorReadingInput } from '@/types/sensorReading';

export class SensorReadingModel {
    /**
     * Create a new sensor reading in the database
     */
    static async create(data: SensorReadingInput): Promise<ISensorReading> {
        try {
            const supabase = createAdminClient();

            const sensorData = {
                station_id: data.stationId || 'VCBI',
                timestamp: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString(),
                temperature: data.temperature,
                humidity: data.humidity,
                pressure: data.pressure,
                wind_speed: data.windSpeed,
                wind_direction: data.windDirection,
                wind_gust: data.windGust,
                visibility: data.visibility,
                precipitation_1h: data.precipitation1h,
                precipitation_3h: data.precipitation3h,
                precipitation_6h: data.precipitation6h,
                precipitation_24h: data.precipitation24h,
                weather_code: data.weatherCode,
                weather_description: data.weatherDescription,
                cloud_coverage: data.cloudCoverage,
                cloud_base: data.cloudBase,
                dew_point: data.dewPoint,
                sea_level_pressure: data.seaLevelPressure,
                altimeter_setting: data.altimeterSetting,
                battery_voltage: data.batteryVoltage,
                solar_panel_voltage: data.solarPanelVoltage,
                signal_strength: data.signalStrength,
                data_quality: data.dataQuality || 'good',
            };


            const { data: reading, error } = await supabase
                .from('sensor_readings')
                .insert(sensorData as any)
                .select()
                .single();

            if (error) {
                console.error('Supabase error creating sensor reading:', error);
                throw new Error(`Failed to create sensor reading: ${error.message}`);
            }

            if (!reading) {
                throw new Error('Supabase did not return the created sensor reading');
            }

            const typedReading = reading as Database['public']['Tables']['sensor_readings']['Row'];

            return {
                id: typedReading.id,
                timestamp: new Date(typedReading.timestamp),
                stationId: typedReading.station_id,
                temperature: typedReading.temperature ?? undefined,
                humidity: typedReading.humidity ?? undefined,
                pressure: typedReading.pressure ?? undefined,
                windSpeed: typedReading.wind_speed ?? undefined,
                windDirection: typedReading.wind_direction ?? undefined,
                windGust: typedReading.wind_gust ?? undefined,
                visibility: typedReading.visibility ?? undefined,
                precipitation1h: typedReading.precipitation_1h ?? undefined,
                precipitation3h: typedReading.precipitation_3h ?? undefined,
                precipitation6h: typedReading.precipitation_6h ?? undefined,
                precipitation24h: typedReading.precipitation_24h ?? undefined,
                weatherCode: typedReading.weather_code ?? undefined,
                weatherDescription: typedReading.weather_description ?? undefined,
                cloudCoverage: typedReading.cloud_coverage ?? undefined,
                cloudBase: typedReading.cloud_base ?? undefined,
                dewPoint: typedReading.dew_point ?? undefined,
                seaLevelPressure: typedReading.sea_level_pressure ?? undefined,
                altimeterSetting: typedReading.altimeter_setting ?? undefined,
                batteryVoltage: typedReading.battery_voltage ?? undefined,
                solarPanelVoltage: typedReading.solar_panel_voltage ?? undefined,
                signalStrength: typedReading.signal_strength ?? undefined,
                dataQuality: typedReading.data_quality ?? undefined,
            };
        } catch (error) {
            console.error('Error creating sensor reading:', error);
            throw error instanceof Error ? error : new Error('Failed to create sensor reading');
        }
    }

    /**
     * Create a new sensor reading in the database using server-side admin client
     * Use this method for API routes and server-side operations
     */
    static async createServerSide(data: SensorReadingInput | any): Promise<ISensorReading> {
        try {
            const supabase = createAdminClient();

            // Handle timestamp conversion (accept Date or string)
            let timestampISO: string;
            if (data.timestamp instanceof Date) {
                timestampISO = data.timestamp.toISOString();
            } else if (data.timestamp) {
                timestampISO = new Date(data.timestamp).toISOString();
            } else {
                timestampISO = new Date().toISOString();
            }

            const sensorData = {
                station_id: data.stationId || 'VCBI',
                timestamp: timestampISO,
                temperature: data.temperature,
                humidity: data.humidity,
                pressure: data.pressure,
                wind_speed: data.windSpeed,
                wind_direction: data.windDirection,
                wind_gust: data.windGust,
                visibility: data.visibility,
                precipitation_1h: data.precipitation1h,
                precipitation_3h: data.precipitation3h,
                precipitation_6h: data.precipitation6h,
                precipitation_24h: data.precipitation24h,
                weather_code: data.weatherCode,
                weather_description: data.weatherDescription,
                cloud_coverage: data.cloudCoverage,
                cloud_base: data.cloudBase,
                dew_point: data.dewPoint,
                sea_level_pressure: data.seaLevelPressure,
                altimeter_setting: data.altimeterSetting,
                battery_voltage: data.batteryVoltage,
                solar_panel_voltage: data.solarPanelVoltage,
                signal_strength: data.signalStrength,
                data_quality: data.dataQuality || 'good',
            };

            const { data: reading, error } = await supabase
                .from('sensor_readings')
                .insert(sensorData as any)
                .select()
                .single();

            if (error) {
                console.error('Supabase admin error creating sensor reading:', error);
                throw new Error(`Failed to create sensor reading: ${error.message}`);
            }

            if (!reading) {
                throw new Error('Supabase admin client did not return the created sensor reading');
            }

            const typedReading = reading as Database['public']['Tables']['sensor_readings']['Row'];

            return {
                id: typedReading.id,
                timestamp: new Date(typedReading.timestamp),
                stationId: typedReading.station_id,
                temperature: typedReading.temperature ?? undefined,
                humidity: typedReading.humidity ?? undefined,
                pressure: typedReading.pressure ?? undefined,
                windSpeed: typedReading.wind_speed ?? undefined,
                windDirection: typedReading.wind_direction ?? undefined,
                windGust: typedReading.wind_gust ?? undefined,
                visibility: typedReading.visibility ?? undefined,
                precipitation1h: typedReading.precipitation_1h ?? undefined,
                precipitation3h: typedReading.precipitation_3h ?? undefined,
                precipitation6h: typedReading.precipitation_6h ?? undefined,
                precipitation24h: typedReading.precipitation_24h ?? undefined,
                weatherCode: typedReading.weather_code ?? undefined,
                weatherDescription: typedReading.weather_description ?? undefined,
                cloudCoverage: typedReading.cloud_coverage ?? undefined,
                cloudBase: typedReading.cloud_base ?? undefined,
                dewPoint: typedReading.dew_point ?? undefined,
                seaLevelPressure: typedReading.sea_level_pressure ?? undefined,
                altimeterSetting: typedReading.altimeter_setting ?? undefined,
                batteryVoltage: typedReading.battery_voltage ?? undefined,
                solarPanelVoltage: typedReading.solar_panel_voltage ?? undefined,
                signalStrength: typedReading.signal_strength ?? undefined,
                dataQuality: typedReading.data_quality ?? undefined,
            };
        } catch (error) {
            console.error('Error creating sensor reading (server-side):', error);
            throw error instanceof Error ? error : new Error('Failed to create sensor reading');
        }
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
            const supabase = createAdminClient();
            const {
                stationId,
                startTime,
                endTime,
                limit = 100,
                offset = 0,
                orderBy = 'desc'
            } = options;

            let query = supabase
                .from('sensor_readings')
                .select('*');

            if (stationId) {
                query = query.eq('station_id', stationId);
            }

            if (startTime) {
                query = query.gte('timestamp', startTime.toISOString());
            }

            if (endTime) {
                query = query.lte('timestamp', endTime.toISOString());
            }

            query = query
                .order('timestamp', { ascending: orderBy === 'asc' })
                .range(offset, offset + limit - 1);

            const { data: readings, error } = await query;

            if (error) {
                console.error('Supabase error fetching sensor readings:', error);
                throw new Error(`Failed to fetch sensor readings: ${error.message}`);
            }

            return (readings || []).map((reading) => {
                const typedReading = reading as Database['public']['Tables']['sensor_readings']['Row'];
                return {
                    id: typedReading.id,
                    timestamp: new Date(typedReading.timestamp),
                    stationId: typedReading.station_id,
                    temperature: typedReading.temperature ?? undefined,
                    humidity: typedReading.humidity ?? undefined,
                    pressure: typedReading.pressure ?? undefined,
                    windSpeed: typedReading.wind_speed ?? undefined,
                    windDirection: typedReading.wind_direction ?? undefined,
                    windGust: typedReading.wind_gust ?? undefined,
                    visibility: typedReading.visibility ?? undefined,
                    precipitation1h: typedReading.precipitation_1h ?? undefined,
                    precipitation3h: typedReading.precipitation_3h ?? undefined,
                    precipitation6h: typedReading.precipitation_6h ?? undefined,
                    precipitation24h: typedReading.precipitation_24h ?? undefined,
                    weatherCode: typedReading.weather_code ?? undefined,
                    weatherDescription: typedReading.weather_description ?? undefined,
                    cloudCoverage: typedReading.cloud_coverage ?? undefined,
                    cloudBase: typedReading.cloud_base ?? undefined,
                    dewPoint: typedReading.dew_point ?? undefined,
                    seaLevelPressure: typedReading.sea_level_pressure ?? undefined,
                    altimeterSetting: typedReading.altimeter_setting ?? undefined,
                    batteryVoltage: typedReading.battery_voltage ?? undefined,
                    solarPanelVoltage: typedReading.solar_panel_voltage ?? undefined,
                    signalStrength: typedReading.signal_strength ?? undefined,
                    dataQuality: typedReading.data_quality ?? undefined,
                };
            });
        } catch (error) {
            console.error('Error fetching sensor readings:', error);
            throw error instanceof Error ? error : new Error('Failed to fetch sensor readings');
        }
    }

    /**
     * Get a single sensor reading by ID
     */
    static async findById(id: string): Promise<ISensorReading | null> {
        try {
            const supabase = createAdminClient();

            const { data: reading, error } = await supabase
                .from('sensor_readings')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return null; // No rows returned
                }
                console.error('Supabase error fetching sensor reading by ID:', error);
                throw new Error(`Failed to fetch sensor reading: ${error.message}`);
            }

            if (!reading) {
                return null;
            }

            const typedReading = reading as Database['public']['Tables']['sensor_readings']['Row'];

            return {
                id: typedReading.id,
                timestamp: new Date(typedReading.timestamp),
                stationId: typedReading.station_id,
                temperature: typedReading.temperature ?? undefined,
                humidity: typedReading.humidity ?? undefined,
                pressure: typedReading.pressure ?? undefined,
                windSpeed: typedReading.wind_speed ?? undefined,
                windDirection: typedReading.wind_direction ?? undefined,
                windGust: typedReading.wind_gust ?? undefined,
                visibility: typedReading.visibility ?? undefined,
                precipitation1h: typedReading.precipitation_1h ?? undefined,
                precipitation3h: typedReading.precipitation_3h ?? undefined,
                precipitation6h: typedReading.precipitation_6h ?? undefined,
                precipitation24h: typedReading.precipitation_24h ?? undefined,
                weatherCode: typedReading.weather_code ?? undefined,
                weatherDescription: typedReading.weather_description ?? undefined,
                cloudCoverage: typedReading.cloud_coverage ?? undefined,
                cloudBase: typedReading.cloud_base ?? undefined,
                dewPoint: typedReading.dew_point ?? undefined,
                seaLevelPressure: typedReading.sea_level_pressure ?? undefined,
                altimeterSetting: typedReading.altimeter_setting ?? undefined,
                batteryVoltage: typedReading.battery_voltage ?? undefined,
                solarPanelVoltage: typedReading.solar_panel_voltage ?? undefined,
                signalStrength: typedReading.signal_strength ?? undefined,
                dataQuality: typedReading.data_quality ?? undefined,
            };
        } catch (error) {
            console.error('Error fetching sensor reading by ID:', error);
            throw error instanceof Error ? error : new Error('Failed to fetch sensor reading');
        }
    }

    /**
     * Get the latest sensor reading for a station
     */
    static async findLatest(stationId?: string): Promise<ISensorReading | null> {
        try {
            const supabase = createAdminClient();

            let query = supabase
                .from('sensor_readings')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(1);

            if (stationId) {
                query = query.eq('station_id', stationId);
            }

            const { data: readings, error } = await query;

            if (error) {
                console.error('Supabase error fetching latest sensor reading:', error);
                throw new Error(`Failed to fetch latest sensor reading: ${error.message}`);
            }

            if (!readings || readings.length === 0) {
                return null;
            }

            const reading = readings[0];
            const typedReading = reading as Database['public']['Tables']['sensor_readings']['Row'];

            return {
                id: typedReading.id,
                timestamp: new Date(typedReading.timestamp),
                stationId: typedReading.station_id,
                temperature: typedReading.temperature ?? undefined,
                humidity: typedReading.humidity ?? undefined,
                pressure: typedReading.pressure ?? undefined,
                windSpeed: typedReading.wind_speed ?? undefined,
                windDirection: typedReading.wind_direction ?? undefined,
                windGust: typedReading.wind_gust ?? undefined,
                visibility: typedReading.visibility ?? undefined,
                precipitation1h: typedReading.precipitation_1h ?? undefined,
                precipitation3h: typedReading.precipitation_3h ?? undefined,
                precipitation6h: typedReading.precipitation_6h ?? undefined,
                precipitation24h: typedReading.precipitation_24h ?? undefined,
                weatherCode: typedReading.weather_code ?? undefined,
                weatherDescription: typedReading.weather_description ?? undefined,
                cloudCoverage: typedReading.cloud_coverage ?? undefined,
                cloudBase: typedReading.cloud_base ?? undefined,
                dewPoint: typedReading.dew_point ?? undefined,
                seaLevelPressure: typedReading.sea_level_pressure ?? undefined,
                altimeterSetting: typedReading.altimeter_setting ?? undefined,
                batteryVoltage: typedReading.battery_voltage ?? undefined,
                solarPanelVoltage: typedReading.solar_panel_voltage ?? undefined,
                signalStrength: typedReading.signal_strength ?? undefined,
                dataQuality: typedReading.data_quality ?? undefined,
            };
        } catch (error) {
            console.error('Error fetching latest sensor reading:', error);
            throw error instanceof Error ? error : new Error('Failed to fetch latest sensor reading');
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
                limit: 10000, // Reasonable limit for aggregation
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
     * Backward compatibility methods for existing code
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

// Legacy compatibility export
export const SensorReading = {
    create: (data: any) => SensorReadingModel.create(data),
    findMany: (options?: any) => SensorReadingModel.findMany_legacy(options),
    findUnique: (options: any) => SensorReadingModel.findById(options.where.id),
    findFirst: (options?: any) => SensorReadingModel.findLatest(options?.where?.stationId),
    insertMany: (data: any[]) => SensorReadingModel.insertMany(data),
};

export default SensorReadingModel;
