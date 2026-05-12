# Copilot Instructions for diamond-node

Genesis Conductor audit-node — QUBO simulation engine + Cloudflare Worker identity layer

## Build, Test, and Lint

```bash
# Install dependencies
npm ci

# Type checking
npm run typecheck

# Run all tests
npm test

# Run specific test file
npx vitest run test/health.test.ts

# Deploy (dry run)
npm run deploy:dry

# Deploy to Cloudflare Workers
npm run deploy

# Generate Ed25519 identity keypair
npm run gen-identity
```

## Python Scripts

**Critical:** All CUDA-Q and numpy scripts **must** use the dedicated venv:

```bash
/home/diamondnode/venv312/bin/python
```

System Python lacks `cudaq`, `numpy`, `cupy`, `scipy`, and `jax`.

```bash
# Run one QUBO iteration
/home/diamondnode/venv312/bin/python scripts/mycelial_qubo.py [--shots 512] [--outer-rounds 3] [--json]

# Run benchmark suite
/home/diamondnode/venv312/bin/python scripts/benchmark.py [--suite all|qubo|llm|gpu|cudaq] [--json]

# Daily health check (GPU + Ollama status)
/home/diamondnode/venv312/bin/python scripts/daily_health.py

# LLM interpretation of network state
/home/diamondnode/venv312/bin/python scripts/llm_interpret.py
```

## Architecture

### Two-Layer Design

1. **TypeScript Worker Layer** (src/)
   - Cloudflare Worker serving identity and audit endpoints
   - Routes: `/healthz`, `/.well-known/diamond-node.json`, `/audit/replay`
   - Ed25519 signatures for all audit events
   - Types defined in `src/types.ts`
   - AppSignal monitoring (optional, enabled via `APPSIGNAL_KEY`)

2. **Python Simulation Layer** (scripts/)
   - CUDA-Q QAOA optimizer running on GTX 1650 (4 GB VRAM)
   - State persisted to `state/mycelial_state.json`
   - Checkpointing to `state/mycelial_checkpoint.json` on energy improvements

### Core Simulation: Mycelial QUBO

**Problem:** Models fungal hyphal-network growth as QUBO over edge variables on a 16-node 4×4 grid

**QUBO Objective:**
- `lam_dist=0.4`: Distance penalty for long edges
- `lam_redund=-0.2`: Redundancy reward for existing edges (multi-path bonus)
- `lam_resource=-0.8`: Reward for edges near resource nodes (0 and 15)

**Solving Strategy:**
- Split into subspaces of ~10 edges each
- Each subspace solved by 1-layer QAOA circuit (`cudaq.sample`)
- QAOA params: `gamma=0.3`, `beta=0.2`
- Best assignments stitched back into global edge vector

**Double-Loopback Resilience:**
- **Inner loopback:** If `cudaq.sample` fails, retry once; fall back to random on second failure
- **Outer loopback:** When candidate energy beats `state.best_energy`, checkpoint to `state/mycelial_checkpoint.json`

**State Model:** `MycelialState` dataclass carries:
- `active_edges`, `energy_history`, `best_energy`, `best_edges`
- `node_positions`, `resource_nodes`, `run_log`
- Serialized to JSON after every iteration

### Benchmark Suite

Five benchmarks in `benchmark.py` each return:
```python
{
  "name": str,
  "passed": bool,
  "duration_s": float,
  "value": Optional[float],
  "unit": Optional[str],
  "threshold": Optional[float],
  "notes": str
}
```

Reports saved to `reports/benchmark-<UTC timestamp>.json`. Exit code 0 only when all pass.

## Key Conventions

### Environment Variables

**Cloudflare Secrets** (set via `wrangler secret put`):
- `DIAMOND_NODE_ED25519_PRIV` — base64 PKCS#8 private key
- `DIAMOND_NODE_ED25519_PUB` — base64 SPKI public key
- `DIAMOND_VAULT_AUDIT_URL` — upstream audit endpoint (optional)
- `APPSIGNAL_KEY` — AppSignal API key (optional)

**Worker vars** (in `wrangler.toml`):
- `NODE_VERSION`, `NODE_ID`, `KEY_ID`

**Python path overrides** (optional):
- `DIAMOND_STATE_DIR` — override `state/` directory
- `DIAMOND_LOG_DIR` — override `logs/` directory
- `DIAMOND_VENV` — override venv path

### Hardware Constraints

- **GPU:** NVIDIA GTX 1650, 4 GB VRAM
- **Thermal threshold:** 89.6 °C (see `bench_gpu_telemetry`)
- **LLM:** Ollama at `/usr/local/bin/ollama` with `llama3.2:3b` (2 GB)

### Python Packages in venv

- `cudaq 0.14.2`
- `numpy 2.4.4`
- `cupy-cuda13x`
- `jax/jaxlib 0.10.0`
- `scipy 1.17.1`

### Identity & Signatures

All audit events are Ed25519-signed. The signature flow:
1. Build event object (sans `sig` field) via `makeEvent()`
2. Sign with `signEvent()` using imported private key
3. Append to in-memory ring buffer (max 100 events)
4. Optionally emit to upstream vault via `emitToVault()`

### State Persistence

- **Primary state:** `state/mycelial_state.json` — written after every iteration
- **Checkpoint:** `state/mycelial_checkpoint.json` — written only on new best energy
- **LLM logs:** `logs/llm-interpretations.jsonl` — appended by `llm_interpret.py`
- **Benchmark reports:** `reports/benchmark-<timestamp>.json`

### CUDA-Q Backend

All QAOA circuits use `qpp-cpu` backend (CPU simulator) since GTX 1650 lacks direct CUDA-Q kernel support. Future GPU acceleration would require migration to `nvidia` backend with compatible hardware.

## Disambiguation

- **NOT** `Diamond-V` (vault repo)
- **NOT** `diamondvault.io` (separate domain)
- This is specifically the `diamond-node` audit/simulation node in the Genesis Conductor 7-agent topology
