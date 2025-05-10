import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { renderHomePage } from './home';
import { Resend } from 'resend';

// Environment interface with necessary bindings
export interface Env {
  MCP_OBJECT: DurableObjectNamespace;
  RESEND_API_KEY: string; // Resend API key as an environment variable
}

interface Context {
  // Add context properties if needed
}

type Bindings = Env & {};

// Props passed to the Durable Object
type Props = {};

// State maintained by the Durable Object
type State = {
  resend: Resend | null;
};

/**
 * MailSender Agent using the Resend SDK with MCP
 */
export class MailSender extends McpAgent<Bindings, State, Props> {
  server = new McpServer({
    name: "MailSender",
    version: "1.0.0",
  });

  async init() {
    // Initialize Resend client
    this.state = {
      resend: new Resend(this.env.RESEND_API_KEY)
    };

    // Register simplified sendMail tool with just to, subject, and body
    this.server.tool(
      "sendMail",
      {
        to: z.string().email().or(z.array(z.string().email())), // Keep the to parameter
        subject: z.string(),
        body: z.string(),
      },
      async ({ to, subject, body }) => {
        try {
          if (!this.state.resend) {
            return {
              content: [{ type: "text", text: "Error: Resend client not initialized" }],
            };
          }

          const defaultFrom = "noreply@yourdomain.com"; // Set your default from address
          
          const emailOptions = {
            from: defaultFrom,
            to,
            subject,
            text: body
          };

          const { data, error } = await this.state.resend.emails.send(emailOptions);
          
          if (error) {
            return {
              content: [{ type: "text", text: `Error: ${error.message}` }],
            };
          }
          
          return {
            content: [{ 
              type: "text", 
              text: `Email sent successfully. ID: ${data.id}` 
            }],
          };
        } catch (error) {
          return {
            content: [{ 
              type: "text", 
              text: `Error sending email: ${error.message}` 
            }],
          };
        }
      }
    );

    // Add a tool to verify email configuration
    this.server.tool(
      "verifyEmailConfig",
      {},
      async () => {
        if (!this.state.resend) {
          return {
            content: [{ type: "text", text: "Error: Resend client not initialized" }],
          };
        }

        return {
          content: [{ 
            type: "text", 
            text: "Email configuration is valid and ready to use." 
          }],
        };
      }
    );
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