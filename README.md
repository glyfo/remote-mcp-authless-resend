# Remote MCP Email Sender Agent on Cloudflare Workers

This project provides a ready-to-deploy Model Context Protocol (MCP) server running on Cloudflare Workers that enables AI assistants to send emails using the [Resend](https://resend.com) email service. It implements the standardized MCP interface for seamless integration with Claude and other AI assistants.

## Features

- **Email Sending Capability**: Send emails directly from your AI assistant
- **Serverless Architecture**: Runs on Cloudflare Workers without additional infrastructure
- **MCP Compatibility**: Follows the Model Context Protocol standard for AI tool integration
- **TypeScript Implementation**: Fully typed and maintainable codebase

## Quick Start

Create and deploy the Email Sender MCP server using the command line:

```bash
# Create a new project from the template
pnpm create cloudflare@latest -- mcp-email-sender --template=cloudflare/ai/demos/remote-mcp-authless

# Navigate to your new project
cd mcp-email-sender

# Copy the MailSender implementation to your project
# (Replace src/index.ts with the MailSender code)

# Set your Resend API key as a secret
npx wrangler secret put RESEND_API_KEY

# Deploy to Cloudflare Workers
pnpm run deploy
```

After deployment, your email sender service will be available at:

```
mcp-email-sender.<your-account>.workers.dev
```

## Configuration

### Environment Variables

The following environment variables must be configured for proper operation:

- `RESEND_API_KEY`: Your API key from [Resend](https://resend.com)

You can set this using Wrangler:

```bash
npx wrangler secret put RESEND_API_KEY
```

## Using the Email Sender

### Available Tool: sendMail

The MCP server provides a `sendMail` tool with the following parameters:

- `to`: Email recipient(s) - can be a single email address or an array of email addresses
- `subject`: Email subject line
- `body`: Email content (plain text)
- `from`: (Optional) Sender email address. If not provided, defaults to "noreply@yourdomain.com"

### Example Usage with Claude

```
Use the sendMail tool to send an email to test@example.com with the subject "Hello from Claude" and the message "This is a test email sent via the MailSender MCP agent."
```

## Connecting to Your MCP Server

### Using Cloudflare AI Playground

The Cloudflare AI Playground provides a web interface for interacting with your MCP server:

1. Go to [https://playground.ai.cloudflare.com/](https://playground.ai.cloudflare.com/)
2. Enter your deployed MCP server URL (e.g., `mcp-email-sender.<your-account>.workers.dev/sse`)
3. Start using the email sending tools within the playground

### Connecting Claude Desktop

Connect Claude Desktop to your remote MCP server using the [mcp-remote proxy](https://www.npmjs.com/package/mcp-remote):

1. Follow [Anthropic's MCP Quickstart Guide](https://modelcontextprotocol.io/quickstart/user)
2. In Claude Desktop, go to Settings > Developer > Edit Config
3. Update the configuration with:

```json
{
  "mcpServers": {
    "emailSender": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://mcp-email-sender.<your-account>.workers.dev/sse"
      ]
    }
  }
}
```

4. Restart Claude Desktop to activate the email tools

## Development and Testing

### Local Development

Run your MCP server locally for testing:

```bash
# Install dependencies
pnpm install

# Start local development server
pnpm run dev
```

Your local server will be available at `http://localhost:8787/sse`

### Deployment

Deploy updates to your MCP server:

```bash
pnpm run deploy
```

## Customizing the Email Sender

### Modifying the Default From Address

To change the default sender email address, update the following line in the `sendMail` tool:

```typescript
from: from || "noreply@yourdomain.com",
```

### Adding HTML Email Support

The current implementation only supports plain text emails. To add HTML support, you can modify the email options:

```typescript
const emailOptions = {
  from: from || "noreply@yourdomain.com",
  to,
  subject,
  text: body,
  html: htmlBody, // Add HTML body parameter to the tool
};
```

## Troubleshooting

- **Email Not Sending**: Verify your Resend API key is correctly set as a secret
- **Connection Issues**: Ensure your Cloudflare Workers URL includes the `/sse` endpoint
- **Tool Not Found**: Check that the tool is properly registered in the `init()` method
- **Type Errors**: The implementation uses TypeScript interfaces that match Resend's API

## Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Anthropic Claude MCP Guide](https://docs.anthropic.com/claude/docs/model-context-protocol)

## License

This project is licensed under the terms specified in the repository.
