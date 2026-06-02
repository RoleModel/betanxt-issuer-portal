import { redirect } from 'next/navigation'

import { EmailPreviewClient } from './EmailPreviewClient'

export default function EmailPreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    redirect('/')
  }

  return <EmailPreviewClient />
}
