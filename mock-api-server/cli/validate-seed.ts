import { supabase } from "@/utils/supabase/client";
import { asArray } from "@/utils/typeUtils";

/**
 * Comprehensive database validation - validates every column in every table
 */

type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "email"
  | "url"
  | "date"
  | "timestamp"
  | "decimal"
  | "json"
  | "enum";

interface TableSchema {
  required: string[];
  optional: string[];
  types: Record<string, FieldType>;
}

interface TableValidationSummary {
  recordCount: number;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    columnStats: Record<
      string,
      { totalCount: number; nullCount: number; typeErrors: number }
    >;
  };
  data: unknown[];
}

type ValidationResultsMap = Record<
  string,
  TableValidationSummary | { error: string }
>;

const getTableRows = <T>(
  result: TableValidationSummary | { error: string } | undefined
): T[] =>
  result !== undefined && "data" in result ? asArray<T>(result.data) : [];

// Minimal structural interfaces (original richer forms were removed during cleanup).
// Retain only fields accessed later in the script.
interface Phase {
  id: string;
  meeting_id: string;
  name: string;
  order_index: number;
}

interface Task {
  id: string;
  phase_id: string;
  meeting_id: string;
  phase_number?: number;
  title: string;
}

// Added minimal table row interfaces to eliminate `any`
interface Meeting {
  id: string;
}

interface Position {
  id: string;
  meeting_id: string;
  vote_status?: string;
}

interface PositionVote {
  id: string;
  position_id: string;
}

interface Proposal {
  id: string;
  meeting_id: string;
}

// Define table schemas with column validation rules
const TABLE_SCHEMAS: Partial<Record<string, TableSchema>> = {
  account: {
    required: ["id", "account", "name"],
    optional: ["primary_contact", "created_at", "users", "meeting"],
    types: {
      id: "string",
      account: "string",
      name: "string",
      primary_contact: "string",
      created_at: "timestamp",
      users: "json",
      meeting: "json",
    },
  },
  user: {
    required: [
      "id",
      "username",
      "first_name",
      "last_name",
      "email",
      "type",
      "account_id",
    ],
    optional: ["password", "account"],
    types: {
      id: "string",
      username: "string",
      first_name: "string",
      last_name: "string",
      email: "email",
      password: "string",
      type: "string",
      account_id: "string",
      account: "string",
    },
  },
  meeting: {
    required: [
      "id",
      "title",
      "record_date",
      "mailing_date",
      "meeting_date",
      "meeting_type",
      "meeting_year",
      "account_id",
    ],
    optional: [
      "client",
      "cusip",
      "ticker",
      "pre_filing_date",
      "filing_date",
      "broker_search_date",
      "status",
      "current_phase",
      "overall_completion",
      "distribution_type",
      "transfer_agent",
      "employee_stock_plans",
      "plan_administrator",
      "plan_administrator_contact",
      "plan_administrator_contact_email",
      "solicitor",
      "solicitor_email",
      "inspector",
      "document_hosting_site_label",
      "document_hosting_site_url",
      "e_vote_site_label",
      "e_vote_site_url",
      "ivr_dial_in_number",
      "total_shares_outstanding",
      "quorum_requirement",
      "created_at",
      "updated_at",
      "account",
      "phases",
      "documents",
      "tasks",
      "positions",
      "proposals",
    ],
    types: {
      id: "string",
      title: "string",
      client: "string",
      cusip: "string",
      ticker: "string",
      pre_filing_date: "date",
      filing_date: "date",
      broker_search_date: "date",
      record_date: "date",
      mailing_date: "date",
      meeting_date: "date",
      meeting_type: "string",
      meeting_year: "number",
      status: "string",
      current_phase: "string",
      overall_completion: "number",
      distribution_type: "string",
      transfer_agent: "string",
      employee_stock_plans: "string",
      plan_administrator: "string",
      plan_administrator_contact: "string",
      plan_administrator_contact_email: "email",
      solicitor: "string",
      solicitor_email: "email",
      inspector: "string",
      document_hosting_site_label: "string",
      document_hosting_site_url: "url",
      e_vote_site_label: "string",
      e_vote_site_url: "url",
      ivr_dial_in_number: "string",
      total_shares_outstanding: "string",
      quorum_requirement: "decimal",
      account_id: "string",
      created_at: "timestamp",
      updated_at: "timestamp",
      account: "string",
      phases: "json",
      documents: "json",
      tasks: "json",
      positions: "json",
      proposals: "json",
    },
  },
  phase: {
    required: ["id", "meeting_id", "name", "order_index"],
    optional: [
      "status",
      "key_dates",
      "created_at",
      "updated_at",
      "meeting",
      "tasks",
    ],
    types: {
      id: "string",
      meeting_id: "string",
      name: "string",
      order_index: "number",
      status: "string",
      key_dates: "string",
      created_at: "timestamp",
      updated_at: "timestamp",
      meeting: "string",
      tasks: "json",
    },
  },
  task: {
    required: ["id", "phase_id", "meeting_id", "title"],
    optional: [
      "task_id",
      "phase_number",
      "description",
      "type",
      "status",
      "due_date",
      "owner",
      "document_id",
      "links",
      "created_at",
      "updated_at",
      "phase",
      "meeting",
    ],
    types: {
      id: "string",
      task_id: "string",
      phase_id: "string",
      meeting_id: "string",
      phase_number: "number",
      title: "string",
      description: "string",
      type: "string",
      status: "string",
      due_date: "date",
      owner: "string",
      document_id: "string",
      links: "json",
      created_at: "timestamp",
      updated_at: "timestamp",
      phase: "string",
      meeting: "string",
    },
  },
  document: {
    required: ["id", "title"],
    optional: [
      "meeting_id",
      "task_id",
      "description",
      "type",
      "file_path",
      "file_type",
      "file_size",
      "status",
      "upload_date",
      "uploaded_date",
      "signed_date",
      "authorized_date",
      "completed_date",
      "in_progress_date",
      "history",
      "created_at",
      "updated_at",
      "meeting",
      "comments",
      "signatures",
    ],
    types: {
      id: "string",
      meeting_id: "string",
      task_id: "string",
      title: "string",
      description: "string",
      type: "string",
      file_path: "string",
      file_type: "string",
      file_size: "number",
      status: "string",
      upload_date: "timestamp",
      uploaded_date: "timestamp",
      signed_date: "timestamp",
      authorized_date: "timestamp",
      completed_date: "timestamp",
      in_progress_date: "timestamp",
      history: "json",
      created_at: "timestamp",
      updated_at: "timestamp",
      meeting: "string",
      comments: "json",
      signatures: "json",
    },
  },
  comment: {
    required: ["comment"],
    optional: [
      "id",
      "document_id",
      "user_id",
      "first_name",
      "last_name",
      "created_at",
      "document",
      "user",
    ],
    types: {
      id: "number",
      document_id: "string",
      user_id: "string",
      comment: "string",
      first_name: "string",
      last_name: "string",
      created_at: "timestamp",
      document: "string",
      user: "string",
    },
  },
  signature: {
    required: ["id", "document_id"],
    optional: [
      "page_number",
      "x_position",
      "y_position",
      "width",
      "height",
      "signature_type",
      "required",
      "created_at",
      "updated_at",
      "document",
    ],
    types: {
      id: "string",
      document_id: "string",
      page_number: "number",
      x_position: "decimal",
      y_position: "decimal",
      width: "decimal",
      height: "decimal",
      signature_type: "string",
      required: "boolean",
      created_at: "timestamp",
      updated_at: "timestamp",
      document: "string",
    },
  },
  position: {
    required: ["id", "meeting_id", "name"],
    optional: [
      "cusip",
      "account_type",
      "set_key",
      "account_number",
      "control_number",
      "vote_status",
      "shares",
      "shares_voted",
      "source",
      "date_voted",
      "created_at",
      "updated_at",
      "meeting",
      "position_votes",
    ],
    types: {
      id: "string",
      meeting_id: "string",
      cusip: "string",
      account_type: "string",
      set_key: "string",
      name: "string",
      account_number: "string",
      control_number: "string",
      vote_status: "enum",
      shares: "decimal",
      shares_voted: "decimal",
      source: "enum",
      date_voted: "string",
      created_at: "timestamp",
      updated_at: "timestamp",
      meeting: "string",
      position_votes: "json",
    },
  },
  position_vote: {
    required: ["id", "position_id", "proposal_id", "vote"],
    optional: ["shares_voting", "created_at", "position", "proposal"],
    types: {
      id: "string",
      position_id: "string",
      proposal_id: "string",
      vote: "string",
      shares_voting: "string",
      created_at: "timestamp",
      position: "string",
      proposal: "string",
    },
  },
  proposal: {
    required: ["id", "meeting_id", "proposal_number", "proposal_title"],
    optional: [
      "proposal_type",
      "proposal_subtype",
      "director_name",
      "director_term_years",
      "director_class",
      "term_expiration_year",
      "frequency_options",
      "recommendation",
      "created_at",
      "updated_at",
      "meeting",
      "position_votes",
    ],
    types: {
      id: "string",
      meeting_id: "string",
      proposal_number: "number",
      proposal_title: "string",
      proposal_type: "string",
      proposal_subtype: "string",
      director_name: "string",
      director_term_years: "number",
      director_class: "string",
      term_expiration_year: "number",
      frequency_options: "json",
      recommendation: "string",
      created_at: "timestamp",
      updated_at: "timestamp",
      meeting: "string",
      position_votes: "json",
    },
  },
  notification: {
    required: ["id", "title", "message"],
    optional: [
      "type",
      "priority",
      "read",
      "user_id",
      "meeting_id",
      "task_id",
      "action_url",
      "created_at",
      "read_at",
      "expires_at",
    ],
    types: {
      id: "string",
      title: "string",
      message: "string",
      type: "enum",
      priority: "enum",
      read: "boolean",
      user_id: "string",
      meeting_id: "string",
      task_id: "string",
      action_url: "string",
      created_at: "timestamp",
      read_at: "timestamp",
      expires_at: "timestamp",
    },
  },
};

/**
 * The tables validated by this script, as literals so that `supabase.from()`
 * type-checks against the generated schema. Keep in sync with TABLE_SCHEMAS.
 */
const VALIDATED_TABLE_NAMES = [
  "account",
  "user",
  "meeting",
  "phase",
  "task",
  "document",
  "comment",
  "signature",
  "position",
  "position_vote",
  "proposal",
  "notification",
] as const;

// Validation functions
const isValidEmail = (email: string): boolean => {
  if (email.includes(" ")) {
    return false;
  }
  const atIndex = email.indexOf("@");
  if (atIndex <= 0 || atIndex !== email.lastIndexOf("@")) {
    return false;
  }
  const domain = email.slice(atIndex + 1);
  const dotIndex = domain.indexOf(".");
  return dotIndex > 0 && dotIndex < domain.length - 1;
};

const isValidUrl = (url: string): boolean => URL.canParse(url);

/* eslint-disable sonarjs/cognitive-complexity, complexity -- type-dispatch switch over FieldType; deferred architectural refactor (out of scope for this cleanup pass) */
const validateType = (
  value: unknown,
  type: FieldType
): { valid: boolean; error?: string } => {
  if (value === null || value === undefined) {
    // NULL values are handled separately
    return { valid: true };
  }

  switch (type) {
    case "string": {
      if (typeof value !== "string") {
        return { valid: false, error: `Expected string, got ${typeof value}` };
      }
      break;
    }
    case "number": {
      if (typeof value !== "number" || Number.isNaN(value)) {
        return { valid: false, error: `Expected number, got ${typeof value}` };
      }
      break;
    }
    case "boolean": {
      if (typeof value !== "boolean") {
        return { valid: false, error: `Expected boolean, got ${typeof value}` };
      }
      break;
    }
    case "email": {
      if (typeof value !== "string" || !isValidEmail(value)) {
        return { valid: false, error: `Invalid email format` };
      }
      break;
    }
    case "url": {
      if (typeof value !== "string" || !isValidUrl(value)) {
        return { valid: false, error: `Invalid URL format` };
      }
      break;
    }
    case "date": {
      if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
        return { valid: false, error: `Invalid date format` };
      }
      break;
    }
    case "timestamp": {
      if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
        return { valid: false, error: `Invalid timestamp format` };
      }
      break;
    }
    case "decimal": {
      if (typeof value !== "number" && typeof value !== "string") {
        return {
          valid: false,
          error: `Expected decimal (number or string), got ${typeof value}`,
        };
      }
      if (typeof value === "string" && Number.isNaN(Number(value))) {
        return { valid: false, error: `Invalid decimal format` };
      }
      break;
    }
    case "json": {
      if (typeof value !== "object" && typeof value !== "string") {
        return {
          valid: false,
          error: `Expected JSON (object or string), got ${typeof value}`,
        };
      }
      if (typeof value === "string") {
        try {
          JSON.parse(value);
        } catch {
          return { valid: false, error: `Invalid JSON string` };
        }
      }
      break;
    }
    case "enum": {
      if (typeof value !== "string") {
        return {
          valid: false,
          error: `Expected enum (string), got ${typeof value}`,
        };
      }
      break;
    }
    default: {
      break;
    }
  }

  return { valid: true };
};
/* eslint-enable sonarjs/cognitive-complexity, complexity */

type ColumnStats = Record<
  string,
  { nullCount: number; totalCount: number; typeErrors: number }
>;

const isEmptyValue = (value: unknown): boolean =>
  ([null, undefined, ""] as unknown[]).includes(value);

interface FieldValidationContext {
  row: Record<string, unknown>;
  field: string;
  schema: TableSchema;
  columnStats: ColumnStats;
  errors: string[];
  index: number;
}

const validateRequiredField = (context: FieldValidationContext): void => {
  const { row, field, schema, columnStats, errors, index } = context;
  columnStats[field].totalCount += 1;

  if (isEmptyValue(row[field])) {
    columnStats[field].nullCount += 1;
    errors.push(
      `Row ${index + 1}: Required field '${field}' is missing or empty`
    );
    return;
  }

  const typeValidation = validateType(row[field], schema.types[field]);
  if (!typeValidation.valid) {
    columnStats[field].typeErrors += 1;
    errors.push(`Row ${index + 1}: Field '${field}' ${typeValidation.error}`);
  }
};

const validateOptionalField = (context: FieldValidationContext): void => {
  const { row, field, schema, columnStats, errors, index } = context;
  if (row[field] === undefined) {
    return;
  }

  columnStats[field].totalCount += 1;

  if (row[field] === null) {
    columnStats[field].nullCount += 1;
    return;
  }

  const typeValidation = validateType(row[field], schema.types[field]);
  if (!typeValidation.valid) {
    columnStats[field].typeErrors += 1;
    errors.push(`Row ${index + 1}: Field '${field}' ${typeValidation.error}`);
  }
};

const validateTableData = (
  tableName: string,
  data: Record<string, unknown>[]
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
  columnStats: ColumnStats;
} => {
  const schema = TABLE_SCHEMAS[tableName];
  if (schema === undefined) {
    return {
      valid: false,
      errors: [`No schema defined for table ${tableName}`],
      warnings: [],
      columnStats: {},
    };
  }

  const errors: string[] = [];
  const warnings: string[] = [];
  const columnStats: ColumnStats = {};

  // Initialize column stats
  const allColumns = [...schema.required, ...schema.optional];
  for (const col of allColumns) {
    columnStats[col] = { nullCount: 0, totalCount: 0, typeErrors: 0 };
  }

  for (const [index, row] of data.entries()) {
    for (const field of schema.required) {
      validateRequiredField({ row, field, schema, columnStats, errors, index });
    }

    for (const field of schema.optional) {
      validateOptionalField({ row, field, schema, columnStats, errors, index });
    }

    // Check for unexpected fields
    for (const field of Object.keys(row)) {
      if (!allColumns.includes(field)) {
        warnings.push(`Row ${index + 1}: Unexpected field '${field}' found`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    columnStats,
  };
};

const groupTasksByPhaseNumber = (tasks: Task[]): Map<number, Task[]> => {
  const result = new Map<number, Task[]>();
  for (const task of tasks) {
    if (task.phase_number === undefined) {
      continue;
    }
    const existing = result.get(task.phase_number);
    if (existing) {
      existing.push(task);
    } else {
      result.set(task.phase_number, [task]);
    }
  }
  return result;
};

/* eslint-disable sonarjs/cognitive-complexity, complexity, unicorn/try-complexity -- deferred architectural refactor (out of scope for this cleanup pass) */
const validateSeedData = async () => {
  const validationResults: ValidationResultsMap = {};
  let totalErrors = 0;
  let totalWarnings = 0;

  try {
    // Validate each table. Iterated from a literal list rather than
    // Object.entries so `supabase.from` receives a known table name instead of
    // a widened `string`.
    for (const tableName of VALIDATED_TABLE_NAMES) {
      // eslint-disable-next-line no-await-in-loop -- sequential per-table validation is intentional here
      const { data, error } = await supabase.from(tableName).select("*");

      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions -- `Database` is excluded from typed linting (see eslint.config.mjs), so `error`'s type resolves to `any` here; tsc has no issue
      if (error) {
        validationResults[tableName] = { error: error.message };
        totalErrors += 1;
        continue;
      }

      const validation = validateTableData(tableName, data ?? []);
      validationResults[tableName] = {
        recordCount: data?.length ?? 0,
        validation,
        data: data ?? [],
      };

      totalErrors += validation.errors.length;
      totalWarnings += validation.warnings.length;

      // Report table results
      if (validation.valid) {
        console.log(
          `✅ ${tableName}: ${data?.length ?? 0} records - All validations passed`
        );
      } else {
        console.log(
          `❌ ${tableName}: ${data?.length ?? 0} records - ${validation.errors.length} errors, ${validation.warnings.length} warnings`
        );
      }

      // Show first few errors if any
      if (validation.errors.length > 0) {
        console.log("   First 5 errors:");
        for (const errorMessage of validation.errors.slice(0, 5)) {
          console.log(`     - ${errorMessage}`);
        }
        if (validation.errors.length > 5) {
          console.log(
            `     ... and ${validation.errors.length - 5} more errors`
          );
        }
      }
    }

    // Business rule validations

    const meetings = getTableRows<Meeting>(validationResults.meeting);
    const positions = getTableRows<Position>(validationResults.position);
    const positionVotes = getTableRows<PositionVote>(
      validationResults.position_vote
    );
    const proposals = getTableRows<Proposal>(validationResults.proposal);
    const tasks = getTableRows<Task>(validationResults.task);
    const phases = getTableRows<Phase>(validationResults.phase);

    // Rule 1: Every meeting should have positions
    if (meetings.length > 0 && positions.length > 0) {
      const meetingsWithPositions = new Set(positions.map((p) => p.meeting_id));
      const meetingIds = meetings.map((m) => m.id);
      const meetingsWithoutPositions = meetingIds.filter(
        (id) => !meetingsWithPositions.has(id)
      );

      if (meetingsWithoutPositions.length === 0) {
        console.log("✅ Business Rule 1: All meetings have positions");
      } else {
        console.log(
          `⚠️  Business Rule 1: ${meetingsWithoutPositions.length} meetings without positions`
        );
        totalWarnings += 1;
      }
    }

    // Rule 2: Voted positions should have position votes
    if (positions.length > 0 && positionVotes.length > 0) {
      const votedPositions = positions.filter((p) => p.vote_status === "Voted");
      const positionsWithVotes = new Set(
        positionVotes.map((pv) => pv.position_id)
      );
      const votedPositionsWithoutVotes = votedPositions.filter(
        (p) => !positionsWithVotes.has(p.id)
      );

      if (votedPositionsWithoutVotes.length === 0) {
        console.log(
          "✅ Business Rule 2: All voted positions have position votes"
        );
      } else {
        console.log(
          `⚠️  Business Rule 2: ${votedPositionsWithoutVotes.length} voted positions without votes`
        );
        totalWarnings += 1;
      }
    }

    // Rule 3: Every meeting should have proposals
    if (meetings.length > 0 && proposals.length > 0) {
      const meetingsWithProposals = new Set(proposals.map((p) => p.meeting_id));
      const meetingIds = meetings.map((m) => m.id);
      const meetingsWithoutProposals = meetingIds.filter(
        (id) => !meetingsWithProposals.has(id)
      );

      if (meetingsWithoutProposals.length === 0) {
        console.log("✅ Business Rule 3: All meetings have proposals");
      } else {
        console.log(
          `⚠️  Business Rule 3: ${meetingsWithoutProposals.length} meetings without proposals`
        );
        totalWarnings += 1;
      }
    }

    // Rule 4: Every meeting should have phases
    if (meetings.length > 0 && phases.length > 0) {
      const meetingsWithPhases = new Set(phases.map((p) => p.meeting_id));
      const meetingIds = meetings.map((m) => m.id);
      const meetingsWithoutPhases = meetingIds.filter(
        (id) => !meetingsWithPhases.has(id)
      );

      if (meetingsWithoutPhases.length === 0) {
        console.log("✅ Business Rule 4: All meetings have phases");
      } else {
        console.log(
          `⚠️  Business Rule 4: ${meetingsWithoutPhases.length} meetings without phases`
        );
        totalWarnings += 1;
      }
    }

    // Rule 5: Every phase should have tasks
    if (phases.length > 0 && tasks.length > 0) {
      const phasesWithTasksSet = new Set(tasks.map((t) => t.phase_id));
      const phaseIds = phases.map((p) => p.id);
      const phasesWithoutTasks = phaseIds.filter(
        (id) => !phasesWithTasksSet.has(id)
      );

      if (phasesWithoutTasks.length === 0) {
        console.log("✅ Business Rule 5: All phases have tasks");
      } else {
        console.log(
          `⚠️  Business Rule 5: ${phasesWithoutTasks.length} phases without tasks`
        );
        totalWarnings += 1;
      }
    }

    // Rule 6: Task-Phase Assignment Validation

    // Define expected tasks by phase number (from seed.ts)
    const EXPECTED_TASKS_BY_PHASE: Partial<Record<number, string[]>> = {
      1: [
        "DTCC authorization",
        "Plan File Request form",
        "Transfer Agent Registered File Request Form",
        "Broadridge/ICS Access",
      ],
      2: [
        "DTCC authorization",
        "Broadridge/ICS Access",
        "Transfer Agent Registered File Request Form",
        "Plan File Request form",
      ],
      3: [
        "TA Registered File",
        "DTCC SPR",
        "Plan File(s)",
        "Beneficial Count Settlement",
        "10-K print-ready PDF",
        "DTC SPR file transmitted",
        "Transfer-agent file transmitted",
        "Shareholder quantity count confirmed",
      ],
      4: [
        "TA Registered File",
        "DTCC SPR",
        "Plan File(s)",
        "Beneficial Count Settlement",
        "Proxy Stmt → electronic PDF proof",
        "Release to print 10-K",
        "Release to print Proxy Statement",
        "Final hi-res bookmarked PDFs shared with BetaNXT",
        "Approve Enhanced Annual Report/10-K & Proxy",
        "Approve IVR, Document-hosting & eVote sites",
        "File DEF 14A & DEFA 14A",
        "File ARS",
        "Deliver SH material (10-K & Proxy Stmt)",
        "Provide access to MIC",
        "2024 FY filing deadline",
      ],
      5: ["Notice & Access deadline", "DSM introduction"],
      6: [
        "Mailing proxy materials: Registered & NOBO / Intermediary",
        "Begin daily tabulation reporting",
        "DSM Logistics Call",
      ],
      7: [
        "Official daily tabulation reporting begins",
        "DSM dry run",
        "DSM deliverables due",
        "Final tabulation Results",
      ],
      8: ["Form 8-K Item 5.07 deadline"],
    };

    // Define expected phase names and order indices (only the 8 workflow phases)
    const EXPECTED_PHASE_STRUCTURE = [
      { name: "Project Launch & Data Check", orderIndex: 1, isKeyDate: false },
      {
        name: "Broker Search, Authorizations, and Proxy Card Notice",
        orderIndex: 2,
        isKeyDate: false,
      },
      {
        name: "Approaching Record Date, Proxy Card Readiness",
        orderIndex: 3,
        isKeyDate: false,
      },
      {
        name: "Shareholder Record File delivery expectations",
        orderIndex: 4,
        isKeyDate: false,
      },
      { name: "Pre-Mail Date", orderIndex: 5, isKeyDate: false },
      {
        name: "Post Mail Date – Pre-Vote & Tabulation Reporting",
        orderIndex: 6,
        isKeyDate: false,
      },
      {
        name: "Tabulation Report & Meeting Details",
        orderIndex: 7,
        isKeyDate: false,
      },
      { name: "Registered Vote Report", orderIndex: 8, isKeyDate: false },
    ];

    let taskPhaseErrors = 0;
    let taskPhaseWarnings = 0;

    if (tasks.length > 0 && phases.length > 0) {
      // Create phase lookup map
      const phaseById: Partial<Record<string, Phase>> = {};
      for (const phase of phases) {
        phaseById[phase.id] = phase;
      }

      // Validate each task
      for (const task of tasks) {
        const phase = phaseById[task.phase_id];

        if (phase === undefined) {
          taskPhaseErrors += 1;
          continue;
        }

        if (phase.order_index > 0 && task.phase_number !== phase.order_index) {
          taskPhaseErrors += 1;
        }

        if (task.meeting_id !== phase.meeting_id) {
          taskPhaseErrors += 1;
        }

        if (task.phase_number !== undefined) {
          const expectedTasks = EXPECTED_TASKS_BY_PHASE[task.phase_number];
          if (
            expectedTasks !== undefined &&
            !expectedTasks.includes(task.title)
          ) {
            taskPhaseWarnings += 1;
          }
        }
      }

      // Validate phase structure for each meeting
      const meetingIds = [...new Set(phases.map((p) => p.meeting_id))];
      for (const meetingId of meetingIds) {
        const meetingPhases = phases.filter((p) => p.meeting_id === meetingId);

        for (const expectedPhase of EXPECTED_PHASE_STRUCTURE) {
          const actualPhase = meetingPhases.find(
            (p) => p.order_index === expectedPhase.orderIndex
          );

          if (!actualPhase) {
            taskPhaseErrors += 1;
          } else if (actualPhase.name !== expectedPhase.name) {
            taskPhaseWarnings += 1;
          }
        }

        // Unexpected phases
        for (const phase of meetingPhases) {
          const hasExpectedPhase = EXPECTED_PHASE_STRUCTURE.some(
            (ep) => Math.abs(phase.order_index - ep.orderIndex) < 0.01
          );
          if (!hasExpectedPhase) {
            taskPhaseWarnings += 1;
          }
        }

        // Task distribution per phase
        const meetingTasks = tasks.filter((t) => t.meeting_id === meetingId);
        const tasksByPhaseNumber = groupTasksByPhaseNumber(meetingTasks);

        for (const [phaseNumberKey, expectedTasks] of Object.entries(
          EXPECTED_TASKS_BY_PHASE
        )) {
          const phaseNumber = Number(phaseNumberKey);
          const actualTasks = tasksByPhaseNumber.get(phaseNumber) ?? [];
          if (
            expectedTasks !== undefined &&
            actualTasks.length !== expectedTasks.length
          ) {
            taskPhaseWarnings += 1;
          }
        }
      }

      if (taskPhaseErrors === 0 && taskPhaseWarnings === 0) {
        console.log("✅ Task-Phase Assignment: All validations passed");
      } else {
        console.log(
          `❌ Task-Phase Assignment Issues: ${taskPhaseErrors} errors, ${taskPhaseWarnings} warnings`
        );
        totalErrors += taskPhaseErrors;
        totalWarnings += taskPhaseWarnings;
      }

      // Additional task validation statistics
      const tasksWithValidPhaseId = tasks.filter(
        (t) => phaseById[t.phase_id] !== undefined
      ).length;
      const tasksWithMatchingMeetingId = tasks.filter((t) => {
        const phase = phaseById[t.phase_id];
        return phase?.meeting_id === t.meeting_id;
      }).length;

      console.log(
        `   • Tasks with valid phase_id: ${tasksWithValidPhaseId}/${tasks.length} (${(
          (tasksWithValidPhaseId / tasks.length) *
          100
        ).toFixed(1)}%)`
      );
      console.log(
        `   • Tasks with matching meeting_id: ${tasksWithMatchingMeetingId}/${tasks.length} (${(
          (tasksWithMatchingMeetingId / tasks.length) *
          100
        ).toFixed(1)}%)`
      );

      // Phase utilization statistics
      const phasesWithTasksSet = new Set(tasks.map((t) => t.phase_id));
      const unusedPhases = phases.filter((p) => !phasesWithTasksSet.has(p.id));

      if (unusedPhases.length > 0) {
        console.log(
          `   • Phases with no tasks: ${unusedPhases.length}/${phases.length}`
        );
        if (unusedPhases.length <= 5) {
          const unusedPhaseLabels = unusedPhases.map(
            (p) => `${p.name} (${p.meeting_id})`
          );
          console.log(`     Unused: ${unusedPhaseLabels.join(", ")}`);
        }
      }
    }

    // Final Summary

    console.log("\n📊 Summary by Table:");
    for (const [tableName, result] of Object.entries(validationResults)) {
      if (!("recordCount" in result)) {
        continue;
      }

      const status = result.validation.valid ? "✅" : "❌";
      console.log(`   ${status} ${tableName}: ${result.recordCount} records`);
    }
    console.log(
      `🎯 Key Tables: ${positions.length} positions, ${positionVotes.length} position votes`
    );

    if (totalErrors === 0 && totalWarnings === 0) {
      console.log("\n✅ All validations passed successfully!");
    } else {
      console.log(
        `\n⚠️  Validation completed with ${totalErrors} errors and ${totalWarnings} warnings`
      );

      if (totalErrors > 0) {
        console.log("❌ Please fix the errors above before proceeding");
      }

      if (totalWarnings > 0) {
        console.log("⚠️  Review warnings for potential issues");
      }
    }

    // Data quality recommendations
    if (positions.length < 1000) {
      console.log(
        "\n💡 RECOMMENDATION: Expected thousands of positions for realistic testing"
      );
    }

    if (positionVotes.length < 1000) {
      console.log(
        "💡 RECOMMENDATION: Expected thousands of position votes for realistic testing"
      );
    }

    if (totalErrors > 0) {
      process.exit(1);
    }
  } catch {
    process.exit(1);
  }
};
/* eslint-enable sonarjs/cognitive-complexity, complexity, unicorn/try-complexity */

// Run validation
const runValidation = async (): Promise<void> => {
  try {
    await validateSeedData();
  } catch (error: unknown) {
    console.error("Validation failed:", error);
    process.exit(1);
  }
};

void runValidation();
