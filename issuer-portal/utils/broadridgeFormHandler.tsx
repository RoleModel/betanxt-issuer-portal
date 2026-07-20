import { generatePDFForm } from "./broadRidgeForm";

interface SignatureArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  page?: number;
  label?: string;
  type?: "signature" | "text" | "date";
  signed?: boolean;
}

interface ClientData {
  issuerName?: string;
  cusipNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  exchange?: string;
  contactName?: string;
  telephone?: string;
  email?: string;
  contactName2?: string;
  emailAddress2?: string;
  faxNumber?: string;
}

interface FormHandlerProps {
  onDocumentOpen: (
    documentUrl: string,
    documentId: string,
    signatureAreas: SignatureArea[]
  ) => void;
  clientData?: ClientData;
}

export const handleFormDownload = async (clientData?: ClientData) => {
  const pdfDataUri = await generatePDFForm(clientData);
  const downloadLink = document.createElement("a");
  downloadLink.href = pdfDataUri;
  downloadLink.download = "Broadridge_Corporate_Issuer_Profile_Form.pdf";
  downloadLink.click();
};

export const handleFormSign = async ({
  onDocumentOpen,
  clientData,
}: FormHandlerProps) => {
  try {
    // Generate the PDF form
    const pdfDataUri = await generatePDFForm(clientData);

    if (!pdfDataUri) {
      throw new Error("Failed to generate PDF form");
    }

    // Create unique document ID with random component to ensure uniqueness
    const documentId = `broadridge-form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Define signature areas positioned over the form's signature lines
    const signatureAreas: SignatureArea[] = [
      {
        id: "print-name-1",
        x: 3, // percentage from left - over print name line
        y: 78, // percentage from top - positioned over the actual signature line
        width: 20, // percentage width
        height: 5, // percentage height - smaller to fit on line
        page: 1,
        label: "Print Name",
        type: "text",
        signed: false,
      },
      {
        id: "sig-1",
        x: 37, // percentage from left - over signature line
        y: 78.5, // percentage from top - positioned over the actual signature line
        width: 26, // percentage width
        height: 5, // percentage height - smaller to fit on line
        page: 1,
        label: "Signature",
        type: "signature",
        signed: false,
      },
      {
        id: "date-1",
        x: 69, // percentage from left - over date line
        y: 78, // percentage from top - positioned over the actual signature line
        width: 19, // percentage width
        height: 5, // percentage height - smaller to fit on line
        page: 1,
        label: "Date",
        type: "date",
        signed: false,
      },
    ];

    // Call the callback to open the document viewer
    onDocumentOpen(pdfDataUri, documentId, signatureAreas);
  } catch (error) {
    console.error("Error generating Broadridge form:", error);
    alert("Failed to generate Broadridge form. Please try again.");
  }
};
