#!/usr/bin/env bash
# Claude Canonical Aliases for Diamond Ecosystem
# Source this file to get claude-* aliases
# Usage: source /home/diamondnode/claude-aliases.sh

# Orchestrator aliases - Top-level intelligent routing
alias orchestrate='$HOME/claude-orchestrator.sh'
alias claude-route='$HOME/claude-orchestrator.sh'
alias ask-claude='$HOME/claude-orchestrator.sh'

# Canonical claw endpoint aliases
# These route to the actual claw endpoints via claude-remote

alias claude='claude-remote claude'
alias claude-openclaw='claude-remote claude-openclaw'
alias claude-kimiclaw='claude-remote claude-kimiclaw'
alias claude-nemoclaw='claude-remote claude-nemoclaw'

alias openclaw='claude-remote openclaw'
alias kimiclaw='claude-remote kimiclaw'
alias nemoclaw='claude-remote nemoclaw'

# Broadcast aliases
alias claude-broadcast='claude-remote broadcast'
alias claude-all='claude-remote broadcast'

# List aliases
alias claude-list='claude-remote list'
alias claws='claude-remote list'

# Context sync aliases
alias notion-sync='$HOME/claude-plugins/notion-context-sync.sh'
alias save-context='$HOME/claude-plugins/notion-context-sync.sh quick'

# For bash completion
autosuggest_claude() {
  local cur=${COMP_WORDS[COMP_CWORD]}
  COMPREPLY=($(compgen -W "claude openclaw kimiclaw nemoclaw broadcast list" -- "$cur"))
}

# Register completion for claude-remote
complete -F autosuggest_claude claude-remote
complete -F autosuggest_claude claude

echo "Claude aliases loaded. Use:"
echo "  Orchestration: orchestrate, ask-claude, claude-route"
echo "  Direct claws: claude, claude-openclaw, claude-kimiclaw, claude-nemoclaw"
echo "  Broadcasting: claude-broadcast, claude-all"
echo "  Context sync: notion-sync, save-context"
echo "  List: claws, claude-list"
