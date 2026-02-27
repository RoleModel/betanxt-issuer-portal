#!/usr/bin/env node
/**
 * SEC EDGAR DEF 14A Proxy Scraper
 *
 * Fetches real proxy statement data for all companies in seed.config.ts
 * from SEC EDGAR and writes meeting_info and proposals CSVs to /data.
 *
 * Usage:  node scripts/scrape-sec-proxy-data.mjs
 *
 * EDGAR API rate limit: 10 requests/sec with User-Agent header required.
 * https://www.sec.gov/os/accessing-edgar-data
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DATA_DIR = join(__dirname, '..', 'data')
const CACHE_FILE = join(DATA_DIR, '.sec-cache.json')

// SEC requires a descriptive User-Agent
const USER_AGENT = 'BetaNXT-IssuerPortal-Dev dev@rolemodel.com'
const EFTS_BASE = 'https://efts.sec.gov/LATEST/search-index'
const EDGAR_SEARCH = 'https://efts.sec.gov/LATEST/search-index'
const FULL_TEXT = 'https://efts.sec.gov/LATEST/search-index'

// Rate limiter – max 8 req/s to stay comfortably under SEC's 10/s limit
let lastRequestTime = 0
async function rateLimited(url, options = {}) {
  const now = Date.now()
  const wait = Math.max(0, 125 - (now - lastRequestTime))
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastRequestTime = Date.now()

  const resp = await fetch(url, {
    ...options,
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'application/json, text/html, */*',
      ...options.headers,
    },
  })
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} for ${url}`)
  }
  return resp
}

// ─── Company list ──────────────────────────────────────────────────────────
// Read directly from seed.config.ts so we stay in sync.
function loadCompanies() {
  const configPath = join(__dirname, '..', 'supabase', 'seed.config.ts')
  const src = readFileSync(configPath, 'utf-8')

  const companies = []
  // Match each client block
  const clientBlockRegex = /\{\s*ticker:\s*'([^']+)',\s*companyName:\s*'([^']+)'/g
  let m
  while ((m = clientBlockRegex.exec(src)) !== null) {
    companies.push({ ticker: m[1], companyName: m[2] })
  }
  return companies
}

// ─── Step 1: Resolve CIK for each ticker ───────────────────────────────────
async function resolveCIK(ticker) {
  try {
    const resp = await rateLimited(
      `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=&CIK=${encodeURIComponent(ticker)}&type=DEF+14A&dateb=&owner=include&count=1&search_text=&action=getcompany`,
      { headers: { Accept: 'text/html' } }
    )
    const html = await resp.text()
    // Extract CIK from the page
    const cikMatch = /CIK[#=: ]*(\d{7,10})/.exec(html)
    if (cikMatch) return cikMatch[1].replace(/^0+/, '')

    // Try from company tickers JSON
    const resp2 = await rateLimited(`https://www.sec.gov/files/company_tickers.json`)
    const tickers = await resp2.json()
    for (const entry of Object.values(tickers)) {
      if (entry.ticker === ticker) return String(entry.cik_str)
    }
    return null
  } catch (e) {
    console.error(`  ✗ CIK resolution failed for ${ticker}: ${e.message}`)
    return null
  }
}

// ─── Step 2: Find latest DEF 14A filing URL ────────────────────────────────
async function findLatestDEF14A(cik) {
  try {
    const paddedCIK = cik.padStart(10, '0')
    const resp = await rateLimited(
      `https://data.sec.gov/submissions/CIK${paddedCIK}.json`
    )
    const data = await resp.json()

    // Search recent filings for DEF 14A
    const filings = data.filings?.recent
    if (!filings) return null

    for (let i = 0; i < filings.form.length; i++) {
      if (filings.form[i] === 'DEF 14A') {
        const accession = filings.accessionNumber[i].replace(/-/g, '')
        const primaryDoc = filings.primaryDocument[i]
        return {
          url: `https://www.sec.gov/Archives/edgar/data/${cik}/${accession}/${primaryDoc}`,
          filingDate: filings.filingDate[i],
          accession: filings.accessionNumber[i],
        }
      }
    }
    return null
  } catch (e) {
    console.error(`  ✗ Filing search failed for CIK ${cik}: ${e.message}`)
    return null
  }
}

// ─── Step 3: Parse the DEF 14A HTML for meeting details ─────────────────────
function extractMeetingDetails(html, companyName) {
  const result = {
    company: companyName,
    cusip: '',
    meetingType: 'Annual Meeting',
    recordDate: '',
    meetingDate: '',
    cutoffDate: '',
  }

  // Detect meeting type
  if (/special\s+meeting/i.test(html)) {
    result.meetingType = 'Special Meeting'
  }

  // Extract record date – look for common patterns
  const recordPatterns = [
    /record\s+date[^.]*?(?:is|of|was|:)\s*([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /(?:close\s+of\s+business\s+on|as\s+of)\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    /record\s+date[^.]*?([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
  ]
  for (const pat of recordPatterns) {
    const m = pat.exec(html)
    if (m) {
      result.recordDate = m[1].replace(/,(\d)/, ', $1')
      break
    }
  }

  // Extract meeting date
  const meetingPatterns = [
    // "Annual Meeting of Stockholders ... on May 21, 2025"
    /(?:annual|special)\s+meeting[^.]*?(?:on|held\s+on|scheduled\s+for)\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    // "will be held on May 21, 2025"
    /(?:will\s+be\s+held|to\s+be\s+held)\s+(?:on\s+)?([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i,
    // "meeting ... May 21, 2025, at 10:00 a.m."
    /meeting[^.]*?([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})\s*,?\s*(?:at\s+)?(\d{1,2}:\d{2}\s*(?:a\.?m\.?|p\.?m\.?))/i,
  ]
  for (const pat of meetingPatterns) {
    const m = pat.exec(html)
    if (m) {
      let date = m[1].replace(/,(\d)/, ', $1')
      // Try to get time if present
      const timeMatch =
        /([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})\s*,?\s*(?:at\s+)?(\d{1,2}:\d{2}\s*(?:a\.?m\.?|p\.?m\.?))\s*((?:Eastern|Central|Pacific|Mountain|Local)\s*(?:Time|Daylight\s*Time|Standard\s*Time)?)?/i.exec(
          html
        )
      if (timeMatch) {
        date = timeMatch[1].replace(/,(\d)/, ', $1')
        const time = timeMatch[2]
          .replace(/\./g, '')
          .toUpperCase()
          .replace(/(\d)(AM|PM)/, '$1 $2')
        const tz = timeMatch[3] || 'Eastern Time'
        result.meetingDate = `${date}, ${time} ${tz}`
      } else {
        result.meetingDate = date
      }
      break
    }
  }

  // Extract CUSIP
  const cusipPatterns = [
    /CUSIP[^:]*?(?:No\.?|Number|#)?[:\s]+(\d{6}[A-Z0-9]\d{2})/i,
    /(\d{6}[A-Z]\d{2})\s*[-–—]\s*(?:Common\s+Stock|Class\s+[A-Z])/i,
    /CUSIP[^.]*?(\d{6}[A-Z0-9]\d{2})/i,
  ]
  for (const pat of cusipPatterns) {
    const m = pat.exec(html)
    if (m) {
      result.cusip = m[1]
      break
    }
  }

  return result
}

// ─── Step 4: Extract proposals from DEF 14A ────────────────────────────────
function extractProposals(html) {
  const proposals = []

  // Remove HTML tags but keep text content
  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|td|th|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '')
    .replace(/\s+/g, ' ')

  // Pattern 1: "Proposal No. 1" or "Proposal 1:" or "Item 1."
  const proposalHeaders = [
    /Proposal\s+(?:No\.?\s*)?(\d+(?:\.\d+)?)\s*[-–—:\.]\s*([^\n.]{10,200})/gi,
    /Item\s+(\d+(?:\.\d+)?)\s*[-–—:\.]\s*([^\n.]{10,200})/gi,
  ]

  for (const pat of proposalHeaders) {
    let m
    while ((m = pat.exec(text)) !== null) {
      const number = m[1]
      let title = m[2].trim()
      // Clean up title
      title = title.replace(/\s+/g, ' ').trim()
      if (title.length > 200) title = title.slice(0, 197) + '...'

      // Skip if we already have this proposal number
      if (proposals.find((p) => p.number === number)) continue

      // Detect recommendation
      let recommendation = 'FOR'
      const nearbyText = text.slice(
        Math.max(0, m.index - 200),
        m.index + m[0].length + 500
      )
      if (
        /(?:board|management)\s+recommend(?:s|ation)?\s*(?:a\s+vote\s+)?(?:"|")?AGAINST/i.test(
          nearbyText
        )
      ) {
        recommendation = 'AGAINST'
      }

      proposals.push({
        number,
        title,
        recommendation,
      })
    }
  }

  // If no proposals found via explicit headers, try to find director elections
  if (proposals.length === 0) {
    // Look for "election of directors" style proposals
    const electionMatch =
      /(?:Proposal|Item)\s+(?:No\.?\s*)?1[^.]*?(?:election|elect)\s+(?:of\s+)?(?:\d+\s+)?directors?/i.exec(
        text
      )
    if (electionMatch) {
      proposals.push({
        number: '1',
        title: 'Election of Directors',
        recommendation: 'FOR',
      })
    }
    const ratifyMatch =
      /(?:Proposal|Item)\s+(?:No\.?\s*)?2[^.]*?(?:ratif|appoint)[^.]*?(?:independent|accounting|auditor)/i.exec(
        text
      )
    if (ratifyMatch) {
      proposals.push({
        number: '2',
        title: 'Ratification of Independent Registered Public Accounting Firm',
        recommendation: 'FOR',
      })
    }
    const sayOnPayMatch =
      /(?:Proposal|Item)\s+(?:No\.?\s*)?3[^.]*?(?:advisory|say.on.pay|executive\s+compensation)/i.exec(
        text
      )
    if (sayOnPayMatch) {
      proposals.push({
        number: '3',
        title: 'Advisory Vote to Approve Executive Compensation',
        recommendation: 'FOR',
      })
    }
  }

  // Look for director names if Proposal 1 is about director election
  if (proposals.length > 0 && /elect/i.test(proposals[0].title)) {
    // Try to find individual directors in nominee lists
    const directorRegex =
      /(?:1\.(\d{2}))\s*[,.]?\s*([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g
    let dm
    while ((dm = directorRegex.exec(text)) !== null) {
      const subNumber = `1.${dm[1]}`
      const directorName = dm[2].trim()
      if (!proposals.find((p) => p.number === subNumber)) {
        proposals.push({
          number: subNumber,
          title: directorName,
          recommendation: 'FOR',
        })
      }
    }
  }

  return proposals
}

// ─── Generate realistic vote tallies ────────────────────────────────────────
function generateVoteTallies(proposals, seed = 12345) {
  // Simple seeded pseudo-random
  let s = seed
  const random = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }

  // Generate base total shares between 10M and 200M
  const baseTotal = Math.floor(random() * 190000000 + 10000000)

  return proposals.map((p) => {
    const total = Math.floor(baseTotal * (0.85 + random() * 0.15))
    let forPct, againstPct, abstainPct

    if (p.recommendation === 'AGAINST') {
      // Stockholder proposals typically get 20-40% support
      forPct = 0.15 + random() * 0.25
      againstPct = 0.55 + random() * 0.25
      abstainPct = 1 - forPct - againstPct
    } else if (/elect|director/i.test(p.title)) {
      // Director elections typically get 90-99% support
      forPct = 0.9 + random() * 0.09
      againstPct = 0.005 + random() * 0.03
      abstainPct = 1 - forPct - againstPct
    } else if (/ratif|audit|accounting/i.test(p.title)) {
      // Auditor ratification typically gets 95-99%
      forPct = 0.95 + random() * 0.04
      againstPct = 0.002 + random() * 0.01
      abstainPct = 1 - forPct - againstPct
    } else if (/advisory|compensation|say.on.pay/i.test(p.title)) {
      // Say-on-pay typically gets 80-95%
      forPct = 0.8 + random() * 0.15
      againstPct = 0.03 + random() * 0.1
      abstainPct = 1 - forPct - againstPct
    } else {
      forPct = 0.7 + random() * 0.25
      againstPct = 0.02 + random() * 0.15
      abstainPct = 1 - forPct - againstPct
    }

    const votesFor = Math.floor(total * forPct)
    const votesAgainst = Math.floor(total * againstPct)
    const votesAbstain = total - votesFor - votesAgainst

    return {
      ...p,
      votesFor,
      votesAgainst,
      votesAbstain,
      votesTotal: total,
    }
  })
}

// ─── CSV Writers ────────────────────────────────────────────────────────────
function writeMeetingCSV(filePath, info) {
  const security = info.cusip ? `${info.cusip} - Common Stock` : 'Common Stock'
  const header = 'Issuer,Event,Security,Record Date,Meeting Date,Cutoff Date'
  // Build cutoff from meeting date (day before, 11:59 PM ET)
  let cutoff = info.cutoffDate
  if (!cutoff && info.meetingDate) {
    const dateOnly = info.meetingDate.replace(/,?\s+\d{1,2}:\d{2}.*$/, '')
    try {
      const d = new Date(dateOnly)
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() - 2)
        const months = [
          'January',
          'February',
          'March',
          'April',
          'May',
          'June',
          'July',
          'August',
          'September',
          'October',
          'November',
          'December',
        ]
        cutoff = `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} 11:59 PM Eastern Time`
      }
    } catch {
      cutoff = ''
    }
  }
  const row = `"${info.company}",${info.meetingType},"${security}","${info.recordDate}","${info.meetingDate}","${cutoff || ''}"`
  writeFileSync(filePath, `${header}\n${row}\n`)
}

function writeProposalsCSV(filePath, proposals) {
  const header = 'Proposal Number,Proposal Title,MRV,For,Against,Abstain,Total'
  const rows = proposals.map((p) => {
    const title = p.title.replace(/"/g, '""')
    return `${p.number},"${title}",${p.recommendation},${p.votesFor},${p.votesAgainst},${p.votesAbstain},${p.votesTotal}`
  })
  writeFileSync(filePath, `${header}\n${rows.join('\n')}\n`)
}

// ─── Fallback data for companies without SEC filings ────────────────────────
// Some companies may have been acquired, gone private, or are too small.
// We generate synthetic but realistic data for them.
function generateFallbackData(company) {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]
  // Use ticker hash to deterministically pick dates
  let hash = 0
  for (const ch of company.ticker) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0

  const meetingMonth = 3 + (Math.abs(hash) % 6) // April–September
  const meetingDay = 5 + (Math.abs(hash >> 4) % 22) // 5th–26th
  const recordMonth = meetingMonth - 1
  const recordDay = Math.max(1, meetingDay - 10)

  const meetingDate = `${months[meetingMonth]} ${meetingDay}, 2025, 10:00 AM Eastern Time`
  const recordDate = `${months[recordMonth]} ${recordDay}, 2025`

  return {
    meetingInfo: {
      company: company.companyName,
      cusip: '',
      meetingType: 'Annual Meeting',
      recordDate,
      meetingDate,
      cutoffDate: '',
    },
    proposals: [
      { number: '1', title: 'Election of Directors', recommendation: 'FOR' },
      {
        number: '2',
        title: 'Ratification of Independent Registered Public Accounting Firm',
        recommendation: 'FOR',
      },
      {
        number: '3',
        title: 'Advisory Vote to Approve Executive Compensation',
        recommendation: 'FOR',
      },
    ],
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

  const companies = loadCompanies()
  console.log(`Found ${companies.length} companies in seed.config.ts\n`)

  // Load cache
  let cache = {}
  if (existsSync(CACHE_FILE)) {
    try {
      cache = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'))
    } catch {
      /* ignore */
    }
  }

  // First, resolve all CIKs from the company tickers JSON (single request)
  console.log('Fetching SEC company tickers index...')
  let tickerMap = {}
  try {
    const resp = await rateLimited('https://www.sec.gov/files/company_tickers.json')
    const data = await resp.json()
    for (const entry of Object.values(data)) {
      tickerMap[entry.ticker] = String(entry.cik_str)
    }
    console.log(`  Loaded ${Object.keys(tickerMap).length} tickers from SEC\n`)
  } catch (e) {
    console.error(`  ✗ Failed to load ticker index: ${e.message}`)
  }

  let success = 0
  let fallback = 0
  let skipped = 0

  for (const company of companies) {
    const slug = company.companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/_+$/, '')
    const meetingFile = join(DATA_DIR, `${slug}_meeting_info.csv`)
    const proposalsFile = join(DATA_DIR, `${slug}_proposals.csv`)

    // Skip DFIN and MRSO — not real client companies, they're service providers
    if (['DFIN', 'MRSO'].includes(company.ticker)) {
      console.log(
        `⊘ ${company.ticker} (${company.companyName}) — service provider, skipping`
      )
      skipped++
      continue
    }

    console.log(`▸ ${company.ticker} (${company.companyName})`)

    // Check cache first
    if (cache[company.ticker] && cache[company.ticker].meetingDate) {
      const c = cache[company.ticker]
      writeMeetingCSV(meetingFile, c.meetingInfo)
      const proposalsWithVotes = generateVoteTallies(
        c.proposals,
        company.ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 31
      )
      writeProposalsCSV(proposalsFile, proposalsWithVotes)
      console.log(`  ✓ (cached) ${c.proposals.length} proposals`)
      success++
      continue
    }

    // Resolve CIK
    const cik = tickerMap[company.ticker]
    if (!cik) {
      console.log(`  ⚠ No SEC CIK found — using fallback data`)
      const fb = generateFallbackData(company)
      const proposalsWithVotes = generateVoteTallies(
        fb.proposals,
        company.ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 31
      )
      writeMeetingCSV(meetingFile, fb.meetingInfo)
      writeProposalsCSV(proposalsFile, proposalsWithVotes)
      cache[company.ticker] = { ...fb, source: 'fallback' }
      fallback++
      continue
    }

    // Find latest DEF 14A
    const filing = await findLatestDEF14A(cik)
    if (!filing) {
      console.log(`  ⚠ No DEF 14A found — using fallback data`)
      const fb = generateFallbackData(company)
      const proposalsWithVotes = generateVoteTallies(
        fb.proposals,
        company.ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 31
      )
      writeMeetingCSV(meetingFile, fb.meetingInfo)
      writeProposalsCSV(proposalsFile, proposalsWithVotes)
      cache[company.ticker] = { ...fb, source: 'fallback-no-filing' }
      fallback++
      continue
    }

    console.log(`  Filing: ${filing.filingDate} (${filing.accession})`)

    // Fetch and parse the proxy statement
    try {
      const resp = await rateLimited(filing.url, { headers: { Accept: 'text/html' } })
      const html = await resp.text()

      const meetingInfo = extractMeetingDetails(html, company.companyName)
      let proposals = extractProposals(html)

      if (proposals.length === 0) {
        // Fallback: minimal standard proposals
        proposals = [
          { number: '1', title: 'Election of Directors', recommendation: 'FOR' },
          {
            number: '2',
            title: 'Ratification of Independent Registered Public Accounting Firm',
            recommendation: 'FOR',
          },
          {
            number: '3',
            title: 'Advisory Vote to Approve Executive Compensation',
            recommendation: 'FOR',
          },
        ]
        console.log(`  ⚠ Could not parse proposals from HTML — using standard set`)
      }

      const proposalsWithVotes = generateVoteTallies(
        proposals,
        company.ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 31
      )
      writeMeetingCSV(meetingFile, meetingInfo)
      writeProposalsCSV(proposalsFile, proposalsWithVotes)

      cache[company.ticker] = {
        meetingInfo,
        proposals,
        meetingDate: meetingInfo.meetingDate,
        source: 'sec-edgar',
        filingDate: filing.filingDate,
      }

      console.log(
        `  ✓ ${meetingInfo.meetingDate || '(no date found)'} — ${proposals.length} proposals`
      )
      success++
    } catch (e) {
      console.error(`  ✗ Failed to parse filing: ${e.message}`)
      const fb = generateFallbackData(company)
      const proposalsWithVotes = generateVoteTallies(
        fb.proposals,
        company.ticker.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 31
      )
      writeMeetingCSV(meetingFile, fb.meetingInfo)
      writeProposalsCSV(proposalsFile, proposalsWithVotes)
      cache[company.ticker] = { ...fb, source: 'fallback-parse-error' }
      fallback++
    }
  }

  // Save cache
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2))

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
  console.log(`Done! ${success} from SEC, ${fallback} fallback, ${skipped} skipped`)
  console.log(`CSV files written to ${DATA_DIR}`)
}

main().catch((e) => {
  console.error('Fatal error:', e)
  process.exit(1)
})
