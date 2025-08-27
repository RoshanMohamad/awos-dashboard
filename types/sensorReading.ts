// Core sensor reading interface - used across the application
export interface ISensorReading {
    id: string;
    timestamp: Date;
    stationId: string;

    // Temperature readings (Celsius)
    temperature?: number | undefined;
    humidity?: number | undefined;

    // Pressure readings (hPa)
    pressure?: number | undefined;

    // Wind readings
    windSpeed?: number | undefined; // knots
    windDirection?: number | undefined; // degrees (0-360)
    windGust?: number | undefined; // knots

    // Visibility (meters)
    visibility?: number | undefined;

    // Precipitation
    precipitation1h?: number | undefined; // mm in last hour
    precipitation3h?: number | undefined; // mm in last 3 hours
    precipitation6h?: number | undefined; // mm in last 6 hours
    precipitation24h?: number | undefined; // mm in last 24 hours

    // Weather conditions
    weatherCode?: number | undefined;
    weatherDescription?: string | undefined;

    // Cloud information
    cloudCoverage?: number | undefined; // percentage (0-100)
    cloudBase?: number | undefined; // feet

    // Additional meteorological data
    dewPoint?: number | undefined; // Celsius
    seaLevelPressure?: number | undefined; // hPa
    altimeterSetting?: number | undefined; // inHg

    // System status
    batteryVoltage?: number | undefined;
    solarPanelVoltage?: number | undefined;
    signalStrength?: number | undefined; // dBm

    // Quality indicators
    dataQuality?: string | undefined;
}

// Input type for creating new sensor readings
export interface SensorReadingInput {
    timestamp?: string;
    stationId?: string ;
    temperature?: number | undefined;
    humidity?: number | undefined;
    pressure?: number | undefined;
    windSpeed?: number | undefined;
    windDirection?: number | undefined;
    windGust?: number | undefined;
    visibility?: number | undefined;
    precipitation1h?: number | undefined;
    precipitation3h?: number | undefined;
    precipitation6h?: number | undefined;
    precipitation24h?: number | undefined;
    weatherCode?: number | undefined;
    weatherDescription?: string | undefined;
    cloudCoverage?: number | undefined;
    cloudBase?: number | undefined;
    dewPoint?: number | undefined;
    seaLevelPressure?: number | undefined;
    altimeterSetting?: number | undefined;
    batteryVoltage?: number | undefined;
    solarPanelVoltage?: number | undefined;
    signalStrength?: number | undefined;
    dataQuality?: string;
}

// Legacy types for backward compatibility
export type SensorReading = ISensorReading;
export type NewSensorReading = SensorReadingInput;

// Sensor status type
export interface ISensorStatus {
    windSensor?: boolean | undefined;
    pressureSensor?: boolean | undefined;
    temperatureSensor?: boolean | undefined;
    humiditySensor?: boolean | undefined;
    visibilitySensor?: boolean | undefined;
    precipitationSensor?: boolean | undefined;
}

// Legacy sensor status type
export type SensorStatus = ISensorStatus;
