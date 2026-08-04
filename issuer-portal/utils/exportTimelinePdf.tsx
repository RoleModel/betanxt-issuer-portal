import React from "react";

import type { KeyDate, Task } from "@/types/api-exports";

import { shiftWeekendToMonday } from "@/components/Calendar/CalendarUtils";
import {
  ReportPageNumber,
  ReportPdfHeader,
  downloadBlob,
  reportStyles,
  resolveReportLogos,
} from "@/utils/reportPdfTheme";

interface CombinedItem {
  type: "task" | "keyDate";
  item: Task | KeyDate;
  date: Date;
  displayDate: string;
}

interface ExportOptions {
  tasks: Task[];
  keyDates: KeyDate[];
  meetingTitle: string;
  selectedPhase?: number | "all";
  clientTicker?: string;
}

// Phase colors (matching theme.palette.phase)
const phaseColors = [
  "#00838f", // cyan[800]
  "#00695c", // teal[800]
  "#7b1fa2", // purple[700]
  "#0288d1", // lightBlue[700]
  "#880e4f", // pink[900]
  "#1565c0", // blue[800]
  "#2e7d32", // green[800]
  "#4527a0", // deepPurple[800]
  "#616161", // grey[700]
];

// Helper to convert hex to RGB
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return "rgb(0, 0, 0)";
}

// Helper function to parse date strings
const parseDateString = (dateStr: string): Date => {
  const cleanDateStr = dateStr.replace(/^[A-Za-z]+,\s*/, "");
  const currentYear = new Date().getFullYear();
  return new Date(`${cleanDateStr}, ${currentYear}`);
};

// Format date for display
const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return "";

  const [year, month, day] = dateStr.split("-").map(Number);
  const originalDate = new Date(Date.UTC(year, month - 1, day));
  const adjustedDate = shiftWeekendToMonday(originalDate);

  return adjustedDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
};

// Format date to match Figma style (e.g., "Jun 18", "Jul 29")
function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return "TBD";

  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const adjustedDate = shiftWeekendToMonday(date);

    return adjustedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return "TBD";
  }
}

interface TimelinePDFDocumentProps {
  readonly tasks: Task[];
  readonly keyDates: KeyDate[];
  readonly meetingTitle: string;
  readonly selectedPhase?: number | "all";
  readonly clientTicker?: string;
  readonly clientLogoUrl?: string;
  readonly betanxtLogoUrl?: string;
}

// Simple PDF export function
export async function exportTimelineToPdf(options: ExportOptions) {
  const {
    tasks,
    keyDates,
    meetingTitle,
    selectedPhase = "all",
    clientTicker,
  } = options;

  try {
    // Load the heavy PDF renderer on demand so it stays out of the initial bundle.
    const { Document, Page, StyleSheet, Text, View, pdf } =
      await import("@react-pdf/renderer");

    // Timeline-specific styles layered on the shared report theme
    const styles = StyleSheet.create({
      phaseSection: {
        marginTop: 14,
      },
      phaseHeader: {
        fontSize: 9,
        fontWeight: 700,
        marginBottom: 4,
        fontFamily: "Roboto",
      },
      table: {
        flexDirection: "column",
      },
      tableRow: {
        flexDirection: "row",
        minHeight: 20,
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#E4E4E4",
      },
      keyDateRow: {
        backgroundColor: "#F3F3F3",
        borderLeftWidth: 2,
        borderLeftColor: "#016397",
        paddingLeft: 8,
      },
      taskRow: {
        backgroundColor: "#FFFFFF",
        borderLeftWidth: 2,
        paddingLeft: 8,
      },
      taskCell: {
        flex: 1,
        fontSize: 8,
        paddingVertical: 4,
        paddingRight: 8,
        fontFamily: "Roboto",
        color: "#1F1E1C",
      },
      dateCell: {
        width: 80,
        fontSize: 8,
        textAlign: "right",
        paddingVertical: 4,
        paddingRight: 8,
        fontFamily: "Roboto",
        color: "#1F1E1C",
      },
      boldText: {
        fontWeight: 700,
      },
    });

    // Timeline PDF Document Component
    const TimelinePDFDocument = ({
      tasks: documentTasks,
      keyDates: documentKeyDates,
      meetingTitle: documentMeetingTitle,
      selectedPhase: documentSelectedPhase = "all",
      clientTicker: documentClientTicker,
      clientLogoUrl,
      betanxtLogoUrl,
    }: TimelinePDFDocumentProps) => {
      // Filter and sort data
      let filteredTasks = documentTasks;
      let filteredKeyDates = documentKeyDates;

      if (
        documentSelectedPhase !== "all" &&
        typeof documentSelectedPhase === "number"
      ) {
        filteredTasks = documentTasks.filter(
          (t) => t.phaseNumber === documentSelectedPhase
        );
        filteredKeyDates = documentKeyDates.filter(
          (k) => k.phaseNumber === documentSelectedPhase
        );
      }

      // Combine and sort items chronologically
      const combinedItems: CombinedItem[] = [];

      // Add tasks
      filteredTasks.forEach((task) => {
        if (task.dueDate) {
          const displayDate = formatDate(task.dueDate);
          combinedItems.push({
            type: "task",
            item: task,
            date: parseDateString(displayDate),
            displayDate,
          });
        }
      });

      // Add key dates
      filteredKeyDates.forEach((keyDate) => {
        if (keyDate.date) {
          const displayDate = formatDate(keyDate.date);
          combinedItems.push({
            type: "keyDate",
            item: keyDate,
            date: parseDateString(displayDate),
            displayDate,
          });
        }
      });

      // Sort chronologically
      combinedItems.sort((a, b) => {
        const dateComparison = a.date.getTime() - b.date.getTime();
        if (dateComparison !== 0) return dateComparison;
        // Key dates before tasks on same date
        if (a.type === "keyDate" && b.type === "task") return -1;
        if (a.type === "task" && b.type === "keyDate") return 1;
        return 0;
      });

      // Group by phases
      const phaseGroups = new Map<number, CombinedItem[]>();

      if (documentSelectedPhase === "all") {
        combinedItems.forEach((item) => {
          let phase = 1;
          if (item.type === "task") {
            const task = item.item as Task;
            phase = task.phaseNumber || 1;
          } else {
            const keyDate = item.item as KeyDate;
            phase = keyDate.phaseNumber || 1;
          }

          if (!phaseGroups.has(phase)) {
            phaseGroups.set(phase, []);
          }
          phaseGroups.get(phase)!.push(item);
        });
      } else if (typeof documentSelectedPhase === "number") {
        phaseGroups.set(documentSelectedPhase, combinedItems);
      }

      return (
        <Document>
          <Page size="LETTER" style={reportStyles.page}>
            <ReportPdfHeader
              reportTitle="Meeting Schedule"
              subtitle={documentMeetingTitle}
              clientTicker={documentClientTicker}
              clientLogoUrl={clientLogoUrl}
              betanxtLogoUrl={betanxtLogoUrl}
            />

            {/* Phase Tables */}
            {Array.from({ length: 8 }, (_, i) => i + 1).map((phase) => {
              const items = phaseGroups.get(phase) || [];
              if (items.length === 0) return null;

              const phaseColor = hexToRgb(phaseColors[phase - 1]);

              return (
                <View key={phase} style={styles.phaseSection} wrap={false}>
                  <Text style={[styles.phaseHeader, { color: phaseColor }]}>
                    Phase {phase}
                  </Text>
                  <View style={styles.table}>
                    {items.map((item) => {
                      if (item.type === "keyDate") {
                        const keyDate = item.item as KeyDate;
                        return (
                          <View
                            key={`kd-${phase}-${keyDate.id ?? `${keyDate.title}-${item.displayDate}`}`}
                            style={[styles.tableRow, styles.keyDateRow]}
                          >
                            <Text style={[styles.taskCell, styles.boldText]}>
                              {keyDate.title ?? "Untitled Key Date"}
                            </Text>
                            <Text style={[styles.dateCell, styles.boldText]}>
                              {item.displayDate}
                            </Text>
                          </View>
                        );
                      } else {
                        const task = item.item as Task;
                        const taskPhaseColor = hexToRgb(
                          phaseColors[(task.phaseNumber || 1) - 1]
                        );
                        return (
                          <View
                            key={`t-${phase}-${task.id ?? `${task.title}-${item.displayDate}`}`}
                            style={[
                              styles.tableRow,
                              styles.taskRow,
                              { borderLeftColor: taskPhaseColor },
                            ]}
                          >
                            <Text style={styles.taskCell}>
                              {task.title ?? "Untitled Task"}
                            </Text>
                            <Text style={styles.dateCell}>
                              {formatDateShort(task.dueDate || null)}
                            </Text>
                          </View>
                        );
                      }
                    })}
                  </View>
                </View>
              );
            })}

            <ReportPageNumber />
          </Page>
        </Document>
      );
    };

    const { clientLogoUrl, betanxtLogoUrl } =
      await resolveReportLogos(clientTicker);

    const pdfBlob = await pdf(
      <TimelinePDFDocument
        tasks={tasks}
        keyDates={keyDates}
        meetingTitle={meetingTitle}
        selectedPhase={selectedPhase}
        clientTicker={clientTicker}
        clientLogoUrl={clientLogoUrl}
        betanxtLogoUrl={betanxtLogoUrl}
      />
    ).toBlob();

    const fileName = `${meetingTitle.replace(/\s+/g, "_")}_Timeline_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    downloadBlob(pdfBlob, fileName);
  } catch (error) {
    console.error("Error exporting PDF:", error);
    throw error;
  }
}
