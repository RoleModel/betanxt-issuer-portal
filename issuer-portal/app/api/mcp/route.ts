import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  return new Response(JSON.stringify({ message: "MCP test endpoint works" }), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function POST(req: NextRequest) {
  return new Response(JSON.stringify({ message: "MCP POST test endpoint works" }), {
    headers: { "Content-Type": "application/json" }
  });
}