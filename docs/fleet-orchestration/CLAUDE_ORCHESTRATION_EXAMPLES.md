# Claude Orchestration - Real-World Usage Examples

## Scenario 1: Architecture Decision

**User:** "Should we implement GPU memory pooling or continue with per-request allocation?"

**Orchestrator Decision:** Routes to **Claude Remote** (strategic question)

**Flow:**
```bash
$ orchestrate "Should we implement GPU memory pooling or continue with per-request allocation?"

[orchestrator] Analyzing request...
✓ Decision: Claude Remote (strategic/high-level)
[orchestrator] Routing to Claude Remote (OpenClaw)...
[claude-remote] Sending to openclaw...

# Claude analyzes:
# - Current VRAM usage patterns
# - Cost implications
# - Latency trade-offs
# - Implementation complexity

# Returns strategic recommendation with reasoning
```

**Expected Output:** Strategic analysis with pros/cons, recommendation, and implementation approach.

---

## Scenario 2: Integration Testing

**User:** "Run integration tests for diamond-gateway with mock VRAM overflow"

**Orchestrator Decision:** Routes to **Subagent** (execution task)

**Flow:**
```bash
$ orchestrate "Run integration tests for diamond-gateway with mock VRAM overflow"

[orchestrator] Analyzing request...
✓ Decision: Subagent (execution)
[orchestrator] Routing to subagent (task) for execution...
✓ Delegating to task subagent

# Subagent executes:
# 1. cd /opt/diamond-gateway
# 2. pytest tests/test_integration.py -k "mock_vram"
# 3. Returns test results with coverage
```

**Expected Output:** Test results, pass/fail status, coverage metrics.

---

## Scenario 3: Session Context Offload

**User:** "Save the current GPU orchestration discussion to Notion soul-capsule"

**Orchestrator Decision:** Routes to **Notion Sync** (context storage)

**Flow:**
```bash
$ save-context "GPU orchestration architecture review - CUDA-Q integration strategy"

[orchestrator] Analyzing request...
✓ Decision: Notion sync
[notion-sync] Capturing current session context...
[notion-sync] Syncing session claude-session-1778759400 to Notion via gc-mcp...

{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "success": true,
    "page_id": "36098ee3-e91e-8180-a008-f606688959f3",
    "session_id": "claude-session-1778759400"
  }
}

✓ Context synced to Notion soul-capsule
```

**Expected Output:** Notion page created with session metadata, context summary, and timestamp.

---

## Scenario 4: Public Announcement

**User:** "Draft a blog post announcing our new GPU orchestration API with CUDA-Q integration"

**Orchestrator Decision:** Routes to **Claude Remote** (official communication)

**Flow:**
```bash
$ ask-claude "Draft a blog post announcing our new GPU orchestration API with CUDA-Q integration"

[orchestrator] Analyzing request...
✓ Decision: Claude Remote (strategic/high-level)
[orchestrator] Routing to Claude Remote (OpenClaw)...

# Claude generates:
# - Compelling headline
# - Feature highlights
# - Technical benefits
# - Call-to-action
# - SEO-optimized content
```

**Expected Output:** Professional blog post draft with marketing and technical content.

---

## Scenario 5: Production Deployment

**User:** "Deploy the updated notion-bridge worker to production with zero downtime"

**Orchestrator Decision:** Routes to **Subagent** (deployment task)

**Flow:**
```bash
$ orchestrate "Deploy the updated notion-bridge worker to production with zero downtime"

[orchestrator] Analyzing request...
✓ Decision: Subagent (execution)
[orchestrator] Routing to subagent (general-purpose) for execution...

# Subagent executes:
# 1. cd ~/genesis/notion-bridge
# 2. git pull origin main
# 3. npm install
# 4. npx wrangler deploy --env production
# 5. Verify health check
# 6. Monitor for errors
```

**Expected Output:** Deployment status, worker URL, health check results.

---

## Scenario 6: Broadcast to All Claws

**User:** "Announce that GPU orchestration 2.0 is live with 40% cost reduction"

**Flow:**
```bash
$ claude-broadcast "GPU orchestration 2.0 is now live with 40% cost reduction and CUDA-Q integration"

[claude-remote] Broadcasting to openclaw...
✓ Sent to openclaw

[claude-remote] Broadcasting to kimiclaw...
✓ Sent to kimiclaw

[claude-remote] Broadcasting to nemoclaw...
✓ Sent to nemoclaw

# Each claw:
# - Receives announcement
# - Can trigger downstream notifications (Slack, Telegram)
# - Logs in history
```

**Expected Output:** Confirmation of broadcast to all claw endpoints.

---

## Scenario 7: Mixed Strategy + Execution

**User:** "What's the best testing strategy for the gateway, then run those tests"

**Orchestrator Workflow:**

**Step 1:** Strategic question → Claude
```bash
$ ask-claude "What's the best testing strategy for the diamond-gateway?"

# Claude recommends:
# 1. Unit tests with pytest
# 2. Integration tests with mock VRAM
# 3. Load tests with locust
# 4. Security tests with bandit
```

**Step 2:** Execute recommended tests → Subagent
```bash
$ orchestrate "Run pytest unit tests on diamond-gateway"
$ orchestrate "Run integration tests with mock VRAM overflow"
$ orchestrate "Run locust load test with 100 concurrent users"
```

**Result:** Strategic guidance followed by automated execution.

---

## Scenario 8: Context Capture During Architecture Review

**Real-time flow:**

```bash
# Start architecture review
$ ask-claude "Analyze our current GPU memory orchestration approach"

# Claude analyzes and provides insights
# ... discussion continues ...

# Capture key decisions
$ save-context "Architecture review 2026-05-14: Decided to implement GPU memory pooling with LRU eviction. Target: 30% VRAM savings. Priority: Q2 roadmap."

# Result: Context persisted in Notion for future reference
```

---

## Scenario 9: Routing Statistics Analysis

**User:** "Show me orchestration routing patterns from the past week"

**Flow:**
```bash
$ orchestrate stats

[orchestrator] Routing Statistics:

Total requests: 47
Claude routes:  23 (49%)  # Strategic decisions
Subagent routes: 18 (38%)  # Execution tasks
Notion routes:  6 (13%)   # Context storage

Top patterns:
  "what" → Claude (12 times)
  "run" → Subagent (8 times)
  "save" → Notion (5 times)

Recent routing decisions:
  2026-05-14T11:48:23+00:00 | CLAUDE | What's the best architecture?
  2026-05-14T11:48:23+00:00 | SUBAGENT:task | Run pytest tests
  2026-05-14T11:48:23+00:00 | NOTION | Save session context
```

---

## Scenario 10: Emergency Response

**User:** "Check if diamond-gateway is responding and restart if needed"

**Orchestrator Decision:** Routes to **Subagent** (verification + action)

**Flow:**
```bash
$ orchestrate "Check if diamond-gateway is responding and restart if needed"

[orchestrator] Routing to subagent (task) for execution...

# Subagent executes:
# 1. curl http://localhost:8000/health
# 2. Check response code
# 3. If failed: sudo systemctl restart diamond-gateway
# 4. Verify recovery with health check
# 5. Check logs for errors
```

**Expected Output:** Health status, restart action (if needed), verification results.

---

## Best Practices

### When to Use Claude (Strategic)
- Architecture decisions
- Trade-off analysis
- Official communications
- High-level planning
- Recommendations
- Complex analysis

### When to Use Subagents (Execution)
- Code execution
- Testing and validation
- Deployment operations
- File operations
- System checks
- Build processes

### When to Use Notion Sync (Context)
- Session summaries
- Architecture decisions
- Strategic discussions
- Important milestones
- Research findings
- Meeting notes

---

## Tips for Effective Orchestration

### 1. Be Specific
❌ "Do something with the gateway"
✅ "Run integration tests for diamond-gateway with coverage"

### 2. Use Natural Language
✅ "What's the optimal GPU strategy?"
✅ "Should we implement caching?"
✅ "Run pytest on the gateway"

### 3. Save Important Context
```bash
# After key decisions
save-context "Decided on GPU pooling strategy: LRU eviction, 30% savings target"
```

### 4. Check Statistics Regularly
```bash
# Weekly pattern analysis
orchestrate stats
```

### 5. Use Broadcast for Announcements
```bash
# Important updates
claude-broadcast "New API endpoint deployed: /v2/orchestrate"
```

---

## Troubleshooting Examples

### Wrong Routing?
```bash
# Check routing log
tail -f ~/.config/claude-orchestrator/routing.log

# Verify pattern match
echo "Run tests" | grep -E "^(run|execute)"
```

### Notion Sync Failed?
```bash
# Check sync log
notion-sync log

# Verify MCP connectivity
curl -X POST https://api.optimizationinversion.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

### Claude Not Responding?
```bash
# Check claw endpoints
claude-remote list

# Test direct call
claude "test prompt"
```

---

**For more examples and detailed documentation:**
- Full Setup: `~/CLAUDE_ORCHESTRATION_SETUP.md`
- Quick Reference: `~/CLAUDE_ORCHESTRATION_QUICKREF.md`
- Completion Report: `~/CLAUDE_ORCHESTRATION_COMPLETE.md`
