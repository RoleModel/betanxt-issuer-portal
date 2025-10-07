import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const clients = [
  {
    id: 'd607d704-0222-5a41-abd8-552ffa17c36c',
    ticker: 'WEN',
    company_name: "Wendy's Company",
    short_name: 'Wendys',
    meeting_id: 'wen-annual-meeting-2026'
  },
  {
    id: '8c82a7c6-fd87-570a-a13a-ed4e97c2e5f7',
    ticker: 'ELVN',
    company_name: 'Enliven Therapeutics',
    short_name: 'Enliven',
    meeting_id: 'elvn-annual-meeting-2026'
  },
  {
    id: '02ddeb48-9faf-5caf-91ad-60e9d0ba928c',
    ticker: 'PAYC',
    company_name: 'Paycom Software',
    short_name: 'Paycom',
    meeting_id: 'payc-annual-meeting-2026'
  },
  {
    id: 'deb3dd1b-5c37-5876-a40b-eea42a5dd7b7',
    ticker: 'WWD',
    company_name: 'Woodward Inc',
    short_name: 'Woodward',
    meeting_id: 'wwd-annual-meeting-2026'
  }
]

async function seedClients() {
  console.log('Deleting existing clients...')
  await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  
  console.log('Inserting clients...')
  const { data, error } = await supabase.from('clients').insert(clients)
  
  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }
  
  console.log('✅ Successfully seeded', clients.length, 'clients')
}

seedClients()
