#!/bin/bash
# Diamond Node - Automated Recovery Script
# Fixes critical issues: git worktree, dependencies, VRAM optimization

set -e  # Exit on error

echo "🚨 Diamond Node Recovery Script"
echo "================================"
echo ""

cd ~/diamond-node

# Phase 1: Git Worktree Cleanup
echo "📦 Phase 1: Cleaning Git Worktree..."
echo ""

# Add .gitignore entries for generated files
echo "Adding .gitignore entries..."
cat >> .gitignore << 'EOF'

# State files (generated at runtime)
state/mycelial_state.json
state/mycelial_checkpoint.json
.claude/scheduled_tasks.lock

# Logs (append-only, generated)
logs/llm-interpretations.jsonl
logs/*.log

# Benchmark results (generated)
benchmark_results/*.json
reports/benchmark-*.json
reports/health-*.json

# Node modules
node_modules/
package-lock.json

# Python cache
__pycache__/
*.pyc
.pytest_cache/

# Environment
.env
.env.local
EOF

# Restore generated state files to clean slate
echo "Restoring generated state files..."
git restore state/mycelial_state.json 2>/dev/null || true
git restore state/mycelial_checkpoint.json 2>/dev/null || true
git restore .claude/scheduled_tasks.lock 2>/dev/null || true
git restore logs/llm-interpretations.jsonl 2>/dev/null || true

# Stage all new documentation and code
echo "Staging new files..."
git add -f DEPLOYMENT_STATUS.txt
git add -f OPTIMIZATION_QUICKSTART.sh
git add -f ORTHOGONAL_OPTIMIZATION_SUMMARY.md
git add -f README_OPTIMIZATION.md
git add -f WAVEFORM_DELIVERABLES.md
git add -f WAVEFORM_SUMMARY.txt
git add -f example_optimizer_integration.py
git add -f .gitignore

# Stage new directories (excluding generated content)
git add -f benchmarks/
git add -f config/
git add -f docs/
git add -f scripts/cudaq_gpu_test.py
git add -f scripts/quick_cudaq_test.sh
git add -f scripts/waveform_equilibrium.py
git add -f test/waveform_equilibrium_test.py
git add -f unified_inference/

# Stage reports (commit structure, not generated data)
git add -f reports/CUDAQ_GTX1650_OPTIMIZATION.md 2>/dev/null || true
git add -f reports/CUDAQ_GTX1650_SUMMARY.md 2>/dev/null || true

# Check for script modifications
if git diff --quiet scripts/mycelial_qubo.py; then
    echo "  No changes to mycelial_qubo.py"
else
    echo "⚠️  scripts/mycelial_qubo.py has modifications"
    echo "   Review changes with: git diff scripts/mycelial_qubo.py"
    read -p "   Stage this file? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add scripts/mycelial_qubo.py
    fi
fi

# Check for Claude settings modifications
if git diff --quiet .claude/settings.local.json; then
    echo "  No changes to Claude settings"
else
    echo "⚠️  .claude/settings.local.json has modifications"
    git diff .claude/settings.local.json
    read -p "   Stage this file? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .claude/settings.local.json
    fi
fi

# Show status
echo ""
echo "Git status after staging:"
git status --short

# Commit
echo ""
read -p "Commit these changes? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git commit -m "feat: Add optimization benchmarks and waveform equilibrium tests

- Add waveform equilibrium tests (6/6 passing)
- Add CUDA-Q GPU optimization benchmarks (1/1 passing)
- Add orthogonal optimization framework with Pareto analysis
- Add unified inference documentation
- Add deployment status tracking and quickstart script
- Update .gitignore for generated state/log files

Test results:
- waveform_equilibrium_test.py: 6 passed
- CUDA-Q benchmark: 1/1 passed
- Vitest: 4 passed
- Orthogonal: 3 feasible points (quick), full benchmark passed
- Scientific: 6/12 Pareto-optimal
- Vision: 4/8
- Conversational: 2/9 (needs improvement)
- Balanced: 2/2"
    
    echo "✅ Git worktree cleaned and committed"
else
    echo "⚠️  Skipped commit. Review changes manually."
fi

echo ""
echo "================================"
echo ""

# Phase 2: Fix TypeScript Dependencies
echo "📦 Phase 2: Installing Dependencies..."
echo ""

if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
else
    echo "node_modules exists, checking if deps are current..."
    npm install
fi

echo ""
echo "Running typecheck..."
if npm run typecheck; then
    echo "✅ TypeScript typecheck passed"
else
    echo "❌ TypeScript typecheck failed"
    echo ""
    echo "Attempting fix: updating @cloudflare/workers-types..."
    npm install -D @cloudflare/workers-types@latest
    
    echo "Retrying typecheck..."
    if npm run typecheck; then
        echo "✅ TypeScript typecheck passed after update"
    else
        echo "⚠️  TypeScript typecheck still failing"
        echo "   Manual intervention required"
        echo "   Check: npm run typecheck"
    fi
fi

echo ""
echo "================================"
echo ""

# Phase 3: VRAM Optimization Check
echo "📊 Phase 3: VRAM Status..."
echo ""

if command -v nvidia-smi &> /dev/null; then
    echo "Current GPU status:"
    nvidia-smi --query-gpu=name,memory.used,memory.total,temperature.gpu --format=csv,noheader
    
    VRAM_USED=$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits)
    VRAM_TOTAL=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits)
    VRAM_FREE=$((VRAM_TOTAL - VRAM_USED))
    VRAM_PERCENT=$((VRAM_USED * 100 / VRAM_TOTAL))
    
    echo ""
    echo "VRAM Analysis:"
    echo "  Used:  ${VRAM_USED} MiB (${VRAM_PERCENT}%)"
    echo "  Free:  ${VRAM_FREE} MiB ($((100 - VRAM_PERCENT))%)"
    echo "  Total: ${VRAM_TOTAL} MiB"
    
    if [ $VRAM_FREE -lt 2000 ]; then
        echo ""
        echo "⚠️  WARNING: Low VRAM headroom (${VRAM_FREE} MiB)"
        echo "   Recommended: Use quantized models (4-bit or 8-bit)"
        echo "   Qwen unquantized (~2GB) + YOLO (~800MB) = 2.8GB"
        echo "   Available: ${VRAM_FREE} MiB = $(echo "scale=2; ${VRAM_FREE}/1024" | bc) GB"
        echo ""
        echo "   Solutions:"
        echo "   1. Install Qwen 4-bit quantized (saves ~1.5GB)"
        echo "   2. Offload YOLO to CPU"
        echo "   3. Sequential execution (not parallel)"
    else
        echo "✅ VRAM headroom acceptable (${VRAM_FREE} MiB available)"
    fi
else
    echo "⚠️  nvidia-smi not found. Cannot check VRAM status."
fi

echo ""
echo "================================"
echo ""

# Phase 4: MCP Inspector Setup
echo "🔍 Phase 4: MCP Inspector Info..."
echo ""

echo "To install MCP Inspector:"
echo "  npx @mcpjam/inspector@latest"
echo ""
echo "MCP Server endpoints:"
echo "  HTTPS: https://api.optimizationinversion.com/mcp"
echo "  STDIO: ~/gc-workers/gc-mcp/stdio-wire-up.sh"
echo ""

# Summary
echo "================================"
echo "📋 Recovery Summary"
echo "================================"
echo ""

# Check git status
if git diff-index --quiet HEAD --; then
    echo "✅ Git worktree: CLEAN"
else
    echo "⚠️  Git worktree: Still has uncommitted changes"
    echo "   Run: cd ~/diamond-node && git status"
fi

# Check node_modules
if [ -d "node_modules/@cloudflare/workers-types" ]; then
    echo "✅ Dependencies: Installed"
else
    echo "❌ Dependencies: Missing @cloudflare/workers-types"
fi

# Check typecheck (if already run)
if npm run typecheck --silent 2>/dev/null; then
    echo "✅ TypeScript: Passing"
else
    echo "⚠️  TypeScript: Check required"
fi

# VRAM status
if command -v nvidia-smi &> /dev/null; then
    VRAM_FREE=$(nvidia-smi --query-gpu=memory.free --format=csv,noheader,nounits)
    if [ $VRAM_FREE -gt 2000 ]; then
        echo "✅ VRAM: Adequate headroom (${VRAM_FREE} MiB)"
    else
        echo "⚠️  VRAM: Limited headroom (${VRAM_FREE} MiB)"
    fi
else
    echo "⚠️  VRAM: Status unknown"
fi

echo ""
echo "Next steps:"
echo "  1. Review RISK_ASSESSMENT.md for detailed analysis"
echo "  2. Install MCP inspector: npx @mcpjam/inspector@latest"
echo "  3. Address failing benchmarks (Conversational: 2/9)"
echo "  4. Consider Qwen quantization for VRAM optimization"
echo ""
echo "🎯 Target: 80% overall pass rate (currently 53%)"
echo ""
