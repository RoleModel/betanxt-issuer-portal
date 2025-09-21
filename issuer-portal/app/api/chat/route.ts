import { NextRequest, NextResponse } from 'next/server';

// MCP client for communicating with our MCP server
class MCPClient {
  private baseUrl: string;
  private sessionId: string | null = null;
  private messageEndpoint: string | null = null;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  async initializeSession() {
    try {
      const response = await fetch(`${this.baseUrl}/api/sse`);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to get reader from SSE response');
      }

      const { value } = await reader.read();
      const chunk = decoder.decode(value);

      // Parse the SSE data to get the message endpoint
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          this.messageEndpoint = line.substring(6);
          // Extract session ID from the endpoint
          const match = this.messageEndpoint.match(/sessionId=([^&]+)/);
          if (match) {
            this.sessionId = match[1];
          }
          break;
        }
      }

      reader.cancel();
    } catch (error) {
      console.error('Error initializing MCP session:', error);
      throw error;
    }
  }

  async callTool(toolName: string, args: Record<string, any> = {}) {
    try {
      if (!this.messageEndpoint) {
        await this.initializeSession();
      }

      if (!this.messageEndpoint) {
        throw new Error('Failed to get MCP message endpoint');
      }

      const response = await fetch(`${this.baseUrl}${this.messageEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: args,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`MCP tool call failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Handle MCP result format
      if (result.content && Array.isArray(result.content)) {
        return result.content[0]?.text || result.content[0] || result;
      }

      return result;
    } catch (error) {
      console.error(`Error calling MCP tool ${toolName}:`, error);
      throw error;
    }
  }
}

// Simple chat processor that uses MCP tools
async function processChatMessage(message: string): Promise<string> {
  const mcpClient = new MCPClient();

  // Parse the message to determine which tool to use
  const lowerMessage = message.toLowerCase();

  try {
    if (lowerMessage.includes('echo') && lowerMessage.includes('test')) {
      // Extract the message to echo from the user input
      const match = message.match(/echo\s+(?:test\s+)?(?:with\s+)?(?:message\s+)?["']?([^"']+)["']?/i);
      const echoMessage = match ? match[1] : 'Hello from MCP!';
      const result = await mcpClient.callTool('echo', { message: echoMessage });
      return `✅ MCP: ${result}`;
    }

    if (lowerMessage.includes('meeting') || lowerMessage.includes('meetings')) {
      // Parse filters from the message
      const filters: any = {};

      if (lowerMessage.includes('active')) filters.status = 'ACTIVE';
      else if (lowerMessage.includes('completed')) filters.status = 'COMPLETED';
      else if (lowerMessage.includes('draft')) filters.status = 'DRAFT';

      // Look for client ticker
      const tickerMatch = message.match(/\b([A-Z]{2,5})\b/);
      if (tickerMatch) filters.clientTicker = tickerMatch[1];

      const result = await mcpClient.callTool('get_meetings', filters);
      return `📋 Meeting Information:\n\n${result}`;
    }

    if (lowerMessage.includes('dashboard') || lowerMessage.includes('summary') || lowerMessage.includes('overview')) {
      const result = await mcpClient.callTool('get_dashboard_summary', {});
      return `📊 Dashboard Summary:\n\n${result}`;
    }

    // Default response for unrecognized queries
    return `I'm the BetaNXT Issuer Portal Assistant. I can help you with:

• **Meeting Information** - Ask about active or completed meetings
• **Dashboard Summary** - Get an overview of activity and metrics

Examples:
- "Show me active meetings"
- "When does Tabulation begin?"
- "Give me a dashboard summary"

How can I assist you today?`;

  } catch (error) {
    console.error('Error processing chat message:', error);
    return `I encountered an error while processing your request: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or contact support if the issue persists.`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Get the last user message
    const lastUserMessage = messages
      .filter((m: any) => m.role === 'user')
      .pop();

    if (!lastUserMessage) {
      return NextResponse.json({
        error: 'No user message found',
      }, { status: 400 });
    }

    // Process the message using MCP tools
    const response = await processChatMessage(lastUserMessage.content);

    // Return a simple response format compatible with the chat UI
    return NextResponse.json({
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: response,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
