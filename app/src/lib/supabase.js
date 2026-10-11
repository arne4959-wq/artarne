/* supabase.js — the one Supabase client of the site (URL and publishable key come from CONFIG in circles.js).
   The key is public by design: the access rules in supabase/migrations/001_init.sql protect the data. */
import {createClient} from '@supabase/supabase-js';
import {CONFIG} from 'virtual:circles/config';

export const supabaseReady = !!(CONFIG.supabaseUrl && CONFIG.supabaseKey);

let client = null;
export function supabase() {
  if (!supabaseReady) throw new Error('Supabase is not set up: fill supabaseUrl and supabaseKey in CONFIG (circles.js)');
  return client || (client = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey, {auth: {persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit'}}));
}
