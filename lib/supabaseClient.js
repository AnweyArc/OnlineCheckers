import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lcbkpjwpwxaqkhmyrjsh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjYmtwandwd3hhcWtobXlyanNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2NTk0OTcsImV4cCI6MjA2MzIzNTQ5N30.nRCuPeBowzec0h7ssc2Ixy3NIL2W8W5PlkrkRmINAQI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
