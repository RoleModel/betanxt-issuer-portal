"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

import { TabulationReviewWorkspace } from "@/components/tabulation-review";

/**
 * Deep-link route for the fullscreen review workspace. The events index
 * launches the workspace in place; this route exists so
 * `/tabulation-review?meeting={id}` links keep working.
 */
const TabulationReviewRoute = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const meetingId = searchParams.get("meeting");

  const handleNavigation = () => {
    router.push("/events", { transitionTypes: ["slide-left"] });
  };

  return (
    <TabulationReviewWorkspace
      initialMeetingId={meetingId}
      onClose={() => {
        handleNavigation();
      }}
      open
    />
  );
};

const TabulationReviewPage = () => (
  <Suspense fallback={null}>
    <TabulationReviewRoute />
  </Suspense>
);

export default TabulationReviewPage;
