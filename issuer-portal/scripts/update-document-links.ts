import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateDocumentLinks() {
  console.log("🔗 Updating document links to storage files...\n");

  // Get all storage files using raw SQL
  const { data: initialStorageFiles, error: storageError } = await supabase
    .rpc("get_storage_objects", {
      bucket_name: "documents",
    })
    .select("*");

  let storageFiles = initialStorageFiles;

  // If RPC doesn't exist, use storage API directly
  if (storageError || !storageFiles) {
    console.log("Using storage API to list files...");
    const { data: listData, error: listError } = await supabase.storage
      .from("documents")
      .list("", {
        limit: 1000,
        offset: 0,
      });

    if (listError) {
      console.error("Failed to list storage files:", listError);
      return;
    }

    // Process the list data - need to recursively get all files in subdirectories
    const allFiles: { name: string; metadata: unknown }[] = [];

    // Get all meeting directories
    const meetingDirectories =
      listData?.filter((item) => !item.name.includes(".")) || [];

    for (const meetingDir of meetingDirectories) {
      const { data: typeData } = await supabase.storage
        .from("documents")
        .list(meetingDir.name, { limit: 1000 });

      const typeDirectories =
        typeData?.filter((item) => !item.name.includes(".")) || [];

      for (const typeDir of typeDirectories) {
        const { data: files } = await supabase.storage
          .from("documents")
          .list(`${meetingDir.name}/${typeDir.name}`, { limit: 1000 });

        if (files) {
          for (const file of files) {
            if (file.name.includes(".")) {
              allFiles.push({
                name: `${meetingDir.name}/${typeDir.name}/${file.name}`,
                metadata: file.metadata,
              });
            }
          }
        }
      }
    }

    // Use the collected files
    storageFiles = allFiles;
  }

  if (storageError) {
    console.error("Failed to get storage files:", storageError);
    return;
  }

  console.log(`Found ${storageFiles?.length ?? 0} files in storage\n`);

  // Process each file and update corresponding document records
  for (const file of storageFiles || []) {
    const pathParts = file.name.split("/");
    if (pathParts.length < 3) {
      continue;
    }

    const meetingId = pathParts[0];
    const documentTypeFolder = pathParts[1];
    const filename = pathParts[2];

    // Get public URL for this file
    const { data: urlData } = supabase.storage
      .from("documents")
      .getPublicUrl(file.name);

    // Map folder name to document type
    const typeMapping: Record<string, string> = {
      "proxy-card": "Proxy Card",
      "notice-and-access": "Proxy Notice",
      vif: "Voting Instruction Form",
      "meeting-agenda": "Meeting Agenda",
      "meeting-script": "Meeting Script",
      "meeting-procedures": "Meeting Procedures",
      "meeting-minutes": "Meeting Minutes",
      "shareholder-presentation": "Shareholder Presentation",
      "intro-slide": "Intro Slide",
      "meeting-recording": "Meeting Recording",
      "attendance-report": "Attendance Report",
      "q&a-document": "Q&A Document",
      "company-data": "Company Data",
      "account-registry": "Account Registry",
      "inspector-oath": "Inspector Oath",
      "guest-list": "Guest List",
    };

    const documentType = typeMapping[documentTypeFolder];
    if (!documentType) {
      console.log(`⚠️  Unknown document type folder: ${documentTypeFolder}`);
      continue;
    }

    // Update existing document record with the storage URL
    const { data: updateData, error: updateError } = await supabase
      .from("document")
      .update({
        file_path: urlData.publicUrl,
        file_size: file.metadata?.size ?? 0,
        status: "UPLOADED",
        updated_at: new Date().toISOString(),
      })
      .eq("meeting_id", meetingId)
      .eq("type", documentType)
      .select();

    if (updateError) {
      // Try to insert if update didn't find a record
      const hasNoData =
        !updateData ||
        (Array.isArray(updateData) && (updateData as unknown[]).length === 0);
      if (hasNoData) {
        const { error: insertError } = await supabase.from("document").insert({
          meeting_id: meetingId,
          title: documentType,
          type: documentType,
          file_path: urlData.publicUrl,
          file_type: filename.split(".").pop() || "pdf",
          file_size: file.metadata?.size ?? 0,
          status: "UPLOADED",
          display_category: getDisplayCategory(documentType),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error(`❌ Failed to create document: ${insertError.message}`);
        } else {
          console.log(`✅ Created: ${meetingId} - ${documentType}`);
        }
      } else {
        console.error(
          `❌ Failed to update: ${(updateError as { message?: string })?.message ?? "Unknown error"}`
        );
      }
    } else if (updateData && updateData.length > 0) {
      console.log(`✅ Updated: ${meetingId} - ${documentType}`);
    } else {
      console.log(
        `⚠️  No document found to update: ${meetingId} - ${documentType}`
      );
    }
  }

  // Final count
  const { data: finalCount } = await supabase
    .from("document")
    .select("meeting_id, type, file_path")
    .like("file_path", "%http://127.0.0.1:54321/storage%");

  console.log(`\n✨ Document linking complete!`);
  console.log(`   Total documents linked: ${finalCount?.length ?? 0}`);
}

function getDisplayCategory(documentType: string): string {
  const lowerType = documentType.toLowerCase();

  if (
    lowerType.includes("proxy") ||
    lowerType.includes("notice") ||
    lowerType.includes("vif") ||
    lowerType.includes("voting")
  ) {
    return "proxy-materials";
  }
  if (
    lowerType.includes("agenda") ||
    lowerType.includes("script") ||
    lowerType.includes("procedure") ||
    lowerType.includes("oath") ||
    lowerType.includes("guest") ||
    lowerType.includes("q&a")
  ) {
    return "meeting-materials";
  }
  if (
    lowerType.includes("presentation") ||
    lowerType.includes("slide") ||
    lowerType.includes("shareholder")
  ) {
    return "dsm";
  }
  if (
    lowerType.includes("minutes") ||
    lowerType.includes("attendance") ||
    lowerType.includes("recording")
  ) {
    return "post-meeting";
  }
  if (
    lowerType.includes("data") ||
    lowerType.includes("registry") ||
    lowerType.includes("account")
  ) {
    return "internal";
  }

  return "general";
}

updateDocumentLinks().catch(console.error);
