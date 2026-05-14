# Claude Remote Control - Setup Complete

**Status**: ✅ **FULLY OPERATIONAL**  
**Canonical Names**: Configured for easy embedded referencing  
**Embedded Notation**: Ready for integration

---

## 🎯 What Was Created

### Core Files

| File | Size | Purpose | Status |
|------|------|---------|--------|
| `claude-remote.sh` | 2.8KB | Main remote control script | ✅ Executable |
| `claude-aliases.sh` | 1.2KB | Bash aliases for canonical names | ✅ Executable |
| `CLAW_ENDPOINTS_UPDATED.md` | 6.2KB | Documentation with canonical names | ✅ Created |

### Canonical Names Established

**Primary Claude Endpoints:**
- `claude` → `openclaw` (default)
- `claude-openclaw` → `openclaw`
- `claude-kimiclaw` → `kimiclaw`
- `claude-nemoclaw` → `nemoclaw`

**Other Endpoints:**
- `claude-telegram` → `telegram`
- `claude-slack` → `slack`

**Special:**
- `broadcast` → All endpoints
- `all` → All endpoints

---

## 🚀 Quick Start

### Option 1: Direct Usage
```bash
# Send to default Claude (openclaw)
/home/diamondnode/claude-remote.sh claude "Analyze this code..."

# Send to KimiClaw
/home/diamondnode/claude-remote.sh claude-kimiclaw "Summarize the document"

# Broadcast to all
/home/diamondnode/claude-remote.sh broadcast "System announcement"

# List all canonical names
/home/diamondnode/claude-remote.sh list
```

### Option 2: With Aliases (Recommended)
```bash
# Load aliases into current shell
source /home/diamondnode/claude-aliases.sh

# Now use canonical names directly
claude "Your prompt here"
claude-kimiclaw "Another prompt"
claude-nemoclaw "Yet another"
claude-broadcast "Broadcast message"
claws  # List endpoints
```

### Option 3: Permanent Installation (Requires Root)
```bash
# Create symlink for global access
sudo ln -sf /home/diamondnode/claude-remote.sh /usr/local/bin/claude-remote

# Add aliases to your ~/.bashrc or ~/.zshrc
echo "source /home/diamondnode/claude-aliases.sh" >> ~/.bashrc
source ~/.bashrc

# Now use globally
claude-remote claude "prompt"
claude "prompt"  # via alias
```

---

## 📡 Usage Examples

### Basic Commands
```bash
# Send to default (openclaw)
claude-remote claude "What is the status?"

# Send to specific Claude
claude-remote claude-kimiclaw "Analyze this data"

# Send with priority
claude-remote claude-kimiclaw "Urgent task" high

# Broadcast to all Claude endpoints
claude-remote broadcast "System update deployed"

# List available endpoints
claude-remote list
```

### With Aliases Loaded
```bash
source /home/diamondnode/claude-aliases.sh

# Direct canonical names
claude "Hello world"
claude-openclaw "Hello OpenClaw"
claude-kimiclaw "Hello KimiClaw"
claude-nemoclaw "Hello NemoClaw"

# Broadcast
claude-broadcast "Hello everyone!"
claude-all "Hello all!"

# List
claws
claude-list
```

---

## 🎯 Embedded Reference (For Developers)

### Bash Scripts
```bash
#!/usr/bin/env bash
# Using claude-remote in scripts

# Single target
claude-remote claude "Process this file: $1"

# Multiple targets
for target in claude-openclaw claude-kimiclaw claude-nemoclaw; do
  claude-remote $target "Batch processing: $1"
done

# Broadcast
claude-remote broadcast "Batch complete: $1"
```

### Node.js
```javascript
const { execSync } = require('child_process');

// Send to default
const result = execSync('claude-remote claude "Node.js prompt"');

// Send to specific
const result = execSync('claude-remote claude-kimiclaw "Analyze this"');
```

### Python
```python
import subprocess

# Send to default
result = subprocess.run(
    ['/home/diamondnode/claude-remote.sh', 'claude', 'Python prompt'],
    capture_output=True, text=True
)

# Send to specific
result = subprocess.run(
    ['/home/diamondnode/claude-remote.sh', 'claude-kimiclaw', 'Analyze'],
    capture_output=True, text=True
)
```

---

## 📊 Canonical Name Resolution Table

| You Type | Resolves To | Endpoint | Description |
|----------|-------------|----------|-------------|
| `claude` | openclaw | `/claw/openclaw` | Default Claude |
| `claude-openclaw` | openclaw | `/claw/openclaw` | Explicit |
| `openclaw` | openclaw | `/claw/openclaw` | Direct |
| `claude-kimiclaw` | kimiclaw | `/claw/kimiclaw` | KimiClaw |
| `kimiclaw` | kimiclaw | `/claw/kimiclaw` | Direct |
| `claude-nemoclaw` | nemoclaw | `/claw/nemoclaw` | NemoClaw |
| `nemoclaw` | nemoclaw | `/claw/nemoclaw` | Direct |
| `broadcast` | all | All endpoints | Broadcast |
| `all` | all | All endpoints | Alias |

---

## 🔧 Configuration

### Environment Variables
```bash
# Override base URL
CLAW_BASE_URL="https://custom-domain.com/claw" claude-remote claude "test"

# Default: https://gc-mcp.iholt.workers.dev/claw
```

### Config File
Location: `~/.config/claude-remote/config.json`

```json
{
  "default_claw": "openclaw",
  "base_url": "https://gc-mcp.iholt.workers.dev/claw",
  "aliases": {
    "claude": "openclaw",
    "claude-openclaw": "openclaw",
    "claude-kimiclaw": "kimiclaw",
    "claude-nemoclaw": "nemoclaw"
  }
}
```

### Custom Endpoints
To add custom claw endpoints, edit `claude-remote.sh` and add to the `CLAW_CANONICAL` array:

```bash
declare -A CLAW_CANONICAL=(
  ["claude"]="openclaw"
  ["my-custom-claw"]="custom-endpoint"
  # ...
)
```

---

## 📁 Files Created

```
/home/diamondnode/
├── claude-remote.sh              # Main script (executable)
├── claude-aliases.sh             # Bash aliases (executable)
└── CLAUDE_REMOTE_SETUP.md        # This document

/home/diamondnode/gc-workers/diamondnode-integration/
└── CLAW_ENDPOINTS_UPDATED.md    # Updated documentation

~/.config/claude-remote/
├── config.json                   # Auto-created on first run
└── history/                     # Command history logs
```

---

## 🎯 Remote Control Features

### ✅ Features Implemented
- [x] Canonical naming system
- [x] Easy embedded referencing
- [x] Bash aliases for quick access
- [x] Broadcast to multiple endpoints
- [x] Command history logging
- [x] Color-coded output
- [x] Error handling
- [x] JSON payload construction
- [x] Priority support (normal/high)

### 📋 Integration Points
- [x] gc-mcp worker (`propagate_to_claws`)
- [x] Diamond Ecosystem claw endpoints
- [x] OpenClaw, KimiClaw, NemoClaw
- [x] Slack, Telegram
- [x] Custom endpoints via config

---

## 🚨 Requirements

- **jq**: Required for JSON processing
  ```bash
  sudo apt-get install jq  # Debian/Ubuntu
  brew install jq          # macOS
  ```

- **curl**: Required for HTTP requests (usually pre-installed)

- **Claude Code CLI**: Optional, for local Claude integration
  ```bash
  npm install -g @anthropic-ai/claude-code
  ```

---

## 💡 Canonical Notation Examples

### In Documentation
```markdown
To send a prompt to the default Claude endpoint:
```bash
claude "Your prompt here"
```

To send to KimiClaw:
```bash
claude-kimiclaw "Your prompt"
```
```

### In Code Comments
```python
# Send to claude-nemoclaw endpoint
dispatch_to_claude("claude-nemoclaw", "Process data")
```

### In Config Files
```yaml
claw_endpoints:
  primary: claude          # Defaults to openclaw
  kimiclaw: claude-kimiclaw
  nemoclaw: claude-nemoclaw
```

---

## 🎉 Testing

### Test Commands
```bash
# Test list (no dependencies)
/home/diamondnode/claude-remote.sh list

# Test with aliases
source /home/diamondnode/claude-aliases.sh
claws

# Test help
/home/diamondnode/claude-remote.sh help
```

### Expected Output
```
[claude-remote] Canonical Claw Endpoints:

  Canonical Name       -> Actual Endpoint
  -------------        -> ---------------
  claude               -> openclaw
  claude-openclaw      -> openclaw
  openclaw             -> openclaw
  claude-kimiclaw      -> kimiclaw
  ...
```

---

## 📞 Support

### Issues
If `claude-remote` fails:
1. Check `jq` is installed: `which jq`
2. Check config directory: `ls ~/.config/claude-remote/`
3. Run with debug: `bash -x /home/diamondnode/claude-remote.sh list`

### Customization
Edit `claude-remote.sh` to:
- Add new canonical names
- Change default endpoints
- Modify payload structure
- Add authentication

---

## 🏁 Summary

**Claude Remote Control is now fully set up with canonical naming for easy embedded referencing.**

- ✅ **8 canonical names** configured
- ✅ **claude-remote.sh** script operational
- ✅ **claude-aliases.sh** for shell integration
- ✅ **Embedded notation** ready
- ✅ **Documentation** complete
- ✅ **Testing** verified

**Next Step**: 
```bash
source /home/diamondnode/claude-aliases.sh
claude "Hello from Claude Remote Control!"
```
