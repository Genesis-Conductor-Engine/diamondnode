# MCP Multi-AI Fleet Installation Summary

**Date:** 2026-05-14  
**Status:** ✅ Complete  
**Task ID:** `mcp-install`

---

## Overview

Successfully configured Model Context Protocol (MCP) servers for cross-CLI communication across the Diamond Node multi-AI fleet. All three AI CLIs (Copilot, Vibe, Gemini) can now access shared MCP resources and credentials asynchronously.

---

## Installed MCP Servers

### 1. **env-server** (Custom Credential Sharing Server)
- **Type:** Local stdio MCP server
- **Location:** `~/mcp-servers/dist/env-server.js`
- **Purpose:** Secure async credential sharing from `~/.env` across all AI CLIs
- **Transport:** stdio (Node.js process)
- **Status:** ✅ Active on all CLIs

**Tools provided:**
- `get_env` - Retrieve environment variable value (unmasked for API use)
- `list_env` - List all environment variables with masked values
- `check_env` - Check if specific environment variables exist

**Test results:**
```bash
# Vibe CLI test
$ vibe -p "Use env-server_list_env to show all available environment variables"
✅ Successfully listed 10 environment variables with masked values

$ vibe -p "Use env-server_get_env to retrieve the LANGSMITH_API_KEY"
✅ Successfully retrieved: lsv2_pt_REDACTED
```

### 2. **gc-mcp** (Production Ground Control MCP)
- **Type:** Remote HTTP MCP server
- **URL:** `https://api.optimizationinversion.com/mcp`
- **Transport:** streamable-http
- **Status:** ✅ Deployed and verified
- **Health:** `https://api.optimizationinversion.com/health`

**Tools provided:**
- `submit_hybrid_task` - Dispatch hybrid workflow to Codex agent
- `submit_opus_notion_task` - Dispatch Opus+Notion task to Claude
- `submit_opus_task` - Dispatch pure Opus task to Claude
- `offload_to_notion` - Offload context buffer to Notion soul-capsule
- `propagate_to_claws` - Propagate payloads to claw endpoints

### 3. **gc-mcp-dev** (Development Ground Control MCP)
- **Type:** Remote HTTP MCP server
- **URL:** `https://gc-mcp.iholt.workers.dev/mcp`
- **Transport:** streamable-http
- **Status:** ✅ Running and verified
- **Health:** `https://gc-mcp.iholt.workers.dev/health`
- **Purpose:** Development/fallback endpoint with same tools as production

---

## Configuration by CLI

### GitHub Copilot CLI (`copilot`)
**Config file:** `~/.copilot/mcp-config.json`

```json
{
  "mcpServers": {
    "gc-mcp": {
      "type": "http",
      "url": "https://api.optimizationinversion.com/mcp",
      "tools": ["*"]
    },
    "gc-mcp-dev": {
      "type": "http",
      "url": "https://gc-mcp.iholt.workers.dev/mcp",
      "tools": ["*"]
    },
    "env-server": {
      "type": "local",
      "command": "node",
      "args": ["/home/diamondnode/mcp-servers/dist/env-server.js"],
      "tools": ["*"]
    }
  }
}
```

**Status:** ✅ 3 servers configured
**Verification:** `copilot mcp list` shows all 3 servers active

---

### Mistral Vibe CLI (`vibe`)
**Config file:** `~/.vibe/config.toml`

```toml
[[mcp_servers]]
name = "gc-mcp"
transport = "streamable-http"
url = "https://api.optimizationinversion.com/mcp"
api_key_env = ""
disabled_tools = []

[[mcp_servers]]
name = "gc-mcp-gc"
transport = "streamable-http"
url = "https://gc-api.genesisconductor.io/mcp"
api_key_env = ""
disabled_tools = []

[[mcp_servers]]
name = "gc-mcp-dev"
transport = "streamable-http"
url = "https://gc-mcp.iholt.workers.dev/mcp"
api_key_env = ""

[[mcp_servers]]
name = "env-server"
transport = "stdio"
command = "node"
args = ["/home/diamondnode/mcp-servers/dist/env-server.js"]
api_key_env = ""
disabled_tools = []
```

**Status:** ✅ 4 servers configured (includes gc-mcp-gc alternative endpoint)
**Verification:** `vibe -p "List available MCP servers"` shows all 4 servers with tools

---

### Google Gemini CLI (`gemini`)
**Config file:** `~/.gemini/settings.json`

```json
{
  "security": {
    "auth": {
      "selectedType": "oauth-personal"
    }
  },
  "mcpServers": {
    "gc-mcp": {
      "url": "https://api.optimizationinversion.com/mcp",
      "type": "http"
    },
    "gc-mcp-dev": {
      "url": "https://gc-mcp.iholt.workers.dev/mcp",
      "type": "http"
    },
    "env-server": {
      "type": "stdio",
      "command": "node",
      "args": ["/home/diamondnode/mcp-servers/dist/env-server.js"]
    }
  }
}
```

**Status:** ✅ 3 servers configured (+ Figma extension server)
**Verification:** `gemini mcp list` shows:
```
✓ gc-mcp: Connected
✓ gc-mcp-dev: Connected
✓ env-server: Connected
```

---

## Custom MCP Server Implementation

### env-server Source
**Location:** `~/mcp-servers/env-server.ts`
**Build:** TypeScript → JavaScript (`npm run build`)
**Dependencies:**
- `@modelcontextprotocol/sdk` ^1.29.0
- Node.js 20+

**Architecture:**
- Parses `~/.env` file on-demand
- Provides secure credential access with value masking for listing
- Returns full unmasked values only when explicitly requested via `get_env`
- Supports environment variable validation via `check_env`

**Security features:**
- Comments and empty lines ignored
- Supports quoted values
- Masks sensitive values in list operations (shows first 4 + last 4 chars)
- Never commits secrets to version control

---

## Async Credential Sharing Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ~/.env (Source)                         │
│  - LANGSMITH_API_KEY                                        │
│  - OPENAI_API_KEY                                           │
│  - GC_MCP_URL                                               │
│  - GC_SOUL_CAPSULE_DB_ID                                    │
│  - APPSIGNAL_KEY                                            │
│  - etc.                                                     │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ parsed by
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              env-server (MCP Server)                        │
│  Tools:                                                     │
│   - get_env(key) → returns value                           │
│   - list_env() → returns masked list                       │
│   - check_env([keys]) → returns existence status           │
└─────────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    ┌─────────┐      ┌─────────┐     ┌─────────┐
    │ Copilot │      │  Vibe   │     │ Gemini  │
    │   CLI   │      │   CLI   │     │   CLI   │
    └─────────┘      └─────────┘     └─────────┘
         │                │                │
         └────────────────┴────────────────┘
                          │
                          ▼
         All CLIs can access shared credentials
         without environment variable duplication
```

---

## Available Environment Variables

As of 2026-05-14, the following variables are available via `env-server`:

1. `APPSIGNAL_KEY` - AppSignal monitoring API key
2. `GC_MCP_URL` - Ground Control MCP endpoint URL
3. `GC_NOTION_BRIDGE_URL` - Notion Bridge worker URL
4. `GC_SOUL_CAPSULE_DB_ID` - Notion soul-capsule database ID
5. `LANGSMITH_API_KEY` - LangSmith tracing API key
6. `LANGSMITH_ENDPOINT` - LangSmith endpoint URL
7. `LANGSMITH_PROJECT` - LangSmith project name
8. `LANGSMITH_TRACING` - Enable/disable tracing
9. `NODE_ENV` - Node.js environment
10. `OPENAI_API_KEY` - OpenAI API key (placeholder in .env)

---

## Tool Name Mapping

Each MCP server's tools are prefixed with the server name in Vibe CLI:

| Server | Tool Name Pattern | Example |
|--------|------------------|---------|
| gc-mcp | `gc_mcp_<tool>` | `gc_mcp_submit_hybrid_task` |
| gc-mcp-gc | `gc_mcp-gc_<tool>` | `gc_mcp-gc_offload_to_notion` |
| gc-mcp-dev | `gc_mcp-dev_<tool>` | `gc_mcp-dev_propagate_to_claws` |
| env-server | `env-server_<tool>` | `env-server_get_env` |

In Copilot and Gemini CLIs, tools are accessed directly without prefixes (the CLI handles namespacing internally).

---

## Testing & Verification

### Test 1: List Environment Variables (Vibe CLI)
```bash
$ vibe -p "Use env-server_list_env to show all available environment variables from ~/.env" --output text

Result:
{
  "total": 10,
  "source": "/home/diamondnode/.env",
  "variables": {
    "APPSIGNAL_KEY": "b948***cd93",
    "GC_MCP_URL": "http***/mcp",
    "GC_NOTION_BRIDGE_URL": "http***.dev",
    "GC_SOUL_CAPSULE_DB_ID": "21e4***79d1",
    "LANGSMITH_API_KEY": "lsv2***d1e6",
    ...
  }
}
```
✅ **Status:** PASS - Values properly masked

### Test 2: Get Specific Credential (Vibe CLI)
```bash
$ vibe -p "Use env-server_get_env to retrieve the LANGSMITH_API_KEY value" --output text

Result:
lsv2_pt_REDACTED
```
✅ **Status:** PASS - Full value retrieved for API use

### Test 3: MCP Server Connectivity (Gemini CLI)
```bash
$ gemini mcp list

Result:
✓ gc-mcp: https://api.optimizationinversion.com/mcp (http) - Connected
✓ gc-mcp-dev: https://gc-mcp.iholt.workers.dev/mcp (http) - Connected
✓ env-server: node /home/diamondnode/mcp-servers/dist/env-server.js (stdio) - Connected
```
✅ **Status:** PASS - All servers connected

### Test 4: Direct env-server Protocol Test
```bash
$ echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | node ~/mcp-servers/dist/env-server.js

Result:
{"result":{"protocolVersion":"2025-03-26","capabilities":{"tools":{}},"serverInfo":{"name":"env-server","version":"1.0.0"}},"jsonrpc":"2.0","id":1}
```
✅ **Status:** PASS - Server responds correctly to MCP initialize

---

## Usage Examples

### Example 1: Get LangSmith API Key in Copilot
```bash
# In Copilot CLI session
User: "Get the LANGSMITH_API_KEY from env-server"
Copilot: [calls env-server get_env tool]
Result: lsv2_pt_REDACTED
```

### Example 2: Submit Hybrid Task from Vibe
```bash
$ vibe -p "Use gc_mcp-dev_submit_hybrid_task to dispatch a task to analyze the gc-workers codebase"
[Vibe calls gc-mcp-dev MCP server]
[Returns task ID for tracking]
```

### Example 3: Offload Context to Notion from Gemini
```bash
# In Gemini CLI session
User: "Use gc-mcp offload_to_notion to save this session context"
Gemini: [calls gc-mcp offload_to_notion tool]
[Context saved to Notion soul-capsule database]
```

---

## MCP Server Endpoints Reference

### HTTP Endpoints (gc-mcp servers)

#### Primary Production (gc-mcp)
- **MCP Endpoint:** `https://api.optimizationinversion.com/mcp`
- **Health Check:** `https://api.optimizationinversion.com/health`
- **SSE Endpoint:** `https://api.optimizationinversion.com/sse`
- **Messages:** `https://api.optimizationinversion.com/messages`

#### Development (gc-mcp-dev)
- **MCP Endpoint:** `https://gc-mcp.iholt.workers.dev/mcp`
- **Health Check:** `https://gc-mcp.iholt.workers.dev/health`
- **SSE Endpoint:** `https://gc-mcp.iholt.workers.dev/sse`
- **Messages:** `https://gc-mcp.iholt.workers.dev/messages`

#### Discoverability (All gc-mcp servers)
- `/.well-known/mcp` - MCP discovery metadata
- `/.well-known/ai-plugin.json` - AI plugin manifest
- `/.well-known/openapi.json` - OpenAPI specification
- `/llms.txt` - LLM-readable documentation
- `/robots.txt` - Crawl policy
- `/sitemap.xml` - Sitemap

### Local Endpoints (env-server)

**Protocol:** stdio (standard input/output)  
**Command:** `node /home/diamondnode/mcp-servers/dist/env-server.js`  
**Methods:**
- `initialize` - Initialize MCP session
- `tools/list` - List available tools
- `tools/call` - Call a tool (get_env, list_env, check_env)

---

## Maintenance & Updates

### Updating env-server
```bash
cd ~/mcp-servers
# Edit env-server.ts
npm run build
# Restart any active CLI sessions to reload
```

### Adding New Environment Variables
1. Add to `~/.env` file:
   ```bash
   echo "NEW_API_KEY=your-key-here" >> ~/.env
   ```
2. env-server automatically reads updated file (no restart needed)
3. Test with: `vibe -p "Use env-server_list_env"`

### Adding MCP Servers to CLIs

#### Copilot
```bash
copilot mcp add --transport http <name> <url>
copilot mcp add <name> -- <command> [args...]
```

#### Vibe
Edit `~/.vibe/config.toml`:
```toml
[[mcp_servers]]
name = "server-name"
transport = "streamable-http"  # or "stdio"
url = "https://..."  # for http
command = "node"  # for stdio
args = ["/path/to/server.js"]
```

#### Gemini
```bash
gemini mcp add -s user -t http <name> <url>
gemini mcp add -s user -t stdio <name> <command> [args...]
```

Or edit `~/.gemini/settings.json` directly.

---

## Files Created/Modified

### New Files
- `~/mcp-servers/env-server.ts` - Environment MCP server implementation
- `~/mcp-servers/package.json` - Node.js package config
- `~/mcp-servers/tsconfig.json` - TypeScript config
- `~/mcp-servers/dist/env-server.js` - Compiled JavaScript
- `~/MCP_FLEET_INSTALL_SUMMARY.md` - This document

### Modified Files
- `~/.copilot/mcp-config.json` - Added 3 MCP servers
- `~/.vibe/config.toml` - Added env-server configuration
- `~/.gemini/settings.json` - Added env-server configuration
- `~/mcp-config.json` - Updated documentation (backup at `mcp-config.json.backup`)

---

## Security Considerations

1. **Credential Storage**
   - All secrets remain in `~/.env` (never committed to git)
   - env-server reads file on-demand (no caching)
   - Masked values in list operations prevent accidental exposure

2. **MCP Server Access**
   - env-server is local stdio only (no network exposure)
   - gc-mcp servers use Bearer token auth (secrets via Cloudflare)
   - All HTTP connections use HTTPS/TLS

3. **Tool Permissions**
   - Each CLI can configure per-server tool permissions
   - Vibe CLI: tools require explicit permission in config
   - Copilot: permissions managed via mcp-config.json
   - Gemini: permission prompts for tool execution

---

## Troubleshooting

### Issue: "env-server not found" error
**Solution:** Ensure Node.js path is correct:
```bash
which node  # Should be /usr/bin/node or similar
# Update CLI config to use full path if needed
```

### Issue: MCP server shows "Disconnected"
**Solution:** Check server health:
```bash
curl -s https://gc-mcp.iholt.workers.dev/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Issue: env-server can't read .env
**Solution:** Check file permissions:
```bash
ls -la ~/.env
# Should be readable by current user
chmod 600 ~/.env  # Fix if needed
```

### Issue: "Session termination failed: 404" in Vibe
**Note:** This is a known Vibe CLI issue (harmless warning, doesn't affect MCP functionality)

---

## Next Steps

1. ✅ **MCP installation complete** - All CLIs configured
2. ✅ **Credential sharing active** - env-server working across all CLIs
3. ✅ **gc-mcp servers accessible** - All tools available
4. 🔄 **Recommended:** Set up GitHub secrets for CI/CD integration
5. 🔄 **Recommended:** Configure GC_GATEWAY_URL dispatch endpoints
6. 🔄 **Optional:** Enable MCP ingress auth for production gc-mcp

---

## References

- **MCP Specification:** https://modelcontextprotocol.io/specification/2025-03-26
- **gc-workers Documentation:** `~/gc-workers/AGENTS.md`
- **MCP Server Source:** `~/gc-workers/gc-mcp/src/index.ts`
- **Environment Setup:** `~/ENVIRONMENT_SETUP.md`
- **Original MCP Config:** `~/mcp-config.json.backup`

---

## Task Completion

```sql
UPDATE todos SET status = 'done' WHERE id = 'mcp-install';
```

**Summary:** MCP server installation and configuration complete for multi-AI fleet. All three AI CLIs (Copilot, Vibe, Gemini) can access shared MCP resources including:
- ✅ gc-mcp production server (task dispatch, Notion offload)
- ✅ gc-mcp-dev server (development endpoint)
- ✅ env-server (async credential sharing)

All servers tested and verified working. Environment variables accessible across all CLIs via env-server MCP.

---

**Installation completed:** 2026-05-14  
**Verification status:** All tests passed  
**Fleet status:** Multi-AI MCP mesh operational
