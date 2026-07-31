import React from "react";

import DocumentsSection from "@/components/Documents/DocumentsSection";

export const revalidate = 60;

interface PageProps {
  readonly params: Promise<{ clientTicker: string; meetingId: string }>;
}

const DocumentsPage = ({ params }: PageProps) => {
  return <DocumentsSection params={params} />;
};

export default DocumentsPage;
