# Tasks: Create Supabase Seed Data and Docker Files

**Input**: Design documents from `/specs/001-create-supabase-seed/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓), quickstart.md (✓)

## Execution Flow (main)

```
1. Load plan.md from feature directory ✓
   → Extract: TypeScript/Node.js, Supabase, Next.js API routes, @snaplet/seed
2. Load design documents ✓:
   → data-model.md: 10 entities for Supabase tables
   → contracts/: seed-data-api.yaml → 4 endpoints
   → research.md: CSV parsing, Supabase setup, 8-phase workflow
   → quickstart.md: 5 demo scenarios with Supabase data
3. Generate 60+ tasks following existing cc-mock-api-server pattern ✓
4. Apply TDD rules: Tests before implementation ✓
5. Dependencies: Supabase Setup → Schema → Tests → Core → Integration → Polish ✓
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Follow existing cc-mock-api-server structure and patterns

## Phase 3.1: Supabase Project Setup (Following cc-mock-api-server Pattern)

- [ ] **T001** Create new Supabase project via dashboard for "BetaNXT Issuer Portal Demo"
- [ ] **T002** Initialize Supabase CLI in `mock-api-server/` directory with `supabase init`
- [ ] **T003** Configure Supabase config.toml in `mock-api-server/supabase/config.toml` following cc-mock-api-server pattern
- [ ] **T004** Create Supabase client in `mock-api-server/supabase/client.ts` using @supabase/supabase-js pattern
- [ ] **T005** Configure app config in `mock-api-server/utils/appConfig.ts` with SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_DB
- [ ] **T006** [P] Install Supabase dependencies in `mock-api-server/package.json`: @supabase/supabase-js, supabase CLI, @snaplet/seed, @snaplet/copycat
- [ ] **T007** [P] Create seed config in `mock-api-server/seed.config.ts` for seed data parameters

## Phase 3.2: Schema Migration & Database Setup

- [ ] **T008** Convert Prisma schema to Supabase migration in `mock-api-server/supabase/migrations/001_issuer_portal_schema.sql`
- [ ] **T009** Generate Supabase types in `mock-api-server/supabase/database.types.ts` using `supabase gen types typescript --local`
- [ ] **T010** [P] Create RLS policies in `mock-api-server/supabase/migrations/002_rls_policies.sql` for demo user access
- [ ] **T011** [P] Configure seed.sql structure in `mock-api-server/supabase/seed.sql` following cc-mock-api-server pattern
- [ ] **T012** Test local Supabase setup with `supabase start` and verify all services

## Phase 3.3: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.4

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (Next.js API Routes)

- [ ] **T013** [P] Contract test POST /api/seed/generate in `mock-api-server/tests/contract/seed-generate.spec.ts`
- [ ] **T014** [P] Contract test POST /api/seed/validate in `mock-api-server/tests/contract/seed-validate.spec.ts`
- [ ] **T015** [P] Contract test DELETE /api/seed/reset in `mock-api-server/tests/contract/seed-reset.spec.ts`
- [ ] **T016** [P] Contract test GET /api/seed/status in `mock-api-server/tests/contract/seed-status.spec.ts`

### Supabase Integration Tests

- [ ] **T017** [P] Test Supabase connection in `mock-api-server/tests/integration/supabase-connection.spec.ts`
- [ ] **T018** [P] Test schema validation in `mock-api-server/tests/integration/schema-validation.spec.ts`
- [ ] **T019** [P] Test RLS policies in `mock-api-server/tests/integration/rls-policies.spec.ts`

### Demo Scenario Tests (Based on quickstart.md)

- [ ] **T020** [P] Integration test Wendy's Phase 6 in `mock-api-server/tests/integration/wendys-phase6.spec.ts` - tabulation dashboard
- [ ] **T021** [P] Integration test Paycom Phase 1 in `mock-api-server/tests/integration/paycom-phase1.spec.ts` - authorization workflow
- [ ] **T022** [P] Integration test Woodward Phase 2 in `mock-api-server/tests/integration/woodward-phase2.spec.ts` - document workflow
- [ ] **T023** [P] Integration test Enliven Phase 8 in `mock-api-server/tests/integration/enliven-phase8.spec.ts` - final reporting
- [ ] **T024** [P] Integration test CSV parsing in `mock-api-server/tests/integration/csv-parsing.spec.ts` - Wendy's data processing

## Phase 3.4: Seed Data Generation (Following @snaplet/seed Pattern)

- [ ] **T025** Main seed script in `mock-api-server/seed.ts` using @snaplet/seed and @snaplet/copycat pattern
- [ ] **T026** [P] CSV data processor in `mock-api-server/src/lib/csv-processor.ts` - parse Wendy's historical data
- [ ] **T027** [P] Company data factory in `mock-api-server/src/lib/company-factory.ts` - Wendy's, Paycom, Woodward, Enliven patterns
- [ ] **T028** [P] Phase workflow generator in `mock-api-server/src/lib/phase-workflow.ts` - 8-phase progression with task-data.md tasks
- [ ] **T029** [P] User activity simulator in `mock-api-server/src/lib/user-activity.ts` - realistic engagement patterns
- [ ] **T030** [P] Document workflow generator in `mock-api-server/src/lib/document-workflow.ts` - version tracking and approvals

## Phase 3.5: Entity Generation Functions

- [ ] **T031** [P] Account seeding function in `mock-api-server/src/lib/seeders/accounts.ts` - 5 accounts with realistic data
- [ ] **T032** [P] User seeding function in `mock-api-server/src/lib/seeders/users.ts` - 8-10 users with varied activity
- [ ] **T033** [P] Meeting seeding function in `mock-api-server/src/lib/seeders/meetings.ts` - 4 meetings in different phases
- [ ] **T034** [P] Phase seeding function in `mock-api-server/src/lib/seeders/phases.ts` - 8-phase workflow per meeting
- [ ] **T035** [P] PhaseKeyDate seeding function in `mock-api-server/src/lib/seeders/phase-key-dates.ts` - milestone dates
- [ ] **T036** [P] Task seeding function in `mock-api-server/src/lib/seeders/tasks.ts` - tasks from task-data.md with ownership
- [ ] **T037** [P] Document seeding function in `mock-api-server/src/lib/seeders/documents.ts` - realistic document workflows
- [ ] **T038** [P] Position seeding function in `mock-api-server/src/lib/seeders/positions.ts` - 10k+ positions from Wendy's CSV
- [ ] **T039** [P] Proposal seeding function in `mock-api-server/src/lib/seeders/proposals.ts` - director elections + shareholder proposals
- [ ] **T040** [P] PositionVote seeding function in `mock-api-server/src/lib/seeders/position-votes.ts` - realistic voting patterns
- [ ] **T041** [P] Comment seeding function in `mock-api-server/src/lib/seeders/comments.ts` - document collaboration

## Phase 3.6: Next.js API Routes (Following cc-mock-api-server Pattern)

- [ ] **T042** POST /api/seed/generate route in `mock-api-server/app/api/seed/generate/route.ts` - trigger seed generation
- [ ] **T043** POST /api/seed/validate route in `mock-api-server/app/api/seed/validate/route.ts` - validate data integrity
- [ ] **T044** DELETE /api/seed/reset route in `mock-api-server/app/api/seed/reset/route.ts` - safe data cleanup
- [ ] **T045** GET /api/seed/status route in `mock-api-server/app/api/seed/status/route.ts` - current seed state

## Phase 3.7: Utilities & Validation

- [ ] **T046** Data validator utility in `mock-api-server/src/lib/utils/data-validator.ts` - schema compliance checking
- [ ] **T047** Date calculator utility in `mock-api-server/src/lib/utils/date-calculator.ts` - SEC timeline calculations
- [ ] **T048** Supabase query helpers in `mock-api-server/src/lib/utils/supabase-helpers.ts` - type-safe operations
- [ ] **T049** CSV parsing utility in `mock-api-server/src/lib/utils/csv-parser.ts` - Wendy's data processing

## Phase 3.8: Package.json Scripts & CLI

- [ ] **T050** Update package.json scripts in `mock-api-server/package.json` - add generate:seeds, supabase:start, generate:db-types
- [ ] **T051** Create CLI seed commands in `mock-api-server/src/cli/seed-commands.ts` - command line interface
- [ ] **T052** Environment setup script in `mock-api-server/scripts/setup-env.ts` - automated environment configuration

## Phase 3.9: Performance & Polish

- [ ] **T053** [P] Unit tests for CSV processing in `mock-api-server/tests/unit/csv-processor.spec.ts`
- [ ] **T054** [P] Unit tests for company factory in `mock-api-server/tests/unit/company-factory.spec.ts`
- [ ] **T055** [P] Unit tests for phase workflow in `mock-api-server/tests/unit/phase-workflow.spec.ts`
- [ ] **T056** [P] Performance test for 10k+ records in `mock-api-server/tests/performance/large-dataset.spec.ts`
- [ ] **T057** [P] Load test for Supabase operations in `mock-api-server/tests/performance/supabase-load.spec.ts`
- [ ] **T058** [P] Create README.md in `mock-api-server/README.md` - setup and usage documentation
- [ ] **T059** [P] Update domain-models in `mock-api-server/domain-models/` to include seed data types
- [ ] **T060** Execute quickstart validation scenarios - verify all 5 demo scenarios work with generated data

## Dependencies

### Critical Path

1. **Supabase Setup** (T001-T007) → **Schema** (T008-T012) → **Tests** (T013-T024) → **Core Generation** (T025-T030) → **Entity Seeders** (T031-T041) → **API Routes** (T042-T045) → **Utilities** (T046-T049) → **Scripts** (T050-T052) → **Polish** (T053-T060)

### Key Blockers

- T008-T012 (schema) need T001-T007 (Supabase setup complete)
- T025 (main seed script) blocks T031-T041 (entity seeders need main script structure)
- T031-T041 (seeders) block T042-T045 (API routes need seeders)
- T050-T052 (scripts) need T025 (main seed script)
- T060 (validation) needs all implementation complete

### Major Parallel Opportunities

- **T006-T007**: Dependencies and config (different files)
- **T010-T011**: RLS policies and seed.sql (different concerns)
- **T013-T016**: Contract tests (different API endpoints)
- **T017-T024**: Integration tests (different scenarios and components)
- **T026-T030**: Core utilities (different modules)
- **T031-T041**: Entity seeders (different database tables)
- **T042-T045**: API routes (different endpoints)
- **T053-T059**: Polish tasks (different files and concerns)

## Supabase Implementation Notes

### Following cc-mock-api-server Patterns

- **Next.js Structure**: API routes in `app/api/` directory
- **Supabase Client**: Single client.ts file with proper typing
- **Config Management**: Use znv for environment validation
- **Seed Generation**: Main seed.ts file with @snaplet/seed pattern
- **Type Safety**: Generate database.types.ts from Supabase schema
- **Local Development**: Full Supabase stack with config.toml

### Seed Data Specific Requirements

- **@snaplet/seed**: Use for realistic data generation with copycat for deterministic results
- **CSV Integration**: Parse existing Wendy's data for authentic patterns
- **8-Phase Workflow**: Generate PhaseKeyDates and Tasks following proxy voting phases
- **Performance**: Handle 10k+ position records efficiently
- **Company Patterns**: Distinct data for Wendy's, Paycom, Woodward, Enliven

### Demo Scenario Integration

- **Wendy's Phase 6**: Tabulation dashboard with realtime Supabase updates
- **Paycom Phase 1**: Authorization workflows with proper task ownership
- **Woodward Phase 2**: Document upload/approval with Supabase storage integration
- **Enliven Phase 8**: Comprehensive reporting with Supabase analytics

## Task Generation Rules Applied

1. **Architecture**: Follow cc-mock-api-server Next.js + Supabase pattern exactly
2. **From Contracts**: 4 endpoints → 4 contract tests [P] + 4 Next.js API routes
3. **From Data Model**: 10 entities → 10 seeder functions [P] + main orchestrator
4. **From Quickstart**: 5 scenarios → 5 integration tests [P] + validation
5. **TDD Compliance**: All tests before implementation, must fail first
6. **Supabase Best Practices**: Type generation, RLS policies, local development

## Validation Checklist ✓

- [x] Architecture matches cc-mock-api-server pattern (Next.js + Supabase + @snaplet/seed)
- [x] All contracts have corresponding tests and API routes
- [x] All entities have Supabase-compatible seeder functions
- [x] Tests come before implementation (TDD enforced)
- [x] Supabase-specific setup included (config.toml, types, RLS)
- [x] Parallel tasks are truly independent
- [x] File paths follow existing project structure
- [x] Performance requirements for large datasets included

## Success Criteria

After completing all 60 tasks:

- ✅ Supabase project configured following cc-mock-api-server pattern
- ✅ 5 user accounts with realistic activity using @snaplet/seed
- ✅ 4 companies with meetings in phases 1, 2, 6, 8 using Supabase
- ✅ 10,000+ shareholder positions from Wendy's CSV patterns
- ✅ Complete 8-phase workflow with task-data.md tasks and ownership
- ✅ Document workflows with version tracking in Supabase
- ✅ Working Next.js API routes for seed data management
- ✅ Local Supabase development environment
- ✅ Comprehensive testing coverage matching cc-mock-api-server standards

**Ready for immediate execution following proven cc-mock-api-server architecture** 🎯
