"use client";

import dynamic from "next/dynamic";

const EducationContent = dynamic(
  () => import("@/components/Education/EducationContent")
);

export default function EducationPage() {
  return <EducationContent />;
}
