import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import { downloadDocument } from "@/domain-models/api/documents";
import { handleCors, withCors } from "@/utils/cors";
import { supabase } from "@/utils/supabase/client";

interface RouteParams {
  id: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<RouteParams> },
): Promise<NextResponse> {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const { data: filePath, error } = await downloadDocument(id);

    if (error) {
      return withCors(
        NextResponse.json({ error: error.message }, { status: error.statusCode || 500 }),
      );
    }

    if (!filePath) {
      return withCors(NextResponse.json({ error: "File not found" }, { status: 404 }));
    }

    const storagePath = filePath.replace(/^\/storage\/v1\/object\/public\/documents\//, "");

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(storagePath);

    if (downloadError) {
      return withCors(NextResponse.json({ error: downloadError.message }, { status: 500 }));
    }

    const contentType = fileData.type || "application/octet-stream";
    const headers = new Headers();
    headers.set("Content-Type", contentType);
    headers.set("Content-Disposition", `attachment; filename="${storagePath.split("/").pop()}"`);

    return new NextResponse(fileData.stream(), { headers });
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
          operationId: "downloadDocument",
        },
        { status: 500 },
      ),
    );
  }
}

export function OPTIONS() {
  return handleCors();
}
