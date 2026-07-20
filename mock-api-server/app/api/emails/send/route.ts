import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";
import React from "react";
import { z } from "zod";

import { DocumentUpdateNotification } from "@/emails/DocumentUpdateNotification";
import { TabulationReportEmail } from "@/emails/TabulationReportEmail";
import { getEmailService } from "@/lib/email/EmailService";
import { handleCors, withCors } from "@/utils/cors";

export const runtime = "nodejs";

const DocumentUpdateNotificationSchema = z.object({
  meetingType: z.string().min(1),
  issuerAccountName: z.string().min(1),
  documentName: z.string().min(1),
  uploaderName: z.string().min(1),
  uploaderAvatarUrl: z.string().url().optional(),
  documentDescription: z.string().min(1),
  uploadDate: z.string().min(1),
  viewDocumentUrl: z.string().url(),
  portalBaseUrl: z.string().url(),
});

const TabulationReportProposalSchema = z.object({
  number: z.string(),
  title: z.string().min(1),
  totalShares: z.number().int().nonnegative(),
  votesFor: z.number().int().nonnegative(),
  votesAgainst: z.number().int().nonnegative(),
  votesAbstain: z.number().int().nonnegative(),
  votesNotCast: z.number().int().nonnegative(),
});

const TabulationReportSchema = z.object({
  companyName: z.string().min(1),
  meetingType: z.string().min(1),
  meetingDate: z.string().min(1),
  reportDate: z.string().min(1),
  daysUntilMeeting: z.number().int().nonnegative(),
  recipientName: z.string().min(1),
  proposals: z.array(TabulationReportProposalSchema).min(1),
  totalSharesEligible: z.number().int().nonnegative(),
  totalSharesVoted: z.number().int().nonnegative(),
  quorumRequired: z.number().min(0).max(100),
  quorumMet: z.boolean(),
  viewTabulationUrl: z.string().url(),
  portalBaseUrl: z.string().url(),
});

const SendEmailSchema = z.discriminatedUnion("templateKey", [
  z.object({
    templateKey: z.literal("document-update-notification"),
    to: z.array(z.string().email()).min(1),
    props: DocumentUpdateNotificationSchema,
  }),
  z.object({
    templateKey: z.literal("tabulation-daily-report"),
    to: z.array(z.string().email()).min(1),
    props: TabulationReportSchema,
  }),
]);

type SendEmailPayload = z.infer<typeof SendEmailSchema>;

const TEMPLATE_REGISTRY: Record<
  string,
  (props: unknown) => React.ReactElement
> = {
  "document-update-notification": (props) =>
    React.createElement(
      DocumentUpdateNotification,
      props as React.ComponentProps<typeof DocumentUpdateNotification>
    ),
  "tabulation-daily-report": (props) =>
    React.createElement(
      TabulationReportEmail,
      props as React.ComponentProps<typeof TabulationReportEmail>
    ),
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (process.env.ENABLE_EMAILS !== "true") {
    return withCors(
      NextResponse.json(
        {
          error:
            "Email sending is disabled. Set ENABLE_EMAILS=true in mock-api-server/.env.local",
        },
        { status: 503 }
      )
    );
  }

  try {
    const body: unknown = await request.json();
    const parsed = SendEmailSchema.safeParse(body);

    if (!parsed.success) {
      return withCors(
        NextResponse.json(
          { error: "Invalid payload", details: parsed.error.flatten() },
          { status: 400 }
        )
      );
    }

    const { templateKey, to, props } = parsed.data;
    const renderTemplate = TEMPLATE_REGISTRY[templateKey];

    const subject = buildSubject(parsed.data);
    const element = renderTemplate(props);
    const service = getEmailService();
    const result = await service.send({ to, subject, react: element });

    return withCors(NextResponse.json({ data: { id: result.id } }));
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      )
    );
  }
}

function buildSubject(payload: SendEmailPayload): string {
  if (payload.templateKey === "document-update-notification") {
    return `Document Update: ${payload.props.documentName} — ${payload.props.meetingType}`;
  }
  if (payload.templateKey === "tabulation-daily-report") {
    return `Daily Tabulation Report — ${payload.props.companyName} · ${payload.props.daysUntilMeeting}d until meeting`;
  }
  return "BetaNXT Issuer Portal Notification";
}

export function OPTIONS() {
  return handleCors();
}
