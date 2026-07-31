import * as fs from "node:fs";
import * as path from "node:path";
import { createClient } from "@supabase/supabase-js";

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const MEETING_ID = "wen-annual-meeting-2025";
const REPORTS_DIR = path.join(__dirname, "../../data/wendys/reports");

const reportFiles = [
  "Address Change Detail.xls",
  "Ballot Comment Detail (1).xls",
  "DTC Participant Account (1).xls",
  "DTC Participant Account (2).xls",
  "DTC Participant Account.xls",
  "IVR Web Vote Report (1).xls",
  "Meeting Attendance Detail.xls",
  "Paper Election Detail Report.xls",
  "Paper Election Statistics by Source and Day.xls",
  "Participant Votes Report.xls",
  "Registered Account (2).xls",
  "Registered Account (3).xls",
  "Registered Accounts Voted (1).xls",
];

async function uploadReports() {
  console.log("📁 Starting report upload to Supabase storage...");
  console.log(`Meeting ID: ${MEETING_ID}`);
  console.log(`Reports directory: ${REPORTS_DIR}`);

  for (const fileName of reportFiles) {
    const filePath = path.join(REPORTS_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${fileName}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const storagePath = `${MEETING_ID}/reports/${fileName}`;

    console.log(`\n📤 Uploading: ${fileName}`);
    console.log(`   Path: ${storagePath}`);

    const { data, error } = await supabase.storage
      .from("documents")
      .upload(storagePath, fileBuffer, {
        contentType: "application/vnd.ms-excel",
        upsert: true,
      });

    if (error) {
      console.error(`❌ Failed to upload ${fileName}:`, error.message);
    } else {
      console.log(`✅ Successfully uploaded: ${fileName}`);
      console.log(`   Storage path: ${data.path}`);
    }
  }

  console.log("\n✨ Upload complete!");
}

uploadReports().catch(console.error);
