# AppSignal Integration Guide

**Service**: Application Performance Monitoring (APM)  
**Version**: @appsignal/javascript@1.6.1  
**Status**: ✅ Installed, ⚠️ Configuration Required

---

## 📊 **What is AppSignal?**

AppSignal provides:
- ✅ **Error Tracking** - Automatic error capture and reporting
- ✅ **Performance Monitoring** - Request duration, throughput metrics
- ✅ **Custom Metrics** - Track VRAM, Hamiltonian, model performance
- ✅ **Uptime Monitoring** - Service availability tracking
- ✅ **Alerting** - Slack, email, webhook notifications

---

## 🚀 **Setup Instructions**

### 1. Create AppSignal Account

```bash
# 1. Sign up at https://appsignal.com
# 2. Create new application: "diamond-node"
# 3. Copy your API key (Push & Deploy key)
```

### 2. Configure Wrangler Secret

```bash
cd ~/diamond-node

# Set AppSignal API key as secret
npx wrangler secret put APPSIGNAL_KEY
# When prompted, paste your AppSignal API key
```

### 3. Deploy Worker

```bash
cd ~/diamond-node
npm run deploy
```

### 4. Verify Integration

```bash
# Check Worker is using AppSignal
curl https://dn.genesisconductor.io/.well-known/diamond-node.json | jq .monitoring

# Should return: "enabled"
```

---

## 📈 **What Gets Tracked**

### Automatic Tracking

1. **Request Duration**
   - Metric: `request.duration` (ms)
   - Tags: method, path, status
   - Example: `GET /health` - 5ms

2. **Error Tracking**
   - All unhandled exceptions
   - Stack traces with context
   - Tags: method, path, url

3. **HTTP Status Codes**
   - 200 OK count
   - 404 Not Found count
   - 500 Internal Server Error count

### Custom Metrics (Ready to Add)

```typescript
// Track VRAM Hamiltonian
trackMetric(appsignal, "vram.hamiltonian", 2.5, {
  gpu: "GTX 1650",
  threshold: 8.5,
});

// Track model inference time
trackMetric(appsignal, "model.inference_time", 150, {
  model: "qwen2:0.5b",
  sequence_length: 1024,
});

// Track Pareto-optimality score
trackMetric(appsignal, "benchmark.pareto_score", 0.72, {
  workload: "conversational",
});
```

---

## 🎯 **Integration Points**

### Diamond Gateway (Python)

Add AppSignal Python SDK:

```bash
# Install AppSignal for Python
/home/diamondnode/venv312/bin/pip install appsignal

# Configure in gateway.py
import appsignal

appsignal.start({
    "name": "diamond-gateway",
    "push_api_key": "YOUR_PYTHON_KEY"
})

# Track VRAM orchestration
@appsignal.instrument
def orchestrate_vram(session_id, context_buffer):
    # Your code here
    pass
```

### TRTC Demo (Frontend)

Add AppSignal JavaScript for browser:

```bash
cd ~/trtc-projects/enid-diamondnode-intro
npm install @appsignal/javascript

# In src/index.js
import Appsignal from "@appsignal/javascript"

const appsignal = new Appsignal({
  key: "YOUR_FRONTEND_KEY"
})

// Track video call duration
appsignal.sendMetric({
  name: "video_call.duration",
  value: callDuration,
  tags: { room_id: roomId }
})
```

---

## 📊 **Dashboard Configuration**

### Recommended Dashboards

1. **Service Health**
   - Request rate (req/min)
   - Error rate (%)
   - P95 response time
   - Uptime (%)

2. **VRAM Monitoring**
   - Hamiltonian H(s) over time
   - VRAM usage (MiB)
   - Offload events count
   - Threshold violations

3. **Model Performance**
   - Inference time (ms)
   - Throughput (ops/sec)
   - Pareto-optimality score
   - Benchmark results

4. **Claw Activity**
   - Tasks dispatched by openclaw
   - Memory operations by kimiclaw
   - Network events by nemoclaw
   - Propagation success rate

### Alert Rules

```yaml
Critical Alerts:
  - VRAM H(s) > 8.5 for 5 minutes
  - Error rate > 5% for 5 minutes
  - P95 response time > 1000ms for 10 minutes
  - Service down for 5 minutes

Warning Alerts:
  - VRAM H(s) > 7.0 for 15 minutes
  - Error rate > 2% for 10 minutes
  - P95 response time > 500ms for 15 minutes
  - GPU temperature > 80°C for 10 minutes
```

---

## 🔧 **Advanced Configuration**

### Custom Error Filtering

```typescript
// In src/appsignal.ts

export function shouldIgnoreError(error: Error): boolean {
  // Ignore 404 Not Found errors
  if (error.message.includes("Not Found")) {
    return true;
  }
  
  // Ignore health check failures
  if (error.message.includes("health")) {
    return true;
  }
  
  return false;
}
```

### Performance Sampling

```typescript
// Sample 100% in production, 10% in development
const sampleRate = env.NODE_ENV === "production" ? 1.0 : 0.1;

const appsignal = new Appsignal({
  key: env.APPSIGNAL_KEY,
  active: Math.random() < sampleRate,
});
```

### Custom Context

```typescript
// Add user context to errors
appsignal.sendError(error, (span) => {
  span.setTags({
    session_id: "sess-123",
    claw: "openclaw",
    operation: "task_dispatch",
  });
});
```

---

## 🧪 **Testing AppSignal Integration**

### Test Error Tracking

```bash
# Trigger test error
curl https://dn.genesisconductor.io/test-error

# Check AppSignal dashboard for error report
open https://appsignal.com/your-org/diamond-node/errors
```

### Test Custom Metrics

```bash
# Trigger metric collection
curl -X POST https://gateway.diamondnode.com/v1/orchestrate \
  -H "Authorization: Bearer $GATEWAY_SECRET" \
  -d '{"session_id":"metric-test","context_buffer":"[TEST]"}'

# Check AppSignal dashboard for metrics
open https://appsignal.com/your-org/diamond-node/metrics
```

### Load Testing

```bash
# Generate traffic for monitoring
cd ~/diamond-node
npm install -g artillery

artillery quick --count 100 --num 10 \
  https://dn.genesisconductor.io/healthz

# Watch metrics in AppSignal dashboard
```

---

## 📋 **Integration Checklist**

### Phase 1: Basic Setup (15 minutes)

- [x] Install @appsignal/javascript package
- [ ] Create AppSignal account
- [ ] Get API key (Push & Deploy key)
- [ ] Configure Wrangler secret: `APPSIGNAL_KEY`
- [ ] Deploy Worker with AppSignal enabled
- [ ] Verify monitoring shows "enabled"

### Phase 2: Error Tracking (30 minutes)

- [ ] Test error capture (trigger 500 error)
- [ ] Verify errors appear in dashboard
- [ ] Configure error notifications (Slack/email)
- [ ] Set up error grouping rules
- [ ] Test error resolution workflow

### Phase 3: Performance Monitoring (1 hour)

- [ ] Configure custom metrics (VRAM, Hamiltonian)
- [ ] Set up performance dashboards
- [ ] Configure P95/P99 tracking
- [ ] Add throughput monitoring
- [ ] Test metric collection

### Phase 4: Alerting (1 hour)

- [ ] Configure critical alerts (VRAM, errors)
- [ ] Set up warning alerts (performance)
- [ ] Test alert delivery (Slack, email)
- [ ] Configure alert escalation
- [ ] Document on-call procedures

### Phase 5: Integration (2 hours)

- [ ] Integrate Diamond Gateway (Python)
- [ ] Integrate TRTC demo (JavaScript)
- [ ] Integrate GC-MCP worker
- [ ] Test end-to-end monitoring
- [ ] Create unified dashboard

---

## 🔗 **Resources**

### Documentation

- AppSignal Docs: https://docs.appsignal.com
- JavaScript SDK: https://docs.appsignal.com/javascript/
- Cloudflare Workers: https://docs.appsignal.com/javascript/integrations/cloudflare-workers.html
- Custom Metrics: https://docs.appsignal.com/metrics/custom.html

### Dashboard Links

- AppSignal Dashboard: https://appsignal.com
- diamond-node App: https://appsignal.com/[org]/diamond-node
- Errors: https://appsignal.com/[org]/diamond-node/errors
- Performance: https://appsignal.com/[org]/diamond-node/performance
- Metrics: https://appsignal.com/[org]/diamond-node/metrics

### Support

- AppSignal Support: support@appsignal.com
- Community Slack: https://appsignal.com/slack
- GitHub Issues: https://github.com/appsignal/appsignal-javascript

---

## 🎯 **Success Metrics**

After full integration:

- ✅ Error rate visible in real-time
- ✅ P95 response time < 100ms tracked
- ✅ VRAM Hamiltonian monitored continuously
- ✅ Alerts fire within 1 minute of threshold breach
- ✅ All 3 services (Worker, Gateway, Demo) monitored
- ✅ Zero blind spots in observability

---

## 📈 **Next Steps**

1. **Immediate** (TODAY):
   - Create AppSignal account
   - Configure APPSIGNAL_KEY secret
   - Deploy and verify integration

2. **This Week**:
   - Set up error tracking and alerts
   - Configure performance monitoring
   - Create VRAM dashboard

3. **This Month**:
   - Integrate all services (Gateway, Demo, MCP)
   - Complete Phase 5 (full integration)
   - Train claw agents on monitoring data

---

**Status**: ✅ Code Integrated, ⚠️ Account Setup Required  
**Estimate**: 15 minutes to full basic monitoring  
**Blockers**: Need AppSignal account and API key  
**Priority**: **HIGH** - Critical for Task 5.3 (claw checklist)

---

## 🤖 **Claw Integration**

### For openclaw (Primary Orchestrator)

```typescript
// Track task dispatch
trackMetric(appsignal, "openclaw.task_dispatch", 1, {
  task_type: "hybrid",
  priority: "high",
  status: "success",
});

// Track execution time
trackMetric(appsignal, "openclaw.execution_time", 1500, {
  task_id: "task-123",
});
```

### For kimiclaw (Knowledge Manager)

```typescript
// Track memory operations
trackMetric(appsignal, "kimiclaw.memory_write", 1, {
  database: "notion",
  page_id: "page-456",
  size_kb: 15,
});

// Track context retrieval
trackMetric(appsignal, "kimiclaw.context_retrieval_time", 250, {
  query_type: "semantic_search",
  results_count: 10,
});
```

### For nemoclaw (Network Monitor)

```typescript
// Track service health checks
trackMetric(appsignal, "nemoclaw.health_check", 1, {
  service: "diamond-gateway",
  status: "healthy",
  response_time_ms: 15,
});

// Track incident detection
trackMetric(appsignal, "nemoclaw.incident_detected", 1, {
  severity: "critical",
  service: "gateway",
  type: "vram_overflow",
});
```

---

**File**: `~/diamond-node/APPSIGNAL_SETUP.md`  
**Related**: Task 5.3 (Enable LangSmith tracing) - now also includes AppSignal  
**Updates Checklist**: Monitoring & Observability section
