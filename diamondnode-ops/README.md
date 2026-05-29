# diamondnode-ops

Operational and functional commands for the diamondnode (GTX 1650) environment in the Genesis Conductor / Hermes-Openclaw project.

## Scripts

- `status.sh` — Comprehensive status (GPU, model, native binary, disk, podman, processes).
- `cleanup.sh` — Safe kill of runaway llama processes + deletion of large benchmark logs.
- `run_bench.sh` — Reliable statistical benchmarks using the proper `llama-bench` tool (JSON output, avoids log flooding).
- `gpu_watch.sh` — Live GPU + disk monitor.

## Usage on diamondnode

```bash
# Copy this directory to diamondnode (e.g. via rsync or git)
rsync -avz diamondnode-ops/ diamondnode@192.168.1.228:~/diamondnode-ops/

ssh diamondnode@192.168.1.228
cd ~/diamondnode-ops
./status.sh
./cleanup.sh
./run_bench.sh
./gpu_watch.sh
```

These commands are designed for the real hardware environment (Ubuntu + GTX 1650 + native llama.cpp CUDA build).

## Notes
- Always run cleanup before new benchmark attempts.
- Use `run_bench.sh` for clean statistical data (preferred over raw llama-cli loops).
- All scripts are idempotent and safe where possible.

Part of the ag-15 / Hermes-Openclaw operational tooling.