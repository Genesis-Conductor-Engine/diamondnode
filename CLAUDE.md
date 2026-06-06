# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Environment

All CUDA-Q and numpy work must use the dedicated venv:

```
/home/diamondnode/venv312/bin/python
```

System Python lacks `cudaq`, `numpy`, `cupy`, `scipy`, and `jax`. Key packages in the venv: `cudaq 0.14.2`, `numpy 2.4.4`, `cupy-cuda13x`, `jax/jaxlib 0.10.0`, `scipy 1.17.1`.

Hardware: NVIDIA GTX 1650, 4 GB VRAM. Thermal threshold 89.6 °C (see `bench_gpu_telemetry`).

Ollama is at `/usr/local/bin/ollama` with `llama3.2:3b` (2 GB) loaded.

Path overrides via env vars: `DIAMOND_STATE_DIR`, `DIAMOND_LOG_DIR`, `DIAMOND_VENV`.

## Commands

Run one QUBO iteration (uses venv python internally):
```bash
/home/diamondnode/venv312/bin/python scripts/mycelial_qubo.py [--shots 512] [--outer-rounds 3] [--json]
```

Run the full benchmark suite (saves report to `reports/`):
```bash
/home/diamondnode/venv312/bin/python scripts/benchmark.py [--suite all|qubo|llm|gpu|cudaq] [--json]
```

Daily health check (GPU telemetry + ttectra + ollama status):
```bash
/home/diamondnode/venv312/bin/python scripts/daily_health.py
```

LLM interpretation of current network state (appends to `logs/llm-interpretations.jsonl`):
```bash
/home/diamondnode/venv312/bin/python scripts/llm_interpret.py
```

CUDA-Q smoke test (256 shots of a Bell circuit on `qpp-cpu`):
```bash
/home/diamondnode/venv312/bin/python scripts/_cudaq_probe.py
```

## Architecture

**Core simulation — `mycelial_qubo.py`**

Models fungal hyphal-network growth as a QUBO over edge variables on a 16-node 4×4 grid. The QUBO diagonal encodes three competing terms: distance penalty (`lam_dist=0.4`), redundancy reward for already-active edges (`lam_redund=-0.2`), and resource-proximity reward for edges incident to resource nodes 0 and 15 (`lam_resource=-0.8`).

Solving is split into subspaces of 10 edges each. Each subspace is solved by a 1-layer QAOA circuit via `cudaq.sample` (gamma=0.3, beta=0.2). Subspace assignments are stitched back into the global edge vector, and the best global assignment is kept across `outer_rounds`.

**Double-loopback resilience**:
- *Inner loopback*: if `cudaq.sample` raises, retries once; falls back to random assignment on second failure.
- *Outer loopback*: whenever a candidate energy beats `state.best_energy`, state is checkpointed to `state/mycelial_checkpoint.json`. This checkpoint is the recovery target if outer rounds diverge.

**State persistence**

`MycelialState` (dataclass) is serialised to `state/mycelial_state.json` after every iteration and to `state/mycelial_checkpoint.json` on any new best energy. The state carries `active_edges`, `energy_history`, `best_energy`/`best_edges`, node positions, and a full `run_log`.

**Benchmark runner — `benchmark.py`**

Five benchmarks (`gpu_telemetry`, `cudaq_probe`, `qubo_iteration`, `state_persistence`, `llm_latency`) each return a uniform dict `{name, passed, duration_s, value?, unit?, threshold?, notes}`. Results are saved as JSON to `reports/benchmark-<UTC timestamp>.json`. Exit code is 0 only when all selected benchmarks pass.

**LLM interpretation — `llm_interpret.py`**

Reads `state/mycelial_state.json`, builds a one-sentence summary (node count, active edges, best energy, trend, resource nodes, iteration), and sends it to `ollama run llama3.2:3b` asking for a 3–4 sentence assessment and a single parameter-change recommendation. Output appended as JSONL to `logs/llm-interpretations.jsonl`.

**Arena integration cross-ref (gc-arena-controller + OFFLOAD):** High-value Ouroboros matches (from gc-arena-controller 5-phase FSM on shared D1) can participate in the H(s) > 8.5 OFFLOAD → notion-bridge soul-capsule (DB 21e41606...) → diamondvault → gc-mcp propagation story via the live `/v1/arena/matches/:id/offload` (or future gc-mcp-beta arena tools). See top ~/AGENTS.md "Arena + Conductor Soul-Capsule Integration", gc-arena-controller/README.md, and Task 4. Arena matches provide richer context (phase history, strategy, bench_trace, demand_score) than raw VRAM telemetry.
