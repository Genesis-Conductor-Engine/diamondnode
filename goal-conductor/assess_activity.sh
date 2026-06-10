#!/usr/bin/env bash
# assess_activity.sh — gather all movement since the last newsletter run.
# Used by the daily ops-newsletter workflow (daily_ops_workflow.md).
# Read-only except for updating the run marker when called with --mark.
set -uo pipefail

GC_DIR="$(cd "$(dirname "$0")" && pwd)"
MARKER="$GC_DIR/.last_newsletter_run"
MARK_FLAG="${1:-}"   # capture before the health loop reuses positional params via set --
SINCE="$(cat "$MARKER" 2>/dev/null || echo '24 hours ago')"

REPOS=(
  "$HOME/diamond-node"
  "$HOME/gc-workers"
  "$HOME/diamondvault-notion-worker"
  "$HOME/diamondnode-unified-inference"
  "$HOME/genesis/notion-bridge"
)

echo "=== ACTIVITY SINCE: $SINCE ==="
for r in "${REPOS[@]}"; do
  [ -d "$r/.git" ] || continue
  log=$(git -C "$r" log --all --since="$SINCE" --oneline --no-decorate 2>/dev/null | head -30)
  [ -n "$log" ] && { echo "--- $(basename "$r") ---"; echo "$log"; }
done

echo "=== NEW LEDGER ENTRIES ==="
tail -20 "$GC_DIR/utilization_ledger.jsonl" 2>/dev/null

echo "=== NEW DECISIONS ==="
tail -10 "$GC_DIR/decision_log.jsonl" 2>/dev/null

echo "=== HEALTH SWEEP ==="
for url in \
  "http://localhost:8000/health gateway" \
  "https://dn.genesisconductor.io/healthz dn-worker" \
  "https://news.genesisconductor.io/health gc-news" \
  "http://localhost:8081/health diamondvault" \
  "http://localhost:8080/health unified-inference"; do
  set -- $url
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 6 "$1" 2>/dev/null)
  echo "$2: $code"
done

echo "=== GPU ==="
nvidia-smi --query-gpu=memory.used,memory.total,temperature.gpu --format=csv,noheader 2>/dev/null

if [ "$MARK_FLAG" = "--mark" ]; then
  date -u +"%Y-%m-%dT%H:%M:%SZ" > "$MARKER"
  echo "=== MARKER UPDATED ==="
fi
