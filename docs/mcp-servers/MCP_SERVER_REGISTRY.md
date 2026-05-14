# DiamondNode MCP Server Registry

**Version:** 1.0.0  
**Last Updated:** 2024-05-14  
**Total Servers:** 3

This document catalogs all Model Context Protocol (MCP) servers in the Diamond Ecosystem, providing metadata for AgentRegistry discoverability and MCP standard compliance.

---

## 📋 Registry Overview

| Server | Version | Transport | Status | Category | License |
|--------|---------|-----------|--------|----------|---------|
| **gc-mcp** | 1.0.0 | Streamable HTTP, SSE | ✅ Production | Orchestration | Proprietary |
| **env-server** | 1.0.0 | stdio | ✅ Production | Utilities | MIT |
| **notion-bridge** | 2.0.0 | HTTP Worker | ✅ Production | Integration | Proprietary |

---

## 🔧 Server Details

### 1. gc-mcp - Ground Control MCP Server

**Type:** Remote HTTP MCP Server  
**Platform:** Cloudflare Workers  
**Protocol:** Model Context Protocol 2025-03-26

#### Metadata
```json
{
  "name": "gc-mcp",
  "version": "1.0.0",
  "description": "Ground Control MCP Server for multi-agent task dispatch, Notion soul-capsule integration, and claw propagation",
  "author": "Optimization Inversion / Genesis Conductor",
  "license": "PROPRIETARY",
  "category": "orchestration"
}
```

#### Endpoints
- **Primary:** `https://api.optimizationinversion.com/mcp`
- **Secondary:** `https://gc-api.genesisconductor.io/mcp`
- **Development:** `https://gc-mcp.iholt.workers.dev/mcp`

#### Capabilities
- **Tools:** 5
  - `submit_hybrid_task` - Dispatch Codex agent tasks
  - `submit_opus_notion_task` - Dispatch Claude+Notion tasks
  - `submit_opus_task` - Dispatch Claude Opus tasks
  - `offload_to_notion` - Offload session context to Notion
  - `propagate_to_claws` - Propagate to Slack/Telegram/OpenClaw
- **Resources:** 0
- **Prompts:** 0

#### Transports
- ✅ Streamable HTTP (recommended)
- ✅ SSE (legacy)
- ✅ JSON-RPC 2.0

#### Discovery Endpoints
- `/.well-known/mcp` - MCP server discovery
- `/.well-known/ai-plugin.json` - OpenAI plugin manifest
- `/.well-known/openapi.json` - OpenAPI 3.1 spec
- `/llms.txt` - LLM-readable documentation
- `/health` - Health check

#### Client Configuration
```json
{
  "mcpServers": {
    "gc-mcp": {
      "url": "https://api.optimizationinversion.com/mcp",
      "transport": "streamable-http"
    }
  }
}
```

#### Use Cases
- Multi-agent task orchestration
- GPU VRAM monitoring and offloading
- Notion soul-capsule integration
- Cross-platform alert propagation (Slack, Telegram)
- Ising Hamiltonian calculations

#### Documentation
- **README:** `~/gc-workers/gc-mcp/README.md`
- **Schema:** `~/gc-workers/gc-mcp/mcp.json`
- **Source:** `~/gc-workers/gc-mcp/src/index.ts`

#### AgentRegistry Tags
`multi-agent`, `task-dispatch`, `notion`, `gpu-monitoring`, `vram`, `orchestration`, `cloudflare-workers`

---

### 2. env-server - Environment Variable MCP Server

**Type:** Local stdio MCP Server  
**Platform:** Node.js  
**Protocol:** Model Context Protocol (latest)

#### Metadata
```json
{
  "name": "env-server",
  "version": "1.0.0",
  "description": "Local MCP server for secure environment variable access from ~/.env file",
  "author": "DiamondNode",
  "license": "MIT",
  "category": "utilities"
}
```

#### Installation
```bash
cd ~/mcp-servers
npm install
npm run build
```

#### Capabilities
- **Tools:** 3
  - `get_env` - Get environment variable value (unmasked)
  - `list_env` - List all env vars (masked values)
  - `check_env` - Check if env vars exist (masked)
- **Resources:** 0
- **Prompts:** 0

#### Transports
- ✅ stdio (local process)

#### Security Features
- Read-only access to `~/.env`
- Value masking for `list_env` and `check_env`
- No write operations
- Local-only execution

#### Client Configuration

**Claude Desktop:**
```json
{
  "mcpServers": {
    "env-server": {
      "command": "node",
      "args": ["/home/diamondnode/mcp-servers/dist/env-server.js"]
    }
  }
}
```

**Vibe CLI:**
```toml
[[mcpServers]]
name = "env-server"
command = "node"
args = ["/home/diamondnode/mcp-servers/dist/env-server.js"]
```

#### Use Cases
- Cross-CLI credential sharing
- Secure API key management
- Dynamic configuration discovery
- Development environment validation
- Multi-AI fleet integration

#### Documentation
- **README:** `~/mcp-servers/README.md`
- **Schema:** `~/mcp-servers/mcp.json`
- **Source:** `~/mcp-servers/env-server.ts`

#### AgentRegistry Tags
`credentials`, `environment`, `security`, `local`, `api-keys`, `multi-ai-fleet`

---

### 3. notion-bridge - Notion Soul-Capsule Bridge Worker

**Type:** HTTP Worker (not standard MCP)  
**Platform:** Cloudflare Workers  
**Protocol:** Custom HTTP API

#### Metadata
```json
{
  "name": "notion-bridge",
  "version": "2.0.0",
  "description": "Cloudflare Worker for Notion soul-capsule integration with Diamond Gateway VRAM orchestration",
  "author": "DiamondNode",
  "license": "PROPRIETARY",
  "category": "integration"
}
```

#### Endpoint
- **Production:** `https://notion-bridge.iholt.workers.dev`

#### Capabilities
- **Operations:**
  - OFFLOAD payload processing
  - Notion page creation in soul-capsule database
  - VRAM usage tracking
  - Session context persistence

#### API
- **Method:** POST
- **Content-Type:** `application/json`
- **Authentication:** Optional Bearer token

#### Request Format
```json
{
  "action": "OFFLOAD",
  "session_id": "sess-abc-123",
  "context_buffer": "Session context...",
  "hamiltonian": 9.2,
  "vram_used_mib": 9200,
  "vram_total_mib": 10000
}
```

#### Notion Database
- **Database ID:** `21e416066ef1411084d1bbaf67af79d1`
- **Properties:** Session ID, VRAM Usage, Context Blob, Hamiltonian, Timestamp

#### Integration
Called by `gc-mcp` server's `offload_to_notion` tool when VRAM threshold is exceeded (Hamiltonian > 8.5).

#### Use Cases
- GPU VRAM overflow handling
- Session context persistence
- Soul-capsule database management
- Ising Hamiltonian orchestration

#### Documentation
- **README:** `~/genesis/notion-bridge/README.md`
- **Source:** `~/genesis/notion-bridge/src/`

#### AgentRegistry Tags
`notion`, `vram`, `gpu-monitoring`, `soul-capsule`, `cloudflare-workers`, `integration`

---

## 🌐 Discovery & Standards Compliance

### Model Context Protocol Compliance

| Server | Protocol Version | JSON-RPC 2.0 | Error Handling | CORS | Rate Limiting |
|--------|------------------|--------------|----------------|------|---------------|
| **gc-mcp** | 2025-03-26 | ✅ Yes | ✅ Standard | ✅ Enabled | ❌ Disabled |
| **env-server** | latest | ✅ Yes (via SDK) | ✅ Standard | N/A (stdio) | N/A (local) |
| **notion-bridge** | N/A (Custom) | N/A | ✅ Custom | ✅ Enabled | ❌ Disabled |

### Well-Known Endpoints

| Server | `.well-known/mcp` | `ai-plugin.json` | `openapi.json` | `llms.txt` | `robots.txt` |
|--------|-------------------|------------------|----------------|------------|--------------|
| **gc-mcp** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **env-server** | N/A (local) | N/A | N/A | N/A | N/A |
| **notion-bridge** | ❌ No | ❌ No | ❌ No | ❌ No | ❌ No |

---

## 📦 AgentRegistry Submission

### Submission Files

Each server has the following files prepared for AgentRegistry submission:

#### gc-mcp
- ✅ `README.md` - Comprehensive documentation
- ✅ `mcp.json` - MCP server schema with AgentRegistry metadata
- ✅ `package.json` - NPM package with MCP fields
- ✅ `.well-known/mcp` - Discovery endpoint (live)
- ✅ `.well-known/ai-plugin.json` - OpenAI plugin manifest (live)

#### env-server
- ✅ `README.md` - Comprehensive documentation
- ✅ `mcp.json` - MCP server schema with AgentRegistry metadata
- ✅ `package.json` - NPM package with MCP fields
- ⚠️ No well-known endpoints (local stdio server)

#### notion-bridge
- ✅ `README.md` - Comprehensive documentation
- ✅ `package.json` - NPM package with metadata
- ❌ Not a standard MCP server (custom HTTP API)
- 💡 Consider wrapping in MCP protocol for registry submission

### Submission Status

| Server | Ready for Submission | Priority | Notes |
|--------|---------------------|----------|-------|
| **gc-mcp** | ✅ Yes | High | Production remote MCP server, fully compliant |
| **env-server** | ✅ Yes | Medium | Local utility server, MIT licensed, reusable |
| **notion-bridge** | ⚠️ Partial | Low | Not MCP-compliant, consider wrapper |

### Recommended Submission Order

1. **gc-mcp** (Priority: High)
   - Unique orchestration capabilities
   - Production-ready
   - Publicly accessible
   - Comprehensive documentation

2. **env-server** (Priority: Medium)
   - Useful for community
   - MIT licensed
   - Simple, secure design
   - Cross-platform compatible

3. **notion-bridge** (Priority: Low - needs MCP wrapper)
   - Currently custom HTTP API
   - Would benefit from MCP protocol layer
   - Consider creating `gc-mcp` tool as primary interface

---

## 🚀 Quick Start for Each Server

### gc-mcp
```json
{
  "mcpServers": {
    "gc-mcp": {
      "url": "https://api.optimizationinversion.com/mcp",
      "transport": "streamable-http"
    }
  }
}
```

### env-server
```json
{
  "mcpServers": {
    "env-server": {
      "command": "node",
      "args": ["/home/diamondnode/mcp-servers/dist/env-server.js"]
    }
  }
}
```

### notion-bridge (via gc-mcp)
```javascript
// Call via gc-mcp's offload_to_notion tool
{
  "method": "tools/call",
  "params": {
    "name": "offload_to_notion",
    "arguments": {
      "session_id": "sess-001",
      "context_buffer": "Context..."
    }
  }
}
```

---

## 📊 Verification & Testing

### Verification Scripts
- **MCP Fleet Verification:** `~/mcp-verify-fleet.sh`
- **gc-mcp Verification:** `~/mcp-verify.sh`

### Test Results (Latest)
```
Date: 2026-05-10T23:45:00Z
Total Tests: 11
Passed: 11
Failed: 0
```

### Health Checks
```bash
# gc-mcp
curl https://api.optimizationinversion.com/health

# env-server (requires local MCP client)
# Test via Claude Desktop or Vibe CLI

# notion-bridge
curl https://notion-bridge.iholt.workers.dev
```

---

## 🔗 Related Documentation

- **Main Config:** `~/mcp-config.json`
- **Fleet Summary:** `~/MCP_FLEET_REGISTRY_SUMMARY.md`
- **Status:** `~/MCP_STATUS.md`
- **gc-workers README:** `~/gc-workers/AGENTS.md`

---

## 📝 Maintenance

### Update Checklist
- [ ] Update version numbers in package.json
- [ ] Update mcp.json schemas
- [ ] Update README.md documentation
- [ ] Update this registry document
- [ ] Run verification scripts
- [ ] Test with at least 2 MCP clients
- [ ] Deploy changes (for remote servers)
- [ ] Update AgentRegistry listings (when submitted)

### Contact
- **Email:** admin@optimizationinversion.com
- **GitHub:** TBD
- **Documentation:** See individual README files

---

**Registry Maintained by:** DiamondNode  
**License:** Mixed (see individual servers)  
**Last Verified:** 2024-05-14

---

**Built with ❤️ for the Model Context Protocol Community**
