# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Two-Layer Design

1. **TypeScript Cloudflare Worker** (`src/`, `wrangler.toml`) — `gc-diamond-node`, routed at `dn.genesisconductor.io`. Ed25519 identity layer (key-id `dn-2026-05`), signed audit event ring buffer, and UQ attestation endpoints.
2. **Python QUBO simulation** (`scripts/`) — CUDA-Q QAOA mycelial hyphal-network optimizer running locally on the GTX 1650.

The two layers share no code; they meet through signed audit events and the Genesis Conductor mesh (see `~/AGENTS.md` and root `~/CLAUDE.md` for the ecosystem-level flow).

## Environment

All CUDA-Q and numpy work must use the dedicated venv — system Python lacks `cudaq`, `numpy`, `cupy`, `scipy`, `jax`:

```
/home/diamondnode/venv312/bin/python
```

Key venv packages: `cudaq 0.14.2`, `numpy 2.4.4`, `cupy-cuda13x`, `jax/jaxlib 0.10.0`, `scipy 1.17.1`.

Hardware: NVIDIA GTX 1650, 4 GB VRAM. Thermal threshold 89.6 °C (see `bench_gpu_telemetry`).

Ollama is at `/usr/local/bin/ollama` with `llama3.2:3b` (2 GB) loaded.

Path overrides via env vars: `DIAMOND_STATE_DIR`, `DIAMOND_LOG_DIR`, `DIAMOND_VENV`.

## Commands

**TypeScript worker:**
```bash
npm run typecheck            # tsc --noEmit
npm test                     # vitest run
npx vitest run test/health.test.ts   # single test file
npm run deploy:dry           # wrangler deploy --dry-run
npm run deploy               # wrangler deploy (live at dn.genesisconductor.io)
npm run gen-identity         # one-time Ed25519 keypair → wrangler secret put
```

Worker secrets are bound via `wrangler secret put` (`DIAMOND_NODE_ED25519_PRIV`/`_PUB`, `DIAMOND_VAULT_AUDIT_URL`, `APPSIGNAL_KEY`) — never committed.

**Python simulation:**
```bash
# One QUBO iteration
/home/diamondnode/venv312/bin/python scripts/mycelial_qubo.py [--shots 512] [--outer-rounds 3] [--json]

# Benchmark suite (report saved to reports/)
/home/diamondnode/venv312/bin/python scripts/benchmark.py [--suite all|qubo|llm|gpu|cudaq] [--json]

# Daily health check (GPU telemetry + ollama status)
/home/diamondnode/venv312/bin/python scripts/daily_health.py

# LLM interpretation of network state (appends logs/llm-interpretations.jsonl)
/home/diamondnode/venv312/bin/python scripts/llm_interpret.py

# CUDA-Q smoke test (256-shot Bell circuit on qpp-cpu)
/home/diamondnode/venv312/bin/python scripts/_cudaq_probe.py
```

Ops helpers live in `diamondnode-ops/` (`status.sh`, `gpu_watch.sh`, `run_bench.sh`, `cleanup.sh`).

## Architecture

### Worker layer — `src/index.ts`

Currently dispatched routes:
- `GET /healthz` (or `/health`) — `{ok, version, identity_pubkey, ts}`
- `GET /audit/replay?n=N` — last N signed events from the in-memory ring buffer (`audit.ts`)
- `GET /.well-known/diamond-node.json` — identity manifest, includes latest power-tower decision + radix claims
- `POST /uq/power_tower` — v0.3 power-tower arbitration (promote/veto via `guardian_r` threshold), result signed and appended to audit
- `POST /uq/radix_claims` — signs RadixAttention claims from gc-dynamic-uq-service (requires priv key)

Every mutating route follows the same pattern: build event via `makeEvent`, Ed25519-sign via `signEvent` (falls back to `"unsigned-dev"` without the priv key), `appendAudit`. AppSignal tracking wraps all requests when `APPSIGNAL_KEY` is set.

**Known drift:** `notion.ts`, `seo-routes.ts`, `botid.ts`, `landing-html.ts`, and `yennefer-dashboard.ts` exist in `src/` but are NOT wired into the `index.ts` dispatch — the README endpoint table (`/notion/*`, BotID protection) describes a fuller routing that is not currently live. Check `index.ts` before trusting README endpoint docs.

### Core simulation — `mycelial_qubo.py`

Models fungal hyphal-network growth as a QUBO over edge variables on a 16-node 4×4 grid. The QUBO diagonal encodes three competing terms: distance penalty (`lam_dist=0.4`), redundancy reward for already-active edges (`lam_redund=-0.2`), and resource-proximity reward for edges incident to resource nodes 0 and 15 (`lam_resource=-0.8`).

Solving is split into subspaces of 10 edges each. Each subspace is solved by a 1-layer QAOA circuit via `cudaq.sample` (gamma=0.3, beta=0.2). Subspace assignments are stitched back into the global edge vector, and the best global assignment is kept across `outer_rounds`.

**Double-loopback resilience**:
- *Inner loopback*: if `cudaq.sample` raises, retries once; falls back to random assignment on second failure.
- *Outer loopback*: whenever a candidate energy beats `state.best_energy`, state is checkpointed to `state/mycelial_checkpoint.json`. This checkpoint is the recovery target if outer rounds diverge.

**State persistence**: `MycelialState` (dataclass) is serialised to `state/mycelial_state.json` after every iteration and to `state/mycelial_checkpoint.json` on any new best energy. The state carries `active_edges`, `energy_history`, `best_energy`/`best_edges`, node positions, and a full `run_log`. Note: `state/mycelial_state.json` and `logs/llm-interpretations.jsonl` churn on every run — do not commit them incidentally with unrelated changes.

**Benchmark runner — `benchmark.py`**: five benchmarks (`gpu_telemetry`, `cudaq_probe`, `qubo_iteration`, `state_persistence`, `llm_latency`) each return a uniform dict `{name, passed, duration_s, value?, unit?, threshold?, notes}`. Results saved as JSON to `reports/benchmark-<UTC timestamp>.json`. Exit code 0 only when all selected benchmarks pass.

**LLM interpretation — `llm_interpret.py`**: reads `state/mycelial_state.json`, builds a one-sentence summary, sends it to `ollama run llama3.2:3b` for a 3–4 sentence assessment + one parameter-change recommendation. Appended as JSONL to `logs/llm-interpretations.jsonl`.

### Goal Conductor control plane — `goal-conductor/`

Diamondnode's economics/dispatch control plane (bootstrap 2026-06-10, evt-diamondnode-qubo-first-prompt):
- `goal_conductor_live_artifact.yaml` — canonical G1–G5 goal vectors, plane topology (hermes/openclaw/gc-mcp/arbiter/kimiclaw/nemoclaw), model routing matrix
- `budget_policy.yaml` — daily $25/$50 and monthly $500/$1000 soft/hard caps; Haiku per-task caps
- `openclaw_dispatch_policy.yaml` — task-class → model routing table with arbiter VRAM/thermal gates
- `hermes_openclaw_bridge.yaml` — ingress→dispatch design (design-only, not deployed)
- `utilization_ledger.jsonl`, `decision_log.jsonl`, `session_registry.jsonl` — append-only records; every material decision gets a `DL-xxx` entry with a verification status

Honesty rule carried by all goal-conductor artifacts: VPD/value numbers are heuristic until a named-baseline report exists at `goal-conductor/reports/value_per_dollar_benchmark.md`; never emit fabricated benchmark figures.

### Skills — `skills/`

`skills/diamondnode-qubo-economics-strategist/` — QUBO/knapsack skill-portfolio selector (Step 3 of the goal-conductor first-prompt). Symlinked into `~/.claude/skills/` for CLI loading; registered in `.claude-plugin/marketplace.json`. Run:

```bash
/home/diamondnode/venv312/bin/python skills/diamondnode-qubo-economics-strategist/select_portfolio.py \
  --task "<task>" --goals G1 G4 --budget 1.00 [--emit-evt]
```

`--emit-evt` appends the result to `goal-conductor/utilization_ledger.jsonl`. Tune heuristic value/cost scores in `skill_value_manifest.yaml` (unlisted skills default to value 1.0 and are flagged `unscored`).

### Other notable pieces

- `scripts/waveform_equilibrium.py` + `test/waveform_equilibrium_test.py` — waveform equilibrium at eigenvector planes (GTX 1650-optimized); Python test exists outside vitest.
- `genomes/` — IQG (Invariant Quantization Genome) v0.1/v0.2 specs; the `/uq/*` worker routes implement the v0.3 dynamic-UQ extension.
- `unified_inference/optimizer.py` — power-tower QUBO arbitration module shared with the worker's `/uq/power_tower` semantics.
- `mcp-config.json` + `mcp-verify-fleet.sh` — MCP exposure of diamondnode capabilities.

**Arena integration cross-ref (gc-arena-controller + OFFLOAD):** High-value Ouroboros matches (from gc-arena-controller 5-phase FSM on shared D1) can participate in the H(s) > 8.5 OFFLOAD → notion-bridge soul-capsule (DB 21e41606...) → diamondvault → gc-mcp propagation story via the live `/v1/arena/matches/:id/offload` (or future gc-mcp-beta arena tools). See top ~/AGENTS.md "Arena + Conductor Soul-Capsule Integration", gc-arena-controller/README.md, and Task 4. Arena matches provide richer context (phase history, strategy, bench_trace, demand_score) than raw VRAM telemetry.
