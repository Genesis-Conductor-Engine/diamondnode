import { describe, it, expect, vi, beforeEach } from "vitest";
import worker from "../src/index.js";
import type { Env } from "../src/types.js";

// Mock global fetch for cortex feed tests — prevents real network calls in CI
const MOCK_CORTEX_FEED = [
  JSON.stringify({ event_id: "cortex-test-001", timestamp: "2026-05-28T12:00:00Z", type: "cortex_state_snapshot", epsilon_th: 0.91, crystalline_score: 0.89, dissonance_r: 0.14, content: { global_crystalline_invariant: 0.89, guardian_risk: 0.19, guardian_risk_threshold: 0.30, status: "within_threshold", all_participant_sets_connected: true, closed_loop_operational: true }, source: "test" }),
  JSON.stringify({ event_id: "cortex-test-002", timestamp: "2026-05-28T12:01:00Z", type: "system_status_update", epsilon_th: 0.95, crystalline_score: 0.92, dissonance_r: 0.13, content: { system_status: "CLOSED_LOOP_OPERATIONAL", truth_index: 0.94, qflops_breaths_coherence: 0.89, project_aurora_percent: 78, guardian_risk: 0.19, hermes_bridge_health: "optimal" }, source: "test" }),
  JSON.stringify({ event_id: "cortex-test-003", timestamp: "2026-05-28T12:02:00Z", type: "component_state", epsilon_th: 0.92, crystalline_score: 0.89, dissonance_r: 0.11, content: { component: "Hermes Gateway", status: "Active", crystalline_invariant: 0.89 }, source: "test" }),
].join("\n");

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn((url: string) => {
    if (url.includes("cortex-feed") || url.includes("raw.githubusercontent.com")) {
      return Promise.resolve(new Response(MOCK_CORTEX_FEED, { status: 200 }));
    }
    // Pass through other fetches (vault, etc)
    return Promise.resolve(new Response("{}", { status: 200 }));
  }));
});

const mockEnv: Env = {
  DIAMOND_NODE_ED25519_PRIV: "",
  DIAMOND_NODE_ED25519_PUB: "test-pubkey-base64",
  DIAMOND_VAULT_AUDIT_URL: "",
  NODE_VERSION: "0.1.0",
  NODE_ID: "diamond-node",
  KEY_ID: "dn-2026-05",
};

const mockCtx = { waitUntil: (_p: Promise<unknown>) => {} } as ExecutionContext;

describe("GET /healthz", () => {
  it("returns ok=true with version and pubkey", async () => {
    const req = new Request("https://dn.genesisconductor.io/healthz");
    const res = await worker.fetch(req, mockEnv, mockCtx);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.ok).toBe(true);
    expect(body.version).toBe("0.1.0");
    expect(body.identity_pubkey).toBe("test-pubkey-base64");
    expect(typeof body.ts).toBe("string");
  });
});

describe("GET /.well-known/diamond-node.json", () => {
  it("returns identity manifest", async () => {
    const req = new Request("https://dn.genesisconductor.io/.well-known/diamond-node.json");
    const res = await worker.fetch(req, mockEnv, mockCtx);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.node_id).toBe("diamond-node");
    expect(body.key_id).toBe("dn-2026-05");
  });
});

describe("GET /audit/replay", () => {
  it("returns events array", async () => {
    const req = new Request("https://dn.genesisconductor.io/audit/replay");
    const res = await worker.fetch(req, mockEnv, mockCtx);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(Array.isArray(body.events)).toBe(true);
  });
});

describe("GET /api/system-status", () => {
  it("returns 200 with live cortex metrics", async () => {
    const req = new Request("https://dn.genesisconductor.io/api/system-status");
    const res = await worker.fetch(req, mockEnv, mockCtx);
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body.ok).toBe(true);
    expect(typeof body.system_status).toBe("string");
    expect(typeof body.crystalline_score).toBe("number");
    expect(typeof body.epsilon_th).toBe("number");
    expect(typeof body.dissonance_r).toBe("number");
    expect(typeof body.guardian_risk).toBe("number");
    expect(Array.isArray(body.components)).toBe(true);
  });

  it("returns CORS header", async () => {
    const req = new Request("https://dn.genesisconductor.io/api/system-status");
    const res = await worker.fetch(req, mockEnv, mockCtx);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });
});

describe("OPTIONS preflight", () => {
  it("returns 204 with CORS headers", async () => {
    const req = new Request("https://dn.genesisconductor.io/api/system-status", { method: "OPTIONS" });
    const res = await worker.fetch(req, mockEnv, mockCtx);
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-methods")).toContain("GET");
  });
});

describe("GET /unknown", () => {
  it("returns 404", async () => {
    const req = new Request("https://dn.genesisconductor.io/unknown");
    const res = await worker.fetch(req, mockEnv, mockCtx);
    expect(res.status).toBe(404);
  });
});
