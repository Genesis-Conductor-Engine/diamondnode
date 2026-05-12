# Git Authentication & Repository Setup

**Status**: Current  
**Last Updated**: 2026-05-12  
**Phase**: 3 (Production Hardening)

---

## Repository Configuration

**Repository**: Genesis-Conductor-Engine/diamondnode  
**URL**: https://github.com/Genesis-Conductor-Engine/diamondnode  
**Branch**: main  
**Commits Ready**: 10 commits (8,400+ lines)

---

## Authentication Methods

### Option 1: GitHub CLI (Recommended)

```bash
# Authenticate interactively
gh auth login

# Follow prompts:
# - What account? GitHub.com
# - Protocol? HTTPS
# - Authenticate? Login with web browser
# - Copy one-time code: XXXX-XXXX
# - Press Enter to open browser
```

### Option 2: Personal Access Token

```bash
# Generate token
open https://github.com/settings/tokens/new

# Required scopes:
# - repo (Full control of private repositories)

# Configure git
git config --global credential.helper store
git push -u origin main
# Username: your-github-username
# Password: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Option 3: SSH Key

```bash
# Generate Ed25519 key
ssh-keygen -t ed25519 -C "diamond@genesisconductor.io"

# Add to GitHub
cat ~/.ssh/id_ed25519.pub
# Copy and add at: https://github.com/settings/keys

# Change remote to SSH
git remote set-url origin git@github.com:Genesis-Conductor-Engine/diamondnode.git

# Push
git push -u origin main
```

---

## Push to GitHub

Once authenticated:

```bash
cd ~/diamond-node
git push -u origin main
```

---

## Related Documentation

- **Deployment**: [docs/setup/deployment.md](./deployment.md)
- **Monitoring**: [docs/setup/monitoring.md](./monitoring.md)
