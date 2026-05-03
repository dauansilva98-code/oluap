import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://haxonnnbycypirigxsvj.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhheG9ubm5ieWN5cGlyaWd4c3ZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNTYwMzEsImV4cCI6MjA4OTYzMjAzMX0.keYNqjbu7DxBYV9f4_HW1MTaP1_TJZ_bNDTRIvSeSYw'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
