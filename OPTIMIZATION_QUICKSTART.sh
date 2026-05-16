#!/bin/bash
# Orthogonal Optimization Quick Start Script

set -e

echo "================================================================"
echo "ORTHOGONAL OPTIMIZATION QUICK START"
echo "================================================================"

# Check environment
echo -e "\n[1/5] Checking environment..."
if [ ! -d ~/venv312 ]; then
    echo "❌ venv312 not found"
    exit 1
fi
echo "✓ Python venv found"

# Activate venv
echo -e "\n[2/5] Activating Python environment..."
source ~/venv312/bin/activate
echo "✓ Environment activated"

# Check dependencies
echo -e "\n[3/5] Checking dependencies..."
python -c "import numpy" 2>/dev/null || { echo "❌ numpy not installed"; exit 1; }
echo "✓ Dependencies OK"

# Run quick benchmark
echo -e "\n[4/5] Running quick benchmark..."
cd ~/diamond-node
python benchmarks/orthogonal_test.py --mode quick

# Show results summary
echo -e "\n[5/5] Summary..."
echo "================================================================"
echo "✓ Optimizer tested successfully"
echo ""
echo "Next steps:"
echo "  1. Run full benchmarks:"
echo "     python benchmarks/orthogonal_test.py --mode full"
echo ""
echo "  2. View integration examples:"
echo "     python example_optimizer_integration.py"
echo ""
echo "  3. Read documentation:"
echo "     cat docs/ORTHOGONAL_OPTIMIZATION.md | less"
echo ""
echo "  4. Check Pareto frontiers:"
echo "     ls -lh benchmark_results/"
echo "================================================================"
