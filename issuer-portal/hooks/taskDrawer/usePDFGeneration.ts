import jsPDF from "jspdf";
import { useCallback } from "react";

interface SignatureData {
  name: string;
  title: string;
  date: string;
  signature: string;
}

interface FormFieldValue {
  value: string;
  label: string;
}

export const usePDFGeneration = () => {
  const generateFilledPDF = useCallback(
    (
      taskTitle: string,
      signatureDataMap: Map<string, SignatureData>,
      formFieldValues: Map<string, FormFieldValue>,
    ): Blob => {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(16);
      doc.text(taskTitle ?? "Task Completion Form", 20, 20);

      let yPosition = 40;

      // Add signature data
      doc.setFontSize(12);
      doc.text("Signatures:", 20, yPosition);
      yPosition += 10;

      signatureDataMap.forEach((data, areaId) => {
        doc.setFontSize(10);
        doc.text(`Area: ${areaId}`, 20, yPosition);
        yPosition += 7;
        doc.text(`Name: ${data.name}`, 25, yPosition);
        yPosition += 7;
        doc.text(`Title: ${data.title}`, 25, yPosition);
        yPosition += 7;
        doc.text(`Date: ${data.date}`, 25, yPosition);
        yPosition += 7;
        if (data.signature) {
          doc.text("Signature: [Signed]", 25, yPosition);
        } else {
          doc.text("Signature: [Not signed]", 25, yPosition);
        }
        yPosition += 10;

        // Check if we need a new page
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
      });

      // Add form field values
      if (formFieldValues.size > 0) {
        yPosition += 10;
        doc.setFontSize(12);
        doc.text("Form Fields:", 20, yPosition);
        yPosition += 10;

        formFieldValues.forEach((fieldData) => {
          doc.setFontSize(10);
          doc.text(`${fieldData.label}: ${fieldData.value}`, 25, yPosition);
          yPosition += 7;

          // Check if we need a new page
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
        });
      }

      // Add completion timestamp
      yPosition += 10;
      doc.text(`Completed: ${new Date().toLocaleString()}`, 20, yPosition);

      return doc.output("blob");
    },
    [],
  );

  return { generateFilledPDF };
};
