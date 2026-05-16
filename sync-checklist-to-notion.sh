#!/bin/bash
# Notion Task Sync for Claw Handoff Checklist
# Syncs checklist status to Notion soul-capsule database

CHECKLIST_FILE="$HOME/CLAW_HANDOFF_CHECKLIST.md"
NOTION_BRIDGE_URL="https://notion-bridge.iholt.workers.dev"

echo "🔄 Syncing Claw Handoff Checklist to Notion"
echo "============================================"
echo ""

# Count tasks
TOTAL_TASKS=$(grep -c "^\- \[ \]" "$CHECKLIST_FILE" || echo "0")
COMPLETED_TASKS=$(grep -c "^\- \[x\]" "$CHECKLIST_FILE" || echo "0")
PENDING_TASKS=$((TOTAL_TASKS - COMPLETED_TASKS))

if [ $TOTAL_TASKS -eq 0 ]; then
    COMPLETION_PCT=0
else
    COMPLETION_PCT=$((COMPLETED_TASKS * 100 / TOTAL_TASKS))
fi

echo "Task Summary:"
echo "  Total: $TOTAL_TASKS"
echo "  Completed: $COMPLETED_TASKS"
echo "  Pending: $PENDING_TASKS"
echo "  Progress: $COMPLETION_PCT%"
echo ""

# Get critical tasks (first 10 uncompleted)
CRITICAL_PENDING=$(grep "^\- \[ \].*\*\*" "$CHECKLIST_FILE" | head -10)

# Build context buffer
CONTEXT="Diamondnode Claw Handoff Status Update

Progress: $COMPLETION_PCT% ($COMPLETED_TASKS/$TOTAL_TASKS)

Critical Pending Tasks:
$CRITICAL_PENDING

Updated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

Full checklist: ~/CLAW_HANDOFF_CHECKLIST.md"

# Get current VRAM status
VRAM_USED=$(nvidia-smi --query-gpu=memory.used --format=csv,noheader,nounits 2>/dev/null || echo "0")
VRAM_TOTAL=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits 2>/dev/null || echo "4096")

if [ $VRAM_TOTAL -eq 0 ]; then
    VRAM_TOTAL=4096
fi

# Calculate Hamiltonian
HAMILTONIAN=$(echo "scale=2; ($VRAM_USED / $VRAM_TOTAL) * 10" | bc)

echo "VRAM Status:"
echo "  Used: $VRAM_USED MiB"
echo "  Total: $VRAM_TOTAL MiB"
echo "  H(s): $HAMILTONIAN"
echo ""

# Build JSON payload
PAYLOAD=$(cat <<EOF
{
  "action": "OFFLOAD",
  "session_id": "claw-handoff-$(date +%Y%m%d-%H%M%S)",
  "context_buffer": $(echo "$CONTEXT" | jq -Rs .),
  "hamiltonian": $HAMILTONIAN,
  "vram_used_mib": $VRAM_USED,
  "vram_total_mib": $VRAM_TOTAL
}
EOF
)

echo "Uploading to Notion..."
echo ""

# Send to Notion
RESPONSE=$(curl -s -X POST "$NOTION_BRIDGE_URL" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

if echo "$RESPONSE" | grep -q "page_id\|success"; then
    echo "✅ Successfully synced to Notion"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
else
    echo "⚠️  Sync may have failed"
    echo ""
    echo "Response:"
    echo "$RESPONSE"
fi

echo ""
echo "============================================"
echo "Next sync: Run this script again after updating checklist"
echo ""
