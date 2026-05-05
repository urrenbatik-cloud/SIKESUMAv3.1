typescriptimport { createClient } from '@supabase/supabase-js';

// Supabase Project: urrenbatik-cloud's Project (SIKESUMAv3.1)
const supabaseUrl = 'https://qjijsftbytozcoyrtric.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqaWpzZnRieXRvemNveXJ0cmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzU0NjcsImV4cCI6MjA4NjE1MTQ2N30.xhTQedwot78BMLoeiaSpBs6wGjb3zhZhnf6_jld14qA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
