#!/bin/bash
# CUDA-Q Quick Test Script for GTX 1650
# Location: /home/diamondnode/diamond-node/scripts/quick_cudaq_test.sh
#
# Usage: ./quick_cudaq_test.sh

set -e

VENV_PY="/home/diamondnode/venv312/bin/python"
SCRIPTS_DIR="/home/diamondnode/diamond-node/scripts"

echo "=========================================="
echo "CUDA-Q GTX 1650 Quick Test"
echo "=========================================="
echo ""

# GPU Status
echo "=== GPU Status ==="
nvidia-smi --query-gpu=name,memory.used,memory.total,temperature.gpu --format=csv,noheader
echo ""

# CUDA-Q Version
echo "=== CUDA-Q Version ==="
$VENV_PY -c "import cudaq; print(cudaq.__version__)"
echo ""

# Target Backend
echo "=== Active Target ==="
$VENV_PY -c "import cudaq; print(cudaq.get_target().name)"
echo ""

# Quick probe test
echo "=== Running Bell State Probe ==="
$VENV_PY "$SCRIPTS_DIR/_cudaq_probe.py"
echo ""

# GPU Status after test
echo "=== GPU Status (Post-Test) ==="
nvidia-smi --query-gpu=memory.used,memory.total,temperature.gpu --format=csv,noheader
echo ""

echo "✅ CUDA-Q quick test complete!"
