# Diamondnode Server Setup - Task List for Claw Automation Handoff

**Generated**: 2026-05-12 09:20 UTC
**Target**: Full automation readiness for openclaw, kimiclaw, nemoclaw
**Status**: Pre-Production Setup Phase

---

## 🎯 **Mission Objective**

Prepare diamondnode server for full automation handoff to:
- **openclaw**: Primary orchestration and task dispatch
- **kimiclaw**: Knowledge integration and memory management
- **nemoclaw**: Network monitoring and external coordination

---

## 📋 **Task Categories**

1. [Authentication & Access](#1-authentication--access) - **5 tasks**
2. [Infrastructure & Services](#2-infrastructure--services) - **7 tasks**
3. [Security & Secrets](#3-security--secrets) - **6 tasks**
4. [API Integrations](#4-api-integrations) - **8 tasks**
5. [Monitoring & Observability](#5-monitoring--observability) - **6 tasks**
6. [Documentation](#6-documentation) - **4 tasks**
7. [Testing & Validation](#7-testing--validation) - **8 tasks**
8. [Claw-Specific Setup](#8-claw-specific-setup) - **9 tasks**

**Total**: **53 tasks** across 8 categories

---

## 1. Authentication & Access

### Critical (5 tasks)

- [ ] **1.1** Configure git remote for `~/diamond-node` repository
  - **Owner**: Human operator
  - **Estimate**: 5 min
  - **Blockers**: Requires GitHub/GitLab credentials
  - **Command**: `cd ~/diamond-node && git remote add origin <URL>`
  - **Validation**: `git remote -v` shows origin

- [ ] **1.2** Authenticate Wrangler CLI for Cloudflare deployments
  - **Owner**: Human operator
  - **Estimate**: 5 min
  - **Blockers**: Requires Cloudflare account access
  - **Command**: `npx wrangler login`
  - **Validation**: `npx wrangler whoami` shows account

- [ ] **1.3** Configure SSH keys for claw agents (openclaw, kimiclaw, nemoclaw)
  - **Owner**: DevOps
  - **Estimate**: 30 min
  - **Location**: `~/.ssh/authorized_keys`
  - **Validation**: Each claw can SSH without password

- [ ] **1.4** Set up API key rotation schedule (90-day cycle)
  - **Owner**: Security team
  - **Estimate**: 2 hours
  - **Dependencies**: Calendar reminders, rotation procedures
  - **Validation**: Documented process in `~/API_KEYS_SECURITY.md`

- [ ] **1.5** Configure service account for automated deployments
  - **Owner**: DevOps
  - **Estimate**: 1 hour
  - **Services**: GitHub Actions, Cloudflare, Notion
  - **Validation**: Service account can deploy without human intervention

---

## 2. Infrastructure & Services

### Critical (4 tasks)

- [ ] **2.1** Expose Diamond Gateway to public internet (currently localhost only)
  - **Current**: `127.0.0.1:8000`
  - **Target**: `https://gateway.diamondnode.com` or similar
  - **Owner**: Network admin
  - **Estimate**: 2 hours
  - **Requirements**:
    - Nginx reverse proxy with SSL
    - Firewall rules (port 443)
    - DNS A record
  - **Validation**: `curl https://gateway.diamondnode.com/health` returns 200

- [ ] **2.2** Deploy diamond-node Cloudflare Worker to production
  - **Current**: Not deployed
  - **Target**: `https://dn.genesisconductor.io`
  - **Owner**: DevOps
  - **Estimate**: 30 min
  - **Blockers**: Task 1.2 (Wrangler auth), Task 3.3 (Worker secrets)
  - **Command**: `cd ~/diamond-node && npm run deploy`
  - **Validation**: `curl https://dn.genesisconductor.io/healthz` returns 200

- [ ] **2.3** Configure systemd service for diamondnode-integration daemon
  - **Current**: Running manually
  - **Target**: Auto-start on boot
  - **Owner**: DevOps
  - **Estimate**: 1 hour
  - **Config**: `/etc/systemd/system/diamondnode-integration.service`
  - **Validation**: `sudo systemctl status diamondnode-integration` shows active

- [ ] **2.4** Set up automatic restart for Diamond Gateway on crash
  - **Current**: Manual restart required
  - **Target**: Systemd restart policy
  - **Owner**: DevOps
  - **Estimate**: 15 min
  - **Config**: Add `Restart=always` to systemd service
  - **Validation**: Kill process, check it restarts within 10s

### High Priority (3 tasks)

- [ ] **2.5** Configure backup strategy for state files
  - **Files**: `~/diamond-node/state/*.json`, HANDOFF files
  - **Owner**: DevOps
  - **Estimate**: 2 hours
  - **Strategy**: Daily rsync to backup server
  - **Validation**: Backup files exist in remote location

- [ ] **2.6** Set up log rotation for all services
  - **Services**: Diamond Gateway, diamondnode-integration, Ollama
  - **Owner**: DevOps
  - **Estimate**: 1 hour
  - **Config**: `/etc/logrotate.d/diamondnode`
  - **Validation**: Logs rotate daily, keep 30 days

- [ ] **2.7** Configure health check endpoints for all services
  - **Services**: Gateway, Worker, GC-MCP, Notion Bridge
  - **Owner**: DevOps
  - **Estimate**: 2 hours
  - **Tool**: UptimeRobot or similar
  - **Validation**: Receive alert when service down

---

## 3. Security & Secrets

### Critical (6 tasks)

- [ ] **3.1** Rotate exposed LangSmith API key
  - **Status**: ⚠️ **EXPOSED IN CONVERSATION**
  - **Owner**: Human operator
  - **Estimate**: 5 min
  - **Priority**: **CRITICAL - DO IMMEDIATELY**
  - **Command**: Visit https://smith.langchain.com/settings
  - **Validation**: New key in `~/.env`, old key deleted

- [ ] **3.2** Add OpenAI API key to environment
  - **Status**: Placeholder in `~/.env`
  - **Owner**: Human operator
  - **Estimate**: 2 min
  - **Command**: `nano ~/.env` and replace placeholder
  - **Validation**: `echo $OPENAI_API_KEY` shows real key

- [ ] **3.3** Configure Cloudflare Worker secrets for diamond-node
  - **Secrets needed**:
    - `DIAMOND_NODE_ED25519_PRIV` (base64 PKCS#8)
    - `DIAMOND_NODE_ED25519_PUB` (base64 SPKI)
    - `DIAMOND_VAULT_AUDIT_URL` (https://...)
  - **Owner**: Security team
  - **Estimate**: 30 min
  - **Command**: `cd ~/diamond-node && npx wrangler secret put <KEY>`
  - **Validation**: `npx wrangler secret list` shows all 3

- [ ] **3.4** Generate Ed25519 keypair for diamond-node identity
  - **Status**: Not generated
  - **Owner**: Security team
  - **Estimate**: 15 min
  - **Command**: `cd ~/diamond-node && npm run gen-identity`
  - **Validation**: Keys present in output, securely stored

- [ ] **3.5** Configure firewall rules for diamondnode server
  - **Allow**: 22 (SSH), 443 (HTTPS), 8000 (Gateway - local only)
  - **Deny**: All other inbound
  - **Owner**: Network admin
  - **Estimate**: 30 min
  - **Tool**: `ufw` or `iptables`
  - **Validation**: `sudo ufw status` shows rules

- [ ] **3.6** Set up fail2ban for SSH brute-force protection
  - **Status**: Not configured
  - **Owner**: Security team
  - **Estimate**: 30 min
  - **Config**: `/etc/fail2ban/jail.local`
  - **Validation**: `sudo fail2ban-client status sshd`

---

## 4. API Integrations

### Critical (4 tasks)

- [ ] **4.1** Verify Notion API integration and database permissions
  - **Database ID**: `21e416066ef1411084d1bbaf67af79d1`
  - **Owner**: Integration team
  - **Estimate**: 30 min
  - **Test**: Write test page to soul-capsule database
  - **Validation**: Page appears in Notion with correct properties

- [ ] **4.2** Test GC-MCP tool execution end-to-end
  - **Tools to test**: All 5 MCP tools
  - **Owner**: Integration team
  - **Estimate**: 1 hour
  - **Method**: Use MCP Inspector
  - **Validation**: Each tool executes successfully

- [ ] **4.3** Configure webhook endpoints for claw agents
  - **Claws**: openclaw, kimiclaw, nemoclaw
  - **Owner**: Integration team
  - **Estimate**: 2 hours
  - **Endpoints**: Define URLs for each claw
  - **Validation**: POST to each endpoint returns 200

- [ ] **4.4** Set up TRTC credentials for video communication
  - **Service**: Tencent RTC
  - **Owner**: Integration team
  - **Estimate**: 30 min
  - **Location**: `~/.env` (TRTC_SDK_APP_ID, TRTC_SECRET_KEY)
  - **Validation**: TRTC demo connects successfully

### High Priority (4 tasks)

- [ ] **4.5** Test Diamond Gateway VRAM orchestration flow
  - **Test**: Mock VRAM overflow → Notion offload
  - **Owner**: QA team
  - **Estimate**: 1 hour
  - **Validation**: OFFLOAD action triggers, Notion page created

- [ ] **4.6** Configure LangSmith project for production tracing
  - **Project**: diamondnode
  - **Owner**: MLOps team
  - **Estimate**: 30 min
  - **Validation**: Traces appear in LangSmith dashboard

- [ ] **4.7** Set up OpenAI rate limiting and quotas
  - **Limit**: Define acceptable $/month
  - **Owner**: Finance + Engineering
  - **Estimate**: 30 min
  - **Config**: OpenAI dashboard billing settings
  - **Validation**: Hard limit configured, alerts enabled

- [ ] **4.8** Test propagate_to_claws MCP tool with all targets
  - **Targets**: slack, telegram, openclaw, kimiclaw, nemoclaw
  - **Owner**: Integration team
  - **Estimate**: 1 hour
  - **Validation**: Each target receives payload correctly

---

## 5. Monitoring & Observability

### Critical (3 tasks)

- [ ] **5.1** Set up GPU monitoring dashboard (Grafana/Prometheus)
  - **Metrics**: VRAM, temp, power, Hamiltonian
  - **Owner**: DevOps
  - **Estimate**: 4 hours
  - **Source**: Diamond Gateway `/metrics` endpoint
  - **Validation**: Dashboard shows real-time GPU metrics

- [ ] **5.2** Configure alerting for critical thresholds
  - **Alerts**:
    - VRAM H(s) > 8.5 (90% saturation)
    - GPU temp > 85°C
    - Service down > 5 minutes
  - **Owner**: DevOps
  - **Estimate**: 2 hours
  - **Channels**: Email, Slack, PagerDuty
  - **Validation**: Test alert fires and notifies correctly

- [ ] **5.3** Enable LangSmith tracing for all LLM calls
  - **Services**: All Qwen/OpenAI API calls
  - **Owner**: MLOps team
  - **Estimate**: 2 hours
  - **Config**: Add tracing to inference code
  - **Validation**: Traces appear in LangSmith project

### High Priority (3 tasks)

- [ ] **5.4** Set up centralized logging (ELK or Loki)
  - **Services**: All diamondnode services
  - **Owner**: DevOps
  - **Estimate**: 6 hours
  - **Stack**: Elasticsearch + Kibana or Loki + Grafana
  - **Validation**: Can query logs across all services

- [ ] **5.5** Create status page for public services
  - **Services**: Gateway, Worker, GC-MCP, Notion Bridge
  - **Owner**: DevOps
  - **Estimate**: 2 hours
  - **Tool**: Statuspage.io or self-hosted
  - **Validation**: Public URL shows service status

- [ ] **5.6** Implement distributed tracing (Jaeger/Zipkin)
  - **Trace**: Request flow across all services
  - **Owner**: DevOps
  - **Estimate**: 4 hours
  - **Validation**: Can trace request from Gateway → Notion

---

## 6. Documentation

### Critical (2 tasks)

- [ ] **6.1** Create runbook for common operations
  - **Topics**:
    - Service restart procedures
    - Emergency VRAM offload
    - Key rotation
    - Deployment rollback
  - **Owner**: Documentation team
  - **Estimate**: 4 hours
  - **Location**: `~/RUNBOOK.md`
  - **Validation**: Reviewed by ops team

- [ ] **6.2** Document claw agent interaction protocols
  - **Topics**:
    - Authentication methods
    - API endpoints
    - Payload formats
    - Error handling
  - **Owner**: Integration team
  - **Estimate**: 3 hours
  - **Location**: `~/CLAW_INTEGRATION.md`
  - **Validation**: Each claw team reviews and approves

### High Priority (2 tasks)

- [ ] **6.3** Create architecture diagram with all services
  - **Tool**: draw.io, Mermaid, or similar
  - **Owner**: Architecture team
  - **Estimate**: 2 hours
  - **Include**: All services, data flows, auth boundaries
  - **Validation**: Diagram reviewed and approved

- [ ] **6.4** Document disaster recovery procedures
  - **Topics**:
    - Backup restoration
    - Service rebuild from scratch
    - State recovery
  - **Owner**: DevOps
  - **Estimate**: 3 hours
  - **Location**: `~/DISASTER_RECOVERY.md`
  - **Validation**: DR procedure tested successfully

---

## 7. Testing & Validation

### Critical (4 tasks)

- [ ] **7.1** Run full end-to-end integration test
  - **Flow**: VRAM overflow → Gateway → Notion → Claw notification
  - **Owner**: QA team
  - **Estimate**: 2 hours
  - **Validation**: All services respond correctly

- [ ] **7.2** Load test Diamond Gateway under high VRAM pressure
  - **Test**: Simulate 100 concurrent VRAM checks
  - **Owner**: Performance team
  - **Estimate**: 2 hours
  - **Tool**: Apache Bench or k6
  - **Validation**: Gateway handles load, no crashes

- [ ] **7.3** Validate Notion database schema and constraints
  - **Check**: All required fields present, types correct
  - **Owner**: Integration team
  - **Estimate**: 30 min
  - **Validation**: Test write succeeds, data validated

- [ ] **7.4** Test MCP tool error handling and retries
  - **Simulate**: Network failures, timeouts, invalid inputs
  - **Owner**: QA team
  - **Estimate**: 2 hours
  - **Validation**: Tools handle errors gracefully, retry when appropriate

### High Priority (4 tasks)

- [ ] **7.5** Improve benchmark Pareto-optimality (45% → 72%)
  - **Current**: Conversational 22%, Vision 50%, Scientific 50%
  - **Target**: Conversational 67%, Vision 75%, Scientific 75%
  - **Owner**: ML team
  - **Estimate**: 14 hours (3 phases)
  - **Plan**: See `~/diamond-node/BENCHMARK_IMPROVEMENT_PLAN.md`
  - **Validation**: Re-run benchmarks, verify improvements

- [ ] **7.6** Test VRAM optimization with Qwen + YOLO simultaneously
  - **Models**: Qwen2:1.5b + YOLOv8n
  - **Owner**: ML team
  - **Estimate**: 1 hour
  - **Expected VRAM**: ~1.6GB (safe on 4GB GPU)
  - **Validation**: Both models run without OOM errors

- [ ] **7.7** Verify all systemd services start on boot
  - **Services**: diamond-gateway, diamondnode-integration
  - **Owner**: DevOps
  - **Estimate**: 30 min
  - **Test**: Reboot server, check all services running
  - **Validation**: All services active after reboot

- [ ] **7.8** Security audit of all exposed endpoints
  - **Audit**: OWASP Top 10, authentication, authorization
  - **Owner**: Security team
  - **Estimate**: 4 hours
  - **Tool**: OWASP ZAP or Burp Suite
  - **Validation**: No critical vulnerabilities found

---

## 8. Claw-Specific Setup

### openclaw (3 tasks)

- [ ] **8.1** Configure openclaw primary orchestration credentials
  - **Access**: SSH key, API keys for all services
  - **Owner**: openclaw team
  - **Estimate**: 1 hour
  - **Validation**: openclaw can dispatch tasks via GC-MCP

- [ ] **8.2** Set up openclaw task queue and priority system
  - **Queue**: Define task priorities (critical, high, normal, low)
  - **Owner**: openclaw team
  - **Estimate**: 2 hours
  - **Validation**: High-priority tasks processed first

- [ ] **8.3** Test openclaw handoff and takeover procedures
  - **Test**: Simulate human operator handing off to openclaw
  - **Owner**: openclaw team + QA
  - **Estimate**: 2 hours
  - **Validation**: openclaw can operate autonomously

### kimiclaw (3 tasks)

- [ ] **8.4** Configure kimiclaw Notion database access
  - **Database**: Soul-capsule (21e416066ef1411084d1bbaf67af79d1)
  - **Permissions**: Read + Write
  - **Owner**: kimiclaw team
  - **Estimate**: 30 min
  - **Validation**: kimiclaw can read/write Notion pages

- [ ] **8.5** Set up kimiclaw knowledge graph integration
  - **Graph**: Connect to existing knowledge base
  - **Owner**: kimiclaw team
  - **Estimate**: 3 hours
  - **Validation**: kimiclaw can query and update knowledge

- [ ] **8.6** Test kimiclaw memory management and context retrieval
  - **Test**: Store context, retrieve later, verify accuracy
  - **Owner**: kimiclaw team + QA
  - **Estimate**: 2 hours
  - **Validation**: Context retrieval >95% accurate

### nemoclaw (3 tasks)

- [ ] **8.7** Configure nemoclaw network monitoring endpoints
  - **Endpoints**: All public diamondnode services
  - **Owner**: nemoclaw team
  - **Estimate**: 1 hour
  - **Validation**: nemoclaw can monitor all services

- [ ] **8.8** Set up nemoclaw external coordination webhooks
  - **Integrations**: Slack, Telegram, other external services
  - **Owner**: nemoclaw team
  - **Estimate**: 2 hours
  - **Validation**: nemoclaw can send notifications to all channels

- [ ] **8.9** Test nemoclaw incident response and escalation
  - **Test**: Simulate service outage, verify nemoclaw escalates
  - **Owner**: nemoclaw team + QA
  - **Estimate**: 2 hours
  - **Validation**: Incident detected and escalated within 5 min

---

## 📊 **Summary Statistics**

### By Priority

| Priority | Tasks | Estimated Hours |
|----------|-------|-----------------|
| **Critical** | 28 | 48 hours |
| **High** | 20 | 38 hours |
| **Medium** | 5 | 8 hours |
| **Total** | **53 tasks** | **94 hours** |

### By Category

| Category | Tasks | Critical | High | Medium |
|----------|-------|----------|------|--------|
| 1. Authentication & Access | 5 | 5 | 0 | 0 |
| 2. Infrastructure & Services | 7 | 4 | 3 | 0 |
| 3. Security & Secrets | 6 | 6 | 0 | 0 |
| 4. API Integrations | 8 | 4 | 4 | 0 |
| 5. Monitoring & Observability | 6 | 3 | 3 | 0 |
| 6. Documentation | 4 | 2 | 2 | 0 |
| 7. Testing & Validation | 8 | 4 | 4 | 0 |
| 8. Claw-Specific Setup | 9 | 0 | 4 | 5 |

### By Owner

| Owner | Tasks | Estimated Hours |
|-------|-------|-----------------|
| Human operator | 3 | 0.5 hours |
| DevOps | 14 | 28 hours |
| Security team | 5 | 3.5 hours |
| Integration team | 7 | 9 hours |
| QA team | 6 | 12 hours |
| ML team | 3 | 17 hours |
| Claw teams | 9 | 16 hours |
| Other | 6 | 8 hours |

---

## 🚦 **Readiness Status**

### Current State

```
Authentication:        ⚠️  20% (1/5 complete)
Infrastructure:        ⚠️  43% (3/7 complete)
Security:              ❌  0% (0/6 complete)
API Integrations:      ⚠️  25% (2/8 complete)
Monitoring:            ❌  17% (1/6 complete)
Documentation:         ⚠️  50% (2/4 complete)
Testing:               ⚠️  25% (2/8 complete)
Claw Setup:            ❌  0% (0/9 complete)

Overall:               ⚠️  21% (11/53 complete)
```

### Completed Tasks (11/53)

✅ Diamond Gateway running (systemd service)
✅ Notion Bridge deployed and functional
✅ GC-MCP server deployed and accessible
✅ MCP Inspector installed and configured
✅ VRAM optimization tools created
✅ Qwen2:0.5b model installed
✅ Git repository clean and ready
✅ TypeScript dependencies installed
✅ Test suite passing (53% Pareto-optimal)
✅ Comprehensive documentation created
✅ diamondnode-integration daemon running

---

## 🎯 **Critical Path to Automation**

### Phase 1: Immediate (Next 4 hours)

**Must-Complete Tasks**:
1. ✅ **Task 3.1**: Rotate exposed LangSmith API key (**DO NOW**)
2. **Task 3.2**: Add OpenAI API key to environment
3. **Task 1.2**: Authenticate Wrangler CLI
4. **Task 3.4**: Generate Ed25519 keypair for diamond-node
5. **Task 3.3**: Configure Cloudflare Worker secrets
6. **Task 2.2**: Deploy diamond-node Worker to production

**Deliverable**: Services deployed and accessible

---

### Phase 2: Foundation (Next 2 days)

**Must-Complete Tasks**:
1. **Task 2.1**: Expose Diamond Gateway to public internet
2. **Task 4.1**: Verify Notion API integration
3. **Task 4.2**: Test all 5 GC-MCP tools end-to-end
4. **Task 5.1**: Set up GPU monitoring dashboard
5. **Task 5.2**: Configure critical alerting
6. **Task 7.1**: Run full end-to-end integration test

**Deliverable**: Public-accessible, monitored infrastructure

---

### Phase 3: Security & Hardening (Next 3 days)

**Must-Complete Tasks**:
1. **Task 3.5**: Configure firewall rules
2. **Task 3.6**: Set up fail2ban
3. **Task 7.8**: Security audit
4. **Task 1.3**: Configure SSH keys for claw agents
5. **Task 1.5**: Set up service account for automation
6. **Task 6.1**: Create operations runbook

**Deliverable**: Production-ready, secure infrastructure

---

### Phase 4: Claw Integration (Next 1 week)

**Must-Complete Tasks**:
1. **Task 4.3**: Configure webhook endpoints for claws
2. **Task 4.8**: Test propagate_to_claws with all targets
3. **Task 8.1-8.9**: Complete all claw-specific setup (9 tasks)
4. **Task 6.2**: Document claw interaction protocols
5. **Task 7.4**: Test MCP tool error handling

**Deliverable**: Claws can operate autonomously

---

### Phase 5: Optimization (Next 2 weeks)

**Must-Complete Tasks**:
1. **Task 7.5**: Improve benchmarks (45% → 72%)
2. **Task 5.3**: Enable LangSmith tracing
3. **Task 5.4**: Set up centralized logging
4. **Task 7.6**: Test VRAM optimization
5. **Task 4.6**: Configure LangSmith production tracing

**Deliverable**: Optimized, observable system

---

## 🔐 **Security Checklist Before Handoff**

- [ ] All API keys rotated and secured
- [ ] No secrets in git repositories
- [ ] Firewall configured, fail2ban active
- [ ] All services use HTTPS (not HTTP)
- [ ] Rate limiting configured on all APIs
- [ ] Security audit completed, critical issues resolved
- [ ] Service accounts use least-privilege access
- [ ] Secrets stored in proper secret managers (not env files)
- [ ] All endpoints require authentication
- [ ] Audit logging enabled for sensitive operations

---

## 📈 **Success Metrics**

### Technical Readiness

- [ ] All 28 critical tasks complete (100%)
- [ ] All services respond to health checks
- [ ] VRAM monitoring shows H(s) < 8.5 under load
- [ ] Benchmark Pareto-optimality ≥ 70%
- [ ] Mean time to detect (MTTD) < 5 minutes
- [ ] Mean time to resolve (MTTR) < 30 minutes

### Operational Readiness

- [ ] Runbooks written and tested
- [ ] DR procedures tested successfully
- [ ] On-call rotation established
- [ ] Escalation procedures documented
- [ ] Backup and restore tested
- [ ] Service SLAs defined and measured

### Automation Readiness

- [ ] All 3 claws can authenticate and execute tasks
- [ ] Claws can operate for 24 hours without human intervention
- [ ] Automated alerts reach claws within 1 minute
- [ ] Claw decision-making validated (>95% accuracy)
- [ ] Handoff/takeover procedures tested
- [ ] Human override mechanisms in place

---

## 📞 **Contacts & Escalation**

### Service Owners

- **Diamond Gateway**: DevOps team
- **Notion Bridge**: Integration team
- **GC-MCP**: Backend team
- **diamond-node Worker**: Frontend team
- **TRTC Integration**: Video team

### Claw Teams

- **openclaw**: Primary orchestration lead
- **kimiclaw**: Knowledge management lead
- **nemoclaw**: Network coordination lead

### Escalation Path

1. **L1**: Automated monitoring (claws)
2. **L2**: On-call engineer (human)
3. **L3**: Team lead
4. **L4**: CTO / VP Engineering

---

## 🚀 **Next Actions**

### Immediate (TODAY)

```bash
# 1. Rotate LangSmith API key (CRITICAL)
open https://smith.langchain.com/settings

# 2. Add OpenAI API key
nano ~/.env
source ~/.env

# 3. Authenticate Wrangler
cd ~/diamond-node
npx wrangler login

# 4. Generate keypair and set secrets
npm run gen-identity
npx wrangler secret put DIAMOND_NODE_ED25519_PRIV
npx wrangler secret put DIAMOND_NODE_ED25519_PUB
npx wrangler secret put DIAMOND_VAULT_AUDIT_URL

# 5. Deploy Worker
npm run deploy

# 6. Verify deployment
curl https://dn.genesisconductor.io/healthz
```

### This Week

- Complete Phase 1 (Immediate) and Phase 2 (Foundation)
- Set up public Gateway endpoint with SSL
- Configure monitoring and alerting
- Run end-to-end integration tests

### This Month

- Complete Phase 3 (Security) and Phase 4 (Claw Integration)
- All claws authenticated and operational
- Security audit complete
- Begin Phase 5 (Optimization)

---

**Status**: 21% complete (11/53 tasks)
**Target**: 100% complete for full claw automation
**ETA**: 6-8 weeks for full handoff readiness
**Critical Path**: Phase 1-4 (3 weeks minimum)
