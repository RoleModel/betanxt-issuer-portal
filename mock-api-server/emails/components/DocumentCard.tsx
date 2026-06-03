import { Column, Link, Row, Section, Text } from "@react-email/components";
import React from "react";

import { COLORS, FONTS } from "../styles";

interface DocumentCardProps {
  uploaderName: string;
  uploaderAvatarUrl?: string;
  documentName: string;
  documentDescription: string;
  uploadDate: string;
  viewDocumentUrl: string;
}

function UploaderAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        width="32"
        height="32"
        style={{
          borderRadius: "50%",
          display: "block",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        backgroundColor: COLORS.navyLight,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: COLORS.white,
        fontSize: "12px",
        fontWeight: "600",
        fontFamily: FONTS.sans,
        lineHeight: "32px",
        textAlign: "center",
      }}
    >
      {initials}
    </div>
  );
}

export function DocumentCard({
  uploaderName,
  uploaderAvatarUrl,
  documentName,
  documentDescription,
  uploadDate,
  viewDocumentUrl,
}: DocumentCardProps) {
  return (
    <Section
      style={{
        backgroundColor: COLORS.white,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `4px solid ${COLORS.accentGreen}`,
        borderRadius: "6px",
        padding: "16px 20px",
        margin: "0 0 24px",
      }}
    >
      <Row style={{ marginBottom: "12px" }}>
        <Column style={{ width: "40px", verticalAlign: "top" }}>
          <UploaderAvatar name={uploaderName} avatarUrl={uploaderAvatarUrl} />
        </Column>
        <Column style={{ verticalAlign: "top", paddingLeft: "10px" }}>
          <Text
            style={{
              color: COLORS.muted,
              fontFamily: FONTS.sans,
              fontSize: "12px",
              margin: 0,
              lineHeight: "1.4",
            }}
          >
            {uploaderName}
          </Text>
        </Column>
        <Column align="right" style={{ verticalAlign: "top" }}>
          <Text
            style={{
              color: COLORS.muted,
              fontFamily: FONTS.sans,
              fontSize: "12px",
              margin: 0,
              lineHeight: "1.4",
            }}
          >
            {uploadDate}
          </Text>
        </Column>
      </Row>
      <Text
        style={{
          color: COLORS.text,
          fontFamily: FONTS.sans,
          fontSize: "15px",
          fontWeight: "600",
          margin: "0 0 6px",
          lineHeight: "1.3",
        }}
      >
        {documentName}
      </Text>
      <Text
        style={{
          color: COLORS.textLight,
          fontFamily: FONTS.sans,
          fontSize: "14px",
          margin: "0 0 14px",
          lineHeight: "1.5",
        }}
      >
        {documentDescription}
      </Text>
      <Link
        href={viewDocumentUrl}
        style={{
          color: COLORS.link,
          fontFamily: FONTS.sans,
          fontSize: "14px",
          fontWeight: "500",
          textDecoration: "none",
        }}
      >
        View Document →
      </Link>
    </Section>
  );
}
