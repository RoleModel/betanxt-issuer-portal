import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "http://127.0.0.1:54321";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const meetingIds = [
  "elvn-annual-meeting-2025",
  "payc-annual-meeting-2025",
  "wen-annual-meeting-2025",
  "wwd-annual-meeting-2025",
];

async function linkStorageDocuments() {
  console.log("🔗 Linking storage documents to database...\n");

  for (const meetingId of meetingIds) {
    console.log(`\n📁 Processing ${meetingId}...`);

    // List all directories for this meeting
    const { data: typeDirs, error: typeDirError } = await supabase.storage
      .from("documents")
      .list(meetingId, { limit: 1000 });

    if (typeDirError) {
      console.error(
        `❌ Error listing directories for ${meetingId}:`,
        typeDirError
      );
      continue;
    }

    // Filter to only directories (no file extension)
    const directories =
      typeDirs?.filter((item) => !item.name.includes(".")) || [];

    for (const dir of directories) {
      const dirPath = `${meetingId}/${dir.name}`;

      // List files in this directory
      const { data: files, error: fileError } = await supabase.storage
        .from("documents")
        .list(dirPath, { limit: 1000 });

      if (fileError) {
        console.error(`❌ Error listing files in ${dirPath}:`, fileError);
        continue;
      }

      // Process each file
      const actualFiles =
        files?.filter((item) => item.name.includes(".")) || [];

      for (const file of actualFiles) {
        const fullPath = `${dirPath}/${file.name}`;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("documents")
          .getPublicUrl(fullPath);

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
          "q-a-document": "Q&A Document",
          "company-data": "Company Data",
          "account-registry": "Account Registry",
          "inspector-oath": "Inspector Oath",
          "guest-list": "Guest List",
        };

        const docType = typeMapping[dir.name];
        if (!docType) {
          console.log(`⚠️  Unknown type: ${dir.name} for file ${file.name}`);

          // Create a new document for unknown types
          const title = file.name
            .replace(/^\d+_/, "") // Remove timestamp
            .replace(/\.(pdf|docx?|xlsx?|pptx?)$/i, "") // Remove extension
            .replace(/_/g, " "); // Replace underscores with spaces

          const { error: insertError } = await supabase
            .from("document")
            .insert({
              meeting_id: meetingId,
              title: title,
              type: dir.name
                .split("-")
                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                .join(" "),
              file_path: urlData.publicUrl,
              file_type: file.name.split(".").pop() || "pdf",
              file_size: file.metadata?.size ?? 0,
              status: "UPLOADED",
              display_category: "general",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error(
              `❌ Failed to create document: ${insertError.message}`
            );
          } else {
            console.log(`✅ Created new: ${title}`);
          }
          continue;
        }

        // Try to update existing document
        const { data: updateData, error: updateError } = await supabase
          .from("document")
          .update({
            file_path: urlData.publicUrl,
            file_size: file.metadata?.size ?? 0,
            status: "UPLOADED",
            updated_at: new Date().toISOString(),
          })
          .eq("meeting_id", meetingId)
          .ilike("type", `%${docType}%`)
          .select();

        if (updateError) {
          console.error(`❌ Error updating: ${updateError.message}`);
        } else if (updateData && updateData.length > 0) {
          console.log(`✅ Updated: ${docType}`);
        } else {
          // No existing record found, create new one
          const title = file.name
            .replace(/^\d+_/, "") // Remove timestamp
            .replace(/\.(pdf|docx?|xlsx?|pptx?)$/i, "") // Remove extension
            .replace(/_/g, " "); // Replace underscores with spaces

          const { error: insertError } = await supabase
            .from("document")
            .insert({
              meeting_id: meetingId,
              title: title || docType,
              type: docType,
              file_path: urlData.publicUrl,
              file_type: file.name.split(".").pop() || "pdf",
              file_size: file.metadata?.size ?? 0,
              status: "UPLOADED",
              display_category: getDisplayCategory(docType),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error(`❌ Failed to create: ${insertError.message}`);
          } else {
            console.log(`✅ Created: ${docType}`);
          }
        }
      }
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

function getDisplayCategory(docType: string): string {
  const lowerType = docType.toLowerCase();

  if (
    lowerType.includes("proxy") ||
    lowerType.includes("notice") ||
    lowerType.includes("vif") ||
    lowerType.includes("voting")
  ) {
    return "proxy-materials";
  } else if (
    lowerType.includes("agenda") ||
    lowerType.includes("script") ||
    lowerType.includes("procedure") ||
    lowerType.includes("oath") ||
    lowerType.includes("guest") ||
    lowerType.includes("q&a") ||
    lowerType.includes("q-a")
  ) {
    return "meeting-materials";
  } else if (
    lowerType.includes("presentation") ||
    lowerType.includes("slide") ||
    lowerType.includes("shareholder")
  ) {
    return "dsm";
  } else if (
    lowerType.includes("minutes") ||
    lowerType.includes("attendance") ||
    lowerType.includes("recording")
  ) {
    return "post-meeting";
  } else if (
    lowerType.includes("data") ||
    lowerType.includes("registry") ||
    lowerType.includes("account")
  ) {
    return "internal";
  }

  return "general";
}

linkStorageDocuments().catch(console.error);
