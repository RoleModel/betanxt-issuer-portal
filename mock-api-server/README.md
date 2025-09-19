# Overview

## Name and aliases

The project is named "BetaNXT Issuer Portal Mock API Server". It is the mock API server for the [Issuer Portal](../issuer-portal/README.md) application.

## Purpose

The front end for the Issuer Portal was developed before the backend so in order to create a functional prototype, we mocked up an API server to make calls to until the real API comes online. The mock API is also used to have deterministic testing data for the Issuer Portal [e2e tests](../issuer-portal/README.md#how-to-run-tests).

# How to set up the project

## How to start the dev server

- start the dev server - `npm run dev`

## How to generate the test build

- build the app - `npm run build:test`
- run the build - `npm run start:test`

## How to generate the production build

- build the app - `npm run build`
- run the build - `npm run start`

## How to run tests

- run all tests - `npx playwright test`
- run tests with UI - `npx playwright test --ui`
- run specific test - `npx playwright test tests/integration/test_api_comprehensive.spec.ts`

# Supabase

- This API uses [Supabase](https://supabase.com/docs) as its database.

## Local development with Supabase

1. `npx supabase start` - Starts the local Supabase client
2. [Ensure local db is up to date with the remote db](./README.md#update-schema-from-remote-db)
3. Status of local db can be run with `npx supabase status`. From here the local database studio can be launched to manage the database

## Update schema from remote db

1. `npx supabase start` - execute if you have not done so already
2. `npx supabase link --project-ref <project-id>` - You can get `<project-id>` from your project's dashboard URL: `https://supabase.com/dashboard/project/<project-id>`
3. `npx supabase db pull` - Capture any changes that you have made to your remote database before you went through the steps above, if you have not made any changes to the remote database, skip this step
4. `npx supabase migration up` - To apply the new migration to your local database
5. `npx supabase db reset` - To reset your local database completely
6. `npm run seed` - If pulling down or making new changes to the db you will need to reseed the database

## Editing your local db

- `npx supabase status` will display various dev tools available for the db
- select `Studio URL` from this list to launch the local Supabase UI

## Generate a db migration file

- When changing the structure of the database, you must generate a migration file in order to apply your changes.
- Once you have made your change to your local database run `supabase db diff -f my_migration_name` where my_migration_name describes the changes you made
- This will generate a migration file in `supabase/migrations/`. Look over the generated file and make changes if necessary
- Reset your database by running `npx supabase db reset` to apply all migrations including your new one

## Seeding approach

We are using custom TypeScript seed files to generate our seed data to populate Supabase locally for both testing and local development. This process allows us to create data that is fully deterministic.

## Generating seed data

1. Make any necessary database changes (i.e adding a new column)
2. Create or modify the data generation in [seed.ts](./seed.ts)
3. Run `npm run seed` to populate the database with seed data
4. Run `npx supabase db reset` to reset the local database and apply fresh seeds

## Environment Setup

1. Copy `env.template` to `.env.development.local`
2. Fill in your Supabase credentials:
   ```
   # Supabase
   SUPABASE_URL="https://your-project.supabase.co"
   SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

## API Endpoints

The mock API server provides the following endpoints:

### Meeting Management

- `GET /api/meeting` - List meetings with pagination and filters
- `GET /api/meeting/{id}` - Get specific meeting
- `POST /api/meeting` - Create new meeting
- `PUT /api/meeting/{id}` - Update meeting
- `DELETE /api/meeting/{id}` - Delete meeting

### Task Management

- `GET /api/tasks` - List all tasks
- `GET /api/meeting/{meetingId}/tasks` - Get tasks for a meeting
- `GET /api/tasks/{id}` - Get specific task

### Document Management

- `GET /api/documents` - List all documents
- `GET /api/meeting/{meetingId}/documents` - Get documents for a meeting
- `GET /api/documents/{id}` - Get specific document

### Position Management

- `GET /api/positions` - List all positions
- `GET /api/positions/{id}` - Get specific position
- `GET /api/positions/{id}/votes` - Get votes for a position

### Other Endpoints

- `GET /api/proposals` - List all proposals
- `GET /api/phases` - List all phases
- `GET /api/accounts` - List all accounts
- `GET /api/users` - List all users
- `GET /api/health` - Health check endpoint

## Testing

The project uses Playwright for end-to-end testing with comprehensive API coverage:

- **Integration Tests**: Test all API endpoints with real database interactions
- **Unit Tests**: Test individual models and validation logic
- **Database Tests**: Verify schema, migrations, and relationships

## Database Schema

The database includes the following main entities:

- **accounts**: Company accounts and organizations
- **users**: User accounts with role-based permissions
- **meetings**: Shareholder meetings and events
- **phases**: Meeting workflow phases
- **tasks**: Action items and to-dos within phases
- **documents**: Meeting materials and files
- **positions**: Shareholder positions and holdings
- **proposals**: Meeting proposals and voting items
- **votes**: Position votes on proposals

## Continuous integration

We populate the CI Supabase database with seed data at the start of each test run in GitHub Actions so we have deterministic test data not muddied by changes we may make to our remote Supabase database.

## Development Workflow

1. Make database schema changes in local Supabase Studio
2. Generate migration file: `supabase db diff -f migration_name`
3. Update seed data in `seed.ts` if needed
4. Reset database: `npx supabase db reset`
5. Run tests: `npx playwright test`
6. Commit migration files and seed updates
