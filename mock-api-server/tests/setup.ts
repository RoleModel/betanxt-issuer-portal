import { config } from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function globalSetup() {
  // Load environment variables for tests
  config({ path: path.join(__dirname, '../.env.local') })
  config({ path: path.join(__dirname, '../.env.development.local') })

  // Validate required environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Warning: Missing required environment variables for tests')
    console.warn('SUPABASE_URL:', !!process.env.SUPABASE_URL)
    console.warn('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  }
}

export default globalSetup
