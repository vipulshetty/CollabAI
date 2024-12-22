import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

// ...existing code...

app.use(async (req, res, next) => {
  req.supabase = supabase
  next()
})

// ...existing code...
