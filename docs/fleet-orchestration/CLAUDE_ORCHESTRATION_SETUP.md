# Claude Orchestration System - Configuration Complete

## Overview

Claude Remote is now configured as a top-level orchestrator that intelligently routes requests between Claude (strategic decisions) and subagents (execution).

## Architecture

```
User Request
     ↓
┌────────────────────────────────────┐
│  claude-orchestrator.sh            │
│  (Intelligent Routing Layer)       │
└──────────┬─────────────────────────┘
           │
    ┌──────┴──────┬──────────────┬──────────────┐
    ▼             ▼              ▼              ▼
┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Claude  │  │Subagents │  │  Notion  │  │ gc-mcp   │
│ Remote  │  │(explore, │  │  Sync    │  │ Tools    │
│OpenClaw │  │task,etc) │  │          │  │          │
└─────────┘  └──────────┘  └──────────┘  └──────────┘
     │             │              │              │
     ▼             ▼              ▼              ▼
Strategic      Execution     Context         Tool
Decisions      Tasks         Storage         Dispatch
```

## Components

### 1. claude-orchestrator.sh
**Location:** `~/claude-orchestrator.sh`

**Purpose:** Main routing logic that classifies requests and delegates to appropriate handlers.

**Routing Rules:**

| Pattern | Route | Examples |
|---|---|---|
| `what\|how\|why\|should\|recommend\|explain` | **Claude Remote** | "What's the best GPU strategy?", "Should we migrate to CUDA-Q?" |
| `official\|public\|strategic\|outreach` | **Claude Remote** | "Draft announcement for new API", "Strategic roadmap for Q2" |
| `run\|execute\|deploy\|test\|build` | **Subagent** | "Run integration tests", "Deploy to production" |
| `check\|verify\|create\|modify\|git\|docker` | **Subagent** | "Check gateway logs", "Create new endpoint" |
| `offload\|save.*context\|notion` | **Notion Sync** | "Save session to Notion", "Offload current context" |

**Usage:**
```bash
# Direct command
~/claude-orchestrator.sh "Should we implement caching for the gateway?"

# Via alias (after sourcing claude-aliases.sh)
orchestrate "What's our GPU memory optimization strategy?"
ask-claude "How should we handle API rate limiting?"

# View routing statistics
~/claude-orchestrator.sh stats

# Test routing scenarios
~/claude-orchestrator.sh test
```

### 2. claude-remote.sh
**Location:** `~/claude-remote.sh`

**Purpose:** Low-level Claude API interface. Routes to specific claw endpoints.

**Endpoints:**
- `openclaw` - Primary Claude endpoint
- `kimiclaw` - Kimi Claude endpoint
- `nemoclaw` - Nemo Claude endpoint

**Usage:**
```bash
# Direct call to specific claw
~/claude-remote.sh openclaw "Analyze our architecture"

# Broadcast to all claws
~/claude-remote.sh broadcast "New feature announcement"

# List available claws
~/claude-remote.sh list
```

### 3. notion-context-sync.sh
**Location:** `~/claude-plugins/notion-context-sync.sh`

**Purpose:** Sync Claude conversation context to Notion soul-capsule database via gc-mcp.

**Features:**
- Capture context locally
- Sync to Notion via `offload_to_notion` MCP tool
- Track sync history
- Integrate with VRAM orchestration (Hamiltonian)

**Usage:**
```bash
# Quick sync
~/claude-plugins/notion-context-sync.sh quick "Discussed GPU orchestration strategies"

# Capture and sync separately
~/claude-plugins/notion-context-sync.sh capture session-123 "Architecture notes" 0.7
~/claude-plugins/notion-context-sync.sh sync ~/.config/claude-orchestrator/context/session-123.json

# List captured contexts
~/claude-plugins/notion-context-sync.sh list

# View sync log
~/claude-plugins/notion-context-sync.sh log
```

### 4. claude-aliases.sh
**Location:** `~/claude-aliases.sh`

**Purpose:** Convenient bash aliases for all orchestration commands.

**Setup:**
```bash
# Add to ~/.bashrc for persistent loading
echo 'source ~/claude-aliases.sh' >> ~/.bashrc
source ~/.bashrc

# Or source manually in current session
source ~/claude-aliases.sh
```

**Available Aliases:**

| Alias | Command | Purpose |
|---|---|---|
| `orchestrate` | `claude-orchestrator.sh` | Intelligent routing |
| `ask-claude` | `claude-orchestrator.sh` | Same as orchestrate |
| `claude-route` | `claude-orchestrator.sh` | Same as orchestrate |
| `claude` | `claude-remote claude` | Direct OpenClaw call |
| `openclaw` | `claude-remote openclaw` | OpenClaw endpoint |
| `kimiclaw` | `claude-remote kimiclaw` | KimiClaw endpoint |
| `nemoclaw` | `claude-remote nemoclaw` | NemoClaw endpoint |
| `claude-broadcast` | `claude-remote broadcast` | Broadcast to all |
| `claws` | `claude-remote list` | List endpoints |
| `notion-sync` | `notion-context-sync.sh` | Notion sync tool |
| `save-context` | `notion-context-sync.sh quick` | Quick context save |

## Integration with gc-mcp

The orchestrator integrates with the gc-mcp MCP server deployed at:
- `https://api.optimizationinversion.com/mcp`
- `https://gc-api.genesisconductor.io/mcp`
- `https://gc-mcp.iholt.workers.dev/mcp`

**MCP Tools Used:**
1. `offload_to_notion` - Sync context to Notion soul-capsule DB
2. `submit_opus_task` - Dispatch to Claude Opus
3. `submit_hybrid_task` - Dispatch to Codex hybrid workflow
4. `propagate_to_claws` - Fan-out to Slack, Telegram, Claws

**Environment Variables:**
```bash
# Set in ~/.env (loaded via ~/load-env.sh)
export GC_MCP_URL="https://api.optimizationinversion.com/mcp"
export GC_NOTION_BRIDGE_URL="https://notion-bridge.iholt.workers.dev"
export GC_SOUL_CAPSULE_DB_ID="21e416066ef1411084d1bbaf67af79d1"
```

## Orchestration Workflow

### Example 1: Strategic Decision
```bash
# User asks strategic question
orchestrate "Should we implement GPU memory pooling for the gateway?"

# Flow:
# 1. Orchestrator classifies as "strategic" (contains "should")
# 2. Routes to Claude Remote (openclaw)
# 3. Claude analyzes architecture, recommends approach
# 4. Returns decision with reasoning
# 5. Logs: routing.log records "CLAUDE | Should we implement..."
```

### Example 2: Execution Task
```bash
# User requests execution
orchestrate "Run integration tests for the diamond-gateway"

# Flow:
# 1. Orchestrator classifies as "execution" (starts with "run")
# 2. Routes to subagent (task agent)
# 3. Logs: routing.log records "SUBAGENT:task | Run integration..."
# 4. Returns delegation instructions for MCP or Copilot
# 5. Subagent executes: pytest /opt/diamond-gateway/tests/
```

### Example 3: Context Offload
```bash
# User wants to save context
orchestrate "Save this session context to Notion soul-capsule"

# Flow:
# 1. Orchestrator classifies as "notion" (contains "notion")
# 2. Routes to Notion sync handler
# 3. Calls notion-context-sync.sh
# 4. Creates JSON payload with session context
# 5. POSTs to gc-mcp offload_to_notion tool
# 6. Notion page created in database 21e416066ef1411084d1bbaf67af79d1
# 7. Logs: notion-sync.log records sync result
```

### Example 4: Broadcast Communication
```bash
# Official announcement
claude-broadcast "New GPU orchestration API v2 launched with 40% cost reduction"

# Flow:
# 1. Broadcasts to openclaw, kimiclaw, nemoclaw
# 2. Each claw receives identical payload
# 3. Can trigger downstream notifications (Slack, Telegram)
# 4. History logged in ~/.config/claude-remote/history/
```

## Routing Decision Logic

The orchestrator uses regex pattern matching to classify requests:

**Claude Patterns (Strategic):**
- Questions: `^(what|how|why|when|should|would|can I|is it)`
- Strategic: `recommend.*approach`, `explain.*architecture`, `high.level.*plan`
- Communication: `official.*announcement`, `public.*statement`, `outreach`

**Subagent Patterns (Execution):**
- Actions: `^(run|execute|deploy|install|build|test)`
- Verification: `^(check|verify|validate|measure)`
- Operations: `^(create|modify|edit|update|delete)`
- CLI tools: `git.*(commit|push)`, `docker.*(build|run)`, `npm.*(install|test)`

**Notion Patterns (Context Sync):**
- Keywords: `offload`, `save.*context`, `notion.*page`, `soul.capsule`

**Default:** If ambiguous, route to Claude (safe default for high-level guidance).

## File Locations

```
~/
├── claude-orchestrator.sh          # Main orchestrator
├── claude-remote.sh                # Low-level claw interface
├── claude-aliases.sh               # Bash aliases
├── load-env.sh                     # Environment loader
├── claude-plugins/
│   └── notion-context-sync.sh     # Notion sync tool
└── .config/
    └── claude-orchestrator/
        ├── routing-rules.json      # Routing patterns (auto-generated)
        ├── routing.log             # Routing decisions log
        ├── notion-sync.log         # Notion sync log
        └── context/                # Captured contexts
            ├── session-001.json
            └── session-002.json
```

## Configuration Files

### routing-rules.json
**Location:** `~/.config/claude-orchestrator/routing-rules.json`

Auto-generated on first run. Customize patterns here:

```json
{
  "claude_patterns": [
    "^(what|how|why|when|should|would|can I|is it)",
    "official.*announcement",
    "public.*statement",
    "strategic.*decision"
  ],
  "subagent_patterns": [
    "^(run|execute|deploy|install|build|test)",
    "git.*(commit|push|pull)"
  ],
  "notion_sync_patterns": [
    "offload",
    "save.*context",
    "notion.*page"
  ]
}
```

## Testing

### Run Test Scenarios
```bash
~/claude-orchestrator.sh test
```

**Output:**
```
[orchestrator] Running test scenarios...
[orchestrator] Analyzing request: What's the best architecture for GPU orchestration?...
✓ Decision: Claude Remote (strategic/high-level)
[claude-remote] Sending to openclaw...

[orchestrator] Analyzing request: Run pytest on the gateway tests...
✓ Decision: Subagent (execution)
[orchestrator] Delegating to task subagent

[orchestrator] Analyzing request: Save this session context to Notion...
✓ Decision: Notion sync
[notion-sync] Syncing session claude-session-1234567890 to Notion via gc-mcp...
```

### Check Routing Statistics
```bash
~/claude-orchestrator.sh stats
```

**Output:**
```
[orchestrator] Routing Statistics:

Total requests: 47
Claude routes:  23
Subagent routes: 18
Notion routes:  6

Recent routing decisions:
  2025-01-XX 14:23:45 | CLAUDE | Should we implement caching?
  2025-01-XX 14:25:12 | SUBAGENT:task | Run integration tests
  2025-01-XX 14:30:00 | NOTION | Save session to Notion
```

## Security Considerations

1. **API Keys:** Never hardcode keys. Use `~/.env` loaded via `load-env.sh`
2. **Routing Logs:** May contain sensitive prompts. Located in `~/.config/claude-orchestrator/`
3. **Context Files:** Session contexts stored locally. Review before syncing to Notion
4. **MCP Authentication:** Use `GC_MCP_INGRESS_AUTH` for production deployments

## Production Deployment

### 1. Set Environment Variables
```bash
# Add to ~/.env
cat >> ~/.env << 'EOF'
# Claude Orchestration
CLAW_BASE_URL="https://gc-mcp.iholt.workers.dev/claw"
GC_MCP_URL="https://api.optimizationinversion.com/mcp"
GC_NOTION_BRIDGE_URL="https://notion-bridge.iholt.workers.dev"
GC_SOUL_CAPSULE_DB_ID="21e416066ef1411084d1bbaf67af79d1"
EOF

# Load environment
source ~/load-env.sh
```

### 2. Enable Aliases
```bash
# Add to ~/.bashrc
echo 'source ~/claude-aliases.sh' >> ~/.bashrc
source ~/.bashrc
```

### 3. Verify Setup
```bash
# Test orchestrator
orchestrate "What's the status of GPU resources?"

# Test Claude Remote
claude "Analyze the diamond-gateway architecture"

# Test Notion sync
notion-sync quick "Test context sync"

# Check stats
orchestrate stats
```

## Usage Examples

### Strategic Planning
```bash
ask-claude "What's the optimal GPU memory strategy for our workload?"
ask-claude "Should we migrate from Ising Hamiltonian to neural network scheduling?"
ask-claude "How do we scale to 100 concurrent YOLO11 inference requests?"
```

### Execution Tasks
```bash
orchestrate "Run pytest with coverage on diamond-gateway"
orchestrate "Deploy the notion-bridge worker to production"
orchestrate "Check systemd logs for diamond-gateway errors"
```

### Official Communications
```bash
claude-broadcast "Q2 roadmap: GPU orchestration 2.0 with 50% cost reduction"
claude "Draft announcement for new Quantum QAOA API endpoint"
```

### Context Management
```bash
save-context "Completed GPU orchestration architecture review"
notion-sync capture session-arch-review "Reviewed CUDA-Q integration" 0.8
notion-sync log  # View sync history
```

## Troubleshooting

### Orchestrator not routing correctly
```bash
# Check routing rules
cat ~/.config/claude-orchestrator/routing-rules.json

# View recent decisions
tail -f ~/.config/claude-orchestrator/routing.log
```

### Claude Remote connection issues
```bash
# Verify environment
source ~/load-env.sh
echo $CLAW_BASE_URL

# Test connectivity
curl -s https://gc-mcp.iholt.workers.dev/claw/openclaw | jq .
```

### Notion sync failures
```bash
# Check MCP endpoint
curl -X POST https://api.optimizationinversion.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Verify environment
echo $GC_NOTION_BRIDGE_URL
echo $GC_SOUL_CAPSULE_DB_ID

# View sync log
notion-sync log
```

## Next Steps

### Integration Enhancements
1. **Streaming Responses:** Add WebSocket support for real-time Claude output
2. **Multi-Agent Coordination:** Use Claude Managed Agents for complex workflows
3. **Cost Tracking:** Monitor API usage per routing decision
4. **Observability:** Integrate with AppSignal for orchestration metrics

### Workflow Automation
1. **Git Hooks:** Auto-sync context on commit
2. **CI/CD Integration:** Route deployment decisions through Claude
3. **Scheduled Tasks:** Periodic strategic reviews via cron + orchestrator

### UI Development
1. **Web Dashboard:** Visualize routing statistics
2. **Chat Interface:** FastAPI + WebSocket for interactive orchestration
3. **Mobile App:** React Native client for on-the-go strategic decisions

## References

- **Claude API Docs:** https://docs.anthropic.com/
- **gc-mcp MCP Server:** `~/gc-workers/AGENTS.md`
- **Diamond Gateway:** `/opt/diamond-gateway/gateway.py`
- **Notion Bridge:** `~/genesis/notion-bridge/`
- **Unified Inference:** `~/UNIFIED_INFERENCE_ARCHITECTURE.md`

---

**Status:** ✅ Claude Orchestration System Configured

**Configured by:** GitHub Copilot CLI  
**Date:** 2025-01-XX  
**Version:** 1.0.0
