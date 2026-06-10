# Daily Ops-Newsletter Workflow (evt-diamondnode-daily-ops)

Canonical procedure for the recurring Diamondnode operations workflow. Triggered:
- **Daily** via Claude Code durable cron (registered from the operator session), or
- **On major/impacting change** — operator (or agent) runs the same prompt manually after
  deploys, security fixes, control-plane changes, or anything appending a `DL-xxx` decision.

## Steps (execute in order)

### 1. Assess all movement since last run
```bash
bash ~/diamond-node/goal-conductor/assess_activity.sh
```
Collect: cross-repo git activity, new utilization-ledger entries, new decisions,
live health sweep (gateway, dn worker, gc-news, diamondvault, unified-inference), GPU state.

### 2. Run the QUBO economics strategist
```bash
~/venv312/bin/python ~/diamond-node/skills/diamondnode-qubo-economics-strategist/select_portfolio.py \
  --task "<today's dominant task from step 1>" --goals G1 G4 --budget 1.00 --emit-evt
```

### 3. Take the advised action + delegate
- Act on the selected portfolio: for each actionable finding from step 1, dispatch per
  `openclaw_dispatch_policy.yaml` (queue_triage→haiku-class, implementation→sonnet-class,
  strategy/security→opus-class, telemetry→local Ollama within arbiter VRAM/thermal gate).
- Server-capable operations available for delegation: local venv312 Python, npm/wrangler
  deploys (dry-run first), CF Workers (dn, gc-news, gc-mcp fleet), Notion MCP, gh CLI,
  Ollama local models, gc-mcp-beta KV memory.
- Respect budget_policy.yaml caps. Log every dispatch as a ledger entry.

### 4. Write the newsletter
Company-update style, honest, concise: what shipped, what moved, health status,
QUBO portfolio result (marked heuristic), blockers, what's next. No fabricated
metrics; no external "unrivalled" claims (see VPD report value_basis).

### 5. Publish to news.genesisconductor.io
```bash
source ~/load-env.sh   # provides NEWS_PUBLISH_SECRET
curl -s -X POST https://news.genesisconductor.io/api/publish \
  -H "Authorization: Bearer $NEWS_PUBLISH_SECRET" -H "Content-Type: application/json" \
  -d '{"title":"...","evt_id":"EVT-DIAMONDNODE-DAILY-<date>","md":"..."}'
```

### 6. Close the loop
```bash
bash ~/diamond-node/goal-conductor/assess_activity.sh --mark   # update run marker
```
Append a ledger entry (record_type `daily_ops_workflow`) + decision-log entry if any
material decision was taken. Commit goal-conductor changes on the working branch.

## Safety gates
- No live deploy without dry-run + DL entry. No secrets in newsletter or logs.
- Newsletter is public: include only information already public in the GitHub repos
  or explicitly cleared; never internal credentials, costs beyond aggregates, or
  unreleased security details (vulnerabilities get a "fixed" mention only after the fix ships).
