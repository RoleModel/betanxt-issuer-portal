import { pdfjs } from "react-pdf";

// Configure PDF.js worker for Next.js
if (typeof window !== "undefined") {
  // Use CDN with version matching to ensure compatibility between API and Worker
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export { pdfjs };
