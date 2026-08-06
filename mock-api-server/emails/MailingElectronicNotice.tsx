import {
  Column,
  Container,
  Hr,
  Link,
  Row,
  Section,
  Text,
} from "@react-email/components";
import React from "react";

import type { MailingElectronicNoticeProps } from "./types";

import { Layout } from "./components/Layout";
import { COLORS, CONTAINER_WIDTH, FONTS } from "./styles";

/**
 * Electronic delivery notice sent to stock-plan participants: a personalised
 * voting-instruction email with a control number and links to the secure
 * voting site.
 *
 * This is the electronic counterpart to the printed Full Set / NAA mailings —
 * the Mailing tab shows a thumbnail of it beside the "Electronic" figure, and
 * clicking that thumbnail opens this rendered email in the document viewer.
 *
 * Copy mirrors the client's real participant notice; every client-specific
 * value is a prop, and the company name and rules adopt the client's brand
 * colour so the notice matches whichever client's meeting it belongs to.
 */

/** A readable ink colour for the company name — the brand colour itself if it
 * is dark enough, otherwise a near-black. */
function accentInk(hex: string): string {
  const normalized = hex.replace("#", "");
  if (normalized.length < 6) {
    return COLORS.navy;
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#1F2933" : hex;
}

const bodyText: React.CSSProperties = {
  fontFamily: FONTS.sans,
  fontSize: "14px",
  lineHeight: "1.6",
  color: COLORS.text,
  margin: "0 0 16px",
};

const linkText: React.CSSProperties = {
  fontFamily: FONTS.sans,
  fontSize: "14px",
  color: COLORS.link,
  fontWeight: "700",
};

export const MailingElectronicNotice = ({
  companyName,
  companyLegalName,
  brandColor,
  meetingDateTime,
  recordDate,
  votingDeadline,
  proxyPushUrl,
  proxyPushLabel,
  voteSiteUrl,
  controlNumber,
  phone,
  printedCopiesContactName,
  printedCopiesContactEmail,
  questionsContactName,
  questionsContactLocation,
  questionsContactEmail,
  portalBaseUrl,
}: MailingElectronicNoticeProps) => {
  const accent = brandColor && brandColor.length > 0 ? brandColor : COLORS.navy;
  const nameInk = accentInk(accent);

  return (
    <Layout
      preview={`${companyName} — Annual Meeting voting instructions and control number`}
    >
      <Container
        style={{
          maxWidth: CONTAINER_WIDTH,
          margin: "0 auto",
          backgroundColor: COLORS.white,
          border: "1px solid #CCCCCC",
        }}
      >
        {/* Header: company name (left), proxy-push link (right) */}
        <Section style={{ padding: "24px 32px 12px" }}>
          <Row>
            <Column>
              <Text
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: "22px",
                  fontWeight: "700",
                  letterSpacing: "0.02em",
                  color: nameInk,
                  margin: 0,
                }}
              >
                {companyName.toUpperCase()}
              </Text>
            </Column>
            <Column align="right" style={{ verticalAlign: "middle" }}>
              <Link href={proxyPushUrl} style={linkText}>
                {proxyPushLabel}
              </Link>
            </Column>
          </Row>
        </Section>

        <Hr style={{ borderColor: accent, margin: "0 32px", width: "auto" }} />

        <Section style={{ padding: "24px 32px 8px" }}>
          <Text style={{ ...bodyText, fontWeight: "700" }}>
            TO ALL {companyName.toUpperCase()} STOCK PLAN PARTICIPANTS:
          </Text>

          <Text style={bodyText}>
            The Annual Meeting of Stockholders of {companyLegalName} will be
            held virtually on {meetingDateTime}.
          </Text>

          <Text style={bodyText}>
            All members participating in the {companyName} Stock Plan (the
            &quot;Plan&quot;) as of the record date of {recordDate}, have the
            opportunity to instruct the Plan Trustee how to vote shares
            allocated in the member&apos;s name.
          </Text>

          <Text style={bodyText}>
            Below is your personalized control number and a link to the secure
            internet site that will allow you to instruct the Plan Trustee how
            to vote your allocated shares.
          </Text>

          <Text style={bodyText}>
            Participants must provide instructions on how to vote their shares
            no later than {votingDeadline}. It is important that all Plan
            participants exercise their right as stockholders and vote their
            shares — so please vote your shares today! If you do not instruct
            the Plan Trustee how to vote your shares, the Plan Trustee will vote
            your shares in the same proportion as the shares with respect to
            which it does receive instructions, unless the Trustee determines
            that to do so would be inconsistent with applicable law. If you wish
            to change your vote, you can do so by simply voting again no later
            than {votingDeadline}. Only your latest dated vote will count.
          </Text>

          <Text style={bodyText}>
            Before you vote through the online voting system, please review the
            Proxy Statement by clicking on the link below. The Proxy Statement
            provides information on the proposals submitted for stockholder
            approval at this year&apos;s Annual Meeting and other information of
            interest to you as a stockholder. Printed copies of both the Annual
            Report and Proxy Statement are available to members at select plant
            locations. If you would like printed copies and your location does
            not have copies available, please contact {printedCopiesContactName}{" "}
            via email at{" "}
            <Link
              href={`mailto:${printedCopiesContactEmail}`}
              style={{ color: COLORS.link }}
            >
              {printedCopiesContactEmail}
            </Link>
            .
          </Text>

          <Text style={{ ...bodyText, fontWeight: "700", margin: "0 0 8px" }}>
            Please vote online by clicking on the following link:
          </Text>
          <Text style={{ margin: "0 0 16px" }}>
            <Link href={voteSiteUrl} style={linkText}>
              {voteSiteUrl}
            </Link>
          </Text>

          <Text style={{ ...bodyText, fontWeight: "700" }}>
            Your Voting Control Number is: {controlNumber}
          </Text>

          <Text style={bodyText}>
            You may also vote your shares via telephone at {phone} using the
            control number listed above.
          </Text>

          <Text style={bodyText}>
            If you have questions regarding the voting process, please contact{" "}
            {questionsContactName} in {questionsContactLocation} via email at{" "}
            <Link
              href={`mailto:${questionsContactEmail}`}
              style={{ color: COLORS.link }}
            >
              {questionsContactEmail}
            </Link>
            .
          </Text>

          <Text style={bodyText}>Thank you.</Text>
        </Section>

        <Hr style={{ borderColor: COLORS.border, margin: "0 32px 12px" }} />

        <Section style={{ padding: "0 32px 24px" }}>
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: "12px",
              color: COLORS.muted,
              margin: 0,
            }}
          >
            * Please do not reply to this e-mail. This e-mail is for
            informational purposes only.
          </Text>
          <Text
            style={{
              fontFamily: FONTS.sans,
              fontSize: "11px",
              color: COLORS.muted,
              margin: "8px 0 0",
            }}
          >
            Delivered via {portalBaseUrl.replace(/^https?:\/\//, "")}
          </Text>
        </Section>
      </Container>
    </Layout>
  );
};

export default MailingElectronicNotice;
