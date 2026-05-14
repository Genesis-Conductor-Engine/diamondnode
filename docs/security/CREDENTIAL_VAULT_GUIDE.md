# Credential Vault Integration Guide for AI Fleet

Complete guide for secure async credential sharing across the AI fleet.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     ~/.env (source)                          │
│                   Main credential store                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │  Credential Vault      │
            │  (AES-256-GCM)         │
            │  ~/.credential-vault/  │
            └─────┬──────────────┬───┘
                  │              │
         ┌────────┴─────┐   ┌───┴──────────┐
         │              │   │              │
         ▼              ▼   ▼              ▼
    ┌─────────┐   ┌─────────┐   ┌──────────────┐
    │ Copilot │   │  Vibe   │   │   Gemini     │
    │  .env   │   │  .env   │   │    .env      │
    └─────────┘   └─────────┘   └──────────────┘
         │              │              │
         └──────────┬───┴──────────────┘
                    │
                    ▼
            AI CLI Operations
                    │
                    ▼ (On VRAM overflow)
         ┌──────────────────────┐
         │  Diamond Gateway     │
         │  /v1/orchestrate     │
         └─────────┬────────────┘
                   │
                   ▼ (If H > 8.5)
         ┌──────────────────────┐
         │  Encrypted Offload   │
         │  credential-offload   │
         └─────────┬────────────┘
                   │
         ┌─────────┴─────────────┐
         │                       │
         ▼                       ▼
┌──────────────────┐   ┌──────────────────┐
│ Notion Worker 1  │   │ Notion Worker 2  │
│ .credentials/    │   │ .credentials/    │
│ credentials.enc  │   │ credentials.enc  │
└──────────────────┘   └──────────────────┘
```

## 🔐 Security Features

### 1. Encryption
- **Algorithm**: AES-256-GCM (Galois/Counter Mode)
- **Key Length**: 256 bits (32 bytes)
- **IV**: Unique 128-bit IV per encryption operation
- **Format**: `iv_hex:base64_encrypted`

### 2. Access Control
- **Vault directory**: 700 permissions (owner only)
- **Credential files**: 600 permissions (owner read/write only)
- **Key file**: 600 permissions (never transmitted)
- **Scoped access**: Credentials can be scoped to specific targets

### 3. Transmission Security
- **No plaintext in transit**: All credentials encrypted before transmission
- **HTTPS only**: Remote offload uses encrypted channels
- **Auth tokens**: Gateway requires Bearer token authentication

## 🚀 Quick Start

### 1. Initialize Vault
```bash
# Initialize vault structure
credential-vault.sh init

# Import existing credentials from ~/.env
credential-vault.sh import

# Verify import
credential-vault.sh list
```

### 2. Sync to AI CLIs
```bash
# One-time sync
credential-vault.sh sync

# Or start continuous sync daemon
credential-vault.sh watch

# Or enable systemd service (persistent)
sudo cp ~/.systemd/credential-vault-sync.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable credential-vault-sync
sudo systemctl start credential-vault-sync
```

### 3. Configure AI CLIs

#### Copilot (Current Session)
```bash
# Source credentials in .bashrc or before using copilot
source ~/bin/load-ai-credentials.sh ~/.copilot/credentials
```

#### Mistral Vibe
```bash
# Add to ~/.vibe/config.toml
[credentials]
source = "~/.vibe/credentials/.env"

# Or source before running vibe
source ~/bin/load-ai-credentials.sh ~/.vibe/credentials
```

#### Gemini
```bash
# Source credentials before running gemini
source ~/bin/load-ai-credentials.sh ~/.gemini/credentials
```

#### OpenClaw
```bash
# Source credentials for OpenClaw
source ~/bin/load-ai-credentials.sh ~/.openclaw/credentials
```

## 📦 Credential Scopes

Credentials can be scoped to control distribution:

- **`all`**: Synced to both AI CLIs and Notion workers (default)
- **`ai-cli`**: Only synced to AI CLI directories
- **`workers`**: Only synced to Notion worker directories

```bash
# Store credential with specific scope
credential-vault.sh store OPENAI_API_KEY "sk-..." all
credential-vault.sh store MISTRAL_API_KEY "..." ai-cli
credential-vault.sh store NOTION_TOKEN "secret_..." workers
```

## 🔄 Offload to Notion Workers

### Automatic Offload (VRAM-triggered)
```bash
# Gateway monitors VRAM and triggers offload when H > 8.5
# Credentials automatically encrypted and sent to Notion bridge
credential-offload.sh gateway session-123 9200 10000
```

### Manual Offload
```bash
# Direct offload to Notion worker
credential-offload.sh notion \
    https://notion-bridge.iholt.workers.dev \
    session-456 \
    "Query context summary"
```

### Test Offload
```bash
# Test complete offload pipeline
credential-offload.sh test
```

## 🐍 Python Integration (Notion Workers)

### Setup
```bash
# Install cryptography library
pip install cryptography

# Generate worker helper
credential-vault.sh generate-helper ~/notion-ai-worker
```

### Usage in Worker Code
```python
from credential_vault import CredentialVault

# Initialize vault
vault = CredentialVault()

# Load credentials from worker directory
credentials = vault.load_from_worker_dir('~/notion-ai-worker')

# Or inject directly to environment
vault.inject_to_env()

# Now use credentials
import os
notion_token = os.environ['NOTION_TOKEN']
openai_key = os.environ['OPENAI_API_KEY']
```

### Worker Startup Script
```python
#!/usr/bin/env python3
import sys
sys.path.insert(0, '/home/diamondnode/bin')

from credential_vault import CredentialVault

# Auto-load credentials
vault = CredentialVault()
vault.inject_to_env()

# Start your worker
from src.worker import start_worker
start_worker()
```

## 🔧 Management Commands

### Vault Operations
```bash
# Initialize vault
credential-vault.sh init

# Import from ~/.env
credential-vault.sh import

# Store new credential
credential-vault.sh store KEY "value" [scope]

# Retrieve credential
credential-vault.sh get KEY

# List all credentials
credential-vault.sh list

# Sync to all targets
credential-vault.sh sync

# Watch mode (continuous sync)
credential-vault.sh watch
```

### Python Client
```bash
# Load credentials (JSON output)
credential-vault.py load

# Load from specific worker
credential-vault.py load --worker-dir ~/notion-ai-worker

# Get single credential
credential-vault.py get --key OPENAI_API_KEY

# Inject to environment
credential-vault.py inject

# Test vault
credential-vault.py test
```

### Offload Operations
```bash
# Offload to Notion
credential-offload.sh notion <url> <session-id> [context]

# Offload via Gateway
credential-offload.sh gateway <session-id> <vram-used> [vram-total]

# Test offload
credential-offload.sh test
```

## 📁 File Structure

```
~/.credential-vault/
├── vault.key              # 256-bit AES key (NEVER commit)
├── credentials.enc        # Encrypted credential database
├── manifest.json          # Credential metadata
├── sync.log              # Sync operation log
└── offload.log           # Offload operation log

~/.copilot/credentials/
└── .env                  # Decrypted credentials for Copilot

~/.vibe/credentials/
└── .env                  # Decrypted credentials for Vibe

~/.gemini/credentials/
└── .env                  # Decrypted credentials for Gemini

~/.openclaw/credentials/
└── .env                  # Decrypted credentials for OpenClaw

~/.opencode/credentials/
└── .env                  # Decrypted credentials for OpenCode

~/diamondvault-notion-worker/.credentials/
├── credentials.enc.json  # Encrypted credential bundle
└── decrypt-credentials.js # Decryption helper

~/notion-ai-worker/.credentials/
├── credentials.enc.json  # Encrypted credential bundle
└── credential_vault.py   # Python decryption helper
```

## 🔍 Monitoring & Logs

### Sync Logs
```bash
# View sync history
tail -f ~/.credential-vault/sync.log

# Check systemd service status
systemctl status credential-vault-sync

# View service logs
journalctl -u credential-vault-sync -f
```

### Offload Logs
```bash
# View offload history
tail -f ~/.credential-vault/offload.log
```

### Verify Sync Status
```bash
# Check last sync time
cat ~/.credential-vault/manifest.json | jq '.synced_at'

# Verify AI CLI credentials
ls -l ~/.copilot/credentials/.env
ls -l ~/.vibe/credentials/.env
ls -l ~/.gemini/credentials/.env

# Verify worker credentials
ls -l ~/notion-ai-worker/.credentials/credentials.enc.json
```

## 🛡️ Security Best Practices

### 1. Protect Vault Key
```bash
# NEVER commit vault.key
echo ".credential-vault/vault.key" >> ~/.gitignore

# Backup key securely (encrypted)
gpg -c ~/.credential-vault/vault.key
# Store vault.key.gpg in secure location
```

### 2. Rotate Credentials
```bash
# Update credential in vault
credential-vault.sh store OPENAI_API_KEY "new-key" all

# Sync immediately
credential-vault.sh sync

# Verify rotation
credential-vault.sh get OPENAI_API_KEY
```

### 3. Audit Access
```bash
# Review sync log for unusual activity
grep "SYNC" ~/.credential-vault/sync.log

# Review offload log
grep "OFFLOAD" ~/.credential-vault/offload.log

# Check last sync time
credential-vault.sh list
```

### 4. Scope Restrictions
```bash
# Minimize credential exposure
# Use 'ai-cli' scope for CLI-only credentials
credential-vault.sh store MISTRAL_API_KEY "..." ai-cli

# Use 'workers' scope for worker-only credentials
credential-vault.sh store NOTION_TOKEN "..." workers
```

## 🧪 Testing

### Test Full Pipeline
```bash
# 1. Initialize vault
credential-vault.sh init
credential-vault.sh import

# 2. Verify storage
credential-vault.sh list

# 3. Test sync
credential-vault.sh sync

# 4. Verify AI CLI access
source ~/bin/load-ai-credentials.sh ~/.copilot/credentials
echo $OPENAI_API_KEY | head -c 10

# 5. Test Python client
credential-vault.py test

# 6. Test offload
credential-offload.sh test
```

### Test AI CLI Integration
```bash
# Copilot
source ~/bin/load-ai-credentials.sh ~/.copilot/credentials
env | grep -E "(OPENAI|LANGSMITH|MISTRAL)" | wc -l

# Vibe
source ~/bin/load-ai-credentials.sh ~/.vibe/credentials
env | grep MISTRAL_API_KEY

# Gemini
source ~/bin/load-ai-credentials.sh ~/.gemini/credentials
env | grep OPENAI_API_KEY
```

## 🚨 Troubleshooting

### Issue: Credentials not syncing
```bash
# Check vault status
credential-vault.sh list

# Re-sync manually
credential-vault.sh sync

# Check permissions
ls -la ~/.credential-vault/
```

### Issue: Decryption fails
```bash
# Verify vault key exists
ls -l ~/.credential-vault/vault.key

# Test decryption
credential-vault.sh get OPENAI_API_KEY

# Check Python vault
credential-vault.py test
```

### Issue: AI CLI can't access credentials
```bash
# Verify sync
ls -l ~/.copilot/credentials/.env

# Re-sync specific CLI
credential-vault.sh sync

# Check file permissions
stat ~/.copilot/credentials/.env
```

### Issue: Offload fails
```bash
# Check worker credentials
ls -l ~/notion-ai-worker/.credentials/

# Verify encryption
credential-vault.py load --worker-dir ~/notion-ai-worker

# Test connection
curl -X POST https://notion-bridge.iholt.workers.dev
```

## 📚 Integration Examples

### Example 1: Add New AI CLI
```bash
# 1. Add to AI_CLI_DIRS in credential-vault.sh
# 2. Sync credentials
credential-vault.sh sync

# 3. Source in new CLI startup
source ~/bin/load-ai-credentials.sh ~/.new-cli/credentials
```

### Example 2: Add New Credential
```bash
# Store new credential
credential-vault.sh store NEW_API_KEY "secret123" all

# Sync to all targets
credential-vault.sh sync

# Verify
credential-vault.sh get NEW_API_KEY
```

### Example 3: Worker Python Integration
```python
# In worker startup script
import sys
import os

# Add bin to path
sys.path.insert(0, os.path.expanduser('~/bin'))

# Import and load credentials
from credential_vault import CredentialVault

vault = CredentialVault()
vault.inject_to_env()

# Use credentials
print(f"✅ Loaded {len(vault.load_credentials())} credentials")

# Start worker with credentials
from worker import main
main()
```

## 🔗 Related Documentation

- [API_KEYS_SECURITY.md](API_KEYS_SECURITY.md) - API key security guidelines
- [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) - Environment configuration
- [NOTION_OBSERVABILITY_SUMMARY.md](NOTION_OBSERVABILITY_SUMMARY.md) - Notion worker setup

## 📋 Credential Inventory

Current credentials managed by vault:

| Credential | Scope | Used By |
|-----------|-------|---------|
| LANGSMITH_API_KEY | all | All AI CLIs, LangSmith tracing |
| OPENAI_API_KEY | all | All AI CLIs, OpenAI API |
| MISTRAL_API_KEY | ai-cli | Mistral Vibe CLI |
| APPSIGNAL_KEY | all | All services, APM monitoring |
| NOTION_TOKEN | workers | Notion workers |
| GC_NOTION_BRIDGE_URL | workers | Notion bridge worker |
| GC_SOUL_CAPSULE_DB_ID | workers | Soul capsule database |
| GATEWAY_SECRET | workers | Diamond Gateway auth |

## ✅ Status

- **Vault**: ✅ Initialized with AES-256-GCM encryption
- **AI CLI Sync**: ✅ Copilot, Vibe, Gemini, OpenClaw, OpenCode
- **Worker Sync**: ✅ Both Notion workers
- **Offload**: ✅ Gateway + Notion bridge integration
- **Python Client**: ✅ Full decryption support
- **Systemd Service**: ✅ Continuous sync daemon

**Last Updated**: 2024-05-14
