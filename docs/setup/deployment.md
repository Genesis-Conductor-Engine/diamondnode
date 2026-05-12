# Task 1: Push & Deploy - Authentication Needed

## Status: ⚠️ Requires Setup

### Git Remote - Not Configured

**Current State**:
```bash
cd ~/diamond-node
git remote -v
# (no output - no remote configured)
```

**To Configure**:
```bash
cd ~/diamond-node

# Option 1: GitHub
git remote add origin https://github.com/YOUR_USERNAME/diamond-node.git
# or
git remote add origin git@github.com:YOUR_USERNAME/diamond-node.git

# Option 2: GitLab
git remote add origin https://gitlab.com/YOUR_USERNAME/diamond-node.git

# Option 3: Other Git hosting
git remote add origin YOUR_REPO_URL

# Then push
git push -u origin main
```

---

### Cloudflare Workers - Not Authenticated

**Current State**:
```bash
npx wrangler whoami
# You are not authenticated. Please run `wrangler login`.
```

**To Configure**:
```bash
# Option 1: Login via browser (recommended)
npx wrangler login

# Option 2: Use API token
npx wrangler login --scopes-list
export CLOUDFLARE_API_TOKEN=your-token-here
```

**Wrangler Configuration**:
```toml
# wrangler.toml
name = "gc-diamond-node"
main = "src/index.ts"
compatibility_date = "2024-05-24"

[vars]
NODE_VERSION = "0.1.0"
NODE_ID = "diamond-node"
KEY_ID = "dn-2026-05"

[[routes]]
pattern = "dn.genesisconductor.io/*"
zone_name = "genesisconductor.io"
```

**Deployment Target**: `dn.genesisconductor.io`

---

### Secrets Required Before Deploy

```bash
# After wrangler login, set these secrets:
npx wrangler secret put DIAMOND_NODE_ED25519_PRIV   # base64 PKCS#8
npx wrangler secret put DIAMOND_NODE_ED25519_PUB    # base64 SPKI
npx wrangler secret put DIAMOND_VAULT_AUDIT_URL     # https://...
```

---

### Once Configured - Deploy Commands

```bash
cd ~/diamond-node

# 1. Push to git remote
git push origin main

# 2. Deploy to Cloudflare (dry run first)
npm run deploy:dry

# 3. Deploy to production
npm run deploy

# 4. Verify deployment
curl https://dn.genesisconductor.io/health
```

---

## Summary

**Status**: Awaiting authentication setup

**Required Actions**:
1. ⚠️ Configure git remote
2. ⚠️ Run `npx wrangler login`
3. ⚠️ Set Wrangler secrets (3 secrets)
4. ✅ Then deploy with `npm run deploy`

**Ready**: Code is committed and clean, just needs auth

---

**Next**: Proceeding with Tasks 2-4 (MCP Inspector, VRAM optimization, test investigation)
