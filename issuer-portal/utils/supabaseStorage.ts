import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for storage operations
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET_NAME = "documents";

export interface StorageUploadResult {
  data: {
    path: string;
    fullPath: string;
    publicUrl?: string;
  } | null;
  error: string | null;
}

/**
 * Upload a file to Supabase storage
 */
export async function uploadFileToStorage(
  file: File,
  folder?: string
): Promise<StorageUploadResult> {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop();
    const filename = `${timestamp}_${randomId}.${extension}`;

    // Create path with optional folder
    const path = folder ? `${folder}/${filename}` : filename;

    // Upload file to storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return {
        data: null,
        error: error.message,
      };
    }

    if (!data) {
      return {
        data: null,
        error: "Upload failed - no data returned",
      };
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      data: {
        path: data.path,
        fullPath: data.fullPath,
        publicUrl: urlData.publicUrl,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown upload error",
    };
  }
}

/**
 * Delete a file from Supabase storage
 */
export async function deleteFileFromStorage(
  path: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown delete error",
    };
  }
}

/**
 * Get public URL for a file in storage
 */
export function getStorageFileUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

  return data.publicUrl;
}

/**
 * List files in storage bucket
 */
export async function listStorageFiles(folder?: string) {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(folder, {
        limit: 100,
        offset: 0,
      });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown list error",
    };
  }
}

/**
 * Create folder-like structure in storage
 */
export function createStorageFolder(
  meetingId: string,
  documentType: "dsm" | "regular" = "regular"
): string {
  return `${meetingId}/${documentType}`;
}
