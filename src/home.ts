/**
 * Renders the MailSender MCP home page
 */
export const renderHomePage = (c: { req: { raw: Request }, env: any, executionCtx: any }) => {
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>MailSender MCP</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="font-sans text-gray-800 bg-gray-50">
      <div class="max-w-3xl mx-auto px-4 py-8">
        <h1 class="text-3xl font-bold text-blue-800 mb-4">MailSender MCP</h1>
        <p class="mb-6">Welcome to the MailSender Model Context Protocol server. This MCP provides email sending capabilities that can be used by AI agents and applications.</p>
        
        <h2 class="text-2xl font-semibold text-blue-700 mt-8 mb-4">Available Endpoints</h2>
        
        <div class="mb-6">
          <h3 class="text-xl font-medium text-blue-600 mb-2">/mcp</h3>
          <p>Main MCP endpoint for tool operations.</p>
        </div>
        
        <div class="mb-6">
          <h3 class="text-xl font-medium text-blue-600 mb-2">/sse</h3>
          <p>Server-Sent Events endpoint for streaming responses.</p>
        </div>
        
        <h2 class="text-2xl font-semibold text-blue-700 mt-8 mb-4">Available Operations</h2>
        
        <p class="mb-2">The MailSender supports the following operations:</p>
        
        <ul class="list-disc pl-6 mb-6">
          <li class="mb-1"><span class="font-semibold">sendMail</span>: Send an email to specified recipient(s)</li>
          <li class="mb-1"><span class="font-semibold">verifyEmailConfig</span>: Verify email configuration is working properly</li>
        </ul>
        
        <h2 class="text-2xl font-semibold text-blue-700 mt-8 mb-4">Example Usage</h2>
        
        <div class="border-l-4 border-blue-500 pl-4 my-4">
          <p class="mb-2">Here's how to use the sendMail tool:</p>
          <pre class="bg-gray-100 p-4 rounded overflow-x-auto mb-4"><code>{
  "tool": "sendMail",
  "params": {
    "to": "recipient@example.com",
    "subject": "Hello from MailSender MCP",
    "body": "This is a test email sent using the MailSender MCP."
  }
}</code></pre>
          <p class="mb-2">Response:</p>
          <pre class="bg-gray-100 p-4 rounded overflow-x-auto mb-4"><code>{
  "content": [
    {
      "type": "text",
      "text": "Email sent successfully. ID: 1234abcd-5678-efgh-9012-ijklmnopqrst"
    }
  ]
}</code></pre>
        </div>

        <div class="border-l-4 border-blue-500 pl-4 my-4">
          <p class="mb-2">Here's how to use the verifyEmailConfig tool:</p>
          <pre class="bg-gray-100 p-4 rounded overflow-x-auto mb-4"><code>{
  "tool": "verifyEmailConfig",
  "params": {}
}</code></pre>
          <p class="mb-2">Response:</p>
          <pre class="bg-gray-100 p-4 rounded overflow-x-auto mb-4"><code>{
  "content": [
    {
      "type": "text",
      "text": "Email configuration is valid and ready to use."
    }
  ]
}</code></pre>
        </div>
        
        <p class="text-sm text-gray-600 mt-8">Version: 1.0.0</p>
      </div>
    </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
};