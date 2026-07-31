import { useRouter } from "next/navigation";
import { useCallback } from "react";

import buildApiClient from "@/domain-models/apiClient";
import {
  COMPLETED_STATUSES,
  calculateOverallCompletion,
} from "@/utils/taskControl";
import type { components } from "@/types/api";

type Task = components["schemas"]["Task"];

interface Meeting {
  id?: string;
  title?: string;
}

interface Session {
  user?: {
    name?: string | null;
  };
}

interface UsePhaseCompletionProperties {
  currentMeeting: Meeting | null;
  session: Session | null;
  refreshContext:
    (() => Promise<{ tasks: Task[]; positions: unknown[] } | null>) | undefined;
}

export const usePhaseCompletion = ({
  currentMeeting,
  session,
  refreshContext,
}: UsePhaseCompletionProperties) => {
  const router = useRouter();

  const checkAndCompletePhase = useCallback(
    async (taskWithPhase: Task | null): Promise<boolean> => {
      if (!taskWithPhase?.phaseNumber || taskWithPhase.phaseNumber <= 0) {
        return false;
      }

      if (!refreshContext) {
        return false;
      }

      const currentPhaseNumber = taskWithPhase.phaseNumber;

      // Delay to ensure database is fully updated
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Refresh tasks from context to get latest status
      const refreshedData = await refreshContext();
      const freshTasks = refreshedData?.tasks || [];

      // Get all tasks for the current phase (excluding BetaNXT and DFIN owned tasks)
      const currentPhaseTasks = freshTasks.filter(
        (t: Task) =>
          t.phaseNumber === currentPhaseNumber &&
          !["BetaNXT", "DFIN"].includes(t.owner ?? "")
      );

      console.log("Phase advancement check:", {
        currentPhaseNumber,
        totalTasks: freshTasks.length,
        currentPhaseTasks: currentPhaseTasks.length,
        taskStatuses: currentPhaseTasks.map((t) => ({
          title: t.title,
          status: t.status,
          owner: t.owner,
        })),
      });

      // Check if all phase tasks have been initiated
      const isAllPhaseTasksInitiated =
        currentPhaseTasks.length > 0 &&
        currentPhaseTasks.every((t: Task) =>
          COMPLETED_STATUSES.includes(t.status as never)
        );

      console.log("All phase tasks initiated?", isAllPhaseTasksInitiated);

      if (isAllPhaseTasksInitiated) {
        // Update meeting to next phase and calculate completion percentage
        if (currentMeeting?.id) {
          try {
            const client = await buildApiClient();

            // Calculate overall completion
            const overallCompletion = calculateOverallCompletion(freshTasks);

            const nextPhaseNumber = currentPhaseNumber + 1;

            const updatePayload = {
              currentPhase: `Phase ${nextPhaseNumber}`,
              overallCompletion,
            };

            // Update meeting phase and completion
            await client.PUT("/meetings/{meetingId}", {
              params: {
                path: { meetingId: currentMeeting.id },
              },
              body: updatePayload,
            });

            // Refresh meeting data to update the context with new phase
            await refreshContext();
          } catch (error) {
            console.error("Error advancing phase:", error);
            return false;
          }
        }

        // Get user name and meeting title for personalized message
        const userName = session?.user?.name ?? "User";
        const meetingTitle = currentMeeting?.title ?? "Shareholder Meeting";
        const nextPhaseNumber = currentPhaseNumber + 1;

        // Dispatch global phase complete event for Layout to show snackbar
        const message = `Congratulations, ${userName}! 🎉 All tasks for Phase ${currentPhaseNumber} of "${meetingTitle}" are complete! You're now advancing to Phase ${nextPhaseNumber}.`;
        window.dispatchEvent(
          new CustomEvent("phaseComplete", {
            detail: { message },
          })
        );

        // Navigate to next phase dashboard after 3 seconds
        setTimeout(() => {
          const pathParts = window.location.pathname.split("/");
          const clientTicker = pathParts[1];
          const meetingId = pathParts[3];
          router.push(
            `/${clientTicker}/meeting/${meetingId}/dashboard/${nextPhaseNumber}`
          );
        }, 3000);

        return true;
      }

      return false;
    },
    [currentMeeting, session, refreshContext, router]
  );

  return { checkAndCompletePhase };
};
