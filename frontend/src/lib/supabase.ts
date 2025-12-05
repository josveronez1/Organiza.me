import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dwgbubuwohmodpxzoudl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3Z2J1YnV3b2htb2RweHpvdWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjE0MDAsImV4cCI6MjA4MDMzNzQwMH0.zgetCqCQCORu9IzRM0Pb0Z9D9wfi3kTepWXaonIPlGw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)




