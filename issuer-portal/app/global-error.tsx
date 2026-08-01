"use client";

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

interface GlobalErrorProps {
  readonly error: Error & { digest?: string };
}

/**
 * Catches render errors that escape the root layout — the one place a normal
 * error boundary cannot cover. Reports them to Sentry before falling back to
 * Next's built-in error page.
 */
export default function GlobalError({ error }: GlobalErrorProps) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
