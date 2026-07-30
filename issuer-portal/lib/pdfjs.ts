import { pdfjs } from "react-pdf";

import { pdfWorkerSource } from "@/lib/pdf-worker";

// Configure PDF.js worker for Next.js
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSource;
}

export { pdfjs };
