/**
 * Fetch brand logos and colors from Brandfetch API for all event companies.
 *
 * Usage: npx tsx issuer-portal/scripts/fetch-brands.ts
 *
 * Requires BRANDFETCH_API_KEY in issuer-portal/.env
 *
 * This script:
 * 1. Reads all unique company names from eventData.ts
 * 2. Fetches brand data (logos, colors) via the Brandfetch Brand API
 * 3. Downloads SVG/PNG logos to public/logos/brands/
 * 4. Writes a utils/brandConfig.ts mapping file
 */
import { config } from 'dotenv'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

import { brandConfigs } from '../utils/brandConfig'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env from issuer-portal directory
config({ path: path.resolve(__dirname, '../.env') })

const API_KEY = process.env.BRANDFETCH_API_KEY
if (!API_KEY) {
  console.error('Error: BRANDFETCH_API_KEY not found in .env')
  console.error('Get a free key at https://brandfetch.com/developers')
  process.exit(1)
}

const LOGOS_DIR = path.resolve(__dirname, '../public/logos/brands')
const CONFIG_PATH = path.resolve(__dirname, '../utils/brandConfig.ts')

// Get all company names from brandConfig
const uniqueCompanies = Object.keys(brandConfigs)

// Known domain mappings for companies that are hard to search
const KNOWN_DOMAINS: Record<string, string> = {
  'J.P. Morgan Real Estate Income Trust, Inc.': 'jpmorgan.com',
  'E2open Parent Holdings Inc.': 'e2open.com',
  'Champion Homes, Inc.': 'championhomes.com',
  'Bain Capital Specialty Finance, Inc': 'baincapital.com',
  'Shattuck Labs, Inc.': 'shattucklabs.com',
  'Nomad Foods Limited': 'nomadfoods.com',
  'Quest Resource Holding Corporation': 'questrmg.com',
  'SeaStar Medical Holding Corporation': 'seastarmedical.com',
  'Contineum Therapeutics, Inc.': 'contineum.com',
  'Enhabit, Inc.': 'enhabithomehealth.com',
  'Fulcrum Therapeutics, InG.': 'fulcrumtx.com',
  'Lineage Cell Therapeutics, Inc.': 'lineagecell.com',
  'Inozyme Pharma, Ins.': 'inozyme.com',
  'ARS Pharmaceuticals, Inc.': 'ars-pharma.com',
  'Gossamer Bio, Inc.': 'gossamerbio.com',
  'Affirm Holdings Inc.': 'affirm.com',
  'Aligos Therapeutics, Inc.': 'aligos.com',
  'Enliven Therapeutics, Inc.': 'enliventx.com',
  'Erasca, Inc.': 'erasca.com',
  'IDEAYA Biosciences, Inc': 'ideayabio.com',
  'Vivani Medical, Inc.': 'vivanimedical.com',
  'CalciMedica, Inc.': 'calcimedica.com',
  'Artiva Biotherapeutics, Inc.': 'artivabio.com',
  'HilleVax, Inc.': 'hillevax.com',
  'Telesis Bio Inc.': 'telesisbio.com',
  'Lithium Americas Corp.': 'lithiumamericas.com',
  'Western Alliance Bancorporation': 'westernalliancebank.com',
  "Portillo's Inc.": 'portillos.com',
  'Mondelez International, Inc.': 'mondelezinternational.com',
  'Donnelley Financial Solutions, Inc.': 'dfinsolutions.com',
  'Donnelley Financial Solutions Inc.': 'dfinsolutions.com',
  'IN8bio, Inc.': 'in8bio.com',
  'The Oncology Institute, Inc.': 'theoncologyinstitute.com',
  'Azitra, Inc.': 'azitra.com',
  'Woodward, Inc.': 'woodward.com',
  'Sonim Technologies, Inc.': 'sonimtech.com',
  'PROCORE TECHNOLOGIES, INC': 'procore.com',
  'PHX Minerals Inc.': 'phxmin.com',
  'Amerant Bancorp Inc.': 'amerantbank.com',
  'SQZ Biotechnologies Company': 'sqzbiotech.com',
  'SomaLogic, Inc.': 'somalogic.com',
  'Chindata Group Holdings Ltd': 'chindatagroup.com',
  'Frequency Therapeutics Inc.': 'frequencytx.com',
  'Ambrx Biopharma, Inc.': 'ambrx.com',
  'NexTier Oilfield Solutions Inc.': 'pfrcsolutions.com',
  'ILG Acquisition One Corp.': 'ilg.com',
  EnerSve: 'enersve.com',
  'Boundless Big Inc.': 'boundlessbio.com',
  'Yapotherm, Inc.': 'yapotherm.com',
}

interface BrandFormat {
  src: string
  format: string
  width?: number
  height?: number
}

interface BrandLogo {
  type: string
  theme: string
  formats: BrandFormat[]
}

interface BrandColor {
  hex: string
  type: string
  brightness: number
}

interface BrandResponse {
  name: string
  domain: string
  logos: BrandLogo[]
  colors: BrandColor[]
}

interface BrandConfigEntry {
  companyName: string
  domain: string
  logoPath: string
  iconPath: string
  primaryColor: string
  secondaryColor: string
}

async function searchBrandfetch(companyName: string): Promise<string | null> {
  if (KNOWN_DOMAINS[companyName]) {
    return KNOWN_DOMAINS[companyName]
  }

  try {
    const response = await fetch(
      `https://api.brandfetch.io/v2/search/${encodeURIComponent(companyName)}`,
      { headers: { Authorization: `Bearer ${API_KEY}` } }
    )
    if (!response.ok) return null
    const results = (await response.json()) as { domain: string; name: string }[]
    return results[0]?.domain ?? null
  } catch {
    return null
  }
}

async function fetchBrand(domain: string): Promise<BrandResponse | null> {
  try {
    const response = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    })
    if (!response.ok) {
      console.warn(`  Brand API returned ${response.status} for ${domain}`)
      return null
    }
    return (await response.json()) as BrandResponse
  } catch {
    return null
  }
}

function pickBestLogo(
  logos: BrandLogo[],
  preferredType: string,
  preferredTheme = 'light'
): BrandFormat | null {
  // Find logo matching type and theme
  const themed = logos.filter(
    (l) => l.type === preferredType && l.theme === preferredTheme
  )
  const typed = themed.length > 0 ? themed : logos.filter((l) => l.type === preferredType)
  const candidates = typed.length > 0 ? typed : logos

  if (candidates.length === 0) return null

  const logo = candidates[0]
  // Prefer SVG, then PNG
  const svg = logo.formats.find((f) => f.format === 'svg')
  if (svg) return svg
  const png = logo.formats.find((f) => f.format === 'png')
  if (png) return png
  return logo.formats[0] ?? null
}

async function downloadFile(url: string, destPath: string): Promise<boolean> {
  try {
    const response = await fetch(url)
    if (!response.ok) return false
    const buffer = Buffer.from(await response.arrayBuffer())
    fs.writeFileSync(destPath, buffer)
    return true
  } catch {
    return false
  }
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function main(): Promise<void> {
  // Ensure output directory exists
  if (!fs.existsSync(LOGOS_DIR)) {
    fs.mkdirSync(LOGOS_DIR, { recursive: true })
  }

  const configs: Record<string, BrandConfigEntry> = {}
  let processed = 0
  let fetched = 0

  for (const company of uniqueCompanies) {
    processed++
    console.log(`[${processed}/${uniqueCompanies.length}] ${company}`)

    // 1. Find domain
    const domain = await searchBrandfetch(company)
    if (!domain) {
      console.warn(`  Could not find domain for "${company}" - skipping`)
      continue
    }
    console.log(`  Domain: ${domain}`)

    // 2. Fetch brand data
    const brand = await fetchBrand(domain)
    if (!brand) {
      console.warn(`  Could not fetch brand data for ${domain}`)
      continue
    }

    const slug = slugify(company)

    // 3. Download full logo
    const fullLogo = pickBestLogo(brand.logos, 'logo')
    let logoPath = ''
    if (fullLogo) {
      const ext = fullLogo.format === 'svg' ? 'svg' : 'png'
      const filename = `${slug}_logo.${ext}`
      const destPath = path.resolve(LOGOS_DIR, filename)
      const ok = await downloadFile(fullLogo.src, destPath)
      if (ok) {
        logoPath = `/logos/brands/${filename}`
        console.log(`  Logo: ${filename}`)
      }
    }

    // 4. Download icon/symbol
    const iconLogo =
      pickBestLogo(brand.logos, 'icon') ?? pickBestLogo(brand.logos, 'symbol')
    let iconPath = ''
    if (iconLogo) {
      const ext = iconLogo.format === 'svg' ? 'svg' : 'png'
      const filename = `${slug}_icon.${ext}`
      const destPath = path.resolve(LOGOS_DIR, filename)
      const ok = await downloadFile(iconLogo.src, destPath)
      if (ok) {
        iconPath = `/logos/brands/${filename}`
        console.log(`  Icon: ${filename}`)
      }
    }

    // 5. Extract colors
    const primaryColor =
      brand.colors.find((c) => c.type === 'accent')?.hex ??
      brand.colors.find((c) => c.type === 'brand')?.hex ??
      brand.colors[0]?.hex ??
      '#333333'
    const secondaryColor =
      brand.colors.find((c) => c.type === 'dark')?.hex ??
      brand.colors.find((c) => c.type === 'brand' && c.hex !== primaryColor)?.hex ??
      brand.colors[1]?.hex ??
      primaryColor

    configs[company] = {
      companyName: brand.name || company,
      domain,
      logoPath: logoPath || iconPath,
      iconPath: iconPath || logoPath,
      primaryColor,
      secondaryColor,
    }

    fetched++

    // Small delay to respect rate limits
    await new Promise((r) => setTimeout(r, 250))
  }

  // 6. Write brand config TypeScript file
  const entries = Object.entries(configs)
    .map(([key, val]) => {
      const safeKey = key.includes("'") ? `"${key}"` : `'${key}'`
      return `  ${safeKey}: {
    companyName: '${val.companyName.replace(/'/g, "\\'")}',
    domain: '${val.domain}',
    logoPath: '${val.logoPath}',
    iconPath: '${val.iconPath}',
    primaryColor: '${val.primaryColor}',
    secondaryColor: '${val.secondaryColor}',
  }`
    })
    .join(',\n')

  const configContent = `/**
 * Auto-generated brand configuration for event companies.
 * Generated by: npx tsx issuer-portal/scripts/fetch-brands.ts
 * Do not edit manually — re-run the script to update.
 */

export interface BrandConfig {
  companyName: string
  domain: string
  logoPath: string
  iconPath: string
  primaryColor: string
  secondaryColor: string
}

export const brandConfigs: Record<string, BrandConfig> = {
${entries}
}

/** Look up brand config by event/company name */
export function getBrandConfig(companyName: string): BrandConfig | null {
  return brandConfigs[companyName] ?? null
}

/** Get the logo path for a company, with fallback */
export function getBrandLogoPath(companyName: string, fallback = '/images/logo.svg'): string {
  return brandConfigs[companyName]?.logoPath || fallback
}

/** Get the icon path for a company, with fallback */
export function getBrandIconPath(companyName: string, fallback = '/images/logo.svg'): string {
  return brandConfigs[companyName]?.iconPath || fallback
}
`
  fs.writeFileSync(CONFIG_PATH, configContent, 'utf-8')
  console.log(`\\nWrote brand config to ${CONFIG_PATH}`)
  console.log(`Fetched ${fetched} / ${uniqueCompanies.length} brands`)
}

main().catch(console.error)
