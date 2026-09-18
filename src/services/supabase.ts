import { createClient } from '@supabase/supabase-js';

// Safe environment variable retrieval
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://stockspot-demo.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy_anon_key_for_stockspot_offline_mode';

export const isSupabaseConfigured = Boolean(
  (import.meta as any).env?.VITE_SUPABASE_URL && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
