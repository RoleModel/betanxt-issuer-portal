"use client";

import { useEffect } from "react";

// Minimal no-op route preloader for App Router.
// Tabs already set prefetch on Links; this hook is a safe placeholder.
export const useRoutePreload = (meetingId?: string) => {
  useEffect(() => {
    // Intentionally left blank; add programmatic prefetching here if needed.
  }, [meetingId]);
};

export default useRoutePreload;
