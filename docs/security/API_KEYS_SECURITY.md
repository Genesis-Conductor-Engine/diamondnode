# 🔐 API Keys & Environment Variables Security Guide

**Generated**: 2026-05-12  
**Critical**: Read this entire document before using API keys

---

## 🚨 **URGENT SECURITY WARNING**

### Your LangSmith API Key is Exposed

The LangSmith API key you shared has been exposed in our conversation:

```
lsv2_pt_REDACTED
```

**⚠️ IMMEDIATE ACTION REQUIRED:**

1. **Rotate this key immediately** at https://smith.langchain.com/settings
2. **Never share API keys in chat, messages, or public channels**
3. **Check if this key was used in any public repositories** (GitHub, GitLab, etc.)
4. **Review LangSmith audit logs** for any unauthorized access

---

## 📂 Environment Configuration

### Files Created

1. **`~/.env`** - Main environment file (NEVER COMMIT)
2. **`~/.gitignore`** - Global git ignore rules
3. **`~/load-env.sh`** - Environment loader script

### Current Configuration Status

| Variable | Status | Action Required |
|----------|--------|-----------------|
| `LANGSMITH_API_KEY` | ⚠️ **EXPOSED** | **Rotate immediately** |
| `LANGSMITH_PROJECT` | ✅ Set | Ready |
| `LANGSMITH_TRACING` | ✅ Set | Ready |
| `OPENAI_API_KEY` | ❌ Not set | Add your key |
| `GC_MCP_URL` | ✅ Set | Ready |
| `GC_SOUL_CAPSULE_DB_ID` | ✅ Set | Ready |

---

## 🔧 Setup Instructions

### Step 1: Rotate LangSmith API Key

1. Go to https://smith.langchain.com/settings
2. Navigate to **API Keys**
3. Delete the exposed key: `lsv2_pt_REDACTED`
4. Create a new API key
5. Update `~/.env`:
   ```bash
   nano ~/.env
   # Update LANGSMITH_API_KEY with new value
   ```

### Step 2: Add OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Create a new API key (or use existing)
3. Update `~/.env`:
   ```bash
   nano ~/.env
   # Replace: OPENAI_API_KEY=your-openai-api-key-here
   # With: OPENAI_API_KEY=sk-proj-...
   ```

### Step 3: Verify Configuration

```bash
# Load environment variables
source ~/load-env.sh

# Check if variables are loaded
echo $LANGSMITH_API_KEY   # Should show new key
echo $OPENAI_API_KEY      # Should show your key
```

---

## 🛡️ Security Best Practices

### DO ✅

1. **Use environment variables** for all secrets
2. **Add .env to .gitignore** (already done)
3. **Use different keys** for development and production
4. **Rotate keys regularly** (every 90 days minimum)
5. **Use key prefixes** to identify leaked keys (OpenAI: `sk-`, LangSmith: `lsv2_`)
6. **Monitor usage** in service dashboards
7. **Set spending limits** on API accounts
8. **Use least privilege** (minimal permissions for each key)

### DON'T ❌

1. **Never commit .env files** to git
2. **Never share keys in chat or messages**
3. **Never hardcode keys in source code**
4. **Never screenshot keys**
5. **Never email keys in plain text**
6. **Never store keys in public notes** (Notion, Google Docs, etc.)
7. **Never use production keys in development**
8. **Never reuse keys across services**

---

## 📋 Key Rotation Checklist

When rotating a key, follow this checklist:

- [ ] 1. Generate new key in service dashboard
- [ ] 2. Update `~/.env` with new key
- [ ] 3. Test new key locally: `source ~/load-env.sh`
- [ ] 4. Update all services using the key
- [ ] 5. Delete old key from service dashboard
- [ ] 6. Update documentation
- [ ] 7. Notify team members (if applicable)

---

## 🔑 Service-Specific Instructions

### LangSmith

**Dashboard**: https://smith.langchain.com  
**Settings**: https://smith.langchain.com/settings  
**Projects**: https://smith.langchain.com/projects

**Create API Key**:
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Name: `diamondnode-production`
4. Copy the key (shown only once)
5. Add to `~/.env`

**View Traces**:
```bash
# After enabling LANGSMITH_TRACING=true
# Visit: https://smith.langchain.com/projects/diamondnode
```

---

### OpenAI

**Dashboard**: https://platform.openai.com  
**API Keys**: https://platform.openai.com/api-keys  
**Usage**: https://platform.openai.com/usage

**Create API Key**:
1. Go to API Keys
2. Click "Create new secret key"
3. Name: `diamondnode`
4. Permissions: All (or customize)
5. Copy the key (shown only once)
6. Add to `~/.env`

**Set Spending Limit**:
1. Go to Settings → Billing
2. Set hard limit (e.g., $50/month)
3. Enable email alerts at 75% usage

**Check Usage**:
```bash
# After adding OPENAI_API_KEY
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

---

### TRTC SDK (Tencent)

**Console**: https://console.cloud.tencent.com/trtc  
**UserSig Tool**: https://console.cloud.tencent.com/trtc/usersigtool

**Get Credentials**:
1. Go to TRTC Console
2. Select your application
3. Copy `SDKAppID`
4. Get `SecretKey` from App Info
5. Add to `~/.env`:
   ```bash
   TRTC_SDK_APP_ID=your-sdk-app-id
   TRTC_SECRET_KEY=your-secret-key
   ```

**Generate UserSig**:
- **Development**: Use UserSig Tool (temporary)
- **Production**: Generate server-side using SDK

---

## 🌐 Usage in Different Environments

### Python (Diamond Gateway)

```python
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv(os.path.expanduser('~/.env'))

# Access variables
langsmith_key = os.getenv('LANGSMITH_API_KEY')
openai_key = os.getenv('OPENAI_API_KEY')

# LangSmith tracing
os.environ['LANGSMITH_TRACING'] = 'true'
```

### Node.js / JavaScript

```javascript
import 'dotenv/config';
// or
require('dotenv').config({ path: require('path').join(require('os').homedir(), '.env') });

// Access variables
const langsmithKey = process.env.LANGSMITH_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
```

### Bash Scripts

```bash
#!/bin/bash

# Load environment
source ~/load-env.sh

# Use variables
echo "LangSmith Project: $LANGSMITH_PROJECT"
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"Hello"}]}'
```

---

## 🚀 Integration Examples

### Diamond Gateway with LangSmith Tracing

```python
# /opt/diamond-gateway/gateway.py
import os
from dotenv import load_dotenv
from langsmith import Client

# Load environment
load_dotenv(os.path.expanduser('~/.env'))

# Enable tracing
if os.getenv('LANGSMITH_TRACING') == 'true':
    client = Client(api_key=os.getenv('LANGSMITH_API_KEY'))
    print(f"✅ LangSmith tracing enabled for project: {os.getenv('LANGSMITH_PROJECT')}")
```

### TRTC Demo with Environment Variables

```javascript
// ~/trtc-projects/enid-diamondnode-intro/src/index.js
import 'dotenv/config';

const CONFIG = {
  sdkAppId: parseInt(process.env.TRTC_SDK_APP_ID),
  secretKey: process.env.TRTC_SECRET_KEY,
};

// Generate userSig server-side using secretKey
function generateUserSig(userId) {
  // Use TRTC SDK to generate userSig
  // Never expose secretKey to client
}
```

### OpenAI Integration

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function chat(message) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: message }],
  });
  return response.choices[0].message.content;
}
```

---

## 🔍 Monitoring & Auditing

### Check for Exposed Keys

**GitHub Secret Scanning**:
- GitHub automatically scans for leaked keys
- Check: https://github.com/settings/security_analysis

**Manual Search**:
```bash
# Search for potential leaks in git history
git log -S "lsv2_pt_" --all
git log -S "sk-proj-" --all
git log -S "LANGSMITH_API_KEY" --all
```

**Online Tools**:
- GitHub Secret Scanning Alerts
- GitGuardian
- TruffleHog

### Monitor API Usage

**LangSmith**:
- Dashboard: https://smith.langchain.com/projects/diamondnode
- View traces, errors, and token usage

**OpenAI**:
- Usage: https://platform.openai.com/usage
- Set up billing alerts

**TRTC**:
- Console: https://console.cloud.tencent.com/trtc
- Check minutes used, bandwidth

---

## ⚙️ Environment Variables Reference

### LangSmith

| Variable | Required | Description |
|----------|----------|-------------|
| `LANGSMITH_TRACING` | No | Enable tracing (`true`/`false`) |
| `LANGSMITH_ENDPOINT` | No | API endpoint (default: https://api.smith.langchain.com) |
| `LANGSMITH_API_KEY` | Yes* | API key for authentication |
| `LANGSMITH_PROJECT` | Yes* | Project name for organizing traces |

*Required if `LANGSMITH_TRACING=true`

### OpenAI

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | API key (starts with `sk-`) |
| `OPENAI_ORG_ID` | No | Organization ID |
| `OPENAI_MODEL` | No | Default model (e.g., `gpt-4-turbo-preview`) |

### Diamondnode Services

| Variable | Service | Description |
|----------|---------|-------------|
| `GATEWAY_SECRET` | Diamond Gateway | API auth token |
| `GC_MCP_URL` | GC-MCP | MCP server URL |
| `GC_API_KEY` | GC-MCP | API key for dispatch |
| `NOTION_TOKEN` | Notion Bridge | Notion API token |
| `GC_SOUL_CAPSULE_DB_ID` | Notion | Database ID |
| `TRTC_SDK_APP_ID` | TRTC Demo | SDK application ID |
| `TRTC_SECRET_KEY` | TRTC Demo | Secret key for userSig |

---

## 📱 Emergency Response Plan

### If API Key is Leaked

1. **Immediate Actions** (within 5 minutes):
   - [ ] Rotate the key immediately
   - [ ] Check usage logs for unauthorized access
   - [ ] Disable old key

2. **Investigation** (within 1 hour):
   - [ ] Search git history for key exposure
   - [ ] Check GitHub for accidental commits
   - [ ] Review audit logs for suspicious activity
   - [ ] Estimate potential damage (API calls, costs)

3. **Mitigation** (within 24 hours):
   - [ ] Update all services with new key
   - [ ] Contact service provider if billing spike detected
   - [ ] Document the incident
   - [ ] Update security procedures

4. **Prevention** (within 1 week):
   - [ ] Add pre-commit hooks to prevent key commits
   - [ ] Enable GitHub secret scanning
   - [ ] Implement key rotation policy
   - [ ] Train team on security best practices

---

## 📞 Support Resources

### LangSmith Support
- Documentation: https://docs.smith.langchain.com
- Discord: https://discord.gg/langchain
- Email: support@langchain.com

### OpenAI Support
- Documentation: https://platform.openai.com/docs
- Help: https://help.openai.com
- Forum: https://community.openai.com

### TRTC Support
- Documentation: https://cloud.tencent.com/document/product/647
- Console: https://console.cloud.tencent.com/trtc

---

## ✅ Final Checklist

Before going to production:

- [ ] All API keys rotated (no exposed keys)
- [ ] `.env` file created with correct values
- [ ] `.gitignore` configured globally
- [ ] `load-env.sh` working correctly
- [ ] Spending limits set on all services
- [ ] Monitoring and alerts configured
- [ ] Team trained on security practices
- [ ] Incident response plan documented
- [ ] Regular key rotation schedule established
- [ ] Audit logs reviewed

---

## 🔗 Quick Links

- **Environment File**: `~/.env`
- **Loader Script**: `~/load-env.sh`
- **Global Gitignore**: `~/.gitignore`
- **LangSmith Dashboard**: https://smith.langchain.com/projects/diamondnode
- **OpenAI Dashboard**: https://platform.openai.com
- **TRTC Console**: https://console.cloud.tencent.com/trtc

---

**Last Updated**: 2026-05-12  
**Status**: ⚠️ **CRITICAL - Rotate LangSmith key immediately**
