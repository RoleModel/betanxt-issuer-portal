import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import {
  type ChatbotAction,
  drainChatbotActions,
  enqueueChatbotAction,
} from "@/lib/chatbotActionsStore";

export function GET() {
  return NextResponse.json({ actions: drainChatbotActions() });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { action?: ChatbotAction };
    if (!body.action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    const actionId = enqueueChatbotAction(body.action);
    return NextResponse.json({ success: true, actionId });
  } catch (error) {
    console.error("Failed to queue chatbot action:", error);
    return NextResponse.json(
      { error: "Failed to queue action" },
      { status: 500 }
    );
  }
}
