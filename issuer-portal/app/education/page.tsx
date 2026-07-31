"use client";

import dynamic from "next/dynamic";

const EducationContent = dynamic(
  async () => await import("@/components/Education/EducationContent")
);

const EducationPage = () => {
  return <EducationContent />;
};

export default EducationPage;
