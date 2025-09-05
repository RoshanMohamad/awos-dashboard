// @ts-ignore
import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NEXT_PUBLIC_SUPABASE_URL: string
            NEXT_PUBLIC_SUPABASE_ANON_KEY: string
            SUPABASE_SERVICE_ROLE_KEY: string
        }
    }
}

// Simple server-side client for middleware
export const createSupabaseServerClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase server environment variables not found. Using mock client.')
        return {} as any
    }

    return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Admin client (for server-side operations that bypass RLS)
export const createSupabaseAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.warn('Supabase admin server environment variables not found. Using mock client.')
        return {} as any
    }

    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true
        }
    })
}
