import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from './supabase'

// Simple server-side client for middleware
export const createSupabaseServerClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase server environment variables not found. Using mock client.')
        return {} as any
    }

    return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
}

// Admin client (for server-side operations that bypass RLS)
export const createSupabaseAdminClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        console.warn('Supabase admin server environment variables not found. Using mock client.')
        return {} as any
    }

    return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true
        }
    })
}
