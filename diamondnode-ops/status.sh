#!/bin/bash
# diamondnode-ops/status.sh
# Operational status check for diamondnode (GTX 1650 setup)

set -euo pipefail

echo "=== DIAMONDNODE OPERATIONAL STATUS ==="
echo "Timestamp: $(date -Iseconds)"
echo "Host: $(hostname)"
echo ""

echo "=== GPU ==="
nvidia-smi --query-gpu=name,memory.total,memory.free,utilization.gpu,driver_version --format=csv,noheader || echo "nvidia-smi failed"
echo ""

echo "=== MODEL ==="
ls -lh /home/diamondnode/models/ 2>/dev/null || echo "No models directory"
echo ""

echo "=== NATIVE LLAMA.CPP BINARY ==="
if [ -f /home/diamondnode/llama.cpp/build/bin/llama-cli ]; then
    ls -l /home/diamondnode/llama.cpp/build/bin/llama-cli
    sha256sum /home/diamondnode/llama.cpp/build/bin/llama-cli
else
    echo "llama-cli not found"
fi
if [ -f /home/diamondnode/llama.cpp/build/bin/llama-bench ]; then
    echo "llama-bench present"
fi
echo ""

echo "=== DISK ==="
df -h /home/diamondnode /tmp 2>/dev/null | cat
echo ""

echo "=== PODMAN ==="
podman --version 2>/dev/null || echo "podman not available"
echo ""

echo "=== KEY PROCESSES ==="
ps aux | grep -E "llama|benchmark|python|node" | grep -v grep | head -10 | cat || echo "No relevant processes"
echo ""

echo "=== END STATUS ==="