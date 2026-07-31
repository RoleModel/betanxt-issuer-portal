import { useCallback } from "react";

import buildApiClient from "@/domain-models/apiClient";
import { calculateOverallCompletion } from "@/utils/taskControl";
import type { components } from "@/types/api";

type Task = components["schemas"]["Task"];

interface Meeting {
  id?: string;
}

interface UseMeetingCompletionProperties {
  currentMeeting: Meeting | null;
  tasks: Task[];
  refetch: () => void;
}

export const useMeetingCompletion = ({
  currentMeeting,
  tasks,
  refetch,
}: UseMeetingCompletionProperties) => {
  const updateMeetingCompletion = useCallback(async () => {
    if (!currentMeeting?.id) {
      return;
    }

    try {
      const client = await buildApiClient();

      // Refetch tasks to get latest statuses
      refetch();

      // Calculate overall completion
      const overallCompletion = calculateOverallCompletion(tasks);

      // Update meeting completion percentage
      await client.PUT("/meetings/{meetingId}", {
        params: {
          path: { meetingId: currentMeeting.id },
        },
        body: {
          overallCompletion,
        },
      });
    } catch {
      // Non-fatal error
    }
  }, [currentMeeting, tasks, refetch]);

  return { updateMeetingCompletion };
};
