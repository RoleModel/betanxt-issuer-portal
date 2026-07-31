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
      formFieldValues: Map<string, FormFieldValue>
    ): Blob => {
      const document_ = new jsPDF();

      // Add title
      document_.setFontSize(16);
      document_.text(taskTitle ?? "Task Completion Form", 20, 20);

      let yPosition = 40;

      // Add signature data
      document_.setFontSize(12);
      document_.text("Signatures:", 20, yPosition);
      yPosition += 10;

      signatureDataMap.forEach((data, areaId) => {
        document_.setFontSize(10);
        document_.text(`Area: ${areaId}`, 20, yPosition);
        yPosition += 7;
        document_.text(`Name: ${data.name}`, 25, yPosition);
        yPosition += 7;
        document_.text(`Title: ${data.title}`, 25, yPosition);
        yPosition += 7;
        document_.text(`Date: ${data.date}`, 25, yPosition);
        yPosition += 7;
        if (data.signature) {
          document_.text("Signature: [Signed]", 25, yPosition);
        } else {
          document_.text("Signature: [Not signed]", 25, yPosition);
        }
        yPosition += 10;

        // Check if we need a new page
        if (yPosition > 270) {
          document_.addPage();
          yPosition = 20;
        }
      });

      // Add form field values
      if (formFieldValues.size > 0) {
        yPosition += 10;
        document_.setFontSize(12);
        document_.text("Form Fields:", 20, yPosition);
        yPosition += 10;

        formFieldValues.forEach((fieldData) => {
          document_.setFontSize(10);
          document_.text(
            `${fieldData.label}: ${fieldData.value}`,
            25,
            yPosition
          );
          yPosition += 7;

          // Check if we need a new page
          if (yPosition > 270) {
            document_.addPage();
            yPosition = 20;
          }
        });
      }

      // Add completion timestamp
      yPosition += 10;
      document_.text(
        `Completed: ${new Date().toLocaleString()}`,
        20,
        yPosition
      );

      return document_.output("blob");
    },
    []
  );

  return { generateFilledPDF };
};
