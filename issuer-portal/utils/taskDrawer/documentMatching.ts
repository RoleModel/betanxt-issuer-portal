import type { components } from "@/domain-models/generated-schema";

type Document = components["schemas"]["Document"];

interface Task {
  id?: string;
  taskId?: string;
  title?: string;
  meetingId?: string;
}

/**
 * Finds a signed document for a given task using multiple matching strategies
 */
export const findSignedDocumentForTask = (
  task: Task,
  documents: Document[],
): Document | undefined => {
  return documents.find((doc) => {
    // Check for signed/completed document types
    const signedDocTypes = [
      "signed-form",
      "transfer-agent-request",
      "plan-file-request",
      "broadridge-form",
    ];
    if (!signedDocTypes.includes(doc.type ?? "")) {
      return false;
    }

    // Also check for 'Signed' in title
    const hasSignedInTitle = (doc.title ?? "").toLowerCase().includes("signed");
    if (!hasSignedInTitle) {
      return false;
    }

    // Strategy 1: Match on taskId field if both exist
    if (doc.taskId && task.taskId && doc.taskId === task.taskId) {
      return true;
    }

    // Strategy 2: Match on task.id (most common)
    if (doc.taskId === task.id) {
      return true;
    }

    // Strategy 3: Match on document type aligning with task title
    const taskTitle = (task.title ?? "").toLowerCase();

    // Require specific type-to-title alignment
    if (
      doc.type === "transfer-agent-request" &&
      taskTitle.includes("transfer") &&
      taskTitle.includes("agent")
    ) {
      return true;
    }

    if (
      doc.type === "plan-file-request" &&
      taskTitle.includes("plan") &&
      taskTitle.includes("file")
    ) {
      return true;
    }

    if (doc.type === "broadridge-form" && taskTitle.includes("broadridge")) {
      return true;
    }

    return false;
  });
};
