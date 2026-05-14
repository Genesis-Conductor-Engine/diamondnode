# Claude Orchestration - Quick Reference

## One-Line Commands

```bash
# Strategic Questions → Claude
orchestrate "What's the best GPU memory strategy?"
ask-claude "Should we implement caching in the gateway?"

# Execution Tasks → Subagents
orchestrate "Run integration tests for diamond-gateway"
orchestrate "Deploy notion-bridge to production"

# Context Sync → Notion
save-context "Completed GPU orchestration review"
notion-sync quick "Architecture discussion summary"

# Direct Claude Access
claude "Analyze the unified inference architecture"
openclaw "Draft API documentation for v2 endpoint"

# Broadcast to All Claws
claude-broadcast "New release: GPU orchestration 2.0"

# Statistics & Monitoring
orchestrate stats           # View routing statistics
notion-sync log            # View Notion sync log
claws                      # List available claws
```

## Routing Logic at a Glance

| Request Pattern | Routed To | Example |
|---|---|---|
| `what\|how\|why\|should` | **Claude** | "What's the optimal strategy?" |
| `recommend\|explain\|strategic` | **Claude** | "Recommend GPU orchestration approach" |
| `run\|execute\|deploy\|test` | **Subagent** | "Run pytest on gateway" |
| `check\|verify\|create\|git` | **Subagent** | "Check systemd logs" |
| `offload\|notion\|save.*context` | **Notion** | "Save session to Notion" |

## Key Files

```
~/claude-orchestrator.sh           # Main orchestrator
~/claude-remote.sh                 # Claw interface
~/claude-aliases.sh                # Bash aliases
~/claude-plugins/notion-context-sync.sh  # Notion sync
```

## Setup

```bash
# Load aliases
source ~/claude-aliases.sh

# Verify environment
source ~/load-env.sh

# Test orchestration
orchestrate test
```

## Integration Points

- **gc-mcp:** https://api.optimizationinversion.com/mcp
- **Notion DB:** 21e416066ef1411084d1bbaf67af79d1
- **Gateway:** http://localhost:8000
- **Claws:** openclaw, kimiclaw, nemoclaw

## Usage Patterns

### High-Level Planning
```bash
ask-claude "What's our Q2 roadmap for GPU optimization?"
ask-claude "How should we handle API versioning?"
```

### Code Execution
```bash
orchestrate "Build docker image for diamond-gateway"
orchestrate "Run load tests with 1000 concurrent requests"
```

### Official Communications
```bash
claude-broadcast "Product launch: CUDA-Q integration live"
claude "Draft blog post about GPU orchestration"
```

### Session Management
```bash
save-context "Completed architecture review for VRAM pooling"
notion-sync list  # View all captured contexts
```

## Troubleshooting

```bash
# Check routing decisions
tail -f ~/.config/claude-orchestrator/routing.log

# Verify MCP connectivity
curl -X POST https://api.optimizationinversion.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Test Notion sync
notion-sync quick "Test sync"
```

---

**Full Documentation:** `~/CLAUDE_ORCHESTRATION_SETUP.md`
