
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (window as any).process?.env?.SUPABASE_URL || '';
const supabaseAnonKey = (window as any).process?.env?.SUPABASE_ANON_KEY || '';

// Jika di lingkungan browser tanpa process.env, ambil dari window jika tersedia atau gunakan string kosong
// Catatan: Di Vercel, variabel ini akan disuntikkan secara otomatis jika dikonfigurasi.
export const supabase = createClient(
  supabaseUrl || 'https://your-project-url.supabase.co',
  supabaseAnonKey || 'your-anon-key'
);
