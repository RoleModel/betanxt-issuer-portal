import type { NextRequest } from "next/server";

import { NextResponse } from "next/server";

import type { components } from "@/types/api";

import { handleCors, withCors } from "@/utils/cors";
import {
  getMeetingIdsForTicker,
  resolveNotificationUserId,
} from "@/utils/resolveNotificationUser";
import { supabase } from "@/utils/supabase/client";

type CreateNotificationInput = components["schemas"]["CreateNotificationInput"];

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const clientTicker = searchParams.get("ticker");
    const meetingId = searchParams.get("meetingId");
    const type = searchParams.get("type");
    const userId = searchParams.get("userId");
    const username = searchParams.get("username");

    const resolvedUserId = await resolveNotificationUserId(userId, username);

    let query = supabase
      .from("notification")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    type NotificationType = "info" | "warning" | "error" | "success";
    const validQueryTypes: NotificationType[] = [
      "info",
      "warning",
      "error",
      "success",
    ];

    if (resolvedUserId) query = query.eq("user_id", resolvedUserId);
    if (meetingId) query = query.eq("meeting_id", meetingId);
    if (type && validQueryTypes.includes(type as NotificationType))
      query = query.eq("type", type as NotificationType);

    if (clientTicker) {
      const meetingIds = await getMeetingIdsForTicker(clientTicker);
      const normalizedTicker = clientTicker.trim().toUpperCase();
      if (meetingIds.length > 0) {
        query = query.in("meeting_id", meetingIds);
      } else {
        query = query.ilike("action_url", `%/${normalizedTicker}/%`);
      }
    }

    const { data, error } = await query;

    if (error) {
      return withCors(
        NextResponse.json(
          { error: "Failed to fetch notifications", message: error.message },
          { status: 500 }
        )
      );
    }

    const notifications = (data ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      priority: n.priority,
      read: n.read ?? false,
      userId: n.user_id,
      meetingId: n.meeting_id,
      taskId: n.task_id,
      actionUrl: n.action_url,
      createdAt: n.created_at,
      readAt: n.read_at,
      expiresAt: n.expires_at,
    }));

    return withCors(NextResponse.json(notifications));
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
          operationId: "listNotifications",
        },
        { status: 500 }
      )
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as CreateNotificationInput;

    if (!body.userId || !body.title || !body.message) {
      return withCors(
        NextResponse.json(
          { error: "userId, title, and message are required" },
          { status: 400 }
        )
      );
    }

    type NotificationType = "info" | "success" | "warning" | "error";
    type NotificationPriority = "low" | "medium" | "high" | "critical";
    const validTypes: NotificationType[] = [
      "info",
      "success",
      "warning",
      "error",
    ];
    const validPriorities: NotificationPriority[] = [
      "low",
      "medium",
      "high",
      "critical",
    ];
    const type: NotificationType = validTypes.includes(body.type)
      ? body.type
      : "info";
    const priority: NotificationPriority = validPriorities.includes(
      body.priority
    )
      ? body.priority
      : "medium";

    const { data, error } = await supabase
      .from("notification")
      .insert({
        user_id: body.userId,
        meeting_id: body.meetingId ?? null,
        title: body.title,
        message: body.message,
        type,
        priority,
        action_url: body.actionUrl ?? null,
        read: false,
      })
      .select()
      .single();

    if (error) {
      return withCors(
        NextResponse.json(
          { error: "Failed to create notification", message: error.message },
          { status: 500 }
        )
      );
    }

    return withCors(
      NextResponse.json(
        {
          id: data.id,
          title: data.title,
          message: data.message,
          type: data.type,
          priority: data.priority,
          read: data.read ?? false,
          userId: data.user_id,
          meetingId: data.meeting_id,
          actionUrl: data.action_url,
          createdAt: data.created_at,
        },
        { status: 201 }
      )
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      )
    );
  }
}

export function OPTIONS() {
  return handleCors();
}
