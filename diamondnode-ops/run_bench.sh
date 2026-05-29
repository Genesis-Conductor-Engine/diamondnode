#!/bin/bash
# diamondnode-ops/run_bench.sh
# Reliable native benchmark using llama-bench (preferred for stats)

set -euo pipefail

MODEL="/home/diamondnode/models/Hermes-3-Llama-3.1-8B.Q4_K_M.gguf"
BENCH="/home/diamondnode/llama.cpp/build/bin/llama-bench"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTDIR="/tmp/bench_results"
mkdir -p "$OUTDIR"
LOG="$OUTDIR/bench_${TIMESTAMP}.jsonl"

if [ ! -x "$BENCH" ]; then
    echo "llama-bench not found or not executable"
    exit 1
fi

echo "=== RELIABLE NATIVE BENCHMARK $(date -Iseconds) ===" | tee -a "$LOG"
echo "Model: $MODEL" | tee -a "$LOG"
echo "Binary: $BENCH" | tee -a "$LOG"

# Clean statistical runs with JSON output (avoids log flood)
for LAYERS in 4 8 12; do   # Start conservative for 4GB VRAM
  echo "Running layers=$LAYERS ..."
  $BENCH \
    -m "$MODEL" \
    -ngl $LAYERS \
    -p 512 \
    -n 64 \
    -r 5 \
    -b 256 \
    -ub 128 \
    -t 4 \
    --progress \
    -o json \
    --no-warmup 2>&1 | tee -a "$LOG"
done

echo "Results saved to $LOG"
echo "=== BENCH COMPLETE ==="