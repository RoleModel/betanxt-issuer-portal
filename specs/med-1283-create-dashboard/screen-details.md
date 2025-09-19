# Meeting Page Screen Details

## Overview

The meeting page is a comprehensive interface for managing board meetings, displaying meeting information, agenda items, participants, and voting mechanisms. It follows the BetaNXT design system and uses MUI 7.3.1 components.

## Page Route

- **Path**: `/meetings/[meetingid]`
- **Type**: Dynamic route with meeting ID parameter
- **Auth**: Can be bypassed with environment variable for development

## Layout Structure

### 1. Page Header

- **Meeting Title**: Primary heading (Typography h1)
- **Meeting Metadata**: Date, time, location displayed in subtitle
- **Status Badge**: Shows meeting status (Draft, In Progress, Completed)
- **Action Buttons**: Start Meeting, End Meeting, Generate Minutes

### 2. Navigation Tabs

- **Tab Bar**: Secondary AppBar with MUI Tabs component
- **Sections**:
  - Overview (default)
  - Agenda
  - Participants
  - Votes
  - Minutes
  - Documents

### 3. Content Area (Tab Panels)

#### Overview Tab

- **Grid Layout**: 12-column responsive grid
- **Components**:
  - Meeting summary card
  - Key metrics cards (attendance, agenda items, votes)
  - Quick actions panel

#### Agenda Tab

- **Data Table**: MUI DataGrid/Table component
- **Columns**:
  - Item number
  - Title
  - Description
  - Presenter
  - Duration
  - Status
  - Actions (edit, delete, reorder)
- **Features**:
  - Sortable columns
  - Filterable rows
  - Inline editing
  - Drag-and-drop reordering

#### Participants Tab

- **List View**: MUI List with avatars
- **Information Displayed**:
  - Name and role
  - Attendance status (Present, Absent, Remote)
  - Voting eligibility
  - Real-time presence indicators
- **Actions**:
  - Mark attendance
  - Assign voting rights
  - Send notifications

#### Documents Tab

- **File List**: Table with document management
- **Features**:
  - Upload documents
  - Preview capability
  - Download links
  - Version control

## Component Hierarchy

```
MeetingPage
├── PageHeader
│   ├── MeetingTitle
│   ├── MeetingMetadata
│   ├── StatusBadge
│   └── ActionButtons
├── NavigationTabs (AppBar)
│   └── Tab[] (6 tabs)
└── ContentArea
    ├── OverviewPanel
    │   ├── SummaryCard
    │   ├── MetricsCards[]
    │   └── QuickActions
    ├── AgendaPanel
    │   └── AgendaTable
    ├── ParticipantsPanel
    │   └── ParticipantsList
    ├── VotesPanel
    │   ├── VoteCards[]
    │   └── VoteResults
    ├── MinutesPanel
    │   └── RichTextEditor
    └── DocumentsPanel
        └── DocumentsTable
```

## MUI Components Used

### Core Components

- `AppBar` - Navigation header
- `Tabs` / `Tab` - Section navigation
- `TabPanel` - Content containers
- `Grid` - Layout system
- `Card` / `CardContent` - Information cards
- `Typography` - Text elements
- `Button` / `IconButton` - Actions
- `Chip` - Status badges

### Data Display

- `Table` / `TableBody` / `TableCell` - Data tables
- `List` / `ListItem` / `ListItemAvatar` - Participant lists
- `Avatar` - User avatars
- `Badge` - Status indicators

### Form Elements

- `TextField` - Input fields
- `Select` / `MenuItem` - Dropdowns
- `RadioGroup` / `Radio` - Vote options
- `Checkbox` - Multi-select options

### Feedback

- `LinearProgress` - Vote progress
- `Skeleton` - Loading states
- `Alert` - Notifications
- `Snackbar` - Toast messages

## Theme Integration

### Color Scheme

- **Primary**: BetaNXT blue for main actions
- **Secondary**: Used for tabs and secondary actions
- **Phase Colors**: 8 phase colors for different agenda states
- **Status Colors**:
  - Success (green) - Completed items
  - Warning (amber) - Pending items
  - Error (red) - Blocked items
  - Info (blue) - Informational states

### Typography

- **Headings**: Using theme typography variants (h1-h6)
- **Body**: Standard body1/body2 for content
- **Data**: dataCell and dataHeader variants for tables
- **Captions**: For metadata and timestamps

### Spacing

- Using theme spacing units (multiples of 8px)
- Consistent padding: 2-3 spacing units
- Card gaps: 2 spacing units
- Section margins: 3-4 spacing units

## Responsive Design

- **Desktop**: Full layout with sidebar navigation
- **Tablet**: Collapsed sidebar, full content width
- **Mobile**:
  - Stacked layout
  - Bottom tab navigation
  - Simplified tables (card view)
  - Touch-optimized controls

## State Management

- **Loading States**: Skeleton screens for all data components
- **Error States**: Error boundaries with fallback UI
- **Empty States**: Helpful messages and CTAs
- **Real-time Updates**: WebSocket for live data

## Data Requirements

### Meeting Entity

```typescript
interface Meeting {
  id: string
  title: string
  description: string
  date: Date
  startTime: string
  endTime: string
  location: string
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED'
  organizerId: string
}
```

### Agenda Item Entity

```typescript
interface AgendaItem {
  id: string
  meetingId: string
  itemNumber: number
  title: string
  description: string
  presenter: string
  duration: number
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  attachments: string[]
}
```

### Participant Entity

```typescript
interface Participant {
  id: string
  userId: string
  meetingId: string
  role: 'CHAIR' | 'SECRETARY' | 'MEMBER' | 'GUEST'
  attendanceStatus: 'PRESENT' | 'ABSENT' | 'REMOTE'
  hasVotingRights: boolean
}
```

### Vote Entity

```typescript
interface Vote {
  id: string
  meetingId: string
  agendaItemId: string
  motion: string
  description: string
  status: 'PENDING' | 'OPEN' | 'CLOSED'
  results: {
    for: number
    against: number
    abstain: number
  }
}
```

## API Integration

### Endpoints Required

- `GET /api/meetings/{id}` - Fetch meeting details
- `GET /api/meetings/{id}/agenda` - Get agenda items
- `GET /api/meetings/{id}/participants` - List participants
- `GET /api/meetings/{id}/votes` - Get voting items
- `POST /api/meetings/{id}/votes/{voteId}` - Submit vote
- `PUT /api/meetings/{id}/status` - Update meeting status
- `POST /api/meetings/{id}/minutes` - Save minutes

## Environment Variables

```env
# Auth bypass for development
NEXT_PUBLIC_BYPASS_AUTH=true
NEXT_PUBLIC_BYPASS_USER_ID=dev-user-123
NEXT_PUBLIC_BYPASS_USER_ROLE=ADMIN

# API configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# WebSocket for real-time updates
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

## Implementation Priority

### Phase 1: Core Structure

1. Create dynamic route structure
2. Set up page layout with header
3. Implement tab navigation
4. Create placeholder panels

### Phase 2: Data Integration

1. Connect to API endpoints
2. Implement data fetching with React Query
3. Add loading and error states
4. Set up real-time subscriptions

### Phase 3: Interactive Features

1. Implement voting mechanism
2. Add agenda item management
3. Enable participant tracking
4. Create minutes editor

### Phase 4: Polish

1. Add animations and transitions
2. Implement keyboard navigation
3. Optimize for mobile devices
4. Add comprehensive error handling
