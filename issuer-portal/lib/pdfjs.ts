import { pdfjs } from 'react-pdf'

// Configure PDF.js worker for Next.js
if (typeof window !== 'undefined') {
  // Use local worker file that matches react-pdf's pdfjs-dist version
  // This ensures version compatibility between API and Worker
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

  // Alternative: You can also use CDN with version matching
  // pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

export { pdfjs }
