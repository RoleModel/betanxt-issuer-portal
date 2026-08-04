// PDF.js requires a real Worker URL; all supported portal browsers implement URL.
// eslint-disable-next-line compat/compat
const pdfWorkerUrl = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
);

export const pdfWorkerSource = pdfWorkerUrl.href;
