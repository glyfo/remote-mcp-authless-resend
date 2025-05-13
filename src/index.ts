import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { renderHomePage } from './home';
import { Resend } from 'resend';

// Environment interface with necessary bindings
export interface Env {
  MCP_OBJECT: DurableObjectNamespace;
  RESEND_API_KEY: string;
}

// Simplified State with proper typing
type State = {
  resend: Resend | null;
};

// Resend API response type for better type safety
type ResendResponse = {
  data?: { id: string };
  error?: { message: string, statusCode: number };
};

/**
 * MailSender Agent using the Resend SDK with MCP
 */
export class MailSender extends McpAgent<Env, State, {}> {
  server = new McpServer({
    name: "MailSender",
    version: "1.0.0",
  });

  async init() {
    // Validate API key and initialize Resend client
    if (!this.env.RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY environment variable");
      this.state = { resend: null };
      return;
    }

    try {
      this.state = { resend: new Resend(this.env.RESEND_API_KEY) };
      
      // Register sendMail tool with proper validation
      this.server.tool(
        "sendMail",
        {
          to: z.union([
            z.string().email(),
            z.array(z.string().email()).min(1)
          ]).describe("Email recipient(s)"),
          subject: z.string().min(1).describe("Email subject"),
          body: z.string().min(1).describe("Email content"),
          from: z.string().email().optional().describe("Sender email (optional)")
        },
        async ({ to, subject, body, from }) => {
          if (!this.validateResendClient()) {
            return this.createErrorResponse("Email service not initialized");
          }

          try {
            const emailOptions = {
              from: from || "noreply@yourdomain.com",
              to,
              subject,
              text: body
            };

            const result = await this.state.resend!.emails.send(emailOptions) as ResendResponse;
            
            return result.error
              ? this.createErrorResponse(`Failed to send email: ${result.error.message}`)
              : this.createSuccessResponse(`Email sent successfully. ID: ${result.data?.id}`);
          } catch (error) {
            return this.createErrorResponse(`Error sending email: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      );

      // Email verification tool removed as requested
    } catch (error) {
      console.error("Failed to initialize Resend client:", error);
      this.state = { resend: null };
    }
  }

  // Helper methods for consistent responses
  private validateResendClient(): boolean {
    return !!this.state?.resend;
  }

  private createErrorResponse(message: string) {
    return { content: [{ type: "text", text: `Error: ${message}` }] };
  }

  private createSuccessResponse(message: string) {
    return { content: [{ type: "text", text: message }] };
  }
}

// Clean export with route handling
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    
    // Route handling with simplified pattern matching
    switch (url.pathname) {
      case "/sse":
      case "/sse/message":
        return MailSender.serveSSE("/sse").fetch(request, env, ctx);
      case "/mcp":
        return MailSender.serve("/mcp").fetch(request, env, ctx);
      case "/":
        return renderHomePage({ req: { raw: request }, env, executionCtx: ctx });
      default:
        return new Response("Not found", { status: 404 });
    }
  },
};