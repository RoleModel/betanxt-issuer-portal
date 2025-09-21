import { createMcpHandler } from "mcp-handler";
import type { NextRequest } from "next/server";
import { z } from "zod";

const handler = async (
  req: NextRequest,
  { params }: { params: Promise<{ transport: string }> }
) => {
  const { transport } = await params;

  return createMcpHandler(
    (server) => {
      server.tool(
        "echo",
        "Echo a message back",
        { message: z.string() },
        async ({ message }) => {
          return {
            content: [{ type: "text", text: `Echo from Issuer Portal [${transport}]: ${message}` }]
          };
        }
      );

      server.tool(
        "get_meetings",
        "Get meetings with optional filtering",
        {
          status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
          clientTicker: z.string().optional(),
          limit: z.number().int().min(1).max(100).default(10)
        },
        async ({ status, clientTicker, limit }) => {
          // Mock data for testing
          const meetings = [
            { id: "1", title: "Apple Inc. Annual Meeting 2025", clientTicker: "AAPL", status: "ACTIVE", meetingDate: "2025-05-15" },
            { id: "2", title: "Microsoft Corp. Special Meeting", clientTicker: "MSFT", status: "DRAFT", meetingDate: "2025-06-20" },
            { id: "3", title: "Google Inc. Shareholder Meeting", clientTicker: "GOOGL", status: "COMPLETED", meetingDate: "2025-04-10" }
          ];

          let filteredMeetings = meetings;
          if (status) {
            filteredMeetings = filteredMeetings.filter(m => m.status === status);
          }
          if (clientTicker) {
            filteredMeetings = filteredMeetings.filter(m => m.clientTicker === clientTicker);
          }
          filteredMeetings = filteredMeetings.slice(0, limit);

          return {
            content: [{
              type: "text",
              text: `Found ${filteredMeetings.length} meetings:\n${
                filteredMeetings.map(m =>
                  `- ${m.title} (${m.clientTicker}) - Status: ${m.status} - Date: ${m.meetingDate}`
                ).join('\n') || 'No meetings found'
              }`
            }]
          };
        }
      );

      server.tool(
        "get_dashboard_summary",
        "Get a high-level summary of portal activity",
        {},
        async () => {
          return {
            content: [{
              type: "text",
              text: `Issuer Portal Dashboard Summary:\n\n• Active Meetings: 3\n• Pending Tasks: 7\n• Documents Awaiting Signature: 2\n• Upcoming Deadlines: 4\n\nRecent Activity:\n- Apple Inc. proxy materials distributed\n- Microsoft voting window opened\n- Google meeting results finalized`
            }]
          };
        }
      );
    },
    {
      capabilities: {
        tools: {
          echo: { description: "Echo messages back with transport info" },
          get_meetings: { description: "Retrieve meetings with filtering options" },
          get_dashboard_summary: { description: "Get portal activity summary" }
        }
      }
    },
    {
      redisUrl: "redis://localhost:6379",
      basePath: "/api",
      verboseLogs: true,
      maxDuration: 60
    }
  )(req);
};

export { handler as GET, handler as POST };
