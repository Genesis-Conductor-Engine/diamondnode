#!/bin/bash
# VRAM Optimization Helper for Diamond Node
# Manages Qwen model installation and VRAM monitoring

set -e

echo "🔧 VRAM Optimization Helper"
echo "============================"
echo ""

# Check GPU
echo "📊 GPU Status:"
nvidia-smi --query-gpu=name,memory.used,memory.total,temperature.gpu --format=csv,noheader
echo ""

# Calculate Hamiltonian
VRAM_USED=$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits)
VRAM_TOTAL=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits)
VRAM_FREE=$((VRAM_TOTAL - VRAM_USED))
VRAM_PERCENT=$((VRAM_USED * 100 / VRAM_TOTAL))

# H(s) = (Used / Total) * 10
HAMILTONIAN=$(echo "scale=2; ($VRAM_USED / $VRAM_TOTAL) * 10" | bc)

echo "VRAM Analysis:"
echo "  Used:  ${VRAM_USED} MiB (${VRAM_PERCENT}%)"
echo "  Free:  ${VRAM_FREE} MiB ($((100 - VRAM_PERCENT))%)"
echo "  Total: ${VRAM_TOTAL} MiB"
echo "  H(s):  ${HAMILTONIAN}"
echo ""

# Check threshold
THRESHOLD=8.5
SHOULD_OFFLOAD=$(echo "$HAMILTONIAN > $THRESHOLD" | bc -l)

if [ "$SHOULD_OFFLOAD" -eq 1 ]; then
    echo "⚠️  WARNING: H(s) = ${HAMILTONIAN} > ${THRESHOLD}"
    echo "   VRAM pressure high - consider offloading models"
else
    echo "✅ H(s) = ${HAMILTONIAN} < ${THRESHOLD} (OK)"
fi

echo ""
echo "============================"
echo ""

# Check Ollama models
echo "📦 Installed Ollama Models:"
ollama list
echo ""

# Model recommendations
echo "💡 VRAM Optimization Recommendations:"
echo ""

if [ $VRAM_FREE -lt 2000 ]; then
    echo "⚠️  Low VRAM headroom (${VRAM_FREE} MiB)"
    echo ""
    echo "Recommended actions:"
    echo "  1. Use Qwen2:0.5b (352 MB) - ✅ Already installed!"
    echo "  2. Use YOLOv5n for vision (400 MB instead of 700 MB)"
    echo "  3. Consider sequential execution (not parallel)"
    echo ""
    echo "Current capacity:"
    echo "  Qwen2:0.5b:    ~400 MiB"
    echo "  YOLOv5n:       ~400 MiB"
    echo "  Baseline:      ${VRAM_USED} MiB"
    echo "  Total:         ~$((VRAM_USED + 800)) MiB"
    echo "  Available:     ${VRAM_TOTAL} MiB"

    PROJECTED=$((VRAM_USED + 800))
    if [ $PROJECTED -lt $VRAM_TOTAL ]; then
        echo "  Status:        ✅ FITS ($(($VRAM_TOTAL - PROJECTED)) MiB headroom)"
    else
        echo "  Status:        ⚠️  TIGHT ($((PROJECTED - VRAM_TOTAL)) MiB over)"
    fi
else
    echo "✅ Good VRAM headroom (${VRAM_FREE} MiB)"
    echo ""
    echo "You can use:"
    echo "  - Qwen2:0.5b (352 MB) - ✅ Installed"
    echo "  - Qwen2:1.5b (934 MB) - More capable"
    echo "  - YOLOv8n (700 MB) - Standard vision model"
    echo ""
    echo "To install larger Qwen:"
    echo "  ollama pull qwen2:1.5b"
fi

echo ""
echo "============================"
echo ""

# Test Qwen model
echo "🧪 Quick Model Test:"
echo ""
echo "To test Qwen2:0.5b:"
echo "  ollama run qwen2:0.5b 'What is 2+2?'"
echo ""
echo "To monitor VRAM during inference:"
echo "  watch -n 1 'nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader'"
echo ""

# Diamond Gateway integration
if [ -f "/etc/default/diamond-gateway" ]; then
    echo "============================"
    echo ""
    echo "🔗 Diamond Gateway Integration:"
    echo ""
    echo "To test VRAM orchestration:"
    echo "  curl -X POST http://localhost:8000/v1/orchestrate \\"
    echo "    -H \"Authorization: Bearer \$GATEWAY_SECRET\" \\"
    echo "    -H \"Content-Type: application/json\" \\"
    echo "    -d '{\"session_id\":\"vram-test\",\"context_buffer\":\"[VRAM test]\"}'"
    echo ""
fi

echo "✅ VRAM optimization ready!"
echo ""
