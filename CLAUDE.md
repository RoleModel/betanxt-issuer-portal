# Claude Agent Context: Issuer Portal

**Project**: betanxt-issuer-portal  
**Type**: Next.js Web Application with Mock API Backend  
**Current Feature**: 002-fix-phase-1 (Phase Management & DSM Enhancements)

## Technical Stack

**Frontend**: Next.js 15.5.4, React 19.1.1, TypeScript 5.9.2, MUI v7.3.2  
**Backend**: Node.js with Supabase 2.58.0 (PostgreSQL)  
**Testing**: Playwright (E2E), Jest (Unit)  
**Styling**: MUI Design System, Emotion, Custom Theme  
**State Management**: React Context + useReducer, Supabase Real-time

## Current Feature Context (002-fix-phase-1)

### Phase Management

- Auto-advance from Phase 1→2 when all tasks complete
- Phase validation and transition logic
- Real-time phase status updates via Supabase subscriptions
- Phase 7 dashboard scrolling fixes (CSS Grid + MUI Box)

### Document Synchronization

- Real-time sync between Taskbar uploads and MeetingDocuments display
- Optimistic UI updates with Supabase real-time subscriptions
- Document metadata handling (filename, size, upload status)

### Digital Shareholder Meeting (DSM)

- Three-section participant management: Participants/Presenters, Guests, Actual Attendees
- Role-based categorization (participant, presenter, guest, moderator)
- Post-meeting attendance data population
- Multi-format attendee list exports (CSV, Excel, PDF)

### Reports System

- Restore broken report generation functionality
- Client-side generation with Web Workers for performance
- Multiple output formats (PDF, CSV, Excel)
- Error handling and user feedback

### Key Components

- `issuer-portal/components/Meeting/PhaseTransition.tsx`
- `issuer-portal/components/Meeting/DigitalShareholderMeeting.tsx`
- `issuer-portal/components/Documents/MeetingDocuments.tsx`
- `issuer-portal/components/Reports/ReportGenerator.tsx`

## Code Patterns & Conventions

### React Patterns

- Functional components with hooks
- React.memo for performance optimization
- Custom hooks for business logic (usePhaseManagement, useDSMParticipants)
- Error boundaries for graceful failure handling

### State Management

- React Context for global state
- useReducer for complex state transitions
- Supabase real-time subscriptions for live updates
- Optimistic updates for better UX

### API Integration

- Supabase client for database operations
- Row-level security (RLS) for data access control
- Real-time subscriptions for live data updates
- TypeScript interfaces from generated schemas

### Styling Approach

- MUI components with custom theme
- Design system compliance (no sx prop overrides)
- Responsive design with MUI breakpoints
- CSS Grid for complex layouts

## Performance Requirements

- Phase transitions: <200ms
- Document sync: <100ms
- Report generation: <30s standard, <60s large datasets
- Real-time updates: <50ms
- Support 1000+ concurrent users

## Testing Strategy

- Contract tests for API endpoints
- Integration tests for component workflows
- E2E tests with Playwright
- Unit tests for utility functions
- Real dependencies (actual Supabase, not mocks)

## Recent Changes (Last 3)

1. **MUI Digital Clock Fix**: Resolved `.mui-15r9k4b-MuiMultiSectionDigitalClock-root` styling conflicts in DateTimePicker
2. **ESLint Config Update**: Migrated from deprecated `tseslint.config()` to flat array syntax
3. **Feature Planning**: Completed specification and design for Phase Management & DSM enhancements

---

_Updated: October 4, 2025 - Feature 002 Planning Phase Complete_


