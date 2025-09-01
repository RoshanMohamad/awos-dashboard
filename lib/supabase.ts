import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

// Types for our database tables
export interface Database {
    public: {
        Tables: {
            sensor_readings: {
                Row: {
                    id: string
                    timestamp: string
                    station_id: string
                    temperature: number | null
                    humidity: number | null
                    pressure: number | null
                    wind_speed: number | null
                    wind_direction: number | null
                    wind_gust: number | null
                    visibility: number | null
                    precipitation_1h: number | null
                    precipitation_3h: number | null
                    precipitation_6h: number | null
                    precipitation_24h: number | null
                    weather_code: number | null
                    weather_description: string | null
                    cloud_coverage: number | null
                    cloud_base: number | null
                    dew_point: number | null
                    sea_level_pressure: number | null
                    altimeter_setting: number | null
                    battery_voltage: number | null
                    solar_panel_voltage: number | null
                    signal_strength: number | null
                    data_quality: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    timestamp?: string
                    station_id?: string
                    temperature?: number | null
                    humidity?: number | null
                    pressure?: number | null
                    wind_speed?: number | null
                    wind_direction?: number | null
                    wind_gust?: number | null
                    visibility?: number | null
                    precipitation_1h?: number | null
                    precipitation_3h?: number | null
                    precipitation_6h?: number | null
                    precipitation_24h?: number | null
                    weather_code?: number | null
                    weather_description?: string | null
                    cloud_coverage?: number | null
                    cloud_base?: number | null
                    dew_point?: number | null
                    sea_level_pressure?: number | null
                    altimeter_setting?: number | null
                    battery_voltage?: number | null
                    solar_panel_voltage?: number | null
                    signal_strength?: number | null
                    data_quality?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    timestamp?: string
                    station_id?: string
                    temperature?: number | null
                    humidity?: number | null
                    pressure?: number | null
                    wind_speed?: number | null
                    wind_direction?: number | null
                    wind_gust?: number | null
                    visibility?: number | null
                    precipitation_1h?: number | null
                    precipitation_3h?: number | null
                    precipitation_6h?: number | null
                    precipitation_24h?: number | null
                    weather_code?: number | null
                    weather_description?: string | null
                    cloud_coverage?: number | null
                    cloud_base?: number | null
                    dew_point?: number | null
                    sea_level_pressure?: number | null
                    altimeter_setting?: number | null
                    battery_voltage?: number | null
                    solar_panel_voltage?: number | null
                    signal_strength?: number | null
                    data_quality?: string
                    created_at?: string
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Client-side Supabase client - Modern approach
export const createClient = (): SupabaseClient<Database> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        // Return a mock client for build time when environment variables are not available
        console.warn('Supabase environment variables not found. Using mock client.')
        return {} as SupabaseClient<Database>
    }

    return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        },
        db: {
            schema: 'public'
        }
    })
}

// Server-side Supabase admin client - Uses service role key for privileged operations
export const createAdminClient = (): SupabaseClient<Database> => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        // Return a mock client for build time when environment variables are not available
        console.warn('Supabase admin environment variables not found. Using mock client.')
        return {} as SupabaseClient<Database>
    }

    return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
        db: {
            schema: 'public'
        }
    })
}
