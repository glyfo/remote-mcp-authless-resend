import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { Resend } from 'resend';
import { renderHomePage } from './home';

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
  
  server = new McpServer({
    name: "MailSender",
    version: "1.0.0"
  });

  async init() {

    // Validate API key
    if (!this.env.RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY environment variable");
      return;
    }

    try {      
      // Register sendMail tool
      this.server.tool(
        "sendMail",
        {
          to: z.string().email(),
          subject: z.string(),
          body: z.string()
        }, 
        async ({ to, subject, body }) => {       

          try {

            // Create Resend instance
          const resend = new Resend(this.env.RESEND_API_KEY);
          console.debug("Resend instance created");
          const { data, error } = await resend.emails.send({
            from: "noreply@send.glyfo.com",
            to,
            subject,
            text: body,
          });

            // Return appropriate response based on result
            if (error) {
              return {
                content: [{ type: "text" as const, text: `Error: Failed to send email: ${error.message}` }],
                isError: true
              };
            }
            
          // Fix: Add null check for data before accessing data.id
          if (!data) {
            console.warn("Email sent but no ID was returned");
            return {
              content: [{ type: "text", text: `Email sent but no ID was returned` }],
            };
          }
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

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname === "/sse" || url.pathname === "/sse/message") {
      // @ts-ignore
      return MailSender.serveSSE("/sse").fetch(request, env, ctx);
    }
    if (url.pathname === "/mcp") {
      // @ts-ignore
      return MailSender.serve("/mcp").fetch(request, env, ctx);
    }
    if (url.pathname === "/") {
      return renderHomePage({ req: { raw: request }, env, executionCtx: ctx });
    }
    return new Response("Not found", { status: 404 });
  },
};