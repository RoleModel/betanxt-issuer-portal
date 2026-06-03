import { NextResponse } from "next/server";

export function GET(): NextResponse {
  return NextResponse.json({
    message: "Mock API Server",
    status: "running",
    endpoints: "/api/*",
  });
}
