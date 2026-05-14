# EnidPinxit Partner Access Setup

**Status:** Partner Access Framework Ready  
**Partner:** EnidPinxit (GitHub: @EnidPinxit)  
**Access Method:** Notion-based ID and plan sharing  
**Soul-Capsule DB:** `21e416066ef1411084d1bbaf67af79d1`  
**Created:** 2026-05-14

---

## Overview

This document outlines the Notion-based partner access system for EnidPinxit, enabling collaboration through shared knowledge, session memory, and project plans.

## Access Architecture

### 1. Notion Soul-Capsule Database
- **Database ID:** `21e416066ef1411084d1bbaf67af79d1`
- **Purpose:** Stores VRAM offload events, session contexts, and knowledge capsules
- **Access Level:** Read-only for partners via Notion sharing

### 2. Access Control Method
EnidPinxit will access the workspace via Notion's native sharing features:
- **Share Type:** Database share with read permissions
- **Authentication:** Notion account-based (email: determined by partner)
- **Scope:** Soul-capsule database + welcome page + shared plans

---

## Setup Instructions

### Step 1: Share Soul-Capsule Database

```bash
# Manual action required (Notion web UI):
# 1. Open: https://notion.so/21e416066ef1411084d1bbaf67af79d1
# 2. Click "Share" in top right
# 3. Invite EnidPinxit's email with "Can view" permissions
# 4. Enable "Allow duplicate as template" for collaboration
```

**Share Link Generation:**
- Database view: `https://notion.so/21e416066ef1411084d1bbaf67af79d1`
- Public access (if enabled): Add `?v=<view_id>` for filtered views

### Step 2: Create Welcome Page for EnidPinxit

The welcome page template is below. To deploy:

1. **Via Notion Web UI:**
   - Navigate to the soul-capsule database parent page
   - Create new page titled "Welcome - EnidPinxit Partner Access"
   - Copy the welcome template content (see section below)
   - Share the page with EnidPinxit

2. **Via API (when NOTION_TOKEN is configured):**
```bash
# Set up local Notion token first
export NOTION_API_TOKEN="<your-integration-token>"

# Create welcome page
ntn pages create \
  --parent database:21e416066ef1411084d1bbaf67af79d1 \
  --title "Welcome - EnidPinxit Partner Access" \
  --content "$(cat ENIDPINXIT_WELCOME_PAGE.md)"
```

### Step 3: Configure Permissions

**Recommended Permission Structure:**

| Resource | Access Level | Rationale |
|----------|-------------|-----------|
| Soul-Capsule DB | Read (Can view) | View session offloads and context |
| Welcome Page | Read (Can view) | Onboarding instructions |
| Shared Plans | Read/Comment (Can comment) | Collaborate on project plans |
| Session Memory Pages | Read (Can view) | Access historical context |
| Private Gateway Configs | No access | Security boundary |

### Step 4: Enable Collaboration Features

**For EnidPinxit to collaborate effectively:**

1. **Database Views:** Create filtered views for partner-relevant content
   - View 1: "Recent Offloads" (last 30 days)
   - View 2: "High-Priority Sessions" (H > 8.5)
   - View 3: "Shared Knowledge Base"

2. **Comment Access:** Enable comments on shared pages for async communication

3. **Duplicate as Template:** Allow EnidPinxit to duplicate pages for their own workspace

---

## Access Patterns

### Pattern 1: Session Memory Access
EnidPinxit can view VRAM offload events and session contexts:

```
Database: Soul-Capsule (21e416066ef1411084d1bbaf67af79d1)
├── Session ID: test-001
│   ├── VRAM Usage: 9200 MiB / 10000 MiB
│   ├── Hamiltonian: 9.2
│   └── Context Blob: [model/layer info]
├── Session ID: test-002
│   └── ...
```

**Access Method:**
- Direct database link: `https://notion.so/21e416066ef1411084d1bbaf67af79d1`
- Filter by date, VRAM usage, or session ID
- Export as CSV for analysis

### Pattern 2: Knowledge Base Access
Shared knowledge pages linked from the soul-capsule database:

- Architecture documents (MCP, Gateway, Workers)
- API integration guides
- TRTC SDK documentation
- Deployment runbooks

**Access Method:**
- Navigate via database relations
- Search across shared workspace
- Backlink navigation for context

### Pattern 3: Plan Collaboration
EnidPinxit can view and comment on shared plans:

- Project roadmaps
- Feature specifications
- Integration proposals
- Technical RFCs

**Workflow:**
1. View shared plan page
2. Add comments with feedback
3. Reference session IDs from soul-capsule DB
4. Async collaboration via Notion

---

## Share Links

### Primary Resources

| Resource | Type | Link |
|----------|------|------|
| Soul-Capsule Database | Database | `https://notion.so/21e416066ef1411084d1bbaf67af79d1` |
| Welcome Page | Page | _TBD: Created in Step 2_ |
| Shared Plans Folder | Page | _TBD: Create as needed_ |

### View Links (with filters)

Create custom database views for EnidPinxit:

```bash
# Example: Recent high-VRAM sessions
Filter: VRAM Usage > 8500 AND Created Date < 30 days
URL: https://notion.so/21e416066ef1411084d1bbaf67af79d1?v=<view_id>
```

---

## Authentication Flow

### For EnidPinxit

1. **Receive Notion Invitation:**
   - Email invitation from workspace owner
   - Accept invitation via link
   - Log in to Notion account

2. **Access Shared Resources:**
   - Soul-capsule database appears in sidebar
   - Navigate to "Shared with you" section
   - Bookmark key pages for quick access

3. **Verification:**
   - Confirm database visibility
   - Test filtering and search
   - Verify read-only permissions (cannot edit)

### Security Boundaries

**EnidPinxit CANNOT:**
- Edit existing session entries
- Delete database records
- Access private gateway configurations
- View non-shared workspace pages

**EnidPinxit CAN:**
- Read all soul-capsule database entries
- Filter and export database views
- Comment on shared pages (if enabled)
- Duplicate pages to their own workspace

---

## Maintenance & Updates

### Regular Tasks

1. **Weekly:** Review shared content, ensure no sensitive data exposed
2. **Monthly:** Audit permissions, rotate access if needed
3. **As-needed:** Share new plans or knowledge base updates

### Access Revocation

If access needs to be revoked:

```bash
# Via Notion Web UI:
# 1. Open workspace settings
# 2. Navigate to "Members & guests"
# 3. Find EnidPinxit's email
# 4. Click "..." → "Remove from workspace"
```

---

## Next Steps

**Manual Actions Required:**

1. ✅ Framework and documentation created
2. ⏳ **TODO:** Share soul-capsule database with EnidPinxit's email
3. ⏳ **TODO:** Create and share welcome page (see template below)
4. ⏳ **TODO:** Create filtered views for partner-relevant content
5. ⏳ **TODO:** Send EnidPinxit the share links and access instructions

**For EnidPinxit:**

1. Accept Notion workspace invitation
2. Review welcome page
3. Explore soul-capsule database
4. Bookmark key resources
5. Test filtering and export features

---

## Support & Contact

**For Access Issues:**
- GitHub: Tag @diamondnode in issues
- Notion: Comment on welcome page
- Email: Workspace admin email (configured in Notion)

**Resources:**
- Diamond Gateway docs: `/opt/diamond-gateway/README.md`
- Notion Bridge worker: `~/genesis/notion-bridge/`
- GC-MCP integration: `~/gc-workers/AGENTS.md`

---

## Appendix: Technical Details

### Soul-Capsule Database Schema

```typescript
interface SoulCapsuleEntry {
  "Session ID": string;           // Title property
  "VRAM Usage": number;            // Number (MiB)
  "Context Blob": string;          // Rich text with code annotation
  "Hamiltonian": number;           // Calculated value
  "Timestamp": Date;               // Created time
  "VRAM Total": number;            // Number (MiB)
  "Action": "OFFLOAD" | "CONTINUE"; // Select property
}
```

### Worker Bridge Endpoint

EnidPinxit can understand the data flow:

```
Diamond Gateway (localhost:8000)
  ↓ POST /v1/orchestrate
  ↓ (H > 8.5 triggers OFFLOAD)
Notion Bridge Worker (notion-bridge.iholt.workers.dev)
  ↓ POST with session context
Notion API
  ↓ Create database entry
Soul-Capsule Database (21e416066ef1411084d1bbaf67af79d1)
  ↓ Shared with EnidPinxit
Partner Access ✅
```

### API Integration Example

If EnidPinxit wants to programmatically access (read-only):

```bash
# Requires Notion integration token (read-only scope)
curl https://api.notion.com/v1/databases/21e416066ef1411084d1bbaf67af79d1/query \
  -H "Authorization: Bearer $NOTION_TOKEN" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": {
      "property": "VRAM Usage",
      "number": {
        "greater_than": 8500
      }
    }
  }'
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-14  
**Status:** Ready for deployment (manual sharing steps required)
