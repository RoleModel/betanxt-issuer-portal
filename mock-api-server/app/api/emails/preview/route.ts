import { render } from "@react-email/render";
import { NextResponse } from "next/server";
import React from "react";
import type { NextRequest } from "next/server";

import type { MailingElectronicNoticeProps } from "@/emails/types";
import { DocumentUpdateNotification } from "@/emails/DocumentUpdateNotification";
import { MailingElectronicNotice } from "@/emails/MailingElectronicNotice";
import { TabulationReportEmail } from "@/emails/TabulationReportEmail";
import { handleCors, withCors } from "@/utils/cors";

const DOCUMENT_FIXTURE = {
  meetingType: "Annual Meeting",
  issuerAccountName: "Sample Issuer Account",
  documentName: "Proxy Notice",
  uploaderName: "Sarah Chen",
  documentDescription:
    "Sarah Chen has uploaded the first draft of the Proxy Notice.",
  uploadDate: "2026-06-02T12:00:00.000Z",
  viewDocumentUrl: "http://localhost:3000/documents/preview",
  portalBaseUrl: "http://localhost:3000",
};

const TABULATION_FIXTURE = {
  companyName: "Wendy's International",
  meetingType: "Annual Meeting 2026",
  meetingDate: "2026-06-17T14:00:00.000Z",
  reportDate: "2026-06-02T06:00:00.000Z",
  daysUntilMeeting: 15,
  recipientName: "Dallas Peters",
  totalSharesEligible: 12_500_000,
  totalSharesVoted: 6_842_000,
  quorumRequired: 50,
  quorumMet: true,
  viewTabulationUrl:
    "http://localhost:3000/WEN/meeting/wen-annual-meeting-2026/tabulation",
  portalBaseUrl: "http://localhost:3000",
  proposals: [
    {
      number: "1",
      title: "Election of Directors — Class II",
      totalShares: 12_500_000,
      votesFor: 6_021_000,
      votesAgainst: 420_000,
      votesAbstain: 401_000,
      votesNotCast: 5_658_000,
    },
    {
      number: "2",
      title: "Advisory Vote on Executive Compensation (Say-on-Pay)",
      totalShares: 12_500_000,
      votesFor: 5_810_000,
      votesAgainst: 780_000,
      votesAbstain: 252_000,
      votesNotCast: 5_658_000,
    },
    {
      number: "3",
      title: "Ratification of Independent Registered Public Accounting Firm",
      totalShares: 12_500_000,
      votesFor: 6_500_000,
      votesAgainst: 190_000,
      votesAbstain: 152_000,
      votesNotCast: 5_658_000,
    },
    {
      number: "4",
      title: "Approval of the 2026 Equity Incentive Plan",
      totalShares: 12_500_000,
      votesFor: 4_200_000,
      votesAgainst: 2_100_000,
      votesAbstain: 542_000,
      votesNotCast: 5_658_000,
    },
  ],
};

const ELECTRONIC_FIXTURE: MailingElectronicNoticeProps = {
  companyName: "Woodward",
  companyLegalName: "Woodward, Inc.",
  meetingDateTime: "January 28, 2026 at 8:00 a.m. CT",
  recordDate: "December 1, 2025",
  votingDeadline: "8:00 a.m. CT on Tuesday, January 27, 2026",
  proxyPushUrl: "https://www.proxypush.com/WWD",
  proxyPushLabel: "www.proxypush.com/WWD",
  voteSiteUrl: "https://www.proxydocs.com/WWD",
  controlNumber: "338141742198",
  phone: "1-866-829-5209",
  printedCopiesContactName: "Becky Dees",
  printedCopiesContactEmail: "becky.dees@woodward.com",
  questionsContactName: "Bryan Dunn",
  questionsContactLocation: "Colorado",
  questionsContactEmail: "bryan.dunn@woodward.com",
  portalBaseUrl: "http://localhost:3000",
};

/**
 * Builds the electronic-notice props from the fixture, letting query params
 * override the client-specific fields. The Mailing tab passes the current
 * client's name and brand colour so the notice matches that client's theme.
 */
function buildElectronicProperties(
  searchParameters: URLSearchParams
): MailingElectronicNoticeProps {
  const override = (key: string, fallback: string): string =>
    searchParameters.get(key) ?? fallback;

  return {
    companyName: override("company", ELECTRONIC_FIXTURE.companyName),
    companyLegalName: override(
      "companyLegal",
      ELECTRONIC_FIXTURE.companyLegalName
    ),
    brandColor: searchParameters.get("color") ?? undefined,
    meetingDateTime: override(
      "meetingDateTime",
      ELECTRONIC_FIXTURE.meetingDateTime
    ),
    recordDate: override("recordDate", ELECTRONIC_FIXTURE.recordDate),
    votingDeadline: override(
      "votingDeadline",
      ELECTRONIC_FIXTURE.votingDeadline
    ),
    proxyPushUrl: override("proxyPushUrl", ELECTRONIC_FIXTURE.proxyPushUrl),
    proxyPushLabel: override(
      "proxyPushLabel",
      ELECTRONIC_FIXTURE.proxyPushLabel
    ),
    voteSiteUrl: override("voteSiteUrl", ELECTRONIC_FIXTURE.voteSiteUrl),
    controlNumber: override("controlNumber", ELECTRONIC_FIXTURE.controlNumber),
    phone: override("phone", ELECTRONIC_FIXTURE.phone),
    printedCopiesContactName: override(
      "printedContactName",
      ELECTRONIC_FIXTURE.printedCopiesContactName
    ),
    printedCopiesContactEmail: override(
      "printedContactEmail",
      ELECTRONIC_FIXTURE.printedCopiesContactEmail
    ),
    questionsContactName: override(
      "questionsContactName",
      ELECTRONIC_FIXTURE.questionsContactName
    ),
    questionsContactLocation: override(
      "questionsContactLocation",
      ELECTRONIC_FIXTURE.questionsContactLocation
    ),
    questionsContactEmail: override(
      "questionsContactEmail",
      ELECTRONIC_FIXTURE.questionsContactEmail
    ),
    portalBaseUrl: override("portalBaseUrl", ELECTRONIC_FIXTURE.portalBaseUrl),
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const template = searchParams.get("template") ?? "tabulation-daily-report";

  // The electronic mailing notice is a product feature (previewed on the
  // Mailing tab), so it is served regardless of the dev-only preview flag; the
  // other templates are developer previews and remain gated behind it.
  if (
    template !== "mailing-electronic-notice" &&
    process.env.ENABLE_EMAIL_PREVIEW !== "true"
  ) {
    return withCors(
      NextResponse.json({ error: "Not available" }, { status: 404 })
    );
  }

  // `format=html` returns a rendered HTML document (for iframing in the
  // document viewer); anything else returns JSON for the preview screen.
  const isAsHtml = searchParams.get("format") === "html";

  let element: React.ReactElement;

  switch (template) {
    case "document-update-notification": {
      element = React.createElement(
        DocumentUpdateNotification,
        DOCUMENT_FIXTURE
      );

      break;
    }
    case "tabulation-daily-report": {
      element = React.createElement(TabulationReportEmail, TABULATION_FIXTURE);

      break;
    }
    case "mailing-electronic-notice": {
      element = React.createElement(
        MailingElectronicNotice,
        buildElectronicProperties(searchParams)
      );

      break;
    }
    default: {
      return withCors(
        NextResponse.json({ error: "Unknown template" }, { status: 400 })
      );
    }
  }

  const html = await render(element);

  if (isAsHtml) {
    return withCors(
      new NextResponse(html, {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" },
      })
    );
  }

  return withCors(NextResponse.json({ html }));
}

export function OPTIONS() {
  return handleCors();
}
