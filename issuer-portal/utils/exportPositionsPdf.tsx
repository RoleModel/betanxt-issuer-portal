import {
  Document,
  Font,
  Image as PDFImage,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import React from "react";

// Register Roboto font
Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-300-normal.woff",
      fontWeight: 300,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-400-normal.woff",
      fontWeight: 400,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-500-normal.woff",
      fontWeight: 500,
    },
    {
      src: "https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-700-normal.woff",
      fontWeight: 700,
    },
  ],
});

interface Position {
  cusip: string;
  accountType: string;
  setKey: string;
  name: string;
  accountNumber: string;
  voteStatus: string;
  controlNumber: string;
  shares: number;
  sharesVoted: number;
  source: string;
  dateVoted: string | null;
  sentBy: string | null;
}

interface ExportOptions {
  positions: Position[];
  meetingTitle: string;
  clientTicker?: string;
}

// Create styles based on the provided image styling
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontFamily: "Roboto",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    alignItems: "center",
  },
  logo: {
    width: 60,
    height: 60,
  },
  betanxtLogo: {
    width: 86,
    height: 18.6,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
    fontFamily: "Roboto",
    textAlign: "left",
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    fontFamily: "Roboto",
    textAlign: "left",
    color: "#666666",
  },
  table: {
    flexDirection: "column",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#E0E0E0",
    paddingVertical: 4,
    minHeight: 24,
  },
  tableRowAlternate: {
    backgroundColor: "#FAFAFA",
  },
  headerCell: {
    fontSize: 7,
    fontWeight: 700,
    paddingHorizontal: 3,
    fontFamily: "Roboto",
    textAlign: "left",
  },
  cell: {
    fontSize: 7,
    paddingHorizontal: 3,
    fontFamily: "Roboto",
  },
  cellCenter: {
    textAlign: "center",
  },
  cellRight: {
    textAlign: "right",
  },
  // Column widths (percentages)
  col1: { width: "8%" }, // CUSIP
  col2: { width: "8%" }, // Account Type
  col3: { width: "5%" }, // Set Key
  col4: { width: "20%" }, // Name
  col5: { width: "12%" }, // Account #
  col6: { width: "8%" }, // Vote Status
  col7: { width: "8%" }, // Control #
  col8: { width: "5%" }, // Shares
  col9: { width: "10%" }, // Shares Voted
  col10: { width: "6%" }, // Source
  col11: { width: "10%" }, // Date Voted
  col12: { width: "6%" }, // Sent By
  fallbackLogo: {
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "Roboto",
  },
  betanxtText: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0D6580",
    fontFamily: "Roboto",
  },
});

// Format number with thousand separators
const formatNumber = (num: number): string => {
  return num.toLocaleString("en-US");
};

// Format date
const formatDate = (date: string | null): string => {
  if (!date) return "";

  try {
    // Handle MM/DD/YYYY format with optional time
    let dateStr = date;
    if (date.includes(" 12:00AM")) {
      dateStr = date.replace(" 12:00AM", "");
    }

    const parsedDate = new Date(dateStr);

    // Check if date is valid
    if (isNaN(parsedDate.getTime())) {
      // Try parsing as MM/DD/YYYY directly
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        const altDate = new Date(year, month - 1, day);

        if (!isNaN(altDate.getTime())) {
          return altDate.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
          });
        }
      }
      return "";
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  } catch (_error) {
    return "";
  }
};

interface PositionsPDFDocumentProps {
  positions: Position[];
  meetingTitle: string;
  clientTicker?: string;
  clientLogoUrl?: string;
  betanxtLogoUrl?: string;
}

// Positions PDF Document Component
const PositionsPDFDocument: React.FC<PositionsPDFDocumentProps> = ({
  positions,
  meetingTitle,
  clientTicker,
  clientLogoUrl,
  betanxtLogoUrl,
}) => {
  return (
    <Document>
      <Page size="LETTER" style={styles.page} orientation="landscape">
        {/* Header with logos */}
        <View style={styles.header}>
          <View>
            {clientLogoUrl ? (
              <PDFImage style={styles.logo} src={clientLogoUrl} />
            ) : (
              <Text style={styles.fallbackLogo}>
                {clientTicker ? `${clientTicker} Logo` : "Client Logo"}
              </Text>
            )}
          </View>
          <View>
            {betanxtLogoUrl ? (
              <PDFImage style={styles.betanxtLogo} src={betanxtLogoUrl} />
            ) : (
              <Text style={styles.betanxtText}>BetaNXT</Text>
            )}
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Positions Report</Text>
        <Text style={styles.subtitle}>{meetingTitle}</Text>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.col1]}>CUSIP</Text>
            <Text style={[styles.headerCell, styles.col2]}>Account Type</Text>
            <Text style={[styles.headerCell, styles.col3]}>Set Key</Text>
            <Text style={[styles.headerCell, styles.col4]}>Name</Text>
            <Text style={[styles.headerCell, styles.col5]}>Account #</Text>
            <Text style={[styles.headerCell, styles.col7]}>Control #</Text>
            <Text style={[styles.headerCell, styles.cellRight, styles.col8]}>Shares</Text>
            <Text style={[styles.headerCell, styles.cellRight, styles.col9]}>Shares Voted</Text>
            <Text style={[styles.headerCell, styles.col6]}>Vote Status</Text>
            <Text style={[styles.headerCell, styles.col10]}>Source</Text>
            <Text style={[styles.headerCell, styles.col11]}>Date Voted</Text>
            <Text style={[styles.headerCell, styles.cellRight, styles.col12]}>Sent By</Text>
          </View>

          {/* Table Rows */}
          {positions.map((position, index) => (
            <View
              key={index}
              style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlternate : {}]}
            >
              <Text style={[styles.cell, styles.col1]}>{position.cusip}</Text>
              <Text style={[styles.cell, styles.col2]}>{position.accountType}</Text>
              <Text style={[styles.cell, styles.col3]}>{position.setKey}</Text>
              <Text style={[styles.cell, styles.col4]}>{position.name}</Text>
              <Text style={[styles.cell, styles.col5]}>{position.accountNumber}</Text>
              <Text style={[styles.cell, styles.col7]}>{position.controlNumber}</Text>
              <Text style={[styles.cell, styles.col8, styles.cellRight]}>
                {formatNumber(position.shares)}
              </Text>
              <Text style={[styles.cell, styles.col9, styles.cellRight]}>
                {formatNumber(position.sharesVoted)}
              </Text>
              <Text style={[styles.cell, styles.col6]}>{position.voteStatus}</Text>
              <Text style={[styles.cell, styles.col10]}>{position.source}</Text>
              <Text style={[styles.cell, styles.col11]}>{formatDate(position.dateVoted)}</Text>
              <Text style={[styles.cell, styles.col12, styles.cellRight]}>
                {position.sentBy ? "Email" : "Mail"}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

// Main export function
export async function exportPositionsToPdf(options: ExportOptions) {
  const { positions, meetingTitle, clientTicker } = options;

  try {
    // Use direct image URLs (no base64 conversion needed)
    const clientLogoUrl = clientTicker
      ? `/logos/${clientTicker.toLowerCase()}_logo.png`
      : undefined;
    const betanxtLogoUrl = "/images/betanxt-logo.png";

    // Generate the PDF
    const pdfBlob = await pdf(
      <PositionsPDFDocument
        positions={positions}
        meetingTitle={meetingTitle}
        clientTicker={clientTicker}
        clientLogoUrl={clientLogoUrl}
        betanxtLogoUrl={betanxtLogoUrl}
      />,
    ).toBlob();

    // Create download link and trigger download
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    const fileName = `${meetingTitle.replace(/\s+/g, "_")}_Positions_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
