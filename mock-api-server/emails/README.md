# Email Templates

React Email templates for the BetaNXT Issuer Portal, sent via Gmail SMTP in deployed environments.

## Available Templates

| Key                            | File                             | Description                                                               |
| ------------------------------ | -------------------------------- | ------------------------------------------------------------------------- |
| `document-update-notification` | `DocumentUpdateNotification.tsx` | Notifies an issuer account when a new document is added to their workflow |

## Adding a New Template

1. Create `emails/YourTemplate.tsx` — export a named React component and a default export.
2. Add props type to `emails/types.ts`.
3. Add a Zod schema in `app/api/emails/send/route.ts` under the `SendEmailSchema` discriminated union.
4. Register the render function in `TEMPLATE_REGISTRY`.
5. Add fixture props and handle the template key in `app/api/emails/preview/route.ts`.

## Local Preview

Visit `http://localhost:3001/__emails` to see a rendered preview using fixture props.

Or run the react-email standalone dev server:

```bash
cd mock-api-server
npm run email:dev
# opens http://localhost:3030
```

## Sending Emails

**Noop mode (default for local dev)**: emails are logged to console, not sent.

**SMTP/Gmail mode**: set in `.env.local`:

```
EMAIL_FROM="BetaNXT Issuer Portal <noreply@betanxt.com>"
EMAIL_PROVIDER=smtp
ENABLE_EMAILS=true
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=your-gmail-address@example.com
EMAIL_SMTP_PASS=your-gmail-app-password
PORTAL_BASE_URL=https://your-portal.vercel.app
```

For Gmail SMTP, `EMAIL_FROM` should match `EMAIL_SMTP_USER` or be a Gmail/Google Workspace send-as alias that account is authorized to use. Otherwise Gmail may rewrite the sender or reject the message.

## API

```
POST /api/emails/send
Content-Type: application/json

{
  "templateKey": "document-update-notification",
  "to": ["user@example.com"],
  "props": {
    "meetingType": "Annual Meeting",
    "issuerAccountName": "Acme Corp",
    "documentName": "Proxy Notice",
    "uploaderName": "Sarah Chen",
    "documentDescription": "Sarah Chen has uploaded the first draft of the Proxy Notice.",
    "uploadDate": "2026-06-01T10:00:00Z",
    "viewDocumentUrl": "https://portal.betanxt.com/WEN/meeting/wen-2026/documents",
    "portalBaseUrl": "https://portal.betanxt.com"
  }
}
```

Response: `{ "data": { "id": "..." } }` or `{ "error": "..." }`.
