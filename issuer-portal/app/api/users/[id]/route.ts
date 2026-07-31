import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { NextRequest } from "next/server";

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  type?: string;
  account_id?: string;
  client_ticker?: string | null;
  username?: string;
}

// In-memory user storage for development (replace with database in production)
const users = new Map<string, User>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get or create user
    let user = users.get(id);

    if (!user) {
      user = {
        id,
        name: session.user.name ?? "Unknown User",
        email: session.user.email ?? "unknown@example.com",
        type: session.user.type,
        account_id: session.user.account_id,
        client_ticker: session.user.client_ticker,
        username: session.user.username,
        avatarUrl: undefined,
      };
      users.set(id, user);
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("Error in GET /api/users/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify the user is updating their own profile
    if (session.user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Get or create user
    let user = users.get(id);

    if (!user) {
      user = {
        id,
        name: session.user.name ?? "Unknown User",
        email: session.user.email ?? "unknown@example.com",
        type: session.user.type,
        account_id: session.user.account_id,
        client_ticker: session.user.client_ticker,
        username: session.user.username,
      };
    }

    // Update user with new data
    if (body.avatarUrl !== undefined) {
      user.avatarUrl = body.avatarUrl;
    }
    if (body.avatar_url !== undefined) {
      user.avatarUrl = body.avatar_url;
    }

    // Save updated user
    users.set(id, user);

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error("Error in PUT /api/users/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
