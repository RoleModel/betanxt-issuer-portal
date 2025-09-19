#!/usr/bin/env tsx
import { supabase } from '@/utils/supabase/client'

/**
 * Comprehensive database validation - validates every column in every table
 */

// Define table schemas with column validation rules
const TABLE_SCHEMAS = {
  account: {
    required: ['id', 'account', 'name'],
    optional: ['primary_contact', 'created_at', 'users', 'meeting'],
    types: {
      id: 'string',
      account: 'string',
      name: 'string',
      primary_contact: 'string',
      created_at: 'timestamp',
      users: 'json',
      meeting: 'json',
    },
  },
  user: {
    required: [
      'id',
      'username',
      'first_name',
      'last_name',
      'email',
      'type',
      'account_id',
    ],
    optional: ['password', 'account'],
    types: {
      id: 'string',
      username: 'string',
      first_name: 'string',
      last_name: 'string',
      email: 'email',
      password: 'string',
      type: 'string',
      account_id: 'string',
      account: 'string',
    },
  },
  meeting: {
    required: [
      'id',
      'title',
      'record_date',
      'mailing_date',
      'meeting_date',
      'meeting_type',
      'meeting_year',
      'account_id',
    ],
    optional: [
      'client',
      'cusip',
      'ticker',
      'pre_filing_date',
      'filing_date',
      'broker_search_date',
      'status',
      'current_phase',
      'overall_completion',
      'distribution_type',
      'transfer_agent',
      'employee_stock_plans',
      'plan_administrator',
      'plan_administrator_contact',
      'plan_administrator_contact_email',
      'solicitor',
      'solicitor_email',
      'inspector',
      'document_hosting_site_label',
      'document_hosting_site_url',
      'e_vote_site_label',
      'e_vote_site_url',
      'ivr_dial_in_number',
      'total_shares_outstanding',
      'quorum_requirement',
      'created_at',
      'updated_at',
      'account',
      'phases',
      'documents',
      'tasks',
      'positions',
      'proposals',
    ],
    types: {
      id: 'string',
      title: 'string',
      client: 'string',
      cusip: 'string',
      ticker: 'string',
      pre_filing_date: 'date',
      filing_date: 'date',
      broker_search_date: 'date',
      record_date: 'date',
      mailing_date: 'date',
      meeting_date: 'date',
      meeting_type: 'string',
      meeting_year: 'number',
      status: 'string',
      current_phase: 'string',
      overall_completion: 'number',
      distribution_type: 'string',
      transfer_agent: 'string',
      employee_stock_plans: 'string',
      plan_administrator: 'string',
      plan_administrator_contact: 'string',
      plan_administrator_contact_email: 'email',
      solicitor: 'string',
      solicitor_email: 'email',
      inspector: 'string',
      document_hosting_site_label: 'string',
      document_hosting_site_url: 'url',
      e_vote_site_label: 'string',
      e_vote_site_url: 'url',
      ivr_dial_in_number: 'string',
      total_shares_outstanding: 'string',
      quorum_requirement: 'decimal',
      account_id: 'string',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      account: 'string',
      phases: 'json',
      documents: 'json',
      tasks: 'json',
      positions: 'json',
      proposals: 'json',
    },
  },
  phase: {
    required: ['id', 'meeting_id', 'name', 'order_index'],
    optional: ['status', 'key_dates', 'created_at', 'updated_at', 'meeting', 'tasks'],
    types: {
      id: 'string',
      meeting_id: 'string',
      name: 'string',
      order_index: 'number',
      status: 'string',
      key_dates: 'string',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      meeting: 'string',
      tasks: 'json',
    },
  },
  task: {
    required: ['id', 'phase_id', 'meeting_id', 'title'],
    optional: [
      'task_id',
      'phase_number',
      'description',
      'type',
      'status',
      'due_date',
      'owner',
      'document_id',
      'links',
      'created_at',
      'updated_at',
      'phase',
      'meeting',
    ],
    types: {
      id: 'string',
      task_id: 'string',
      phase_id: 'string',
      meeting_id: 'string',
      phase_number: 'number',
      title: 'string',
      description: 'string',
      type: 'string',
      status: 'string',
      due_date: 'date',
      owner: 'string',
      document_id: 'string',
      links: 'json',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      phase: 'string',
      meeting: 'string',
    },
  },
  document: {
    required: ['id', 'title'],
    optional: [
      'meeting_id',
      'task_id',
      'description',
      'type',
      'file_path',
      'file_type',
      'file_size',
      'status',
      'upload_date',
      'uploaded_date',
      'signed_date',
      'authorized_date',
      'completed_date',
      'in_progress_date',
      'history',
      'created_at',
      'updated_at',
      'meeting',
      'comments',
      'signatures',
    ],
    types: {
      id: 'string',
      meeting_id: 'string',
      task_id: 'string',
      title: 'string',
      description: 'string',
      type: 'string',
      file_path: 'string',
      file_type: 'string',
      file_size: 'number',
      status: 'string',
      upload_date: 'timestamp',
      uploaded_date: 'timestamp',
      signed_date: 'timestamp',
      authorized_date: 'timestamp',
      completed_date: 'timestamp',
      in_progress_date: 'timestamp',
      history: 'json',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      meeting: 'string',
      comments: 'json',
      signatures: 'json',
    },
  },
  comment: {
    required: ['comment'],
    optional: [
      'id',
      'document_id',
      'user_id',
      'first_name',
      'last_name',
      'created_at',
      'document',
      'user',
    ],
    types: {
      id: 'number',
      document_id: 'string',
      user_id: 'string',
      comment: 'string',
      first_name: 'string',
      last_name: 'string',
      created_at: 'timestamp',
      document: 'string',
      user: 'string',
    },
  },
  signature: {
    required: ['id', 'document_id'],
    optional: [
      'page_number',
      'x_position',
      'y_position',
      'width',
      'height',
      'signature_type',
      'required',
      'created_at',
      'updated_at',
      'document',
    ],
    types: {
      id: 'string',
      document_id: 'string',
      page_number: 'number',
      x_position: 'decimal',
      y_position: 'decimal',
      width: 'decimal',
      height: 'decimal',
      signature_type: 'string',
      required: 'boolean',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      document: 'string',
    },
  },
  position: {
    required: ['id', 'meeting_id', 'name'],
    optional: [
      'cusip',
      'account_type',
      'set_key',
      'account_number',
      'control_number',
      'vote_status',
      'shares',
      'shares_voted',
      'source',
      'date_voted',
      'created_at',
      'updated_at',
      'meeting',
      'position_votes',
    ],
    types: {
      id: 'string',
      meeting_id: 'string',
      cusip: 'string',
      account_type: 'string',
      set_key: 'string',
      name: 'string',
      account_number: 'string',
      control_number: 'string',
      vote_status: 'enum',
      shares: 'decimal',
      shares_voted: 'decimal',
      source: 'enum',
      date_voted: 'string',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      meeting: 'string',
      position_votes: 'json',
    },
  },
  position_vote: {
    required: ['id', 'position_id', 'proposal_id', 'vote'],
    optional: ['shares_voting', 'created_at', 'position', 'proposal'],
    types: {
      id: 'string',
      position_id: 'string',
      proposal_id: 'string',
      vote: 'string',
      shares_voting: 'string',
      created_at: 'timestamp',
      position: 'string',
      proposal: 'string',
    },
  },
  proposal: {
    required: ['id', 'meeting_id', 'proposal_number', 'proposal_title'],
    optional: [
      'proposal_type',
      'proposal_subtype',
      'director_name',
      'director_term_years',
      'director_class',
      'term_expiration_year',
      'frequency_options',
      'recommendation',
      'created_at',
      'updated_at',
      'meeting',
      'position_votes',
    ],
    types: {
      id: 'string',
      meeting_id: 'string',
      proposal_number: 'number',
      proposal_title: 'string',
      proposal_type: 'string',
      proposal_subtype: 'string',
      director_name: 'string',
      director_term_years: 'number',
      director_class: 'string',
      term_expiration_year: 'number',
      frequency_options: 'json',
      recommendation: 'string',
      created_at: 'timestamp',
      updated_at: 'timestamp',
      meeting: 'string',
      position_votes: 'json',
    },
  },
  notification: {
    required: ['id', 'title', 'message'],
    optional: [
      'type',
      'priority',
      'read',
      'user_id',
      'meeting_id',
      'task_id',
      'action_url',
      'created_at',
      'read_at',
      'expires_at',
    ],
    types: {
      id: 'string',
      title: 'string',
      message: 'string',
      type: 'enum',
      priority: 'enum',
      read: 'boolean',
      user_id: 'string',
      meeting_id: 'string',
      task_id: 'string',
      action_url: 'string',
      created_at: 'timestamp',
      read_at: 'timestamp',
      expires_at: 'timestamp',
    },
  },
}

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validateUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const validateType = (
  value: any,
  type: string,
  _columnName: string
): { valid: boolean; error?: string } => {
  if (value === null || value === undefined) {
    return { valid: true } // NULL values are handled separately
  }

  switch (type) {
    case 'string':
      if (typeof value !== 'string') {
        return { valid: false, error: `Expected string, got ${typeof value}` }
      }
      break
    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        return { valid: false, error: `Expected number, got ${typeof value}` }
      }
      break
    case 'boolean':
      if (typeof value !== 'boolean') {
        return { valid: false, error: `Expected boolean, got ${typeof value}` }
      }
      break
    case 'email':
      if (typeof value !== 'string' || !validateEmail(value)) {
        return { valid: false, error: `Invalid email format` }
      }
      break
    case 'url':
      if (typeof value !== 'string' || !validateUrl(value)) {
        return { valid: false, error: `Invalid URL format` }
      }
      break
    case 'date':
      if (typeof value !== 'string' || isNaN(Date.parse(value))) {
        return { valid: false, error: `Invalid date format` }
      }
      break
    case 'timestamp':
      if (typeof value !== 'string' || isNaN(Date.parse(value))) {
        return { valid: false, error: `Invalid timestamp format` }
      }
      break
    case 'decimal':
      if (typeof value !== 'number' && typeof value !== 'string') {
        return {
          valid: false,
          error: `Expected decimal (number or string), got ${typeof value}`,
        }
      }
      if (typeof value === 'string' && isNaN(parseFloat(value))) {
        return { valid: false, error: `Invalid decimal format` }
      }
      break
    case 'json':
      if (typeof value !== 'object' && typeof value !== 'string') {
        return {
          valid: false,
          error: `Expected JSON (object or string), got ${typeof value}`,
        }
      }
      if (typeof value === 'string') {
        try {
          JSON.parse(value)
        } catch {
          return { valid: false, error: `Invalid JSON string` }
        }
      }
      break
    case 'enum':
      if (typeof value !== 'string') {
        return {
          valid: false,
          error: `Expected enum (string), got ${typeof value}`,
        }
      }
      break
  }

  return { valid: true }
}

const validateTableData = (
  tableName: string,
  data: any[]
): {
  valid: boolean
  errors: string[]
  warnings: string[]
  columnStats: Record<
    string,
    { nullCount: number; totalCount: number; typeErrors: number }
  >
} => {
  const schema = TABLE_SCHEMAS[tableName as keyof typeof TABLE_SCHEMAS]
  if (!schema) {
    return {
      valid: false,
      errors: [`No schema defined for table ${tableName}`],
      warnings: [],
      columnStats: {},
    }
  }

  const errors: string[] = []
  const warnings: string[] = []
  const columnStats: Record<
    string,
    { nullCount: number; totalCount: number; typeErrors: number }
  > = {}

  // Initialize column stats
  const allColumns = [...schema.required, ...schema.optional]
  allColumns.forEach((col) => {
    columnStats[col] = { nullCount: 0, totalCount: 0, typeErrors: 0 }
  })

  data.forEach((row, index) => {
    // Check required fields
    schema.required.forEach((field) => {
      columnStats[field].totalCount++

      if (row[field] === null || row[field] === undefined || row[field] === '') {
        columnStats[field].nullCount++
        errors.push(`Row ${index + 1}: Required field '${field}' is missing or empty`)
      } else {
        // Validate type
        const typeValidation = validateType(
          row[field],
          (schema.types as any)[field],
          field
        )
        if (!typeValidation.valid) {
          columnStats[field].typeErrors++
          errors.push(`Row ${index + 1}: Field '${field}' ${typeValidation.error}`)
        }
      }
    })

    // Check optional fields (type validation only)
    schema.optional.forEach((field) => {
      if (row[field] !== undefined) {
        columnStats[field].totalCount++

        if (row[field] === null || row[field] === undefined) {
          columnStats[field].nullCount++
        } else {
          const typeValidation = validateType(
            row[field],
            (schema.types as any)[field],
            field
          )
          if (!typeValidation.valid) {
            columnStats[field].typeErrors++
            errors.push(`Row ${index + 1}: Field '${field}' ${typeValidation.error}`)
          }
        }
      }
    })

    // Check for unexpected fields
    Object.keys(row).forEach((field) => {
      if (!allColumns.includes(field)) {
        warnings.push(`Row ${index + 1}: Unexpected field '${field}' found`)
      }
    })
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    columnStats,
  }
}

async function validateSeedData() {
  console.log('🔍 Comprehensive Database Validation Starting...')
  console.log('📋 Validating every column in every table\n')

  if (!supabase) {
    console.error(
      '❌ Supabase client not initialized. Please check your environment variables:'
    )
    console.error('   - SUPABASE_URL')
    console.error('   - SUPABASE_ANON_KEY')
    process.exit(1)
  }

  const validationResults: Record<string, any> = {}
  let totalErrors = 0
  let totalWarnings = 0

  try {
    // Validate each table
    for (const [tableName, _schema] of Object.entries(TABLE_SCHEMAS)) {
      console.log(`\n🔍 Validating table: ${tableName}`)

      const { data, error } = await supabase.from(tableName).select('*')

      if (error) {
        console.error(`❌ Error fetching ${tableName}:`, error.message)
        validationResults[tableName] = { error: error.message }
        totalErrors++
        continue
      }

      const validation = validateTableData(tableName, data || [])
      validationResults[tableName] = {
        recordCount: data?.length || 0,
        validation,
        data: data || [],
      }

      totalErrors += validation.errors.length
      totalWarnings += validation.warnings.length

      // Report table results
      if (validation.valid) {
        console.log(
          `✅ ${tableName}: ${data?.length || 0} records - All validations passed`
        )
      } else {
        console.log(
          `❌ ${tableName}: ${data?.length || 0} records - ${validation.errors.length} errors, ${validation.warnings.length} warnings`
        )
      }

      // Show column statistics
      console.log(`📊 Column Statistics for ${tableName}:`)
      Object.entries(validation.columnStats).forEach(([col, stats]) => {
        const nullPercent =
          stats.totalCount > 0
            ? ((stats.nullCount / stats.totalCount) * 100).toFixed(1)
            : '0.0'
        const errorPercent =
          stats.totalCount > 0
            ? ((stats.typeErrors / stats.totalCount) * 100).toFixed(1)
            : '0.0'

        let status = '✅'
        if (stats.typeErrors > 0) status = '❌'
        else if (stats.nullCount > stats.totalCount * 0.5) status = '⚠️'

        console.log(
          `   ${status} ${col}: ${stats.totalCount} records, ${stats.nullCount} nulls (${nullPercent}%), ${stats.typeErrors} type errors (${errorPercent}%)`
        )
      })

      // Show first few errors if any
      if (validation.errors.length > 0) {
        console.log(`🚨 First 5 errors in ${tableName}:`)
        validation.errors.slice(0, 5).forEach((error) => {
          console.log(`   • ${error}`)
        })
        if (validation.errors.length > 5) {
          console.log(`   ... and ${validation.errors.length - 5} more errors`)
        }
      }
    }

    // Business rule validations
    console.log('\n🔍 Validating Business Rules...')

    const meetings = validationResults.meeting?.data || []
    const positions = validationResults.position?.data || []
    const positionVotes = validationResults.position_vote?.data || []
    const proposals = validationResults.proposal?.data || []
    const tasks = validationResults.task?.data || []
    const phases = validationResults.phase?.data || []

    // Rule 1: Every meeting should have positions
    if (meetings.length > 0 && positions.length > 0) {
      const meetingsWithPositions = new Set(positions.map((p: any) => p.meeting_id))
      const meetingIds = meetings.map((m: any) => m.id)
      const meetingsWithoutPositions = meetingIds.filter(
        (id: any) => !meetingsWithPositions.has(id)
      )

      if (meetingsWithoutPositions.length === 0) {
        console.log(`✅ All ${meetings.length} meetings have positions`)
      } else {
        console.warn(`⚠️  ${meetingsWithoutPositions.length} meetings missing positions`)
        totalWarnings++
      }
    }

    // Rule 2: Voted positions should have position votes
    if (positions.length > 0 && positionVotes.length > 0) {
      const votedPositions = positions.filter((p: any) => p.vote_status === 'Voted')
      const positionsWithVotes = new Set(positionVotes.map((pv: any) => pv.position_id))
      const votedPositionsWithoutVotes = votedPositions.filter(
        (p: any) => !positionsWithVotes.has(p.id)
      )

      if (votedPositionsWithoutVotes.length === 0) {
        console.log(`✅ All ${votedPositions.length} voted positions have votes`)
      } else {
        console.warn(
          `⚠️  ${votedPositionsWithoutVotes.length} voted positions missing votes`
        )
        totalWarnings++
      }
    }

    // Rule 3: Every meeting should have proposals
    if (meetings.length > 0 && proposals.length > 0) {
      const meetingsWithProposals = new Set(proposals.map((p: any) => p.meeting_id))
      const meetingIds = meetings.map((m: any) => m.id)
      const meetingsWithoutProposals = meetingIds.filter(
        (id: any) => !meetingsWithProposals.has(id)
      )

      if (meetingsWithoutProposals.length === 0) {
        console.log(`✅ All ${meetings.length} meetings have proposals`)
      } else {
        console.warn(`⚠️  ${meetingsWithoutProposals.length} meetings missing proposals`)
        totalWarnings++
      }
    }

    // Rule 4: Every meeting should have phases
    if (meetings.length > 0 && phases.length > 0) {
      const meetingsWithPhases = new Set(phases.map((p: any) => p.meeting_id))
      const meetingIds = meetings.map((m: any) => m.id)
      const meetingsWithoutPhases = meetingIds.filter(
        (id: any) => !meetingsWithPhases.has(id)
      )

      if (meetingsWithoutPhases.length === 0) {
        console.log(`✅ All ${meetings.length} meetings have phases`)
      } else {
        console.warn(`⚠️  ${meetingsWithoutPhases.length} meetings missing phases`)
        totalWarnings++
      }
    }

    // Rule 5: Every phase should have tasks
    if (phases.length > 0 && tasks.length > 0) {
      const phasesWithTasks = new Set(tasks.map((t: any) => t.phase_id))
      const phaseIds = phases.map((p: any) => p.id)
      const phasesWithoutTasks = phaseIds.filter((id: any) => !phasesWithTasks.has(id))

      if (phasesWithoutTasks.length === 0) {
        console.log(`✅ All ${phases.length} phases have tasks`)
      } else {
        console.warn(`⚠️  ${phasesWithoutTasks.length} phases missing tasks`)
        totalWarnings++
      }
    }

    // Rule 6: Task-Phase Assignment Validation
    console.log('\n🔍 Validating Task-Phase Assignments...')

    // Define expected tasks by phase number (from seed.ts)
    const EXPECTED_TASKS_BY_PHASE: Record<number, string[]> = {
      1: [
        'DTCC (SPR) Authorization Status',
        'Plan File Request form',
        'Transfer Agent Registered File Request Form',
        'Broadridge/ICS Access',
      ],
      2: [
        'DTCC authorization',
        'Broadridge/ICS Access',
        'Transfer Agent Registered File Request Form',
        'Plan File Request form',
      ],
      3: [
        'TA Registered File',
        'DTCC SPR',
        'Plan File(s)',
        'Beneficial Count Settlement',
        '10-K print-ready PDF',
        'DTC SPR file transmitted',
        'Transfer-agent file transmitted',
        'Shareholder quantity count confirmed',
      ],
      4: [
        'TA Registered File',
        'DTCC SPR',
        'Plan File(s)',
        'Beneficial Count Settlement',
        'Proxy Stmt → electronic PDF proof',
        'Release to print 10-K',
        'Release to print Proxy Statement',
        'Final hi-res bookmarked PDFs shared with BetaNXT',
        'Approve Enhanced Annual Report/10-K & Proxy',
        'Approve IVR, Document-hosting & eVote sites',
        'File DEF 14A & DEFA 14A',
        'File ARS',
        'Deliver SH material (10-K & Proxy Stmt)',
        'Provide access to MIC',
        '2024 FY filing deadline',
      ],
      5: ['Notice & Access deadline', 'DSM introduction'],
      6: [
        'Mailing proxy materials: Registered & NOBO / Intermediary',
        'Begin daily tabulation reporting',
        'DSM Logistics Call',
      ],
      7: [
        'Official daily tabulation reporting begins',
        'DSM dry run',
        'DSM deliverables due',
        'Final tabulation Results',
      ],
      8: ['Form 8-K Item 5.07 deadline'],
    }

    // Define expected phase names and order indices (only the 8 workflow phases)
    const EXPECTED_PHASE_STRUCTURE = [
      { name: 'Project Launch & Data Check', orderIndex: 1, isKeyDate: false },
      {
        name: 'Broker Search, Authorizations, and Proxy Card Notice',
        orderIndex: 2,
        isKeyDate: false,
      },
      {
        name: 'Approaching Record Date, Proxy Card Readiness',
        orderIndex: 3,
        isKeyDate: false,
      },
      {
        name: 'Shareholder Record File delivery expectations',
        orderIndex: 4,
        isKeyDate: false,
      },
      { name: 'Pre-Mail Date', orderIndex: 5, isKeyDate: false },
      {
        name: 'Post Mail Date – Pre-Vote & Tabulation Reporting',
        orderIndex: 6,
        isKeyDate: false,
      },
      {
        name: 'Tabulation Report & Meeting Details',
        orderIndex: 7,
        isKeyDate: false,
      },
      { name: 'Registered Vote Report', orderIndex: 8, isKeyDate: false },
    ]

    let taskPhaseErrors = 0
    let taskPhaseWarnings = 0

    if (tasks.length > 0 && phases.length > 0) {
      // Create phase lookup maps
      const phaseById = new Map(phases.map((p: any) => [p.id, p]))
      const phasesByMeetingAndOrder = new Map<string, Map<number, any>>()

      phases.forEach((phase: any) => {
        if (!phasesByMeetingAndOrder.has(phase.meeting_id)) {
          phasesByMeetingAndOrder.set(phase.meeting_id, new Map())
        }
        phasesByMeetingAndOrder.get(phase.meeting_id)!.set(phase.order_index, phase)
      })

      // Validate each task
      tasks.forEach((task: any, _index: any) => {
        const phase = phaseById.get(task.phase_id)

        if (!phase) {
          console.error(
            `❌ Task ${task.id}: References non-existent phase_id '${task.phase_id}'`
          )
          taskPhaseErrors++
          return
        }

        // Check if task.phase_number matches the phase's order_index
        // Key date phases have negative order_index (-3, -2, -1), regular phases have positive (1-8)
        if (
          task.phase_number !== (phase as any).order_index &&
          (phase as any).order_index > 0
        ) {
          // Only check for regular phases (positive order_index)
          console.error(
            `❌ Task ${task.id}: phase_number (${task.phase_number}) doesn't match phase order_index (${(phase as any).order_index})`
          )
          taskPhaseErrors++
        }

        // Check if task.meeting_id matches phase.meeting_id
        if (task.meeting_id !== (phase as any).meeting_id) {
          console.error(
            `❌ Task ${task.id}: meeting_id (${task.meeting_id}) doesn't match phase meeting_id (${(phase as any).meeting_id})`
          )
          taskPhaseErrors++
        }

        // Check if task title matches expected tasks for this phase number
        if (task.phase_number && EXPECTED_TASKS_BY_PHASE[task.phase_number]) {
          const expectedTasks = EXPECTED_TASKS_BY_PHASE[task.phase_number]
          if (!expectedTasks.includes(task.title)) {
            console.warn(
              `⚠️  Task ${task.id}: Unexpected task '${task.title}' in phase ${task.phase_number}`
            )
            taskPhaseWarnings++
          }
        }

        // Check if phase_id actually exists in phases table
        if (!phases.find((p: any) => p.id === task.phase_id)) {
          console.error(
            `❌ Task ${task.id}: phase_id '${task.phase_id}' not found in phases table`
          )
          taskPhaseErrors++
        }
      })

      // Validate phase structure for each meeting
      const meetingIds = [...new Set(phases.map((p: any) => p.meeting_id))]
      meetingIds.forEach((meetingId: any) => {
        const meetingPhases = phases.filter((p: any) => p.meeting_id === meetingId)

        // Check if all expected phases exist
        EXPECTED_PHASE_STRUCTURE.forEach((expectedPhase) => {
          const actualPhase = meetingPhases.find(
            (p: any) => p.order_index === expectedPhase.orderIndex // Direct integer comparison
          )

          if (!actualPhase) {
            console.error(
              `❌ Meeting ${meetingId}: Missing expected phase '${expectedPhase.name}' with order_index ${expectedPhase.orderIndex}`
            )
            taskPhaseErrors++
          } else if (actualPhase.name !== expectedPhase.name) {
            console.warn(
              `⚠️  Meeting ${meetingId}: Phase at order_index ${expectedPhase.orderIndex} has name '${actualPhase.name}', expected '${expectedPhase.name}'`
            )
            taskPhaseWarnings++
          }
        })

        // Check for unexpected phases
        meetingPhases.forEach((phase: any) => {
          const expectedPhase = EXPECTED_PHASE_STRUCTURE.find(
            (ep) => Math.abs(phase.order_index - ep.orderIndex) < 0.01
          )
          if (!expectedPhase) {
            console.warn(
              `⚠️  Meeting ${meetingId}: Unexpected phase '${phase.name}' with order_index ${phase.order_index}`
            )
            taskPhaseWarnings++
          }
        })

        // Validate task distribution across phases
        const meetingTasks = tasks.filter((t: any) => t.meeting_id === meetingId)
        const tasksByPhaseNumber = new Map<number, any[]>()

        meetingTasks.forEach((task: any) => {
          if (task.phase_number) {
            if (!tasksByPhaseNumber.has(task.phase_number)) {
              tasksByPhaseNumber.set(task.phase_number, [])
            }
            tasksByPhaseNumber.get(task.phase_number)!.push(task)
          }
        })

        // Check if each phase has the expected number of tasks
        Object.entries(EXPECTED_TASKS_BY_PHASE).forEach(([phaseNum, expectedTasks]) => {
          const phaseNumber = parseInt(phaseNum)
          const actualTasks = tasksByPhaseNumber.get(phaseNumber) || []

          if (actualTasks.length !== expectedTasks.length) {
            console.warn(
              `⚠️  Meeting ${meetingId}, Phase ${phaseNumber}: Has ${actualTasks.length} tasks, expected ${expectedTasks.length}`
            )
            taskPhaseWarnings++
          }
        })
      })

      // Summary of task-phase validation
      if (taskPhaseErrors === 0 && taskPhaseWarnings === 0) {
        console.log(`✅ All ${tasks.length} tasks are correctly assigned to phases`)
      } else {
        console.log(
          `❌ Task-Phase Assignment Issues: ${taskPhaseErrors} errors, ${taskPhaseWarnings} warnings`
        )
        totalErrors += taskPhaseErrors
        totalWarnings += taskPhaseWarnings
      }

      // Additional task validation statistics
      const tasksWithValidPhaseId = tasks.filter((t: any) =>
        phases.find((p: any) => p.id === t.phase_id)
      ).length
      const tasksWithMatchingMeetingId = tasks.filter((t: any) => {
        const phase = phases.find((p: any) => p.id === t.phase_id)
        return phase && t.meeting_id === phase.meeting_id
      }).length

      console.log(`📊 Task-Phase Statistics:`)
      console.log(
        `   • Tasks with valid phase_id: ${tasksWithValidPhaseId}/${tasks.length} (${((tasksWithValidPhaseId / tasks.length) * 100).toFixed(1)}%)`
      )
      console.log(
        `   • Tasks with matching meeting_id: ${tasksWithMatchingMeetingId}/${tasks.length} (${((tasksWithMatchingMeetingId / tasks.length) * 100).toFixed(1)}%)`
      )

      // Phase utilization statistics
      const phasesWithTasks = new Set(tasks.map((t: any) => t.phase_id))
      const unusedPhases = phases.filter((p: any) => !phasesWithTasks.has(p.id))

      if (unusedPhases.length > 0) {
        console.log(`   • Unused phases: ${unusedPhases.length}/${phases.length}`)
        if (unusedPhases.length <= 5) {
          console.log(
            `     Unused: ${unusedPhases.map((p: any) => `${p.name} (${p.meeting_id})`).join(', ')}`
          )
        }
      }
    }

    // Final Summary
    console.log('\n📊 COMPREHENSIVE VALIDATION SUMMARY')
    console.log('='.repeat(50))

    let totalRecords = 0
    Object.entries(validationResults).forEach(([tableName, result]) => {
      if (result.recordCount) {
        totalRecords += result.recordCount
        const status = result.validation?.valid ? '✅' : '❌'
        console.log(`${status} ${tableName}: ${result.recordCount} records`)
      }
    })

    console.log(`\n📈 Total Records: ${totalRecords}`)
    console.log(
      `🎯 Key Tables: ${positions.length} positions, ${positionVotes.length} position votes`
    )

    if (totalErrors === 0 && totalWarnings === 0) {
      console.log('\n🎉 ALL VALIDATIONS PASSED! Database is in perfect condition.')
    } else {
      console.log(
        `\n⚠️  Validation completed with ${totalErrors} errors and ${totalWarnings} warnings`
      )

      if (totalErrors > 0) {
        console.log('❌ CRITICAL ISSUES FOUND - Please review and fix errors above')
      }

      if (totalWarnings > 0) {
        console.log('⚠️  WARNINGS FOUND - Review warnings for potential improvements')
      }
    }

    // Data quality recommendations
    if (positions.length < 1000) {
      console.warn(
        '\n💡 RECOMMENDATION: Expected thousands of positions for realistic testing'
      )
    }

    if (positionVotes.length < 1000) {
      console.warn(
        '💡 RECOMMENDATION: Expected thousands of position votes for realistic testing'
      )
    }

    console.log('\n✅ Comprehensive validation complete!')

    if (totalErrors > 0) {
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Validation failed:', error)
    process.exit(1)
  }
}

// Run validation
validateSeedData()
