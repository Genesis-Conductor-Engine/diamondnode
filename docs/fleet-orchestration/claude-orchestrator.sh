#!/usr/bin/env bash
# Claude Orchestration Router - Top-Level Decision Layer
# Routes requests: Claude for high-level decisions, subagents for execution

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_DIR="$HOME/.config/claude-orchestrator"
ROUTING_LOG="$CONFIG_DIR/routing.log"

# Load environment
source "$HOME/load-env.sh" 2>/dev/null || true

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${BLUE}[orchestrator]${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

init_config() {
  mkdir -p "$CONFIG_DIR"
  if [ ! -f "$CONFIG_DIR/routing-rules.json" ]; then
    cat > "$CONFIG_DIR/routing-rules.json" << 'EOF'
{
  "claude_patterns": [
    "^(what|how|why|when|should|would|can I|is it)",
    "official.*announcement",
    "public.*statement",
    "strategic.*decision",
    "recommend.*approach",
    "explain.*architecture",
    "high.level.*plan",
    "outreach",
    "communication.*strategy"
  ],
  "subagent_patterns": [
    "^(run|execute|deploy|install|build|test)",
    "^(check|verify|validate|measure)",
    "^(create|modify|edit|update|delete)",
    "git.*(commit|push|pull)",
    "docker.*(build|run|stop)",
    "npm.*(install|build|test)",
    "python.*run",
    "curl.*post",
    "systemctl.*(start|stop|restart)"
  ],
  "notion_sync_patterns": [
    "offload",
    "save.*context",
    "notion.*page",
    "soul.capsule"
  ]
}
EOF
  fi
}

classify_request() {
  local prompt="$1"
  local lowercase=$(echo "$prompt" | tr '[:upper:]' '[:lower:]')
  
  # Check for Claude patterns (high-level/strategic)
  if echo "$lowercase" | grep -qE "what|how|why|when|should|would|can i|is it|recommend|explain|strategic|official|public|outreach"; then
    echo "claude"
    return 0
  fi
  
  # Check for execution patterns
  if echo "$lowercase" | grep -qE "^(run|execute|deploy|install|build|test|check|verify|create|modify|git|docker|npm|python|curl|systemctl)"; then
    echo "subagent"
    return 0
  fi
  
  # Check for Notion sync
  if echo "$lowercase" | grep -qE "offload|save.*context|notion|soul.capsule"; then
    echo "notion"
    return 0
  fi
  
  # Default: Claude for ambiguous cases
  echo "claude"
}

route_to_claude() {
  local prompt="$1"
  local priority="${2:-normal}"
  
  log "Routing to Claude Remote (OpenClaw) for high-level orchestration..."
  
  # Log decision
  echo "$(date -Iseconds) | CLAUDE | $prompt" >> "$ROUTING_LOG"
  
  # Call Claude via claude-remote
  "$SCRIPT_DIR/claude-remote.sh" openclaw "$prompt" "$priority"
  
  # Check if Claude recommended delegation
  # (In practice, Claude's response would indicate if subagents should execute)
  success "Claude decision received"
}

route_to_subagent() {
  local prompt="$1"
  local agent_type="${2:-general-purpose}"
  
  log "Routing to subagent ($agent_type) for execution..."
  
  # Log decision
  echo "$(date -Iseconds) | SUBAGENT:$agent_type | $prompt" >> "$ROUTING_LOG"
  
  # Determine subagent based on task
  local subagent="general-purpose"
  
  if echo "$prompt" | grep -qiE "test|spec|lint"; then
    subagent="task"
  elif echo "$prompt" | grep -qiE "explore|analyze|investigate|research"; then
    subagent="explore"
  fi
  
  success "Delegating to $subagent subagent"
  
  # In actual implementation, would trigger MCP tool or background agent
  # For now, document the routing decision
  cat << EOF

SUBAGENT DELEGATION:
  Type: $subagent
  Task: $prompt
  
  To execute via MCP:
    curl -X POST https://api.optimizationinversion.com/mcp \\
      -H "Content-Type: application/json" \\
      -d '{"method":"tools/call","params":{"name":"submit_hybrid_task","arguments":{"prompt":"$prompt"}}}'
  
  Or via GitHub Copilot:
    @workspace $prompt

EOF
}

route_to_notion() {
  local prompt="$1"
  local session_id="${2:-claude-session-$(date +%s)}"
  
  log "Routing to Notion soul-capsule worker..."
  
  # Log decision
  echo "$(date -Iseconds) | NOTION | $prompt" >> "$ROUTING_LOG"
  
  # Check if this is a context offload trigger
  if [ -n "${GC_NOTION_BRIDGE_URL:-}" ]; then
    log "Triggering Notion offload via gc-mcp..."
    
    # Call gc-mcp offload_to_notion tool (JSON-RPC 2.0 format)
    local payload=$(jq -n \
      --arg sid "$session_id" \
      --arg ctx "$prompt" \
      --arg h "0.0" \
      '{
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
          "name": "offload_to_notion",
          "arguments": {
            "session_id": $sid,
            "context_buffer": $ctx,
            "hamiltonian": ($h | tonumber),
            "vram_used_mib": 0,
            "vram_total_mib": 0
          }
        }
      }')
    
    if command -v curl &> /dev/null; then
      curl -s -X POST "${GC_MCP_URL:-https://api.optimizationinversion.com/mcp}" \
        -H "Content-Type: application/json" \
        -d "$payload" | jq .
    else
      warn "curl not available. Notion sync skipped."
    fi
    
    success "Context synced to Notion soul-capsule"
  else
    warn "GC_NOTION_BRIDGE_URL not set. Notion sync skipped."
  fi
}

orchestrate() {
  local prompt="$1"
  local priority="${2:-normal}"
  
  init_config
  
  log "Analyzing request: $(echo "$prompt" | head -c 60)..."
  
  local routing_decision=$(classify_request "$prompt")
  
  case "$routing_decision" in
    claude)
      success "Decision: Claude Remote (strategic/high-level)"
      route_to_claude "$prompt" "$priority"
      ;;
    subagent)
      success "Decision: Subagent (execution)"
      route_to_subagent "$prompt"
      ;;
    notion)
      success "Decision: Notion sync"
      route_to_notion "$prompt"
      ;;
    *)
      warn "Unknown routing: $routing_decision. Defaulting to Claude."
      route_to_claude "$prompt" "$priority"
      ;;
  esac
}

show_routing_stats() {
  if [ ! -f "$ROUTING_LOG" ]; then
    warn "No routing log found at $ROUTING_LOG"
    return 0
  fi
  
  log "Routing Statistics:"
  echo ""
  echo "Total requests: $(wc -l < "$ROUTING_LOG")"
  echo "Claude routes:  $(grep -c "CLAUDE" "$ROUTING_LOG" || echo 0)"
  echo "Subagent routes: $(grep -c "SUBAGENT" "$ROUTING_LOG" || echo 0)"
  echo "Notion routes:  $(grep -c "NOTION" "$ROUTING_LOG" || echo 0)"
  echo ""
  echo "Recent routing decisions:"
  tail -n 10 "$ROUTING_LOG" | while read line; do
    echo "  $line"
  done
}

main() {
  if [ $# -eq 0 ]; then
    cat << EOF
Claude Orchestration Router - Top-Level Decision Layer

Usage:
  $0 "prompt text" [priority]           Route a request intelligently
  $0 stats                              Show routing statistics
  $0 test                               Run test scenarios

Routing Logic:
  • Claude Remote → Strategic decisions, public/official communications, high-level planning
  • Subagents → Code execution, testing, deployment, file operations
  • Notion Sync → Context offload, soul-capsule storage

Examples:
  $0 "Should we migrate to CUDA-Q for quantum optimization?"
  $0 "Run integration tests for the gateway"
  $0 "Offload current session context to Notion"

EOF
    return 0
  fi
  
  case "$1" in
    stats)
      show_routing_stats
      ;;
    test)
      log "Running test scenarios..."
      echo ""
      orchestrate "What's the best architecture for GPU orchestration?" "normal"
      echo ""
      orchestrate "Run pytest on the gateway tests" "normal"
      echo ""
      orchestrate "Save this session context to Notion" "normal"
      ;;
    *)
      orchestrate "$1" "${2:-normal}"
      ;;
  esac
}

main "$@"
