#!/bin/bash
# diamondnode-ops/cleanup.sh
# Safe cleanup of runaway processes and large logs on diamondnode

set -euo pipefail

echo "=== DIAMONDNODE CLEANUP $(date -Iseconds) ==="

echo "Killing llama* and benchmark processes..."
pkill -9 -f "llama-bench\|llama-cli\|run_native" 2>/dev/null || true
sleep 2

echo "Current GPU:"
nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv,noheader

echo ""
echo "Deleting large benchmark logs (>50MB)..."
find /tmp -name "*diamondnode*bench*.log" -o -name "*native_bench*.log" | while read f; do
    if [ -f "$f" ]; then
        size=$(du -m "$f" | cut -f1)
        if [ "$size" -gt 50 ]; then
            echo "Deleting $f ($size MB)"
            rm -f "$f"
        fi
    fi
done

echo ""
echo "Disk after:"
df -h /tmp

echo "=== CLEANUP COMPLETE ==="