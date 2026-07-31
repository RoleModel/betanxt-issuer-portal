#!/usr/bin/env npx tsx
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

// Local Supabase
const localUrl = "http://127.0.0.1:54321";
const localServiceKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Remote Supabase (production)
const remoteUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://vfgjzlcakdrpsbzuqklz.supabase.co";
const remoteServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!remoteServiceKey) {
  console.error(
    "❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required"
  );
  process.exit(1);
}

const localSupabase = createClient(localUrl, localServiceKey);
const remoteSupabase = createClient(remoteUrl, remoteServiceKey);

async function pushStorageToRemote() {
  console.log("🚀 Starting storage push to remote...\n");

  // First, ensure remote buckets have correct MIME types
  console.log("📦 Updating remote bucket configurations...");

  try {
    const { error: updateError } = await remoteSupabase.rpc("run_sql", {
      sql: `UPDATE storage.buckets SET allowed_mime_types = ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/csv',
        'text/plain',
        'video/mp4',
        'audio/mp4',
        'audio/x-m4a'
      ] WHERE name='documents';`,
    });

    if (updateError) {
      console.log(
        "⚠️  Could not update bucket MIME types via RPC:",
        updateError.message
      );
    }
  } catch {
    console.log(
      "⚠️  Skipping bucket MIME type update (RPC not available on remote)"
    );
  }

  // Get all files from local storage using storage API
  const meetingIds = [
    "elvn-annual-meeting-2025",
    "payc-annual-meeting-2025",
    "wen-annual-meeting-2025",
    "foc-annual-meeting-2025",
    "wwd-annual-meeting-2025",
  ];

  interface FileMetadata {
    mimeType?: string;
    mimetype?: string;
    [key: string]: unknown;
  }

  const allFiles: { path: string; metadata?: FileMetadata }[] = [];

  for (const meetingId of meetingIds) {
    const { data: folders, error: folderError } = await localSupabase.storage
      .from("documents")
      .list(meetingId, { limit: 1000 });

    if (folderError) {
      console.error(`❌ Failed to list folders for ${meetingId}:`, folderError);
      continue;
    }

    // Get files from each folder
    for (const folder of folders || []) {
      if (folder.name && !folder.name.includes(".")) {
        const folderPath = `${meetingId}/${folder.name}`;
        const { data: files, error: fileError } = await localSupabase.storage
          .from("documents")
          .list(folderPath, { limit: 1000 });

        if (fileError) {
          console.error(`❌ Failed to list files in ${folderPath}:`, fileError);
          continue;
        }

        for (const file of files || []) {
          if (file.name?.includes(".")) {
            allFiles.push({
              path: `${folderPath}/${file.name}`,
              metadata: file.metadata ?? undefined,
            });
          }
        }
      }
    }
  }

  const localFiles = allFiles;

  console.log(`📊 Found ${localFiles.length} files in local storage\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const file of localFiles) {
    const filePath = file.path;
    console.log(`📤 Processing: ${filePath}`);

    try {
      // Download file from local storage
      const { data: fileData, error: downloadError } =
        await localSupabase.storage.from("documents").download(filePath);

      if (downloadError) {
        console.error(`   ❌ Failed to download: ${downloadError.message}`);
        errorCount++;
        continue;
      }

      // Convert blob to buffer
      const buffer = Buffer.from(await fileData.arrayBuffer());

      // Check if file already exists in remote
      const { data: existingFile } = await remoteSupabase.storage
        .from("documents")
        .list(filePath.split("/").slice(0, -1).join("/"), {
          limit: 1000,
          search: filePath.split("/").pop(),
        });

      if (existingFile && existingFile.length > 0) {
        console.log(`   ⏭️  Already exists, skipping`);
        skipCount++;
        continue;
      }

      // Upload to remote storage
      const { error: uploadError } = await remoteSupabase.storage
        .from("documents")
        .upload(filePath, buffer, {
          contentType:
            (file.metadata?.mimeType || file.metadata?.mimetype) ??
            "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        console.error(`   ❌ Upload failed: ${uploadError.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Uploaded successfully`);
        successCount++;
      }
    } catch (error) {
      console.error(
        `   ❌ Error: ${error instanceof Error ? error.message : String(error)}`
      );
      errorCount++;
    }
  }

  console.log("\n📊 Storage push complete!");
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📁 Total: ${localFiles.length}`);
}

pushStorageToRemote().catch(console.error);
