# diamond-node

Genesis Conductor audit-node — QUBO simulation engine + Cloudflare Worker identity layer.

**Live:** https://dn.genesisconductor.io  
**Package:** `@genesis-conductor/diamond-node`  
**Identity:** Ed25519, key-id `dn-2026-05`, pubkey at [`/.well-known/diamond-node.json`](https://dn.genesisconductor.io/.well-known/diamond-node.json)

## What it does

- Runs a mycelial hyphal-network growth optimizer on a GTX 1650 using CUDA-Q QAOA
- Exposes a signed audit event stream to the Genesis Conductor mesh
- Serves as the `diamond-node` row in the [GC 7-Agent Topology](https://www.notion.so/33e98ee3e91e81ebac98fa48b7874283)

## Endpoints

| Path | Description | Bot Protection |
|---|---|---|
| `GET /healthz` | `{ok, version, identity_pubkey, ts}` | Basic |
| `GET /.well-known/diamond-node.json` | Identity manifest | None |
| `GET /audit/replay?n=N` | Last N signed events (ring buffer) | Deep |
| `GET /notion/health` | Notion proxy health check | Basic |
| `POST /notion/offload` | Offload context to Notion | Deep |
| `POST /notion/embed` | Embed text via Notion | Deep |
| `POST /notion/query` | Query Notion database | Deep |
| `POST /notion/search` | Search Notion pages | Deep |

**Bot Protection:** Powered by [BotID](https://vercel.com/docs/botid). Verified bots (Googlebot, etc.) allowed through. Unverified bots blocked with 403.

## Setup

### 1. Generate identity keypair (once, offline)

```bash
node scripts/gen-identity.mjs
```

Store output via:
```bash
wrangler secret put DIAMOND_NODE_ED25519_PRIV
wrangler secret put DIAMOND_NODE_ED25519_PUB
wrangler secret put DIAMOND_VAULT_AUDIT_URL   # optional
```

### 2. Install deps and typecheck

```bash
npm install
npm run typecheck
npm test
```

### 3. Deploy

```bash
npm run deploy:dry   # verify
npm run deploy       # ship
```

## Simulation scripts

Require `/home/diamondnode/venv312/bin/python` (not system Python).

```bash
# One QUBO iteration
/home/diamondnode/venv312/bin/python scripts/mycelial_qubo.py --shots 512 --outer-rounds 3

# Full benchmark
/home/diamondnode/venv312/bin/python scripts/benchmark.py --suite all

# LLM interpretation
/home/diamondnode/venv312/bin/python scripts/llm_interpret.py
```

## Documentation Guide

**New to Diamond Node?**
1. Start here: README.md (you are here)
2. Environment setup: [CLAUDE.md](./CLAUDE.md)
3. Deployment: [docs/setup/deployment.md](./docs/setup/deployment.md)

**Running simulations?**
1. QUBO optimization: [CLAUDE.md](./CLAUDE.md) → Architecture section
2. VRAM management: [docs/optimization/vram-strategy.md](./docs/optimization/vram-strategy.md)
3. Benchmarking: [docs/optimization/benchmarks.md](./docs/optimization/benchmarks.md)

**Preparing for automation?**
1. Automation roadmap: [docs/automation/claw-handoff.md](./docs/automation/claw-handoff.md)
2. Monitoring setup: [docs/setup/monitoring.md](./docs/setup/monitoring.md)
3. System status: [CHANGELOG.md](./CHANGELOG.md)

**Technical deep-dives?**
1. Orthogonal optimization: [docs/optimization/orthogonal-system.md](./docs/optimization/orthogonal-system.md)
2. Waveform equilibrium: [WAVEFORM_DELIVERABLES.md](./WAVEFORM_DELIVERABLES.md)
3. Historical context: [docs/archive/](./docs/archive/)

## Disambiguation

This is **not** `Diamond-V` (vault repo) and **not** `diamondvault.io` (separate domain). See `llms.txt`.
