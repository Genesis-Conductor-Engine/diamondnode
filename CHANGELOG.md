# Changelog

## [0.1.0] — 2026-05-11

### Added
- Cloudflare Worker identity layer (`src/index.ts`, `src/health.ts`, `src/identity.ts`, `src/audit.ts`)
- `GET /healthz` endpoint — liveness + pubkey + version
- `GET /.well-known/diamond-node.json` — identity manifest
- `GET /audit/replay` — in-memory ring buffer of last 100 signed events
- Ed25519 signing via WebCrypto; `node.online` event emitted on first healthz per isolate
- `scripts/gen-identity.mjs` — offline keypair generator
- QUBO simulation engine (`scripts/mycelial_qubo.py`) — mycelial hyphal-network optimizer using CUDA-Q QAOA
- Benchmark suite (`scripts/benchmark.py`) — gpu, cudaq, qubo, llm, state_persistence
- LLM interpretation pass (`scripts/llm_interpret.py`) — Ollama llama3.2:3b network analyst
- Daily health check (`scripts/daily_health.py`)
- Phase 1 repo scaffold per HAVIS v2.0 plan (deploy URL: `dn.genesisconductor.io`)
