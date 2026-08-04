"use client";

import { useCallback, useState } from "react";

export interface SignatureArea {
  id: string;
  document_id: string;
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  page_number: number;
  label?: string;
  required: boolean;
  signed_at?: string;
  signed_by?: string;
}

export interface UseSignatureAreasResult {
  loading: boolean;
  error: string | null;
  createSignatureArea: (
    documentId: string,
    area: Partial<SignatureArea>
  ) => Promise<SignatureArea | null>;
  updateSignatureArea: (
    areaId: string,
    updates: Partial<SignatureArea>
  ) => SignatureArea | null;
  checkDocumentExists: (documentId: string) => Promise<boolean>;
}

export const useSignatureAreas = (): UseSignatureAreasResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkDocumentExists = useCallback(
    // Mock implementation - will use await when connected to real API
    // eslint-disable-next-line @typescript-eslint/require-await
    async (_documentId: string): Promise<boolean> => {
      try {
        // This would need to call a document API endpoint
        // For now, we'll return true to avoid breaking functionality
        // In production, this should call: await getDocumentById(documentId)
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const createSignatureArea = useCallback(
    async (
      documentId: string,
      area: Partial<SignatureArea>
    ): Promise<SignatureArea | null> => {
      try {
        setLoading(true);
        setError(null);

        // Check if document exists first
        const isExists = await checkDocumentExists(documentId);
        if (!isExists) {
          throw new Error("Document not found");
        }

        // In a real implementation, this would call an API endpoint like:
        // const result = await createSignatureAreaAPI(documentId, area)

        // For now, return a mock signature area to avoid breaking the component
        const newArea: SignatureArea = {
          id: `sig_${Date.now()}`,
          document_id: documentId,
          x_position: area.x_position ?? 0,
          y_position: area.y_position ?? 0,
          width: area.width || 15,
          height: area.height || 5,
          page_number: area.page_number || 1,
          label: area.label,
          required: area.required ?? true,
        };

        return newArea;
      } catch (error_) {
        const errorMessage = Error.isError(error_)
          ? error_.message
          : "Failed to create signature area";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [checkDocumentExists]
  );

  const updateSignatureArea = useCallback(
    (areaId: string, updates: Partial<SignatureArea>): SignatureArea | null => {
      try {
        setLoading(true);
        setError(null);

        // In a real implementation, this would call an API endpoint like:
        // const result = await updateSignatureAreaAPI(areaId, updates)

        // For now, return the updated area to avoid breaking the component
        const updatedArea: SignatureArea = {
          id: areaId,
          document_id: updates.document_id ?? "",
          x_position: updates.x_position ?? 0,
          y_position: updates.y_position ?? 0,
          width: updates.width || 15,
          height: updates.height || 5,
          page_number: updates.page_number || 1,
          label: updates.label,
          required: updates.required ?? true,
        };

        return updatedArea;
      } catch (error_) {
        const errorMessage = Error.isError(error_)
          ? error_.message
          : "Failed to update signature area";
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    createSignatureArea,
    updateSignatureArea,
    checkDocumentExists,
  };
};
