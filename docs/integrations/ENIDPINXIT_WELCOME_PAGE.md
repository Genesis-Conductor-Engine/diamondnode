# Welcome, EnidPinxit! 👋

**Partner Access Activated**  
**Your Access Level:** Viewer (Read + Comment)  
**Workspace:** Diamond Vault / Ground Control MCP

---

## 🎯 What You Have Access To

Welcome to the Diamond Vault soul-capsule knowledge system. As a partner, you have access to:

### 1. **Soul-Capsule Database**
📊 [View Database →](https://notion.so/21e416066ef1411084d1bbaf67af79d1)

This database contains **session memory offloads** from our GPU gateway:
- **Session IDs:** Unique identifiers for each context
- **VRAM Metrics:** Usage stats when offload triggers
- **Context Blobs:** Serialized model/layer information
- **Hamiltonian Values:** Ising model calculations (H > 8.5 = offload)

**What this means:** When our GPU VRAM saturates (>85%), the system offloads session context to Notion for preservation. You can explore these "soul capsules" to understand our workload patterns and memory management.

### 2. **Shared Knowledge Base**
📚 Documentation and guides:
- Diamond Gateway architecture
- Notion Bridge worker implementation
- Ground Control MCP server design
- TRTC SDK integration patterns

### 3. **Collaboration Space**
💬 Comment on shared pages and participate in:
- Project planning discussions
- Architecture reviews
- Integration proposals

---

## 🚀 Getting Started

### Quick Navigation

| Resource | What It Is | Why It Matters |
|----------|------------|----------------|
| **Soul-Capsule DB** | VRAM offload events | See real-time GPU memory patterns |
| **Session Contexts** | Preserved model states | Understand our workload distribution |
| **Gateway Docs** | FastAPI gateway code | Learn the Ising Hamiltonian logic |
| **Bridge Worker** | Cloudflare Worker | See how data flows to Notion |

### Recommended First Steps

1. **Explore the Soul-Capsule Database**
   - Filter by date: See recent offloads
   - Sort by VRAM Usage: Find high-saturation events
   - Read Context Blobs: Understand what we're running

2. **Check Out the Knowledge Base**
   - Start with the architecture overview
   - Review the API integration guide
   - Explore TRTC SDK patterns (if relevant to your work)

3. **Bookmark Key Pages**
   - Add the soul-capsule DB to your favorites
   - Save this welcome page for reference
   - Bookmark any relevant documentation

---

## 🔍 How to Use This Access

### Pattern 1: Monitor GPU Workloads
Track VRAM offload frequency and patterns:

```
Filter: Created Date = Last 7 days
Sort: VRAM Usage (descending)
Result: High-saturation sessions
```

**Use Case:** Identify bottlenecks, optimize model scheduling, or plan GPU upgrades.

### Pattern 2: Session Context Analysis
Dive into specific session offloads:

```
1. Find interesting session ID
2. Read Context Blob (model/layer details)
3. Check Hamiltonian value (offload trigger threshold)
4. Comment with insights or questions
```

**Use Case:** Understand workload composition, propose optimizations, or collaborate on memory management.

### Pattern 3: Export for Analysis
Download database views as CSV:

```
1. Apply filters (date range, VRAM threshold, etc.)
2. Click "..." → "Export" → "CSV"
3. Analyze in your tools (Excel, Python, etc.)
```

**Use Case:** Time-series analysis, capacity planning, or reporting.

---

## 🧠 Understanding the System

### Architecture Overview

```
┌─────────────────────┐
│ Diamond Gateway     │  FastAPI on localhost:8000
│ (GPU Metrics)       │  Monitors VRAM via pynvml
└──────────┬──────────┘
           │ POST /v1/orchestrate
           │ (if H > 8.5)
           ▼
┌─────────────────────┐
│ Notion Bridge       │  Cloudflare Worker
│ Worker              │  Receives OFFLOAD payload
└──────────┬──────────┘
           │ Notion API
           │ Create entry
           ▼
┌─────────────────────┐
│ Soul-Capsule DB     │  Notion Database
│ (21e416066ef...79d1)│  ← You are here!
└─────────────────────┘
```

### Key Concepts

**Ising Hamiltonian (H):**
```
H(s) = (VRAM_Used / VRAM_Total) * 10
```
- H < 8.5: Continue processing
- H ≥ 8.5: Offload context to Notion
- Inspired by Ising spin model in physics

**Session Context:**
- Model name and configuration
- Layer state (if applicable)
- Inference parameters
- Timestamp and metadata

**Soul Capsule:**
- Our term for a preserved session context
- Think of it as a "memory snapshot" stored in Notion
- Enables session recovery and analysis

---

## 🛠️ Technical Details

### Database Schema

| Property | Type | Description |
|----------|------|-------------|
| **Session ID** | Title | Unique identifier (e.g., "test-001") |
| **VRAM Usage** | Number | Used memory in MiB at offload time |
| **VRAM Total** | Number | Total GPU memory in MiB |
| **Hamiltonian** | Number | Calculated H(s) value |
| **Context Blob** | Rich Text | Serialized session state (code format) |
| **Timestamp** | Date | When the offload occurred |
| **Action** | Select | "OFFLOAD" or "CONTINUE" |

### Programmatic Access (Optional)

If you want to query via API (read-only):

```bash
# Requires a Notion integration token (your own)
curl https://api.notion.com/v1/databases/21e416066ef1411084d1bbaf67af79d1/query \
  -H "Authorization: Bearer $YOUR_NOTION_TOKEN" \
  -H "Notion-Version: 2022-06-28" \
  -H "Content-Type: application/json" \
  -d '{"page_size": 10}'
```

**To get a token:**
1. Go to [notion.so/my-integrations](https://notion.so/my-integrations)
2. Create a new integration (read-only)
3. Share this database with your integration
4. Use the token in API requests

---

## 🤝 Collaboration Guidelines

### What You Can Do
✅ View all soul-capsule database entries  
✅ Filter, sort, and export database views  
✅ Comment on shared pages with feedback  
✅ Duplicate pages to your own workspace for notes  
✅ Ask questions via comments or GitHub issues  

### What You Cannot Do
❌ Edit or delete database entries  
❌ Access private gateway configurations  
❌ View non-shared workspace pages  
❌ Share this workspace with others (contact admin first)  

### Best Practices
- **Ask First:** If you want to reference soul-capsule data publicly, check with @diamondnode
- **Comment Liberally:** We welcome insights, questions, and suggestions
- **Export for Analysis:** Feel free to analyze offload patterns offline
- **Respect Privacy:** Some context blobs may contain internal model names—keep confidential

---

## 📞 Support & Contact

**Need Help?**
- **GitHub:** Tag @diamondnode in issues or discussions
- **Notion:** Comment on this welcome page
- **Email:** [Configured in workspace settings]

**Useful Resources:**
- Diamond Gateway: `/opt/diamond-gateway/gateway.py`
- Notion Bridge: `~/genesis/notion-bridge/src/index.ts`
- GC-MCP: `~/gc-workers/AGENTS.md`
- Architecture Docs: [Link to shared page]

**Found a Bug?**
Open an issue on GitHub with:
- Session ID (from soul-capsule DB)
- Timestamp of the offload
- Description of unexpected behavior

---

## 🎓 Learning Path

### Week 1: Explore & Understand
1. Browse the soul-capsule database
2. Read 5-10 recent offload entries
3. Identify patterns in VRAM usage
4. Comment with observations

### Week 2: Deep Dive
1. Pick an interesting session ID
2. Analyze the context blob
3. Understand the Hamiltonian calculation
4. Propose optimizations (via comments)

### Week 3: Collaborate
1. Review shared architecture docs
2. Participate in planning discussions
3. Suggest integration ideas
4. Export data for analysis (optional)

---

## 🔐 Security Note

This workspace uses Notion's native permissions system:
- Your access is **read-only** by default
- Comments are enabled for collaboration
- No sensitive credentials are stored in the database
- VRAM metrics and session IDs are safe to view

**If you need elevated access** (e.g., to create pages or edit entries), contact @diamondnode with your use case.

---

## 📊 Quick Stats

| Metric | Value |
|--------|-------|
| **Database ID** | `21e416066ef1411084d1bbaf67af79d1` |
| **Offload Threshold** | H ≥ 8.5 (85% VRAM saturation) |
| **Gateway Endpoint** | `localhost:8000/v1/orchestrate` |
| **Worker URL** | `notion-bridge.iholt.workers.dev` |
| **Your Access Level** | Viewer (Read + Comment) |

---

## 🚀 Next Steps

**Your Action Items:**

1. ✅ Read this welcome page (you're doing it!)
2. ⏳ Explore the soul-capsule database
3. ⏳ Bookmark key resources
4. ⏳ Leave a comment with your initial impressions
5. ⏳ Reach out if you have questions

**Our Action Items:**

1. ✅ Share database access with you
2. ✅ Create this welcome page
3. ⏳ Respond to your comments within 48 hours
4. ⏳ Share additional docs as needed
5. ⏳ Schedule a sync call if helpful (optional)

---

## 🎉 Welcome Aboard!

We're excited to collaborate with you, EnidPinxit. The soul-capsule system represents our approach to GPU memory management and session persistence—it's a living system that evolves with our workload.

Feel free to explore, ask questions, and share insights. We value your perspective and look forward to your contributions!

**Happy exploring! 🚀**

---

**Document Type:** Partner Welcome Page  
**Created:** 2026-05-14  
**Access Level:** Shared with EnidPinxit  
**Maintained By:** @diamondnode  
**Version:** 1.0
