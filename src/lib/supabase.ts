import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hzvhnsgpjdkarklaapgh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6dmhuc2dwamRrYXJrbGFhcGdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzk5NTMsImV4cCI6MjA5MDgxNTk1M30.AzivPTT7HYliBcyP1zyNwh9MZlro0P2kSgyhNEBaYU8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
