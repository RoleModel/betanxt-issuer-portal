import type { components } from "@/domain-models/generated-schema";
import buildApiClient from "@/domain-models/apiClient";

/**
 * Utility functions for calculating and updating meeting overall completion
 */

type DatabaseTask = components["schemas"]["Task"];

// Statuses that count toward overall completion
// Include: Positive (green), Warning (yellow), and Neutral EXCEPT INCOMPLETE
const COMPLETION_STATUSES = new Set([
  // Positive/Success statuses (green)
  "COMPLETE",
  "AUTHORIZED",

  // Warning/Pending statuses (yellow)
  "PENDING_AUTHORIZATION",
  "WAITING_FOR_FORM_RETURN",

  // Neutral statuses (grey) - excluding INCOMPLETE
  "SUBMITTED_AWAITING_RECORD_DATE",
  "REQUEST_FORM_TO_FOLLOW",
]);

/**
 * Calculate the overall completion percentage for a meeting based on task statuses
 * @param tasks - Array of tasks for the meeting
 * @returns Completion percentage (0-100)
 */
export function calculateMeetingCompletion(tasks: DatabaseTask[]): number {
  if (tasks.length === 0) {
    return 0;
  }

  const completedTasks = tasks.filter((task) =>
    COMPLETION_STATUSES.has(task.status as string)
  ).length;

  return Math.round((completedTasks / tasks.length) * 100);
}

/**
 * Update the overall completion for a meeting in the database
 * @param meetingId - The meeting ID to update
 * @returns Updated meeting or error
 */
export async function updateMeetingCompletion(meetingId: string) {
  try {
    const client = await buildApiClient();

    // Fetch all tasks for the meeting
    const { data: tasksData, error: tasksError } = await client.GET(
      "/meetings/{meetingId}/tasks",
      {
        params: {
          path: { meetingId },
        },
      }
    );

    if (!tasksData) {
      const errorMessage =
        tasksError && typeof tasksError === "object" && "message" in tasksError
          ? String((tasksError as { message: unknown }).message)
          : "Failed to fetch tasks";
      throw new Error(errorMessage);
    }

    // Calculate completion percentage
    const completion = calculateMeetingCompletion(tasksData);

    // Update the meeting's overall completion
    const { data: updateData, error: updateError } = await client.PUT(
      "/meetings/{meetingId}",
      {
        params: {
          path: { meetingId },
        },
        body: {
          overallCompletion: completion,
        },
      }
    );

    if (!updateData) {
      const errorMessage =
        updateError &&
        typeof updateError === "object" &&
        "message" in updateError
          ? String((updateError as { message: unknown }).message)
          : "Failed to update meeting";
      throw new Error(errorMessage);
    }

    return { meeting: updateData, error: null };
  } catch (error) {
    console.error("Error updating meeting completion:", error);
    return { meeting: null, error };
  }
}

/**
 * Hook to automatically update meeting completion when a task status changes
 * This should be called after any task status update
 */
export async function onTaskStatusChange(taskId: string) {
  try {
    const client = await buildApiClient();

    // Get the task to find its meeting ID
    const { data: taskData, error: taskError } = await client.GET(
      "/tasks/{id}",
      {
        params: {
          path: { id: taskId },
        },
      }
    );

    if (!taskData) {
      console.error("Error fetching task:", taskError);
      return;
    }

    const task = taskData as DatabaseTask;
    if (!task.meetingId) {
      console.error("Task has no meetingId");
      return;
    }

    // Update the meeting completion
    await updateMeetingCompletion(task.meetingId);
  } catch (error) {
    console.error("Error in onTaskStatusChange:", error);
  }
}
