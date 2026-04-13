import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://btczfwdijzjeyaancmkj.supabase.co'
const supabaseKey = 'sb_publishable_eb6Tprz4tktMBij99KndEg_kLKzSGM9'

export const supabase = createClient(supabaseUrl, supabaseKey)