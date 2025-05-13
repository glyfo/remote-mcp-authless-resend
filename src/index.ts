import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Resend } from 'resend';

// Environment interface with necessary bindings
export interface Env {
  MCP_OBJECT: DurableObjectNamespace;
  RESEND_API_KEY: string;
}

// State interface with Resend client
type State = {
  resend: Resend | null;
};

// Resend API response types
interface CreateEmailResponseSuccess {
  id: string;
}

interface ErrorResponse {
  message: string;
  name?: string;
  code?: string;
}

type ResendResponse = {
  data: CreateEmailResponseSuccess | null;
  error: ErrorResponse | null;
};

/**
 * MailSender Agent using the Resend SDK with MCP
 */
export class MailSender extends McpAgent<Env, State, {}> {
  // Define initial state
  initialState = { resend: null };
  
  // Define server property
  server!: McpServer;

  async init() {
    // Initialize server with proper configuration
    this.server = new McpServer({
      name: "MailSender",
      version: "1.0.0",
      methods: ["mcp.listTools", "mcp.invokeTool"],
    });

    // Validate API key
    if (!this.env.RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY environment variable");
      return;
    }

    try {
      // Initialize Resend client
      this.setState({ resend: new Resend(this.env.RESEND_API_KEY) });
      
      // Register sendMail tool
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
        async (args, extra) => {
          const { to, subject, body, from } = args;
          
          // Check if Resend client is initialized
          if (!this.state?.resend) {
            return {
              content: [{ type: "text" as const, text: "Error: Email service not initialized" }],
              isError: true
            };
          }

          try {
            // Prepare email options
            const emailOptions = {
              from: from || "noreply@yourdomain.com",
              to,
              subject,
              text: body
            };

            // Send email using Resend with proper type handling
            const result: ResendResponse = await this.state.resend.emails.send(emailOptions);
            
            // Return appropriate response based on result
            if (result.error) {
              return {
                content: [{ type: "text" as const, text: `Error: Failed to send email: ${result.error.message}` }],
                isError: true
              };
            }
            
            return {
              content: [{ type: "text" as const, text: `Email sent successfully. ID: ${result.data?.id || 'unknown'}` }]
            };
          } catch (error) {
            // Handle any exceptions
            return {
              content: [{ 
                type: "text" as const, 
                text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
              }],
              isError: true
            };
          }
        }
      );
    } catch (error) {
      console.error("Failed to initialize Resend client:", error);
    }
  }
}

// Export default handler for routing - only supporting MCP endpoint
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    // No path needed for McpAgent.serve() as we're only supporting MCP endpoint
    return MailSender.serve().fetch(request, env, ctx);
  },
};