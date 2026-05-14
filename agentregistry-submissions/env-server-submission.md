# AgentRegistry Submission: env-server

## Server Information

**Name:** env-server  
**Display Name:** Environment Variable MCP Server  
**Version:** 1.0.0  
**Author:** DiamondNode  
**License:** MIT  
**Category:** Utilities  
**Pricing:** Free (Open Source)  
**Availability:** Public

## Description

Local MCP server for secure environment variable access from ~/.env file. Enables AI CLI agents to read API keys and credentials without exposing them in conversations.

### Key Features
- Secure credential access from ~/.env
- Value masking for list operations
- Cross-CLI integration (Claude, Vibe, Copilot, etc.)
- Read-only operations (no write access)
- MIT licensed for community use

## Protocol Compliance

- MCP Protocol Version: latest
- Transport: stdio (local process)
- Platform: Node.js
- Security: Local file read-only

## Installation

```bash
cd ~/mcp-servers
npm install
npm run build
```

## Client Configuration

Claude Desktop:
```json
{
  "mcpServers": {
    "env-server": {
      "command": "node",
      "args": ["~/mcp-servers/dist/env-server.js"]
    }
  }
}
```

## Capabilities: 3 Tools

1. get_env - Get environment variable value (unmasked)
2. list_env - List all env vars (masked values)
3. check_env - Check if env vars exist (masked)

## Security Features

- Read-only access to ~/.env
- Value masking: first4***last4
- No write operations
- Local execution only

## Use Cases

- Cross-CLI credential sharing
- Secure API key management
- Dynamic configuration discovery
- Development environment validation
- Multi-AI fleet integration

## Tags

mcp, environment-variables, credentials, security, local, utilities, open-source
