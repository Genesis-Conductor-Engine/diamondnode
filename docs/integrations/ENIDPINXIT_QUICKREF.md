# EnidPinxit Partner Access - Quick Reference

**Status:** ✅ Framework Complete (Manual Steps Required)  
**Date:** 2026-05-14  
**Partner:** EnidPinxit (@EnidPinxit on GitHub)

---

## 🎯 What's Been Created

### 1. Documentation
- **Setup Guide:** `~/ENIDPINXIT_PARTNER_ACCESS.md` (8.6 KB)
  - Complete access architecture
  - Step-by-step setup instructions
  - Authentication flow
  - Maintenance procedures

- **Welcome Page:** `~/ENIDPINXIT_WELCOME_PAGE.md` (9.1 KB)
  - Onboarding content for EnidPinxit
  - Navigation guide
  - Learning path
  - Collaboration guidelines

- **Setup Script:** `~/setup-enidpinxit-access.sh` (Executable)
  - Automated instructions
  - Health checks
  - Quick reference

### 2. Access Configuration

**Soul-Capsule Database:**
- **ID:** `21e416066ef1411084d1bbaf67af79d1`
- **URL:** https://notion.so/21e416066ef1411084d1bbaf67af79d1
- **Content:** VRAM offload events, session contexts, knowledge capsules

**Access Method:**
- Notion native sharing (account-based authentication)
- Permission level: Read + Comment
- Scope: Database + welcome page + shared plans

---

## 🚀 Next Steps (Manual Actions Required)

Since we don't have direct Notion API access configured locally, these steps must be completed manually via the Notion web UI:

### Step 1: Share Database
```
1. Open: https://notion.so/21e416066ef1411084d1bbaf67af79d1
2. Click "Share" button
3. Invite EnidPinxit's email with "Can view" permission
4. Enable "Allow duplicate as template"
5. Click "Invite"
```

### Step 2: Create Welcome Page
```
1. Navigate to workspace (parent of soul-capsule DB)
2. Create new page: "Welcome - EnidPinxit Partner Access"
3. Copy content from ~/ENIDPINXIT_WELCOME_PAGE.md
4. Paste into Notion page
5. Share with EnidPinxit (Can view)
```

### Step 3: Create Filtered Views
```
In soul-capsule database:
  - View 1: Recent Offloads (Last 30 days)
  - View 2: High-VRAM Sessions (VRAM > 8500)
  - View 3: Critical Offloads (H ≥ 8.5)
```

### Step 4: Send Access Info to EnidPinxit
```
Share via GitHub/Email:
  - Database link
  - Welcome page link
  - Copy of ~/ENIDPINXIT_PARTNER_ACCESS.md
```

---

## 📋 Share Links

**Primary Resources:**
- Soul-Capsule DB: `https://notion.so/21e416066ef1411084d1bbaf67af79d1`
- Welcome Page: _To be created in Step 2_
- Setup Guide: `~/ENIDPINXIT_PARTNER_ACCESS.md`

**For EnidPinxit:**
```
Notion Database URL:
https://notion.so/21e416066ef1411084d1bbaf67af79d1

Access Pattern:
1. Accept Notion invitation (email)
2. View soul-capsule database
3. Filter/sort/export as needed
4. Comment on shared pages
5. Collaborate via Notion
```

---

## 🔐 Permissions Summary

**EnidPinxit CAN:**
✅ View all soul-capsule database entries  
✅ Filter, sort, and export database views  
✅ Comment on shared pages  
✅ Duplicate pages to own workspace  
✅ Search across shared content  

**EnidPinxit CANNOT:**
❌ Edit or delete database entries  
❌ Access private gateway configs  
❌ View non-shared workspace pages  
❌ Share workspace with others  

---

## 🧪 Testing & Verification

**After setup, EnidPinxit should verify:**
1. Database is visible in Notion sidebar
2. Can view all entries (read-only)
3. Can filter by date, VRAM usage, session ID
4. Can export database views as CSV
5. Can comment on welcome page

**Troubleshooting:**
- If database not visible → Check email invitation
- If cannot access → Verify "Can view" permission set
- If 404 error → Confirm database ID is correct
- For support → Tag @diamondnode on GitHub

---

## 📊 Access Architecture

```
┌─────────────────────────────────────────┐
│ Diamond Gateway (GPU Metrics)           │
│ localhost:8000/v1/orchestrate           │
└───────────────┬─────────────────────────┘
                │ H > 8.5 (OFFLOAD trigger)
                ▼
┌─────────────────────────────────────────┐
│ Notion Bridge Worker                    │
│ notion-bridge.iholt.workers.dev         │
└───────────────┬─────────────────────────┘
                │ Notion API (create entry)
                ▼
┌─────────────────────────────────────────┐
│ Soul-Capsule Database                   │
│ 21e416066ef1411084d1bbaf67af79d1        │
│                                          │
│ ┌────────────────────────────────────┐ │
│ │ Shared with EnidPinxit             │ │
│ │ Permission: Can view + Comment     │ │
│ │ Scope: All entries, filtered views │ │
│ └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 🛠️ Technical Context

**System Components:**
- **Diamond Gateway:** `/opt/diamond-gateway/gateway.py`
- **Notion Bridge:** `~/genesis/notion-bridge/src/index.ts`
- **Worker URL:** `https://notion-bridge.iholt.workers.dev`
- **Database ID:** `21e416066ef1411084d1bbaf67af79d1`

**Ising Hamiltonian Logic:**
```python
H(s) = (VRAM_Used / VRAM_Total) * 10
if H >= 8.5:
    action = "OFFLOAD"  # Preserve session to Notion
else:
    action = "CONTINUE"
```

**Database Schema:**
```typescript
{
  "Session ID": string,      // Title
  "VRAM Usage": number,       // MiB
  "VRAM Total": number,       // MiB
  "Hamiltonian": number,      // H(s) value
  "Context Blob": string,     // Serialized state
  "Timestamp": Date,          // Created time
  "Action": "OFFLOAD" | "CONTINUE"
}
```

---

## 📞 Support

**For EnidPinxit:**
- GitHub: Tag @diamondnode in issues
- Notion: Comment on welcome page
- Questions: Open discussion on GitHub

**For Maintainers:**
- Run setup script: `~/setup-enidpinxit-access.sh`
- Review docs: `~/ENIDPINXIT_PARTNER_ACCESS.md`
- Update access: Notion web UI (share settings)

---

## ✅ Completion Checklist

**Framework Setup (Complete):**
- [x] Documentation created
- [x] Welcome page template ready
- [x] Setup script executable
- [x] Access architecture documented
- [x] Share links prepared

**Manual Steps (Pending):**
- [ ] Share soul-capsule database with EnidPinxit
- [ ] Create welcome page in Notion
- [ ] Create filtered database views
- [ ] Send access info to EnidPinxit
- [ ] Verify EnidPinxit can access database

**SQL Todo Update:**
```sql
-- When manual steps complete:
UPDATE todos SET status = 'done', updated_at = CURRENT_TIMESTAMP 
WHERE id = 'enidpinxit-integration';
```

---

## 📚 Related Resources

**Documentation:**
- `~/ENIDPINXIT_PARTNER_ACCESS.md` - Full setup guide
- `~/ENIDPINXIT_WELCOME_PAGE.md` - Welcome content
- `~/setup-enidpinxit-access.sh` - Setup script
- `~/gc-workers/AGENTS.md` - GC-MCP integration
- `~/genesis/notion-bridge/` - Worker implementation

**Notion Resources:**
- Database: https://notion.so/21e416066ef1411084d1bbaf67af79d1
- Worker: https://notion-bridge.iholt.workers.dev
- API Docs: https://developers.notion.com

---

**Document Version:** 1.0  
**Last Updated:** 2026-05-14  
**Maintained By:** @diamondnode  
**Status:** Ready for manual deployment
