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

type Bindings = Env & {
  RESEND_API_KEY: string;
};

// State maintained by the Durable Object
type State = null;

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

  private resendClient: Resend | null = null;

  async init() {
    console.log("MailSender._init - Starting initialization");

    // Validate API key
    if (!this.env.RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY environment variable");
      return;
    }

    try {
      // Initialize Resend client
      this.resendClient = new Resend(this.env.RESEND_API_KEY);
      console.log("Resend client initialized successfully");
      
      // Register sendMail tool
      this.server.tool(
        "sendMail",
        {
          to: z.string().email(),
          subject: z.string(),
          body: z.string()
        }, 
        async ({ to, subject, body }) => {       
          console.log(`Attempting to send email to: ${to}`);

          try {
            // Verify client is initialized
            if (!this.resendClient) {
              console.error("Resend client not initialized");
              return {
                content: [{ type: "text" as const, text: "Error: Email service not properly initialized" }],
                isError: true
              };
            }

            // Send email
            const { data, error } = await this.resendClient.emails.send({
              from: "noreply@send.glyfo.com",
              to,
              subject,
              text: body,
            });

            // Return appropriate response based on result
            if (error) {
              console.error(`Email send error: ${error.message}`);
              return {
                content: [{ type: "text" as const, text: `Error: Failed to send email: ${error.message}` }],
                isError: true
              };
            }
            
            // Check for missing data
            if (!data) {
              console.warn("Email sent but no ID was returned");
              return {
                content: [{ type: "text" as const, text: `Email sent but no ID was returned` }],
              };
            }

            // Success case
            console.log(`Email sent successfully with ID: ${data.id}`);
            return {
              content: [{ type: "text" as const, text: `Email sent successfully with ID: ${data.id}` }],
            };
          } catch (error) {
            // Handle any exceptions
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`Exception during email send: ${errorMessage}`);
            return {
              content: [{ 
                type: "text" as const, 
                text: `Error: ${errorMessage}`
              }],
              isError: true
            };
          }
        }
      );

      console.log("MailSender._init - Initialization completed successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to initialize Resend client: ${errorMessage}`);
      throw error; // Re-throw to indicate initialization failure
    }
  }

  // Helper method to check if the service is properly initialized
  isReady() {
    return !!this.resendClient;
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    
    // Standard routes
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
    
    }
};