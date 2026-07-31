import { Container, Section, Text } from "@react-email/components";
import React from "react";

import type { DocumentUpdateNotificationProps } from "./types";

import { DocumentCard } from "./components/DocumentCard";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { Layout } from "./components/Layout";
import { COLORS, CONTAINER_WIDTH, FONTS } from "./styles";

function formatUploadDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const DocumentUpdateNotification = ({
  meetingType,
  issuerAccountName,
  documentName,
  uploaderName,
  uploaderAvatarUrl,
  documentDescription,
  uploadDate,
  viewDocumentUrl,
  portalBaseUrl,
}: DocumentUpdateNotificationProps) => {
  return (
    <Layout preview={`New document available: ${documentName}`}>
      <Container style={{ maxWidth: CONTAINER_WIDTH, margin: "0 auto" }}>
        <Header meetingType={meetingType} />

        <Section
          style={{
            backgroundColor: COLORS.white,
            padding: "32px 32px 8px",
          }}
        >
          <Text
            style={{
              color: COLORS.text,
              fontFamily: FONTS.sans,
              fontSize: "15px",
              margin: "0 0 16px",
              lineHeight: "1.6",
            }}
          >
            Hello {issuerAccountName},
          </Text>
          <Text
            style={{
              color: COLORS.textLight,
              fontFamily: FONTS.sans,
              fontSize: "14px",
              margin: "0 0 24px",
              lineHeight: "1.6",
            }}
          >
            A new document, <strong>{documentName}</strong>, has been added to
            your workflow and is ready for your review. Please log in to the
            portal and approve (or request changes) at your earliest
            convenience.
          </Text>

          <DocumentCard
            uploaderName={uploaderName}
            uploaderAvatarUrl={uploaderAvatarUrl}
            documentName={documentName}
            documentDescription={documentDescription}
            uploadDate={formatUploadDate(uploadDate)}
            viewDocumentUrl={viewDocumentUrl}
          />
        </Section>

        <Footer portalBaseUrl={portalBaseUrl} />
      </Container>
    </Layout>
  );
};

export default DocumentUpdateNotification;
