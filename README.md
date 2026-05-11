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

| Path | Description |
|---|---|
| `GET /healthz` | `{ok, version, identity_pubkey, ts}` |
| `GET /.well-known/diamond-node.json` | Identity manifest |
| `GET /audit/replay?n=N` | Last N signed events (ring buffer) |

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

## Disambiguation

This is **not** `Diamond-V` (vault repo) and **not** `diamondvault.io` (separate domain). See `llms.txt`.
