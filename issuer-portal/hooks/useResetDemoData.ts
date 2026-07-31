import { useState } from "react";

interface ResetStats {
  meetings: number;
  phases: number;
  tasks: number;
  signatures: number;
  documents: number;
  dsmConfigs: number;
}

interface ResetResponse {
  success: boolean;
  message?: string;
  error?: string;
  stats?: ResetStats;
  timestamp?: string;
}

export function useResetDemoData() {
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetDemoData = async (): Promise<void> => {
    setIsResetting(true);
    setError(null);

    try {
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api";

      const response = await fetch(`${apiBaseUrl}/admin/reset-demo-data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData: ResetResponse | null = await response
          .json()
          .catch((): null => null);
        throw new Error(errorData?.error ?? `Reset failed: ${response.status}`);
      }

      const data: ResetResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error ?? "Reset failed");
      }

      // Reload page to reflect changes
      window.location.reload();
    } catch (error_) {
      setError(Error.isError(error_) ? error_.message : "Reset failed");
      setIsResetting(false);
    }
  };

  return { resetDemoData, isResetting, error };
}
