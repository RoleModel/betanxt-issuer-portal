# Documents Workflow System

This directory contains components for handling various document workflows in the issuer portal, including document viewing, signature collection, and file uploads.

## Architecture Overview

The document workflow system is driven by **task link action types** that determine which UI components are displayed and which workflows are triggered.

### Task Link Action Types

Tasks can have multiple links with different action types that control the UI behavior:

- **`upload`** - Shows BNFileDropzone for file uploads
- **`signature`** - Opens DocumentViewer with draggable signature areas
- **`download`** - Downloads files or generated PDFs
- **`authorize`** - Opens external authorization portals
- **`external`** - Opens external links in new tabs

## Component Structure

### Core Components

#### DocumentViewer.tsx

- **Purpose**: Full-screen document viewer with signature capabilities
- **Triggered by**: Link action type `signature`
- **Features**:
  - PDF rendering with react-pdf
  - Draggable signature areas positioned over documents
  - Digital signature collection
  - Document approval workflows
  - Comment system

#### DraggableSignatureArea.tsx

- **Purpose**: Interactive signature areas that can be positioned on documents
- **Features**:
  - Drag-and-drop positioning (hold Shift to drag)
  - Percentage-based positioning for responsive scaling
  - Visual indicators for signed/unsigned areas
  - Support for multiple signature types (signature, date, initials)

#### PDFViewer.tsx

- **Purpose**: Core PDF rendering component used by DocumentViewer
- **Features**:
  - Page navigation and zoom controls
  - Loading states and error handling
  - Responsive design

### Upload Components

#### BNFileDropzone (from design system)

- **Purpose**: File upload interface
- **Triggered by**: Link action type `upload`
- **Features**:
  - Drag-and-drop file selection
  - File type validation
  - Progress tracking
  - File preview and removal

## Workflow Examples

### 1. Document Signing Workflow

```typescript
// Task with signature action
{
  label: "Sign Form",
  action: "signature", // Opens DocumentViewer
  url: "" // Can be empty for generated forms
}
```

**Flow**:

1. User clicks "Sign Form" link
2. TaskDrawer calls appropriate handler (e.g., `handleBroadridgeFormSign`)
3. Handler generates PDF and signature areas
4. DocumentViewer opens with draggable signature areas
5. User positions and signs document
6. Signed document is processed

### 2. File Upload Workflow

```typescript
// Task with upload action
{
  label: "Upload Document",
  action: "upload", // Shows BNFileDropzone
  url: "https://api.example.com/upload"
}
```

**Flow**:

1. TaskDrawer detects `upload` action in task links
2. BNFileDropzone component is displayed
3. User drags/selects files
4. Files are validated and previewed
5. Submit button uploads files to specified URL

### 3. Download Workflow

```typescript
// Task with download action
{
  label: "Download Form",
  action: "download", // Triggers file download
  url: "" // Can be empty for generated forms
}
```

**Flow**:

1. User clicks "Download Form" link
2. Handler generates or fetches document
3. Browser downloads file

## Form Generation System

### Broadridge Form Example

The system includes utilities for generating and signing specific forms:

#### broadridgeFormHandler.ts

- `handleBroadridgeFormDownload()` - Generates and downloads PDF
- `handleBroadridgeFormSign()` - Generates PDF with signature areas for DocumentViewer

#### generatePDFForm.ts

- Uses jsPDF to create Broadridge Corporate Issuer Profile Form
- Includes proper branding, form fields, and signature lines

## TaskDrawer Integration

The TaskDrawer component orchestrates the entire workflow:

```typescript
// Conditional rendering based on action types
{taskLinks.some(link => link.action === 'upload') && (
  <BNFileDropzone ... />
)}

// Action-based link handling
switch (link.action) {
  case 'signature':
    // Open DocumentViewer with signature areas
    break;
  case 'upload':
    // Show upload UI (handled by conditional rendering)
    break;
  case 'download':
    // Download file or generated form
    break;
}
```

## Configuration

### Task Link Structure

```typescript
interface TaskLink {
  label: string // Display text for the link
  action: string // Determines UI behavior (upload, signature, download, etc.)
  url?: string // Optional URL for external actions
}
```

### Signature Area Structure

```typescript
interface SignatureArea {
  id: string // Unique identifier
  x: number // Percentage from left (0-100)
  y: number // Percentage from top (0-100)
  width: number // Percentage width (0-100)
  height: number // Percentage height (0-100)
  page?: number // Page number (default 1)
  label?: string // Display label
  signed?: boolean // Signature status
}
```

## Adding New Document Workflows

To add a new document workflow:

1. **Define the action type** in your task links
2. **Create form generator** (if needed) similar to `generatePDFForm.ts`
3. **Create handler utility** similar to `broadridgeFormHandler.ts`
4. **Update TaskDrawer** to handle the new action type
5. **Configure signature areas** for the document layout

## Best Practices

- Use percentage-based positioning for signature areas to ensure responsive scaling
- Generate unique document IDs for tracking
- Handle both URL-based and generated documents
- Provide fallback signature areas for documents without predefined areas
- Use the `task` prop for signature-type tasks, legacy props for generated forms
- Validate file types and sizes in upload workflows
- Provide clear error handling and user feedback

## Dependencies

- **jsPDF**: PDF generation
- **react-pdf**: PDF rendering
- **@rolemodel/betanxt-design-system**: File upload components
- **@mui/material**: UI components and styling

This system provides a flexible, extensible foundation for handling various document workflows while maintaining a consistent user experience across different task types.

---

## Complete PDF Workflow Implementation

### Task Completion with PDF Storage

The system now provides a complete workflow for task completion that generates, stores, and makes PDFs available in the Documents tab.

#### 1. PDF Generation (`TaskDrawer.tsx:294-339`)
- **Generates actual PDF**: Creates a new PDF document using jsPDF
- **Includes form data**: All filled text fields and date inputs
- **Includes signatures**: Records of all signed areas
- **Adds metadata**: Task title, completion timestamp

```typescript
const generateFilledPDF = async (taskTitle: string): Promise<Blob> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  })

  // Add header, form fields, signatures, and timestamp
  // Returns PDF as blob for storage
}
```

#### 2. Storage Upload (`TaskDrawer.tsx:354-367`)
- **Supabase Storage**: Uploads PDF blob to `supporting` bucket
- **Unique filename**: `${taskId}-completed-${timestamp}.pdf`
- **Proper path**: Stored in `task-completions/` folder
- **Error handling**: Throws error if upload fails

```typescript
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('supporting')
  .upload(filePath, pdfBlob, {
    contentType: 'application/pdf',
    upsert: false
  })
```

#### 3. Database Record (`TaskDrawer.tsx:369-385`)
- **Document record**: Creates entry in database pointing to stored PDF
- **File path**: Links to actual storage location (`uploadData.path`)
- **Task association**: Links document to the completed task
- **History tracking**: Adds "Task Completed" event

#### 4. Documents Tab Visibility
The completed PDF will now appear in the Documents tab because:
- Document record is created in the meeting
- File path points to actual stored PDF in Supabase
- `getDocumentsByMeeting` hook will fetch and display it
- Users can download/view the completed form with all their data

### Enhanced Components for Form Management

#### FormFieldArea
**Location**: `components/Documents/FormFieldArea.tsx`

Handles text and date input fields overlaid on PDF documents.

**Features**:
- Click-to-edit functionality
- Text and date field support
- Proper styling and positioning on PDF lines
- Value persistence and real-time sync
- Black text on white background for visibility

#### Enhanced TaskDrawer
**Location**: `components/Drawers/TaskDrawer.tsx`

Main interface for task management with complete document integration.

**Key Features**:
- **Submit Button**: Saves PDF state and marks task complete
- **Comments**: Full comment functionality for task discussions
- **PDF State Tracking**: Real-time monitoring of form changes
- **File Upload**: Support for task-related document uploads
- **Storage Integration**: Automatic PDF generation and storage

### Complete Task Completion Workflow

1. **User fills form**: DocumentViewer tracks all form fields and signatures
2. **Real-time sync**: Changes are communicated to TaskDrawer via `onPdfStateChange`
3. **Submit action**: User clicks submit in TaskDrawer
4. **PDF generation**: System creates PDF with all filled data
5. **Storage upload**: PDF uploaded to Supabase storage
6. **Database record**: Document entry created pointing to stored file
7. **Task completion**: Task status updated to COMPLETE
8. **History tracking**: Events logged for audit trail

### State Management

```typescript
// PDF form state structure
interface PdfFormState {
  formFields: Record<string, string>  // Text/date field values
  signatures: Record<string, string>   // Signature area data
}
```

### Key Implementation Features

- ✅ **Persistent Storage**: PDF saved to Supabase storage bucket
- ✅ **Database Integration**: Document record created with file reference
- ✅ **Form Data Preservation**: All user inputs and signatures included
- ✅ **Download/View**: Available in Documents tab for future reference
- ✅ **Audit Trail**: History tracking of task completion
- ✅ **Real-time Sync**: Form changes tracked and preserved
- ✅ **Error Handling**: Graceful failure handling for all operations
- ✅ **Comments System**: Full commenting functionality integrated

### Usage Examples

#### Basic Task Document Viewing
```typescript
<DocumentViewer
  task={{
    id: 'task-123',
    title: 'Corporate Form Signing',
    type: 'signature',
    meeting_id: 'meeting-456'
  }}
  onSuccess={() => console.log('Task completed')}
/>
```

#### Form State Tracking
```typescript
<DocumentViewer
  pdfUrl="/path/to/form.pdf"
  signatureAreas={[...]}
  onPdfStateChange={(formFields, signatures) => {
    // Handle form state changes
    console.log('Form updated:', { formFields, signatures })
  }}
/>
```

## Enhanced File Structure

```
components/Documents/
├── README.md                    # This documentation
├── DocumentViewer.tsx          # Main PDF viewer component
├── FormFieldArea.tsx           # Text/date input fields (NEW)
├── DraggableSignatureArea.tsx  # Signature area management
├── SignatureModal.tsx          # Signature creation interface
├── PDFViewer.tsx              # Core PDF rendering
├── DocumentsSection.tsx        # Document listing interface
└── DSMDocuments.tsx           # DSM-specific document handling
```
