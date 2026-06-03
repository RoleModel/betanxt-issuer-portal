const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

interface DocumentUploadEmailParams {
  meetingType: string;
  issuerAccountName: string;
  documentName: string;
  uploaderName: string;
  uploaderAvatarUrl?: string;
  documentDescription: string;
  uploadDate: string;
  viewDocumentUrl: string;
  portalBaseUrl: string;
  recipients: string[];
}

/**
 * Fires-and-forgets a document update notification email via the mock-api-server.
 * Prototype: wraps POST /api/emails/send. Does not throw — logs on failure.
 */
export async function sendDocumentUploadEmail(params: DocumentUploadEmailParams): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/emails/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateKey: "document-update-notification",
        to: params.recipients,
        props: {
          meetingType: params.meetingType,
          issuerAccountName: params.issuerAccountName,
          documentName: params.documentName,
          uploaderName: params.uploaderName,
          uploaderAvatarUrl: params.uploaderAvatarUrl,
          documentDescription: params.documentDescription,
          uploadDate: params.uploadDate,
          viewDocumentUrl: params.viewDocumentUrl,
          portalBaseUrl: params.portalBaseUrl,
        },
      }),
    });
  } catch {
    // Fire-and-forget: silently swallow network errors in prototype
  }
}
