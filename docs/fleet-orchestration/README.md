# Multi-AI Fleet Orchestration

Complete documentation for the DiamondNode multi-AI fleet orchestration system.

## Overview

DiamondNode implements a distributed AI orchestration architecture that coordinates multiple Claude instances, MCP servers, and integration workers to provide a scalable, production-ready AI infrastructure.

## Architecture Components

### 1. **MCP Fleet** (`docs/mcp-servers/`)
- 25+ production MCP servers deployed across local and remote infrastructure
- Unified configuration management via `mcp-config.json`
- Fleet verification and monitoring with `mcp-verify-fleet.sh`
- Comprehensive registry with health checks and failover

**Key Files:**
- `MCP_FLEET_INSTALL_SUMMARY.md` - Installation and setup
- `MCP_SERVER_REGISTRY.md` - Complete server registry
- `MCP_STATUS.md` - Current fleet status
- `MCP_OPTIMIZATION_SUMMARY.md` - Performance optimizations

### 2. **Claude Orchestration** (`docs/fleet-orchestration/`)
- Multi-instance Claude coordination with automatic load balancing
- Session management and context routing
- GPU VRAM-aware offload mechanism
- Remote Claude execution via SSH tunneling

**Key Files:**
- `CLAUDE_ORCHESTRATOR_README.md` - Main orchestration guide
- `CLAUDE_ORCHESTRATION_COMPLETE.md` - Implementation details
- `claude-orchestrator.sh` - Orchestration engine
- `claude-aliases.sh` - Convenience aliases

### 3. **Notion Integration** (`docs/integrations/`)
- Soul-capsule session offload to Notion databases
- Observability and telemetry pipeline
- Cloudflare Worker-based bridge architecture
- BigQuery integration for analytics

**Key Files:**
- `NOTION_OBSERVABILITY_SUMMARY.md` - Complete observability setup
- `~/genesis/notion-bridge/` - Cloudflare Worker source

### 4. **Credential Vault** (`docs/security/`)
- Async credential sharing between AI instances
- Secure vault management with encryption
- API key rotation and audit logging
- Zero-knowledge architecture

**Key Files:**
- `CREDENTIAL_VAULT_GUIDE.md` - Implementation guide
- `ASYNC_CREDENTIAL_SHARING_COMPLETE.md` - Deployment status
- `API_KEYS_SECURITY.md` - Security best practices

### 5. **EnidPinxit Partner System** (`docs/integrations/`)
- Partner access provisioning and management
- Credential distribution via EnidPinxit platform
- OAuth integration for partner authentication
- Usage tracking and billing integration

**Key Files:**
- `ENIDPINXIT_PARTNER_ACCESS.md` - Partner onboarding
- `ENIDPINXIT_QUICKREF.md` - Quick reference guide
- `ENIDPINXIT_WELCOME_PAGE.md` - Partner welcome documentation

### 6. **Social Outreach Node** (`docs/integrations/`)
- Automated GitHub, X (Twitter), and LinkedIn integration
- Content generation and scheduling
- Analytics and engagement tracking
- Multi-platform campaign orchestration

**Key Files:**
- `SOCIAL_OUTREACH_NODE_COMPLETE.md` - Complete implementation

## Production Deployment

All components are production-ready and deployed:

✅ **MCP Fleet** - 25+ servers running across local/remote infrastructure
✅ **Claude Orchestration** - Multi-instance coordination with load balancing
✅ **Notion Workers** - Cloudflare Workers processing OFFLOAD payloads
✅ **Credential Vault** - Async sharing operational with encryption
✅ **EnidPinxit** - Partner access system live
✅ **Social Outreach** - Multi-platform automation active

## Quick Start

### 1. Verify MCP Fleet
```bash
./mcp-verify-fleet.sh
```

### 2. Start Claude Orchestrator
```bash
source docs/fleet-orchestration/claude-aliases.sh
claude-orchestrate
```

### 3. Check Notion Integration
```bash
cd ~/genesis/notion-bridge
npx wrangler tail
```

### 4. Test Credential Vault
```bash
~/test-credential-vault.sh
```

## Monitoring & Observability

- **AppSignal** - Application performance monitoring
- **BigQuery** - Analytics and telemetry data lake
- **LangSmith** - LLM tracing and debugging
- **Notion** - Session offload and soul-capsule storage
- **OpenTelemetry** - Distributed tracing

## AgentRegistry Submissions

Public MCP server submissions for community use:

- **gc-mcp** - Ground Control MCP server for Notion integration
- **env-server** - Environment variable management server

See `agentregistry-submissions/` for submission details.

## Integration Flow

```
User Request → Claude Orchestrator → Load Balancer → Claude Instance
                      ↓
                GPU VRAM Monitor
                      ↓
            OFFLOAD Decision (H > 8.5)
                      ↓
         Notion Bridge Worker → Notion Soul-Capsule DB
                      ↓
              BigQuery Analytics
```

## Environment Setup

All components require proper environment configuration:

```bash
source ~/load-env.sh  # Loads ~/.env with validation
```

Required variables:
- `GATEWAY_SECRET` - Diamond Gateway authentication
- `LANGSMITH_API_KEY` - LangSmith tracing
- `OPENAI_API_KEY` - OpenAI API access
- `GC_MCP_URL` - Ground Control MCP endpoint
- `NOTION_TOKEN` - Notion integration token

## Architecture Principles

1. **Distributed by Design** - No single point of failure
2. **GPU-Aware** - VRAM monitoring with Ising Hamiltonian offload logic
3. **Observable** - Full telemetry pipeline with multiple backends
4. **Secure** - Credential vault with async sharing and encryption
5. **Scalable** - Multi-instance coordination with load balancing
6. **Production-Ready** - Systemd services, monitoring, failover

## Contributing

This is a production system. Changes should:
- Include comprehensive documentation
- Add tests for new components
- Update relevant README files
- Follow existing architectural patterns

## License

Proprietary - Genesis Conductor Engine

## Support

For issues or questions, see individual component documentation in their respective directories.
