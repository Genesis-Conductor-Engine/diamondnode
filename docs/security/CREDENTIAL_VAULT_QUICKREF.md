# Credential Vault Quick Reference

## 🚀 Quick Start

```bash
# Setup (one-time)
credential-vault.sh init
credential-vault.sh import

# Sync to all AI CLIs
credential-vault.sh sync
```

## 💻 Use in AI CLI

```bash
# Load credentials for current session
source ~/bin/load-ai-credentials.sh ~/.copilot/credentials

# Verify loaded
env | grep -E '(OPENAI|LANGSMITH)' | cut -d= -f1
```

## 🔑 Common Operations

| Command | Description |
|---------|-------------|
| `credential-vault.sh init` | Initialize vault |
| `credential-vault.sh import` | Import from ~/.env |
| `credential-vault.sh sync` | Sync to all targets |
| `credential-vault.sh list` | List credentials |
| `credential-vault.sh get KEY` | Get credential value |
| `credential-vault.sh store KEY VAL` | Store new credential |
| `credential-vault.sh watch` | Continuous sync mode |

## 📂 Credential Locations

| AI CLI | Path |
|--------|------|
| Copilot | `~/.copilot/credentials/.env` |
| Vibe | `~/.vibe/credentials/.env` |
| Gemini | `~/.gemini/credentials/.env` |
| OpenClaw | `~/.openclaw/credentials/.env` |
| OpenCode | `~/.opencode/credentials/.env` |

## 🐍 Python Usage

```python
from credential_vault import CredentialVault

vault = CredentialVault()
vault.inject_to_env()  # Load all to environment

# Or get specific
creds = vault.load_credentials()
api_key = creds['OPENAI_API_KEY']
```

## 🔐 Security

- Vault dir: `~/.credential-vault` (700)
- Files: All 600 permissions
- Encoding: Base64 for local storage
- Sync logs: `~/.credential-vault/sync.log`

## 📋 Current Credentials

- LANGSMITH_API_KEY ✅
- OPENAI_API_KEY ✅
- APPSIGNAL_KEY ✅
- GC_MCP_URL ✅
- GC_NOTION_BRIDGE_URL ✅
- NODE_ENV ✅
- +4 more

## 🔗 Full Docs

- Guide: `~/CREDENTIAL_VAULT_GUIDE.md`
- Deployment: `~/CREDENTIAL_SHARING_DEPLOYMENT.md`
