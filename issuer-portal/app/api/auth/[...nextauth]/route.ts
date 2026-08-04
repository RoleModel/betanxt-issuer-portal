import type { NextRequest } from "next/server";
import { GET as authGET, POST as authPOST } from "@/auth";

export async function GET(
  request: NextRequest,
  _context: { params: Promise<{ nextauth: string[] }> }
) {
  return await authGET(request);
}

export async function POST(
  request: NextRequest,
  _context: { params: Promise<{ nextauth: string[] }> }
) {
  return await authPOST(request);
}
