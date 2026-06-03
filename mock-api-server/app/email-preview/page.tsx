import { redirect } from "next/navigation";

import { EmailPreviewClient } from "./EmailPreviewClient";

export const dynamic = "force-dynamic";

export default function EmailPreviewPage() {
  if (process.env.ENABLE_EMAIL_PREVIEW !== "true") {
    redirect("/");
  }

  return <EmailPreviewClient />;
}
